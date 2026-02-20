# AWS Deployment Guide (EB + S3 + CloudFront)

This guide matches the current repo layout:
- Backend: `backend/` (FastAPI on Elastic Beanstalk)
- Frontend: `frontend/` (Vite build hosted on S3 + CloudFront)

Note: Creating AWS resources may incur costs. Do not run the AWS commands
below unless you are ready for paid services.

## 1) Backend: Elastic Beanstalk (FastAPI)

### Prereqs
- AWS CLI configured
- EB CLI installed
- `backend/.env` populated (do not commit this file)

### Build/Run command
The backend uses a `Procfile`:
```
web: gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:$PORT app.main:app
```

### Environment variables
Set these in the EB environment (do NOT commit):
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SECRET_KEY=...
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=...
AWS_REGION=...
BEDROCK_MODEL_ID=...
CORS_ORIGINS=https://<your-cloudfront-domain>
```

### Deploy (EB)
From `backend/`:
```
eb init
eb create
eb deploy
```

### Database migrations
After deployment, run:
```
alembic upgrade head
```

## 2) Frontend: S3 + CloudFront

### Build
From `frontend/`:
```
npm install
npm run build
```

### Configure API base URL
Set `VITE_API_BASE_URL` in `frontend/.env`:
```
VITE_API_BASE_URL=https://<your-eb-domain>
```

### Upload to S3
Upload `frontend/dist/` to your S3 bucket.

### CloudFront
Create a CloudFront distribution with the S3 bucket as origin.
Use the CloudFront URL as your public frontend URL.
