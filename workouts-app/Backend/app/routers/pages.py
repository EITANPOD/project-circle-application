from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from ..auth import require_user
import os


templates = Jinja2Templates(directory=os.path.join(os.path.dirname(__file__), "..", "templates"))
router = APIRouter(include_in_schema=False)


@router.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@router.get("/signup", response_class=HTMLResponse)
def signup_page(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})


@router.get("/workouts", response_class=HTMLResponse)
def workouts_page(request: Request, user=Depends(require_user)):
    return templates.TemplateResponse("workouts.html", {"request": request, "user": user})


