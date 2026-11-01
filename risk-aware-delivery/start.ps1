Write-Host "Starting SafePath AI System..." -ForegroundColor Cyan

$root = $PSScriptRoot

# Launch SafePath Core Engine
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; `$env:PYTHONPATH='.'; py -3.11 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# Launch SafePath Web App
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "SafePath services are starting!" -ForegroundColor Green
Write-Host "SafePath Web App:  http://localhost:5173/" -ForegroundColor Yellow
Write-Host "SafePath Core API: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
