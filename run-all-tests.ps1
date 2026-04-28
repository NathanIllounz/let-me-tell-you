Write-Host "Starting All Tests..." -ForegroundColor Cyan

$hasError = $false

Write-Host "`n=============================================="
Write-Host "Running Backend Tests (pytest)..."
Write-Host "=============================================="
Set-Location backend
if (Test-Path 'venv\Scripts\activate.ps1') { .\venv\Scripts\activate.ps1 }
# Run all tests except those marked as integration
python -m pytest -m "not integration"
if ($LASTEXITCODE -ne 0) { $hasError = $true }
Set-Location ..

Write-Host "`n=============================================="
Write-Host "Running Artist Microservice Tests..."
Write-Host "=============================================="
Set-Location microservices\artist
if (Test-Path 'venv\Scripts\activate.ps1') { .\venv\Scripts\activate.ps1 }
python -m pytest -m "not integration"
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 5 -and $LASTEXITCODE -ne 1) { $hasError = $true }
Set-Location ..\..

Write-Host "`n=============================================="
Write-Host "Running Narrator Microservice Tests..."
Write-Host "=============================================="
Set-Location microservices\narrator
if (Test-Path 'venv\Scripts\activate.ps1') { .\venv\Scripts\activate.ps1 }
python -m pytest -m "not integration"
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 5 -and $LASTEXITCODE -ne 1) { $hasError = $true }
Set-Location ..\..

Write-Host "`n=============================================="
Write-Host "Running Frontend Tests (vitest)..."
Write-Host "=============================================="
Set-Location frontend
npm run test -- --run
if ($LASTEXITCODE -ne 0) { $hasError = $true }
Set-Location ..

Write-Host "`n=============================================="
if ($hasError) {
    Write-Host "TESTS FAILED. Please review the output above." -ForegroundColor Red
    exit 1
} else {
    Write-Host "ALL TESTS PASSED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "If you want to run live integration tests, use: pytest -m integration" -ForegroundColor Yellow
}
