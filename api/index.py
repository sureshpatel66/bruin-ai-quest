from collections import defaultdict, deque
from pathlib import Path
import hashlib
import os
import sys
import threading
import time

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field
from bruin_ai_quest.sim import BruinQuest

# Production keeps the API deliberately small and does not publish interactive
# schema/docs endpoints. The local development app can still expose FastAPI docs.
app = FastAPI(
    title="Bruin AI Quest",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)
game = BruinQuest()
WEB = ROOT / "web"
app.mount("/api/static", StaticFiles(directory=WEB), name="static")

_RATE_WINDOW_SECONDS = 60.0
_PER_CLIENT_LIMIT = max(1, int(os.environ.get("BRUIN_RATE_LIMIT_PER_MINUTE", "12")))
_GLOBAL_LIMIT = max(_PER_CLIENT_LIMIT, int(os.environ.get("BRUIN_GLOBAL_RATE_LIMIT_PER_MINUTE", "120")))
_rate_lock = threading.Lock()
_client_hits: dict[str, deque[float]] = defaultdict(deque)
_global_hits: deque[float] = deque()


def _client_key(request: Request) -> str:
    # Hash the address immediately; raw client addresses are never stored.
    forwarded = request.headers.get("x-forwarded-for", "").split(",", 1)[0].strip()
    address = forwarded or (request.client.host if request.client else "unknown")
    return hashlib.sha256(address.encode("utf-8", "replace")).hexdigest()


def _allow_request(request: Request) -> tuple[bool, int]:
    now = time.monotonic()
    cutoff = now - _RATE_WINDOW_SECONDS
    key = _client_key(request)
    with _rate_lock:
        while _global_hits and _global_hits[0] <= cutoff:
            _global_hits.popleft()
        hits = _client_hits[key]
        while hits and hits[0] <= cutoff:
            hits.popleft()
        if len(_global_hits) >= _GLOBAL_LIMIT or len(hits) >= _PER_CLIENT_LIMIT:
            oldest = hits[0] if hits else (_global_hits[0] if _global_hits else now)
            retry_after = max(1, int(_RATE_WINDOW_SECONDS - (now - oldest)))
            return False, retry_after
        _global_hits.append(now)
        hits.append(now)
        return True, 0


@app.middleware("http")
async def harden_api(request: Request, call_next):
    if request.url.path == "/api/journey" and request.method == "POST":
        allowed, retry_after = _allow_request(request)
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many journey requests. Please try again shortly."},
                headers={"Retry-After": str(retry_after), "Cache-Control": "no-store"},
            )
    response = await call_next(request)
    if request.url.path.startswith("/api"):
        response.headers["Cache-Control"] = "no-store"
    return response


class JourneyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    goal: str = Field(min_length=1, max_length=2000)


@app.get("/api")
def index():
    return FileResponse(WEB / "index.html")


@app.get("/api/health")
def health():
    return {"ok": True, "service": "bruin-ai-quest", "resources": len(game.resources)}


@app.get("/api/resources")
def resources():
    state = game.snapshot()
    return {
        "resources": game.resources,
        "ucla_resources": game.ucla_resources,
        "online_resources": game.online_resources,
        "last_verified": state["last_verified"],
        "disclaimer": state["disclaimer"],
    }


@app.post("/api/journey")
def journey(req: JourneyRequest):
    # No user profile or arbitrary metadata is accepted by the public API.
    return BruinQuest().plan_journey(req.goal, None)


@app.get("/api/security.txt", response_class=PlainTextResponse)
def security_txt():
    return """Contact: https://github.com/sureshpatel66/bruin-ai-quest/security/advisories/new\nPolicy: https://github.com/sureshpatel66/bruin-ai-quest/blob/main/SECURITY.md\nPreferred-Languages: en\nCanonical: https://bruin-ai-quest.vercel.app/.well-known/security.txt\n"""
