# Test Swagger cache behavior
$baseUrl = "http://localhost:3000/api"

Write-Host "=== Testing Swagger Cache ==="
Write-Host "Проверяем работу кеша в Swagger документации"

# Test 1: Check Swagger documentation endpoint
Write-Host "`n1. Testing Swagger documentation endpoint:"
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/docs" -Method GET
    $time = (Get-Date) - $startTime
    Write-Host "  Time: $($time.TotalMilliseconds)ms"
    Write-Host "  Status: $($response.StatusCode)"
    Write-Host "  Content-Type: $($response.Headers['Content-Type'])"
    
    # Check cache headers
    $cacheControl = $response.Headers['Cache-Control']
    $pragma = $response.Headers['Pragma']
    $expires = $response.Headers['Expires']
    
    Write-Host "  Cache-Control: $cacheControl"
    Write-Host "  Pragma: $pragma"
    Write-Host "  Expires: $expires"
    
    if ($cacheControl -like "*no-cache*") {
        Write-Host "  ✅ Cache headers properly set!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Cache headers not set properly" -ForegroundColor Red
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Check Swagger JSON endpoint
Write-Host "`n2. Testing Swagger JSON endpoint:"
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/docs-json" -Method GET
    $time = (Get-Date) - $startTime
    Write-Host "  Time: $($time.TotalMilliseconds)ms"
    Write-Host "  Status: $($response.StatusCode)"
    
    # Check cache headers
    $cacheControl = $response.Headers['Cache-Control']
    Write-Host "  Cache-Control: $cacheControl"
    
    if ($cacheControl -like "*no-cache*") {
        Write-Host "  ✅ JSON endpoint cache headers OK!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ JSON endpoint cache headers missing" -ForegroundColor Red
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Test Nova Poshta API through Swagger
Write-Host "`n3. Testing Nova Poshta API (should use cache):"
$cityRef = "db5c88f5-391c-11dd-90d9-001a92567626"

# First request
Write-Host "  First request:"
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/nova-poshta/warehouses?cityRef=$cityRef" -Method GET
    $time = (Get-Date) - $startTime
    Write-Host "    Time: $($time.TotalMilliseconds)ms"
    Write-Host "    Status: $($response.StatusCode)"
} catch {
    Write-Host "    ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Second request (should be cached)
Write-Host "  Second request (should be cached):"
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/v1/nova-poshta/warehouses?cityRef=$cityRef" -Method GET
    $time = (Get-Date) - $startTime
    Write-Host "    Time: $($time.TotalMilliseconds)ms"
    Write-Host "    Status: $($response.StatusCode)"
    
    if ($time.TotalMilliseconds -lt 500) {
        Write-Host "    ✅ Cached response - working correctly!" -ForegroundColor Green
    } else {
        Write-Host "    ❌ Slow response - cache might not be working" -ForegroundColor Red
    }
} catch {
    Write-Host "    ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Swagger Cache Test Completed ==="
Write-Host "Ожидаемые результаты:"
Write-Host "- Swagger UI: no-cache headers"
Write-Host "- API endpoints: proper caching behavior"
Write-Host "- Nova Poshta: 15x speed improvement with cache" 