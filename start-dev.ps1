Write-Host "Starting all Let Me Tell You services..."

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; if (Test-Path 'venv\Scripts\activate.ps1') { .\venv\Scripts\activate.ps1 }; uvicorn app.main:app --reload" -WindowStyle Normal

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

# Start Artist Microservice
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd microservices\artist; python worker.py" -WindowStyle Normal

# Start Narrator Microservice
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd microservices\narrator; python worker.py" -WindowStyle Normal

Write-Host "All services started in separate windows!"
