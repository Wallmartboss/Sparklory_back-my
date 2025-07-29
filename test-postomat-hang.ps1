# Test Postomat parameter hanging issue
$baseUrl = "http://localhost:3000/api/v1/nova-poshta"
$cityRef = "db5c88f5-391c-11dd-90d9-001a92567626" # Lviv

Write-Host "=== Testing Postomat Parameter Hanging Issue ==="
Write-Host "Testing hanging issue with Postomat parameter"

# Test 1: Clear cache first
Write-Host "`n1. Clearing cache:"
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/clear-cache" -Method POST -TimeoutSec 10
    Write-Host "  Status: $($response.StatusCode)"
} catch {
    Write-Host "  Warning: $($_.Exception.Message)"
}

# Test 2: Test without type parameter (should work)
Write-Host "`n2. Testing without type parameter:"
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/warehouses?cityRef=$cityRef" -Method GET -TimeoutSec 30
    $time = (Get-Date) - $startTime
    Write-Host "  Time: $($time.TotalMilliseconds)ms"
    Write-Host "  Status: $($response.StatusCode)"
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  Total warehouses: $($data.length)"
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 3: Test with Postomat parameter (problematic)
Write-Host "`n3. Testing with Postomat parameter (may hang):"
$startTime = Get-Date
try {
    Write-Host "  Sending request with Postomat parameter..."
    $response = Invoke-WebRequest -Uri "$baseUrl/warehouses?cityRef=$cityRef&type=Postomat" -Method GET -TimeoutSec 60
    $time = (Get-Date) - $startTime
    Write-Host "  Time: $($time.TotalMilliseconds)ms"
    Write-Host "  Status: $($response.StatusCode)"
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  Postomat warehouses: $($data.length)"
    Write-Host "  ✅ SUCCESS! Postomat request completed" -ForegroundColor Green
} catch {
    $time = (Get-Date) - $startTime
    Write-Host "  Time elapsed: $($time.TotalMilliseconds)ms"
    Write-Host "  ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -like "*timeout*") {
        Write-Host "  🕐 TIMEOUT - Request hung and timed out" -ForegroundColor Yellow
    }
}

Start-Sleep -Seconds 2

# Test 4: Test with Branch parameter (for comparison)
Write-Host "`n4. Testing with Branch parameter (for comparison):"
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/warehouses?cityRef=$cityRef&type=Branch" -Method GET -TimeoutSec 30
    $time = (Get-Date) - $startTime
    Write-Host "  Time: $($time.TotalMilliseconds)ms"
    Write-Host "  Status: $($response.StatusCode)"
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  Branch warehouses: $($data.length)"
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Test cached Postomat request
Write-Host "`n5. Testing cached Postomat request:"
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/warehouses?cityRef=$cityRef&type=Postomat" -Method GET -TimeoutSec 30
    $time = (Get-Date) - $startTime
    Write-Host "  Time: $($time.TotalMilliseconds)ms"
    Write-Host "  Status: $($response.StatusCode)"
    
    if ($time.TotalMilliseconds -lt 1000) {
        Write-Host "  ✅ FAST - Cached response working!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ SLOW - Cache might not be working properly" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Postomat Test Completed ==="
Write-Host "If test 3 hangs or times out - problem confirmed"
Write-Host "If all tests pass successfully - problem might be in browser" 