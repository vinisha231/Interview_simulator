# Deploy to Azure App Service

## Method 1: Azure CLI Deployment

### Prerequisites
1. Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
2. Login to Azure: `az login`

### Steps

1. **Create a resource group:**
```bash
az group create --name llm-interview-rg --location "East US"
```

2. **Create an App Service plan:**
```bash
az appservice plan create --name llm-interview-plan --resource-group llm-interview-rg --sku B1 --is-linux
```

3. **Create a web app:**
```bash
az webapp create --resource-group llm-interview-rg --plan llm-interview-plan --name llm-interview-simulator --runtime "PYTHON|3.11" --deployment-local-git
```

4. **Configure the app:**
```bash
az webapp config set --resource-group llm-interview-rg --name llm-interview-simulator --startup-file "startup.py"
```

5. **Deploy from local git:**
```bash
# Add Azure remote
git remote add azure https://llm-interview-simulator.scm.azurewebsites.net/llm-interview-simulator.git

# Deploy
git push azure main
```

## Method 2: GitHub Actions (Recommended)

1. **Fork this repository**
2. **Go to Azure Portal > App Service > Deployment Center**
3. **Connect to GitHub**
4. **Select your repository and branch**
5. **Azure will automatically deploy on every push**

## Method 3: Azure Container Instances

```bash
# Build and push to Azure Container Registry
az acr build --registry yourregistry --image llm-interview-simulator ./backend

# Deploy to Container Instance
az container create --resource-group llm-interview-rg --name llm-interview-container --image yourregistry.azurecr.io/llm-interview-simulator --ports 8000 --cpu 1 --memory 1
```

## Environment Variables

Set these in Azure Portal > App Service > Configuration:

- `PORT=8000`
- `ENVIRONMENT=production`
- `OPENAI_API_KEY=your_key_here` (when ready)

## Testing

After deployment, test your endpoints:
- Health check: `https://your-app-name.azurewebsites.net/health`
- API docs: `https://your-app-name.azurewebsites.net/docs`
- Interview questions: `https://your-app-name.azurewebsites.net/api/interview/`
