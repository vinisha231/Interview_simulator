# LLM Interview Simulator - Backend API

A comprehensive FastAPI backend for the LLM Interview Simulator project. This backend provides REST API endpoints for interview functionality, question management, and answer evaluation.

## 🚀 Features

- **FastAPI Framework**: Modern, fast web framework with automatic API documentation
- **Interview API**: Endpoints for managing interview questions and evaluations
- **CORS Support**: Configured for cross-origin requests from frontend applications
- **Health Checks**: Monitoring endpoints for application health
- **Azure Ready**: Pre-configured for deployment on Azure App Service
- **Docker Support**: Containerized deployment option included

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py              # Main FastAPI application
│   ├── routers/
│   │   └── interview.py     # Interview-related API endpoints
│   ├── services/            # Business logic services
│   ├── models/              # Data models and schemas
│   ├── database/            # Database configuration
│   └── utils/               # Utility functions
├── tests/                   # Test files
├── requirements.txt         # Python dependencies
├── startup.py              # Azure deployment entry point
├── web.config              # Azure IIS configuration
├── Dockerfile              # Docker container configuration
└── .deployment             # Azure deployment settings
```

## 🛠️ Setup and Installation

### Prerequisites

- Python 3.11 or higher
- pip (Python package installer)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd llm-interview-simulator/backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   # Option 1: Direct execution
   python app/main.py
   
   # Option 2: Using uvicorn
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Access the application**
   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - Health check: http://localhost:8000/health

## 📚 API Endpoints

### Core Endpoints

- `GET /` - Welcome message and basic health status
- `GET /health` - Detailed health check for monitoring

### Interview Endpoints

- `GET /api/interview/` - Get sample interview questions
- `POST /api/interview/evaluate` - Evaluate user's answer to a question
- `GET /api/interview/types` - Get available interview types

### Example API Usage

```bash
# Get interview questions
curl http://localhost:8000/api/interview/

# Evaluate an answer
curl -X POST http://localhost:8000/api/interview/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Explain REST APIs",
    "user_answer": "REST is a web service architecture...",
    "interview_type": "technical"
  }'

# Get interview types
curl http://localhost:8000/api/interview/types
```

## 🐳 Docker Deployment

### Build the Docker image
```bash
docker build -t llm-interview-simulator .
```

### Run the container
```bash
docker run -p 8000:8000 llm-interview-simulator
```

## ☁️ Azure Deployment

### Option 1: Azure App Service (Recommended)

1. **Create Azure App Service**
   - Go to Azure Portal
   - Create new App Service
   - Choose Python 3.11 runtime

2. **Configure deployment**
   - Connect to your GitHub repository
   - Set startup command: `python startup.py`

3. **Environment variables**
   - Set `PORT=8000` (Azure sets this automatically)
   - Add any additional environment variables as needed

### Option 2: Azure Container Instances

```bash
# Build and push to Azure Container Registry
az acr build --registry yourregistry --image llm-interview-simulator .

# Deploy to Container Instance
az container create --resource-group your-rg --name llm-interview-container \
  --image yourregistry.azurecr.io/llm-interview-simulator --ports 8000
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server configuration
PORT=8000
ENVIRONMENT=development

# Future: API keys and database configuration
# OPENAI_API_KEY=your_openai_api_key_here
# DATABASE_URL=your_database_connection_string_here
```

### CORS Configuration

The application is configured to accept requests from any origin (`*`). In production, update the CORS settings in `app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],  # Specify your frontend domain
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

## 🧪 Testing

### Run tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest tests/
```

### Manual testing
- Use the interactive docs at http://localhost:8000/docs
- Test endpoints using curl or Postman
- Check health endpoint for monitoring

## 📝 Development Notes

### Code Structure

- **main.py**: Application entry point, CORS configuration, route inclusion
- **routers/**: API endpoint definitions organized by feature
- **models/**: Pydantic models for request/response validation
- **services/**: Business logic (future: LLM integration, database operations)

### Key Technologies

- **FastAPI**: Web framework with automatic API documentation
- **Pydantic**: Data validation using Python type hints
- **Uvicorn**: ASGI server for running FastAPI applications
- **Python 3.11**: Modern Python with improved performance

### Future Enhancements

- [ ] OpenAI GPT integration for real interview evaluation
- [ ] Database integration for storing questions and results
- [ ] User authentication and session management
- [ ] Advanced scoring algorithms
- [ ] Interview analytics and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper comments
4. Test your changes
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process using port 8000
   lsof -ti:8000 | xargs kill -9
   ```

2. **Import errors**
   ```bash
   # Make sure you're in the correct directory
   cd backend
   python -c "from app.main import app; print('Import successful')"
   ```

3. **Dependencies not installed**
   ```bash
   pip install -r requirements.txt
   ```

### Getting Help

- Check the interactive API docs at `/docs`
- Review the application logs
- Ensure all dependencies are installed
- Verify Python version compatibility (3.11+)

---

**Happy coding! 🎉**
