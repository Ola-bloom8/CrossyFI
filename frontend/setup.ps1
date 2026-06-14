# Install frontend deps and start dev server
Set-Location $PSScriptRoot

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm not found. Install Node.js first: https://nodejs.org/"
    exit 1
}

npm install
npm run dev
