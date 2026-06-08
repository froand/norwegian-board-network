# Azure Deployment Script for Norwegian Board Network
# Prerequisites: az cli logged in, Docker running

$ErrorActionPreference = "Stop"

# Configuration
$SUBSCRIPTION_ID = $env:AZURE_SUBSCRIPTION_ID  # Set via environment variable
$RESOURCE_GROUP = "norwegian-board-network"
$LOCATION = "norwayeast"
$ENV_NAME = "norsk-nettverk"

Write-Host "🚀 Deploying Norwegian Board Network to Azure..." -ForegroundColor Cyan

# Set subscription
az account set --subscription $SUBSCRIPTION_ID

# Create resource group if not exists
Write-Host "`n📦 Creating resource group..." -ForegroundColor Yellow
az group create --name $RESOURCE_GROUP --location $LOCATION --output none

# Deploy infrastructure with Bicep
Write-Host "`n🏗️ Deploying infrastructure (Container Apps, ACR, Log Analytics)..." -ForegroundColor Yellow
$deployment = az deployment group create `
  --resource-group $RESOURCE_GROUP `
  --template-file ./infra/main.bicep `
  --parameters ./infra/main.parameters.json `
  --query "properties.outputs" `
  --output json | ConvertFrom-Json

$ACR_SERVER = $deployment.acrLoginServer.value
$BACKEND_URL = $deployment.backendUrl.value
$FRONTEND_URL = $deployment.frontendUrl.value

Write-Host "  ACR: $ACR_SERVER" -ForegroundColor Gray
Write-Host "  Backend: $BACKEND_URL" -ForegroundColor Gray
Write-Host "  Frontend: $FRONTEND_URL" -ForegroundColor Gray

# Login to ACR
Write-Host "`n🔑 Logging into Container Registry..." -ForegroundColor Yellow
az acr login --name ($ACR_SERVER -replace '\.azurecr\.io', '')

# Build and push backend
Write-Host "`n🐳 Building and pushing backend..." -ForegroundColor Yellow
docker build -t "${ACR_SERVER}/${ENV_NAME}-backend:latest" ./backend
docker push "${ACR_SERVER}/${ENV_NAME}-backend:latest"

# Build frontend with correct API URL
Write-Host "`n🐳 Building and pushing frontend..." -ForegroundColor Yellow
docker build -t "${ACR_SERVER}/${ENV_NAME}-frontend:latest" `
  --build-arg VITE_API_URL=$BACKEND_URL `
  ./frontend
docker push "${ACR_SERVER}/${ENV_NAME}-frontend:latest"

# Update container apps to use new images
Write-Host "`n🔄 Updating container apps..." -ForegroundColor Yellow
az containerapp update --name "${ENV_NAME}-api" --resource-group $RESOURCE_GROUP `
  --image "${ACR_SERVER}/${ENV_NAME}-backend:latest" --output none
az containerapp update --name "${ENV_NAME}-web" --resource-group $RESOURCE_GROUP `
  --image "${ACR_SERVER}/${ENV_NAME}-frontend:latest" --output none

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "  Frontend: $FRONTEND_URL" -ForegroundColor Cyan
Write-Host "  Backend API: $BACKEND_URL" -ForegroundColor Cyan
