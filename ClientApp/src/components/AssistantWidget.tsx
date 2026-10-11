import { FormEvent, useEffect, useRef, useState } from "react";
import { fetchAssistantStatus, sendAssistantChat } from "../api/services";
import { useAppData } from "../context/AppData";
import { AssistantStatus, BookingProposal, ChatMessage } from "../types";

type BookingState = "pending" | "booked" | "dismissed";

interface UiMessage extends ChatMessage {
  booking?: BookingProposal;
  bookingState?: BookingState;
}

const GREETING: UiMessage = {
  role: "assistant",
  content: "Hi! I am Noor, the Nile Care assistant. Ask me about clinics, doctors or booking a visit. / أهلا! أنا نور، اسألني عن الدكاترة والعيادات والحجز."
};

const SUGGESTIONS = [
  "رجلي بتوجعني، أروح لأنهي دكتور؟",
  "Who is the top rated pediatrician?",
  "أرخص دكتور جلدية",
  "Earliest appointment with a cardiologist"
];

function BookingCard(props: {
  proposal: BookingProposal;
  state: BookingState;
  onBooked: (text: string) => void;
  onDismiss: () => void;
}) {
  const { proposal, state, onBooked, onDismiss } = props;
  const { addAppointment } = useAppData();
  const [phone, setPhone] = useState<string>(proposal.phone);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  if (state === "booked") {
    return <div className="booking-card booking-done">✓ Booked / تم الحجز</div>;
  }
  if (state === "dismissed") {
    return <div className="booking-card booking-muted">Not booked / لم يتم الحجز</div>;
  }

  async function confirm() {
    if (phone.trim().length < 10) {
      setError("Please enter a valid phone number. / ادخل رقم موبايل صحيح.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await addAppointment({
        patientName: proposal.patientName,
        phone: phone.trim(),
        clinicId: proposal.clinicId,
        doctorId: proposal.doctorId,
        date: proposal.date,
        time: proposal.time,
        reason: proposal.reason
      });
      onBooked(
        `Done! Your visit with ${proposal.doctorName} is booked on ${proposal.date} at ${proposal.time}. / تم الحجز مع ${proposal.doctorName} يوم ${proposal.date} الساعة ${proposal.time}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not book.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="booking-card">
      <strong>{proposal.doctorName}</strong>
      <span>
        {proposal.clinicName} · {proposal.date} · {proposal.time}
      </span>
      {proposal.phone.trim().length < 10 && (
        <input
          type="tel"
          dir="ltr"
          placeholder="Phone / رقم الموبايل"
          aria-label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      )}
      {error && <span className="booking-error">{error}</span>}
      <div className="booking-actions">
        <button className="btn btn-primary" type="button" disabled={busy} onClick={confirm}>
          {busy ? "..." : "Confirm / تأكيد"}
        </button>
        <button className="link-reset" type="button" disabled={busy} onClick={onDismiss}>
          Cancel / إلغاء
        </button>
      </div>
    </div>
  );
}

function AssistantWidget() {
  const [open, setOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<UiMessage[]>([GREETING]);
  const [input, setInput] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && status === null) {
      fetchAssistantStatus()
        .then(setStatus)
        .catch(() => setStatus({ ready: false, model: "Qwen3" }));
    }
  }, [open, status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(text: string) {
    if (text === "" || sending) { 
      return;
    }

    const next: UiMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const history = next.slice(1).map((m) => ({ role: m.role, content: m.content }));
      const result = await sendAssistantChat(history);
      const reply: UiMessage = {
        role: "assistant",
        content: result.reply,
        booking: result.booking ?? undefined,
        bookingState: result.booking ? "pending" : undefined
      };

      setMessages([
        ...next.map((m) => (m.bookingState === "pending" && reply.booking ? { ...m, bookingState: "dismissed" as BookingState } : m)),
        reply
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not reach the assistant.";
      setMessages([...next, { role: "assistant", content: message }]);
    } finally {
      setSending(false);
    }
  }

  function handleSend(e: FormEvent) {
    e.preventDefault();
    sendMessage(input.trim());
  }

  function setBookingState(index: number, state: BookingState, extra?: string) {
    setMessages((prev) => {
      const updated = prev.map((m, i) => (i === index ? { ...m, bookingState: state } : m));
      return extra ? [...updated, { role: "assistant" as const, content: extra }] : updated;
    });
  }

  return (
    <div className="assistant">
      {open && (
        <div className="assistant-panel" role="dialog" aria-label="AI assistant">
          <div className="assistant-header">
            <div>
              <strong>Noor · Care assistant</strong>
              <span className="assistant-model">
                {status ? status.model : "Qwen3"} {status && !status.ready ? "· not connected yet" : ""}
              </span>
            </div>
            <button className="assistant-close" aria-label="Close assistant" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div className="assistant-messages" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={"bubble bubble-" + m.role} dir="auto">
                {m.content}
                {m.booking && m.bookingState && (
                  <BookingCard
                    proposal={m.booking}
                    state={m.bookingState}
                    onBooked={(t) => setBookingState(i, "booked", t)}
                    onDismiss={() => setBookingState(i, "dismissed")}
                  />
                )}
              </div>
            ))}
            {messages.length === 1 && (
              <div className="suggestions">
                {SUGGESTIONS.map((q) => (
                  <button key={q} type="button" className="chip" dir="auto" onClick={() => sendMessage(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}
            {sending && <div className="bubble bubble-assistant">...</div>}
            <div ref={bottomRef} />
          </div>

          <p className="assistant-note">
            This assistant does not give medical diagnoses. In an emergency call 123. / في الطوارئ اتصل بـ 123.
          </p>

          <form className="assistant-form" onSubmit={handleSend}>
            <input
              type="text"
              dir="auto"
              placeholder="Type your question / اكتب سؤالك"
              aria-label="Message"
              maxLength={2000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={sending || input.trim() === ""}>
              Send
            </button>
          </form>
        </div>
      )}

      <button className="assistant-fab" aria-label="Open AI assistant" onClick={() => setOpen((o) => !o)}>
        {open ? "×" : "AI"}
      </button>
    </div>
  );
}

export default AssistantWidget;