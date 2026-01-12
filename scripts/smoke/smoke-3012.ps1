param(
  [string]$BaseUrl = "http://localhost:3012",
  [string]$AdminKey = $env:ADMIN_API_KEY,
  [string]$JobType = "",
  [switch]$SafeOnly,
  [string]$ImagePath = "",
  [string]$ImageBarcode = "bee252525",
  [string]$ImageProfile = "trendyol_square",
  [string]$OutFile = "",
  [string]$OutJson = ""
)

$results = @()

function Invoke-Api {
  param(
    [string]$Method,
    [string]$Path,
    [string]$Body,
    [switch]$NeedsAdmin,
    [switch]$ReturnObject
  )

  $uri = $BaseUrl.TrimEnd("/") + $Path
  $headers = @{}
  if ($NeedsAdmin -and $AdminKey) {
    $headers["x-admin-key"] = $AdminKey
  }
  if ($Body) {
    $headers["Content-Type"] = "application/json"
  }

  $stamp = (Get-Date).ToString("s")
  $line = ">> $Method $uri"
  Write-Host $line
  if ($OutFile) {
    Add-Content -Path $OutFile -Value "[$stamp] $line"
  }
  try {
    if ($Body) {
      $resp = Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -Body $Body -ErrorAction Stop
    } else {
      $resp = Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ErrorAction Stop
    }
    $json = $resp | ConvertTo-Json -Depth 6
    Write-Host $json
    if ($OutFile) {
      Add-Content -Path $OutFile -Value $json
    }
    if ($OutJson) {
      $results += [ordered]@{
        timestamp = $stamp
        method = $Method
        url = $uri
        ok = $true
        status = $null
        body = $resp
      }
    }
    if ($ReturnObject) {
      return $resp
    }
  } catch {
    $msg = "ERROR: $($_.Exception.Message)"
    $text = ""
    Write-Host $msg
    if ($OutFile) {
      Add-Content -Path $OutFile -Value $msg
    }
    if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream) {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $text = $reader.ReadToEnd()
      if ($text) {
        Write-Host $text
        if ($OutFile) {
          Add-Content -Path $OutFile -Value $text
        }
      }
    }
    if ($OutJson) {
      $status = $null
      if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
        $status = [int]$_.Exception.Response.StatusCode
      }
      $results += [ordered]@{
        timestamp = $stamp
        method = $Method
        url = $uri
        ok = $false
        status = $status
        error = $_.Exception.Message
        body = $text
      }
    }
  }
  Write-Host ""
  if ($OutFile) {
    Add-Content -Path $OutFile -Value ""
  }
  if ($ReturnObject) {
    return $null
  }
}

if (-not $AdminKey) {
  Write-Host "WARN: ADMIN_API_KEY not set; admin endpoints may fail."
  Write-Host ""
}

Invoke-Api "GET" "/health"
Invoke-Api "GET" "/products?limit=5"
Invoke-Api "GET" "/marketplace/listings?marketplace=Trendyol&status=active" -NeedsAdmin
Invoke-Api "GET" "/marketplace/listings?barcode=bee252525" -NeedsAdmin
Invoke-Api "GET" "/reports/sales?period=this_week" -NeedsAdmin
Invoke-Api "GET" "/reports/top-products?period=last_month&limit=10" -NeedsAdmin
Invoke-Api "GET" "/content-config" -NeedsAdmin
Invoke-Api "GET" "/admin/settings" -NeedsAdmin
Invoke-Api "GET" "/rate-limits?limit=20" -NeedsAdmin
Invoke-Api "GET" "/marketplaces/providers" -NeedsAdmin
Invoke-Api "POST" "/content-preview" -Body '{"type":"seo","locale":"tr","name":"Bee 252525 Bracelet","price":500,"currency":"TRY"}'
Invoke-Api "GET" "/logs?limit=10" -NeedsAdmin
$jobs = Invoke-Api "GET" "/jobs?limit=10" -NeedsAdmin -ReturnObject
if ($jobs -and $jobs.items -and $jobs.items.Count -gt 0) {
  $selected = $jobs.items[0]
  if ($JobType) {
    $match = $jobs.items | Where-Object { $_.type -eq $JobType } | Select-Object -First 1
    if ($match) {
      $selected = $match
    }
  }
  $jobId = $selected.id
  if ($jobId) {
    Invoke-Api "GET" "/jobs/$jobId" -NeedsAdmin
  }
}
Invoke-Api "GET" "/search?q=trendyol%20satici%20api&docs=true"
Invoke-Api "GET" "/competitors/bee252525"

if (-not $SafeOnly) {
  Invoke-Api "POST" "/admin/settings" -Body '{"lowStockThreshold":5,"lowStockCriticalThreshold":2}' -NeedsAdmin
  Invoke-Api "POST" "/chat" -Body '{"message":"Bee252525 barkodlu urunun fiyatini 500 TL yap"}'
  Invoke-Api "POST" "/products/import" -Body '{"path":"data/mock_products.csv"}' -NeedsAdmin
  Invoke-Api "POST" "/cache/marketplace/reset" -Body '{}' -NeedsAdmin
  Invoke-Api "POST" "/cache/sales/reset" -Body '{}' -NeedsAdmin
  Invoke-Api "POST" "/cache/reset" -Body '{}' -NeedsAdmin
} else {
  Write-Host "INFO: SafeOnly enabled; skipping write endpoints."
  Write-Host ""
}

if ($ImagePath) {
  if ($SafeOnly) {
    Write-Host "INFO: SafeOnly enabled; skipping image upload."
    Write-Host ""
  } elseif (Test-Path $ImagePath) {
    $imageUri = $BaseUrl.TrimEnd("/") + "/images/process"
    Write-Host ">> POST $imageUri (multipart)"
    $curlArgs = @(
      "-s",
      "-X", "POST",
      $imageUri,
      "-F", "image=@$ImagePath",
      "-F", "barcode=$ImageBarcode",
      "-F", "marketplace=Trendyol",
      "-F", "profile=$ImageProfile"
    )
    if ($AdminKey) {
      $curlArgs += "-H"
      $curlArgs += "x-admin-key: $AdminKey"
    }
    try {
      & curl.exe @curlArgs
    } catch {
      Write-Host "ERROR: image upload failed. $($_.Exception.Message)"
    }
    Write-Host ""
    Invoke-Api "GET" "/products/$ImageBarcode/images"
  } else {
    Write-Host "WARN: ImagePath not found: $ImagePath"
    Write-Host ""
  }
}

if ($OutJson) {
  $jsonOutput = $results | ConvertTo-Json -Depth 6
  Set-Content -Path $OutJson -Value $jsonOutput
}
