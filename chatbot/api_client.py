import os
import time

import httpx

BASE_URL = os.getenv("HOSPITAL_API_BASE", "http://localhost:5000")
CATALOG_TTL = float(os.getenv("CATALOG_TTL_SECONDS", "30"))
VERIFY_TLS = os.getenv("HOSPITAL_API_VERIFY_TLS", "1") != "0"


class HospitalApiError(Exception):
    """The hospital API could not be reached or returned an error."""


_http = httpx.AsyncClient(base_url=BASE_URL, timeout=10.0, follow_redirects=True, verify=VERIFY_TLS,
                          headers={"X-Forwarded-Proto": "https"})
_cache: dict = {}


def _lower_keys(obj):
    """ASP.NET may send camelCase or PascalCase; we normalise to lowercase so we never care."""
    if isinstance(obj, dict):
        return {k.lower(): _lower_keys(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_lower_keys(x) for x in obj]
    return obj


async def _get(path: str, params: dict | None = None, ttl: float = 0.0):
    key = path + "?" + "&".join(f"{k}={v}" for k, v in sorted((params or {}).items()))
    now = time.monotonic()
    hit = _cache.get(key)
    if ttl and hit and now - hit[0] < ttl:
        return hit[1]
    try:
        r = await _http.get(path, params=params)
        r.raise_for_status()
        data = _lower_keys(r.json())
    except (httpx.HTTPError, ValueError) as e:
        if hit:
            return hit[1]
        raise HospitalApiError(f"{path}: {type(e).__name__}") from e
    if ttl:
        _cache[key] = (now, data)
    return data


async def clinics() -> list:
    return await _get("/api/clinics", ttl=CATALOG_TTL)


async def specialties() -> list:
    return await _get("/api/specialties", ttl=CATALOG_TTL)


async def doctors() -> list:
    return await _get("/api/doctors", ttl=CATALOG_TTL)


async def slots(doctor_id: int, date_iso: str) -> list:
    return await _get(f"/api/doctors/{doctor_id}/slots", {"date": date_iso})


async def reviews(doctor_id: int) -> list:
    return await _get(f"/api/doctors/{doctor_id}/reviews", ttl=CATALOG_TTL)


async def ping() -> bool:
    try:
        await _http.get("/api/specialties")
        return True
    except httpx.HTTPError:
        return False