@echo off
echo Starting SafePath AI System...

:: Start Backend in a new window
start "SafePath Core Engine (FastAPI)" cmd /k "cd /d "%~dp0backend" && set PYTHONPATH=. && py -3.11 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

:: Start Frontend in a new window
start "SafePath Web App (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo SafePath services launched!
echo SafePath Web App:  http://localhost:5173/
echo SafePath Core API: http://127.0.0.1:8000/docs
pause
