import os, threading, time
from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from .db import init_db, get_session


app = FastAPI(title="K8s Training App")

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
# Allow both development and production origins
ALLOWED_ORIGINS = [
    FRONTEND_ORIGIN,
    "http://localhost:3000",  # Docker frontend
    "http://localhost:5173",  # Development frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.on_event("startup")
def on_startup():
    init_db()


FAIL = {
    "ready_fail": False,
    "liveness_fail": False,
    "memory_leak": False,
    "db_fail": False,
}
_leak = []


@app.get("/healthz")
async def healthz():
    if FAIL["liveness_fail"]:
        return JSONResponse({"status": "unhealthy"}, status_code=500)
    return {"status": "ok"}


@app.get("/readyz")
async def readyz(session=Depends(get_session)):
    if FAIL["ready_fail"]:
        return JSONResponse({"status": "not-ready"}, status_code=500)
    if FAIL["db_fail"]:
        return JSONResponse({"status": "db-fail"}, status_code=500)
    try:
        session.exec(text("SELECT 1"))
    except Exception:
        return JSONResponse({"status": "db-error"}, status_code=500)
    return {"status": "ready"}


def _cpu_spin(seconds=20):
    end = time.time() + seconds
    while time.time() < end:
        pass


@app.post("/admin/fail/{mode}/{state}")
async def set_fail_mode(mode: str, state: str, x_admin_token: str = Header(None)):
    token = os.getenv("ADMIN_TOKEN", "changeme")
    if x_admin_token != token:
        raise HTTPException(403, "bad admin token")
    if mode == "crash" and state == "on":
        os._exit(1)
    elif mode == "cpu_spike" and state == "on":
        threading.Thread(target=_cpu_spin, args=(int(os.getenv("CPU_SPIKE_SEC", "20")),), daemon=True).start()
        return {"cpu": "spinning"}
    elif mode == "memory_leak":
        if state == "on":
            _leak.extend(["X" * 1_000_000] * 200)
            FAIL["memory_leak"] = True
        else:
            _leak.clear(); FAIL["memory_leak"] = False
    elif mode in FAIL:
        FAIL[mode] = (state == "on")
    else:
        raise HTTPException(400, "unknown mode")
    return {"mode": mode, "state": state}


from .routers.users_api import router as users_api
from .routers.workouts_api import router as workouts_api
from .routers.pages import router as pages
app.include_router(users_api)
app.include_router(workouts_api)
app.include_router(pages)









