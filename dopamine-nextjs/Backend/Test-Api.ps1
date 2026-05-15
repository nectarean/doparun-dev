param(
    [string]$ProjectPath = "$PSScriptRoot",
    [string]$BaseUrl = "http://localhost:3000",
    [int]$Port = 3000,
    [int]$MaxWaitSeconds = 60
)

cd $ProjectPath

# Check if server is already running
$portInUse = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
if ($portInUse.TcpTestSucceeded) {
    Write-Host "⚠ Port $Port is already in use. Using existing server." -ForegroundColor Yellow
    $ServerProcess = $null
} else {
    Write-Host "ℹ Starting dev server on port $Port..." -ForegroundColor Cyan
    $ServerProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow -PassThru -WindowStyle Minimized
    Write-Host "✓ Dev server started (PID: $($ServerProcess.Id))" -ForegroundColor Green
    
    Write-Host "ℹ Waiting for server to be ready..." -ForegroundColor Cyan
    $startTime = Get-Date
    $serverReady = $false
    
    while ((Get-Date) - $startTime -lt [timespan]::FromSeconds($MaxWaitSeconds)) {
        try {
            $response = Invoke-WebRequest -Uri "$BaseUrl" -Method Get -ErrorAction Stop -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                $serverReady = $true
                Write-Host "✓ Server is ready!" -ForegroundColor Green
                Start-Sleep -Seconds 2
                break
            }
        } catch {
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 1
        }
    }
    
    if (-not $serverReady) {
        Write-Host "✗ Server failed to start within $MaxWaitSeconds seconds" -ForegroundColor Red
        if ($ServerProcess) {
            Stop-Process -Id $ServerProcess.Id -Force -ErrorAction SilentlyContinue
        }
        exit 1
    }
}

Write-Host ""
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$testCustomer = @{
    name     = "Test Customer $timestamp"
    email    = "customer_$timestamp@test.local"
    lokasi   = "Jakarta"
    password = "TestPassword123!"
}

function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = $null
    )
    
    $url = "$BaseUrl$Endpoint"
    $headers = @{ "Content-Type" = "application/json" }
    
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        if ($Body) {
            $response = Invoke-WebRequest -Uri $url -Method $Method -Headers $headers `
                -Body (ConvertTo-Json $Body) -ErrorAction Stop -UseBasicParsing
        } else {
            $response = Invoke-WebRequest -Uri $url -Method $Method -Headers $headers -ErrorAction Stop -UseBasicParsing
        }
        
        $result = $response.Content | ConvertFrom-Json
        return @{
            Success = $true
            Status  = $response.StatusCode
            Data    = $result
            Error   = $null
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        $errorMessage = $_.Exception.Message
        
        try {
            $errorBody = $_.Exception.Response.Content.ReadAsString() | ConvertFrom-Json
            if ($errorBody.error) { $errorMessage = $errorBody.error }
        } catch {
            # Could not parse error body
        }
        
        return @{
            Success = $false
            Status  = $statusCode
            Data    = $null
            Error   = $errorMessage
        }
    }
}

Write-Host "`n========== Running API Tests ==========" -ForegroundColor Cyan

# Register customer
Write-Host "`n--- Authentication Flow ---" -ForegroundColor Cyan
$registerResult = Invoke-ApiCall -Method POST -Endpoint "/api/auth/register" -Body $testCustomer
if ($registerResult.Success) {
    Write-Host "✓ Register Customer - User created with ID: $($registerResult.Data.user.id)" -ForegroundColor Green
    $customerId = $registerResult.Data.user.id
} else {
    Write-Host "✗ Register Customer - $($registerResult.Error)" -ForegroundColor Red
}

# Login customer
$loginResult = Invoke-ApiCall -Method POST -Endpoint "/api/auth/login" `
    -Body @{ email = $testCustomer.email; password = $testCustomer.password }

if ($loginResult.Success) {
    Write-Host "✓ Login Customer - Token received" -ForegroundColor Green
    $token = $loginResult.Data.token
} else {
    Write-Host "✗ Login Customer - $($loginResult.Error)" -ForegroundColor Red
}

# Get current user
if ($token) {
    $meResult = Invoke-ApiCall -Method GET -Endpoint "/api/auth/me" -Token $token
    if ($meResult.Success) {
        Write-Host "✓ Get Current User (/auth/me) - User: $($meResult.Data.user.email)" -ForegroundColor Green
    } else {
        Write-Host "✗ Get Current User (/auth/me) - $($meResult.Error)" -ForegroundColor Red
    }
}

# Admin endpoints
Write-Host "`n--- Admin Endpoints ---" -ForegroundColor Cyan
if ($token) {
    $adminUsersResult = Invoke-ApiCall -Method GET -Endpoint "/api/admin/users" -Token $token
    if ($adminUsersResult.Success) {
        Write-Host "✓ Get All Users (Admin) - Retrieved $($adminUsersResult.Data.users.Count) users" -ForegroundColor Green
    } else {
        Write-Host "✗ Get All Users (Admin) - $($adminUsersResult.Error)" -ForegroundColor Red
    }

    $adminProductsResult = Invoke-ApiCall -Method GET -Endpoint "/api/admin/products" -Token $token
    if ($adminProductsResult.Success) {
        Write-Host "✓ Get All Products (Admin) - Retrieved $($adminProductsResult.Data.products.Count) products" -ForegroundColor Green
    } else {
        Write-Host "✗ Get All Products (Admin) - $($adminProductsResult.Error)" -ForegroundColor Red
    }
}

# Super-admin endpoints
Write-Host "`n--- Super Admin Endpoints ---" -ForegroundColor Cyan
if ($token) {
    $superAdminUsersResult = Invoke-ApiCall -Method GET -Endpoint "/api/super-admin/users" -Token $token
    if ($superAdminUsersResult.Success) {
        Write-Host "✓ Get All Users (Super Admin) - Retrieved $($superAdminUsersResult.Data.users.Count) users" -ForegroundColor Green
    } else {
        Write-Host "⚠ Get All Users (Super Admin) - $($superAdminUsersResult.Error) (expected if not admin)" -ForegroundColor Yellow
    }
}

Write-Host "`n========== Tests Completed ==========" -ForegroundColor Cyan
if ($ServerProcess) {
    Write-Host "ℹ Dev server is still running. Press Ctrl+C in this terminal to stop it." -ForegroundColor Cyan
}