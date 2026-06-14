# Install Foundry dependencies and run tests
# Requires Foundry: https://book.getfoundry.sh/getting-started/installation

Set-Location $PSScriptRoot

if (-not (Get-Command forge -ErrorAction SilentlyContinue)) {
    Write-Error "forge not found. Install Foundry first: https://book.getfoundry.sh/getting-started/installation"
    exit 1
}

if (-not (Test-Path "lib/openzeppelin-contracts")) {
    forge install OpenZeppelin/openzeppelin-contracts foundry-rs/forge-std --no-commit
}

forge build
forge test -vv
