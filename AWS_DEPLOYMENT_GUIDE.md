# AWS Deployment Guide for LLM Interview Simulator

## Frontend Deployment (AWS Amplify)

### 1. Connect Repository
1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Connect your GitHub repository: `vinisha231/Capstone`
4. Select branch: `main`
5. Root directory: `frontend`

### 2. Build Settings
The `amplify.yml` file is already configured with:
- Node.js 18+ environment
- npm ci for dependency installation
- Build command: `npm run build`
- Output directory: `dist`

### 3. Environment Variables
Set these in Amplify Console → App settings → Environment variables:
```
VITE_API_URL=https://your-backend-url.elasticbeanstalk.com
VITE_AWS_REGION=us-east-1
```

## Backend Deployment (AWS Elastic Beanstalk)

### 1. Prepare Backend
```bash
cd backend
pip install -r requirements.txt
```

### 2. Create Application Package
```bash
zip -r backend-deployment.zip . -x "*.pyc" "__pycache__/*" "*.git*"
```

### 3. Deploy to Elastic Beanstalk
1. Go to AWS Elastic Beanstalk Console
2. Create new application: "llm-interview-simulator"
3. Platform: Python 3.11
4. Upload `backend-deployment.zip`
5. Configure environment variables in EB console

### 4. Environment Variables for Backend
```
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/interview_simulator
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
JWT_SECRET_KEY=your-jwt-secret
```

## Database Setup (AWS RDS)

### 1. Create PostgreSQL Database
1. Go to AWS RDS Console
2. Create database: PostgreSQL 13.7
3. Instance class: db.t3.micro
4. Storage: 20 GB
5. Database name: `interview_simulator`
6. Master username: `postgres`
7. Set master password

### 2. Run Migrations
```bash
cd backend
alembic upgrade head
```

## AWS Services Used

### Frontend
- **AWS Amplify**: Hosting and CI/CD
- **CloudFront**: CDN (automatic with Amplify)

### Backend
- **AWS Elastic Beanstalk**: Application hosting
- **AWS RDS PostgreSQL**: Database
- **AWS Bedrock**: AI/LLM services
- **AWS CloudWatch**: Monitoring and logging

### Additional Services
- **AWS Cognito**: User authentication (optional)
- **AWS S3**: File storage (for future features)
- **AWS Polly**: Text-to-speech (for voice features)
- **AWS Transcribe**: Speech-to-text (for voice features)

## Cost Optimization
- Use t3.micro instances for development
- Enable auto-scaling for production
- Use CloudWatch for monitoring
- Set up billing alerts

## Security
- Use IAM roles instead of access keys
- Enable VPC for database security
- Use HTTPS only
- Set up proper CORS policies
- Use environment variables for secrets

## Monitoring
- CloudWatch logs for application monitoring
- RDS monitoring for database performance
- Amplify build logs for deployment issues
- Set up CloudWatch alarms for critical metrics
