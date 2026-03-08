from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.database.db import init_db
from app.routes import auth, interview, report

from starlette.middleware.sessions import SessionMiddleware
import os

app = FastAPI(title="AI Interview Simulator API", version="1.0.0")

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY", "your-secret-key-for-sessions")
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import logging
import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Global Error: {str(exc)}")
    logging.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

@app.on_event("startup")
async def startup():
    init_db()

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
app.include_router(report.router, prefix="/api/report", tags=["Reports"])

@app.get("/")
def root():
    return {"message": "AI Interview Simulator API is running"}
