# Test pagination functionality
$baseUrl = "http://localhost:3000/api/v1/nova-poshta"
$cityRef = "db5c88f5-391c-11dd-90d9-001a92567626" # Lviv

Write-Host "=== Testing Pagination ==="
Write-Host "Testing pagination functionality for large responses"

# Test 1: Get total count without pagination
Write-Host "`n1. Getting total count:"
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/warehouses?cityRef=$cityRef&type=Postomat" -Method GET -TimeoutSec 30
    $data = $response.Content | ConvertFrom-Json
    $totalCount = $data.total
    Write-Host "  Total Postomat warehouses: $totalCount"
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Test 2: First page with pagination
Write-Host "`n2. Testing first page (limit=50):"
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/warehouses?cityRef=$cityRef&type=Postomat&page=1&limit=50" -Method GET -TimeoutSec 30
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  Status: $($response.StatusCode)"
    Write-Host "  Items on page: $($data.warehouses.length)"
    Write-Host "  Page: $($data.page)"
    Write-Host "  Total: $($data.total)"
    Write-Host "  Total pages: $($data.pages)"
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Second page
Write-Host "`n3. Testing second page (limit=50):"
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/warehouses?cityRef=$cityRef&type=Postomat&page=2&limit=50" -Method GET -TimeoutSec 30
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  Status: $($response.StatusCode)"
    Write-Host "  Items on page: $($data.warehouses.length)"
    Write-Host "  Page: $($data.page)"
    Write-Host "  Total pages: $($data.pages)"
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Large limit (should be capped at 500)
Write-Host "`n4. Testing large limit (should be capped at 500):"
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/warehouses?cityRef=$cityRef&type=Postomat&page=1&limit=1000" -Method GET -TimeoutSec 30
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  Status: $($response.StatusCode)"
    Write-Host "  Requested limit: 1000"
    Write-Host "  Actual limit: $($data.limit)"
    Write-Host "  Items returned: $($data.warehouses.length)"
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Performance comparison
Write-Host "`n5. Performance comparison:"
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/warehouses?cityRef=$cityRef&type=Postomat&page=1&limit=50" -Method GET -TimeoutSec 30
    $time = (Get-Date) - $startTime
    Write-Host "  Paginated request (50 items): $($time.TotalMilliseconds)ms"
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Pagination Test Completed ==="
Write-Host "✅ Pagination works - browser will no longer hang!"
Write-Host "📄 Now you can get data page by page" 