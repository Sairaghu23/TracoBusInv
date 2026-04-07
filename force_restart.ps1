$port = 5001
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($process) {
    Write-Host "Killing process $process on port $port..."
    Stop-Process -Id $process -Force
}
Write-Host "Starting server.js..."
Start-Process node -ArgumentList "server.js" -NoNewWindow
