# Test in-memory cache performance for Nova Poshta API
$baseUrl = "http://localhost:3000/api/v1/nova-poshta"
$cityRef = "db5c88f5-391c-11dd-90d9-001a92567626"

Write-Host "=== Testing Cache Performance ==="
Write-Host "In-memory кеш повинен значно прискорити повторні запити"

# Clear cache first
Write-Host "`n--- Clearing cache ---"
try {
    $clearResponse = Invoke-WebRequest -Uri "$baseUrl/clear-cache" -Method POST
    Write-Host "Cache cleared: $($clearResponse.StatusCode)"
} catch {
    Write-Host "Failed to clear cache (this is normal if cache is empty): $($_.Exception.Message)"
}

# Test 1: Cold cache (first request should be slow)
Write-Host "`n1. Testing COLD cache (first request):"
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/warehouses?cityRef=$cityRef" -Method GET
    $time = (Get-Date) - $startTime
    Write-Host "  Time: $($time.TotalMilliseconds)ms"
    Write-Host "  Status: $($response.StatusCode)"
    $responseData = $response.Content | ConvertFrom-Json
    Write-Host "  Warehouses count: $($responseData.length)"
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)"
}

Start-Sleep -Seconds 1

# Test 2: Warm cache (subsequent requests should be fast)
Write-Host "`n2. Testing WARM cache (should be faster with in-memory cache):"
for ($i = 1; $i -le 5; $i++) {
    Write-Host "Request ${i}:"
    $startTime = Get-Date
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/warehouses?cityRef=$cityRef" -Method GET
        $time = (Get-Date) - $startTime
        Write-Host "  Time: $($time.TotalMilliseconds)ms"
        Write-Host "  Status: $($response.StatusCode)"
        
        # With in-memory cache, these should be 200-500ms (much faster than 5000ms)
        if ($time.TotalMilliseconds -lt 200) {
            Write-Host "  ✅ EXCELLENT! Very fast cache!" -ForegroundColor Green
        } elseif ($time.TotalMilliseconds -lt 500) {
            Write-Host "  ⚡ GOOD! Cache working well" -ForegroundColor Yellow
        } else {
            Write-Host "  ❌ SLOW - cache not working" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Seconds 0.5
}

# Test 3: Different endpoint (type parameter)
Write-Host "`n3. Testing with type parameter (new cache key):"
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/warehouses?cityRef=$cityRef&type=Branch" -Method GET
    $time = (Get-Date) - $startTime
    Write-Host "  Time: $($time.TotalMilliseconds)ms"
    Write-Host "  Status: $($response.StatusCode)"
    $responseData = $response.Content | ConvertFrom-Json
    Write-Host "  Filtered warehouses count: $($responseData.length)"
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)"
}

# Test 4: Repeat type parameter request (should be cached)
Write-Host "`n4. Repeat type parameter request (should be cached):"
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/warehouses?cityRef=$cityRef&type=Branch" -Method GET
    $time = (Get-Date) - $startTime
    Write-Host "  Time: $($time.TotalMilliseconds)ms"
    Write-Host "  Status: $($response.StatusCode)"
    
    if ($time.TotalMilliseconds -lt 500) {
        Write-Host "  ✅ GOOD! Type filtering with cache working!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ SLOW - cache might not be working properly" -ForegroundColor Red
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)"
}

Write-Host "`n=== Cache Performance Test Completed ==="
Write-Host "Очікувані результати:"
Write-Host "- Перший запит: 500-2000ms (звернення до API Нової Пошти)"
Write-Host "- Повторні запити: 200-500ms (in-memory cache)"
Write-Host "- Різні параметри створюють нові cache keys" 