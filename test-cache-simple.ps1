# Simple cache test
$baseUrl = "http://localhost:3000/api/v1/nova-poshta"
$cityRef = "db5c88f5-391c-11dd-90d9-001a92567626"

Write-Host "=== Testing Cache Performance ==="

# Test 1: Without type parameter
Write-Host "`n1. Testing WITHOUT type parameter:"
for ($i = 1; $i -le 4; $i++) {
    Write-Host "Request ${i}:"
    $startTime = Get-Date
    $response = Invoke-WebRequest -Uri "$baseUrl/warehouses?cityRef=$cityRef" -Method GET
    $time = (Get-Date) - $startTime
    Write-Host "  Time: $($time.TotalMilliseconds)ms"
    Write-Host "  Status: $($response.StatusCode)"
    Start-Sleep -Seconds 1
}

# Test 2: With type parameter
Write-Host "`n2. Testing WITH type parameter:"
for ($i = 1; $i -le 4; $i++) {
    Write-Host "Request ${i}:"
    $startTime = Get-Date
    $response = Invoke-WebRequest -Uri "$baseUrl/warehouses?cityRef=$cityRef&type=Branch" -Method GET
    $time = (Get-Date) - $startTime
    Write-Host "  Time: $($time.TotalMilliseconds)ms"
    Write-Host "  Status: $($response.StatusCode)"
    Start-Sleep -Seconds 1
}

Write-Host "`n=== Test Completed ===" 