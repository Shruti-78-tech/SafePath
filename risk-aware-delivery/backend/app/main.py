"""
Main FastAPI Application for SIH 2026 (SIH26002)
================================================
Risk-Aware Essential Supply Delivery Route Planning System
"""

import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure app package is accessible
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.api import routes, risk, model, dashboard
from app.database.db import init_db

app = FastAPI(
    title="SafePath - Risk-Aware Delivery Route Planning API",
    description="SafePath (SIH 2026 Problem Statement SIH26002): Decision Support System for Essential Supply Delivery",
    version="1.0.0"
)

# Enable CORS for frontend Vite development & production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Mount API Routers
app.include_router(routes.router)
app.include_router(risk.router)
app.include_router(model.router)
app.include_router(dashboard.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "SafePath Emergency Logistics Route Planning System",
        "problem_statement": "SIH26002",
        "event": "Smart India Hackathon 2026"
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to SafePath API (SIH 2026 Problem Statement SIH26002)",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }
