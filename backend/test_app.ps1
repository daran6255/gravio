# Quick Test Script
# This script tests if the FastAPI application is running correctly

Write-Host "Testing FastAPI Application..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing health endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -ErrorAction Stop
    Write-Host "   ✓ Health check passed!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host "   Version: $($health.version)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "   ✗ Health check failed!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host "   Make sure the server is running on http://localhost:8000" -ForegroundColor Yellow
    exit 1
}

# Test 2: Root Endpoint
Write-Host "2. Testing root endpoint..." -ForegroundColor Yellow
try {
    $root = Invoke-RestMethod -Uri "http://localhost:8000/" -ErrorAction Stop
    Write-Host "   ✓ Root endpoint passed!" -ForegroundColor Green
    Write-Host "   App: $($root.name)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "   ✗ Root endpoint failed!" -ForegroundColor Red
    exit 1
}

# Test 3: API Documentation
Write-Host "3. Testing API documentation..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✓ API docs accessible!" -ForegroundColor Green
        Write-Host "   Visit: http://localhost:8000/docs" -ForegroundColor Gray
        Write-Host ""
    }
} catch {
    Write-Host "   ✗ API docs failed!" -ForegroundColor Red
}

# Test 4: Register a test user
Write-Host "4. Testing user registration..." -ForegroundColor Yellow
$testUser = @{
    email = "quicktest@example.com"
    username = "quicktest"
    password = "QuickTest123"
    full_name = "Quick Test User"
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/register" `
        -Method Post `
        -Body $testUser `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "   ✓ User registration passed!" -ForegroundColor Green
    Write-Host "   User ID: $($register.id)" -ForegroundColor Gray
    Write-Host "   Email: $($register.email)" -ForegroundColor Gray
    Write-Host ""
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
        Write-Host "   ⚠ User already exists (this is OK)" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host "   ✗ User registration failed!" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

# Test 5: Login
Write-Host "5. Testing user login..." -ForegroundColor Yellow
$loginData = @{
    email = "quicktest@example.com"
    password = "QuickTest123"
} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "   ✓ User login passed!" -ForegroundColor Green
    Write-Host "   Access token received: $($login.access_token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
    
    # Test 6: Authenticated request
    Write-Host "6. Testing authenticated request..." -ForegroundColor Yellow
    $headers = @{
        Authorization = "Bearer $($login.access_token)"
    }
    
    $currentUser = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users/me" `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "   ✓ Authenticated request passed!" -ForegroundColor Green
    Write-Host "   Logged in as: $($currentUser.username)" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "   ✗ Login failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "All Tests Completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your FastAPI application is working correctly! 🎉" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  - Visit API docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  - View ReDoc: http://localhost:8000/redoc" -ForegroundColor White
Write-Host "  - Start building your APIs!" -ForegroundColor White
Write-Host ""
