param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$AdminKey = $env:ADMIN_API_KEY,
  [string]$ImagePath = "",
  [string]$Barcode = "bee252525",
  [string]$Marketplace = "Trendyol",
  [string]$Profile = "trendyol_square",
  [string]$StrictProfile = "trendyol_square_whitebg_strict",
  [switch]$SkipUpload
)

function Invoke-Api {
  param(
    [string]$Method,
    [string]$Path,
    [switch]$NeedsAdmin
  )

  $uri = $BaseUrl.TrimEnd("/") + $Path
  $headers = @{}
  if ($NeedsAdmin -and $AdminKey) {
    $headers["x-admin-key"] = $AdminKey
  }

  Write-Host ">> $Method $uri"
  try {
    $resp = Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ErrorAction Stop
    $resp | ConvertTo-Json -Depth 6
  } catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream) {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $text = $reader.ReadToEnd()
      if ($text) {
        Write-Host $text
      }
    }
  }
  Write-Host ""
}

if (-not $AdminKey) {
  Write-Host "WARN: ADMIN_API_KEY not set; admin endpoints may fail."
  Write-Host ""
}

Invoke-Api "GET" "/health"
Invoke-Api "GET" "/images/profile-sets?marketplace=$Marketplace" -NeedsAdmin
Invoke-Api "GET" "/images/inspects?limit=5" -NeedsAdmin

if ($SkipUpload) {
  Write-Host "INFO: SkipUpload enabled; skipping image upload."
  Write-Host ""
} elseif ($ImagePath -and (Test-Path $ImagePath)) {
  $imageUri = $BaseUrl.TrimEnd("/") + "/images/process"
  Write-Host ">> POST $imageUri (multipart)"
  $curlArgs = @(
    "-s",
    "-X", "POST",
    $imageUri,
    "-F", "image=@$ImagePath",
    "-F", "barcode=$Barcode",
    "-F", "marketplace=$Marketplace",
    "-F", "profile=$Profile",
    "-F", "inspect=true"
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

  Invoke-Api "GET" "/products/$Barcode/images" -NeedsAdmin

  $reprocessUri = "/images/reprocess?barcode=$Barcode&profile=$StrictProfile&inspect=true"
  Invoke-Api "POST" $reprocessUri -NeedsAdmin

  Invoke-Api "GET" "/images/inspects?barcode=$Barcode&limit=5" -NeedsAdmin
} else {
  Write-Host "WARN: ImagePath not found. Provide -ImagePath to test upload."
  Write-Host ""
}
