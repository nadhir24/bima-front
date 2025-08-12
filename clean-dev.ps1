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

# Set environment variables to disable warnings
$env:NODE_OPTIONS = "--no-warnings --no-deprecation"

# Run the development server
Write-Host "Starting fresh development server..."
npm run dev:clean 