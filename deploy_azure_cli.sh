#!/bin/bash
# Azure CLI Deployment Script for LLM Interview Simulator
# ======================================================

echo "🚀 Starting Azure deployment..."

# Variables (update these with your preferred names)
RESOURCE_GROUP="llm-interview-rg"
APP_NAME="llm-interview-simulator-$(date +%s)"  # Adds timestamp for uniqueness
LOCATION="eastus"

echo "📋 Deployment Configuration:"
echo "Resource Group: $RESOURCE_GROUP"
echo "App Name: $APP_NAME"
echo "Location: $LOCATION"

# Login to Azure (if not already logged in)
echo "🔐 Logging into Azure..."
az login

# Create resource group
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service plan
echo "🏗️ Creating App Service plan..."
az appservice plan create \
  --name "${APP_NAME}-plan" \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

# Create web app
echo "🌐 Creating web app..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan "${APP_NAME}-plan" \
  --name $APP_NAME \
  --runtime "PYTHON|3.11" \
  --deployment-local-git

# Configure app settings
echo "⚙️ Configuring app settings..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    PYTHONPATH=/home/site/wwwroot

# Set startup command
echo "🚀 Setting startup command..."
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --startup-file "startup.py"

# Get deployment URL
DEPLOYMENT_URL="https://${APP_NAME}.scm.azurewebsites.net/${APP_NAME}.git"
echo "📡 Deployment URL: $DEPLOYMENT_URL"

# Get app URL
APP_URL="https://${APP_NAME}.azurewebsites.net"
echo "🌍 Your app will be available at: $APP_URL"

echo "✅ Azure resources created successfully!"
echo ""
echo "Next steps:"
echo "1. Add Azure remote: git remote add azure $DEPLOYMENT_URL"
echo "2. Deploy: git push azure main"
echo "3. Visit your app: $APP_URL"
