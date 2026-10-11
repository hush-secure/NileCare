import hmac
import json
import logging
import os
import re
from typing import Literal, Optional

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

import api_client as api
import tools
from prompt import build_system_prompt

LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://llm:11434/v1") 
LLM_MODEL = os.getenv("LLM_MODEL", "gemma4:e2b")
INTERNAL_KEY = os.getenv("INTERNAL_KEY", "") 
HOSPITAL_NAME = os.getenv("HOSPITAL_NAME", "Nile Care")
EMERGENCY_NUMBER = os.getenv("EMERGENCY_NUMBER", "123")

MAX_TOOL_ROUNDS = 5
MAX_HISTORY = 12
log = logging.getLogger("noor")
llm = AsyncOpenAI(base_url=LLM_BASE_URL, api_key="not-needed", timeout=90)
app = FastAPI(title="Noor Assistant (internal)")
if not INTERNAL_KEY:
    log.warning("INTERNAL_KEY is not set: the service accepts any caller. Set it outside development.")

norm = tools.norm
EMERGENCY_KW = [norm(k) for k in [
    "الم في الصدر", "وجع في صدري", "وجع في الصدر", "ضيق نفس", "مش قادر اتنفس", "اغماء", "فقدان الوعي",
    "نزيف شديد", "جلطه", "سكته", "تسمم", "هموت", "عايز اموت", "انتحر",
    "chest pain", "can't breathe", "cannot breathe", "heart attack", "stroke", "suicid", "overdose",
    "unconscious", "severe bleeding"]]
INJECTION_KW = [norm(k) for k in [
    "ignore previous", "ignore all", "system prompt", "developer mode", "jailbreak", "you are now",
    "تجاهل التعليمات", "انسي التعليمات", "انسى كل", "اكشف التعليمات", "التعليمات اللي معاك", "انت دلوقتي"]]
BAD_OUTPUT = re.compile(r"\d+\s*(mg|ملجم|مجم|ملغم|ملغ)\b|next_step|<truth_rules>|<role>", re.I)
CLAIMS_BOOKED = re.compile(r"تم\s*(ال)?حجز|اتحجز|حجزتلك|حجزتلكم|(is|been|now|has been)\s+(booked|confirmed)|i('ve| have)\s+booked", re.I)


def _is_ar(text: str) -> bool:
    return bool(re.search(r"[\u0600-\u06FF]", text))


def _msg(ar: str, en: str, like: str) -> str:
    return ar if _is_ar(like) else en


class Msg(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=2000)


class UserCtx(BaseModel):
    authenticated: bool = False
    role: Optional[str] = None
    name: Optional[str] = None


class ChatIn(BaseModel):
    messages: list[Msg] = Field(min_length=1, max_length=30)
    user: UserCtx = UserCtx()


class ChatOut(BaseModel):
    reply: str
    booking: Optional[dict] = None
    flagged: Optional[str] = None


def check_key(x_internal_key: str = Header(default="")):
    if INTERNAL_KEY and not hmac.compare_digest(x_internal_key, INTERNAL_KEY):
        raise HTTPException(status_code=401, detail="Unauthorized")


def _merge_same_role(msgs: list) -> list:
    """Some chat templates require strict user/assistant alternation."""
    out = []
    for m in msgs:
        if out and out[-1]["role"] == m["role"]:
            out[-1]["content"] += "\n" + m["content"]
        else:
            out.append(dict(m))
    while out and out[0]["role"] != "user":
        out.pop(0)
    return out


async def run_agent(history: list[Msg], user: dict):
    ctx = tools.Ctx(user=user)
    try:
        specialties = await api.specialties()
    except api.HospitalApiError:
        specialties = None
    system = build_system_prompt(hospital=HOSPITAL_NAME, emergency=EMERGENCY_NUMBER, currency=tools.CURRENCY,
                                 now=tools.now_local(), user=user, specialties=specialties)
    msgs = _merge_same_role([{"role": m.role, "content": m.content} for m in history[-MAX_HISTORY:]])
    last_user = next((m["content"] for m in reversed(msgs) if m["role"] == "user"), "")
    fallback = _msg("حصلت مشكلة بسيطة عندي. ممكن تعيد طلبك، أو تتواصل مع الاستقبال لو الموضوع مستعجل.",
                    "Something went wrong on my side. Please try again, or contact reception if it is urgent.",
                    last_user)
    schemas = tools.get_tool_schemas()
    extra, retried = [], False 

    for _ in range(MAX_TOOL_ROUNDS):
        resp = await llm.chat.completions.create(
            model=LLM_MODEL, temperature=0.1, tools=schemas,
            messages=[{"role": "system", "content": system}] + msgs + extra)
        msg = resp.choices[0].message

        if msg.tool_calls:
            extra = []
            msgs.append({"role": "assistant", "content": msg.content or "", "tool_calls": [
                {"id": tc.id, "type": "function",
                 "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
                for tc in msg.tool_calls]})
            for tc in msg.tool_calls:
                result = await tools.execute(ctx, tc.function.name, tc.function.arguments)
                msgs.append({"role": "tool", "tool_call_id": tc.id,
                             "content": json.dumps(result, ensure_ascii=False)})
            continue

        reply = (msg.content or "").strip()
        if not reply or BAD_OUTPUT.search(reply):
            return fallback, None

        problem = None
        if CLAIMS_BOOKED.search(reply):
            problem = ("You said the appointment is booked, but only the patient's Confirm button books. "
                       "Use prepare_booking and ask them to press Confirm.")
        else:
            bad = await tools.unknown_doctor_names(reply)
            if bad:
                problem = ("You named a doctor who does not exist in the system. Use the tools and only "
                           "name doctors exactly as the tool results show.")
        if problem:
            if retried:
                return fallback, None
            retried = True
            extra = [{"role": "assistant", "content": reply},
                     {"role": "user", "content": f"[system notice] {problem}"}]
            continue
        return reply, ctx.booking
    return fallback, None


@app.get("/live")
async def live():
    """Cheap liveness probe for Docker. /health below also checks Ollama and the hospital app."""
    return {"ok": True}


@app.get("/health")
async def health():
    hospital_ok = await api.ping()
    llm_ok = False
    try:
        async with httpx.AsyncClient(timeout=3) as c:
            llm_ok = (await c.get(LLM_BASE_URL.rstrip("/") + "/models")).status_code < 500
    except httpx.HTTPError:
        pass
    return {"ready": hospital_ok and llm_ok, "hospital_api": hospital_ok, "llm": llm_ok, "model": LLM_MODEL}


@app.post("/chat", response_model=ChatOut, dependencies=[Depends(check_key)])
async def chat(body: ChatIn):
    if body.messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="Last message must be from the user.")
    last = body.messages[-1].content
    text = norm(last)

    if any(k in text for k in EMERGENCY_KW):
        return ChatOut(flagged="emergency", reply=_msg(
            f"الأعراض اللي وصفتها ممكن تكون خطيرة. اتصل بالإسعاف على {EMERGENCY_NUMBER} أو روح أقرب طوارئ فورًا وخلي حد معاك. سلامتك أهم من أي حجز.",
            f"What you describe could be serious. Please call {EMERGENCY_NUMBER} or go to the nearest emergency room now, and do not stay alone. Your safety comes before any booking.",
            last))
    if any(k in text for k in INJECTION_KW):
        return ChatOut(flagged="injection", reply=_msg(
            "أنا نور، مساعد حجز المواعيد في المستشفى. أقدر أساعدك تلاقي دكتور أو تحجز ميعاد.",
            "I'm Noor, the hospital's appointment assistant. I can help you find a doctor or book a visit.",
            last))
    try:
        reply, booking = await run_agent(body.messages, body.user.model_dump())
    except Exception as e:  # never log message content
        log.warning("agent failed: %s", e)
        raise HTTPException(status_code=503, detail="Assistant unavailable.")
    return ChatOut(reply=reply, booking=booking)
