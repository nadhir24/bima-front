# Stop any running Next.js server
$job = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*" }
if ($job) {
    Write-Host "Stopping existing Next.js server..."
    Stop-Process -Id $job.Id -Force
}

# Clean up development cache
Write-Host "Cleaning Next.js cache..."
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue

# Set environment variables to optimize performance
$env:NODE_OPTIONS="--max-old-space-size=8192 --no-warnings"
$env:NEXT_OPTIMIZE_CSS="true"
$env:NEXT_OPTIMIZE_FONTS="true"
$env:NEXT_OPTIMIZE_IMAGES="true"

# Build in production mode
Write-Host "Building optimized production version..."
npm run build

# Start the production server
Write-Host "Starting production server for performance testing..."
npm run start 