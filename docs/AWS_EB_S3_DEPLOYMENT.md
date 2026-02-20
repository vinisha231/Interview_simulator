# AWS Deployment Guide (EB + S3 + CloudFront)

This guide matches the current repo layout:
- Backend: `backend/` (FastAPI on Elastic Beanstalk)
- Frontend: `frontend/` (Vite build hosted on S3 + CloudFront)

Cost notice: Creating AWS resources (Elastic Beanstalk, S3, CloudFront, RDS)
can incur charges. Do not run paid-resource commands unless you are ready.

## 1) Backend: Elastic Beanstalk (FastAPI)

### Prereqs
- AWS CLI configured
- EB CLI installed
- `backend/.env` populated (do not commit this file)

### Step-by-step: first-time deploy
1) Install dependencies locally (optional but recommended for validation)
```
cd backend
pip install -r requirements.txt
```

2) Initialize EB in the backend folder
```
eb init
```
Choose:
- Platform: Python 3.x
- Region: your AWS region

3) Create an EB environment
```
eb create
```
Choose:
- Environment name: e.g. `interview-backend`
- DNS prefix: unique name
- Load balancer: application

4) Set environment variables in EB
In the AWS console (Elastic Beanstalk → Configuration → Software), set:
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SECRET_KEY=...
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=...
AWS_REGION=...
BEDROCK_MODEL_ID=...
CORS_ORIGINS=https://<your-cloudfront-domain>
```

5) Deploy the backend
```
eb deploy
```

6) Run migrations (once the environment is live)
```
alembic upgrade head
```

### Build/Run command
The backend uses a `Procfile`:
```
web: gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:$PORT app.main:app
```

### Typical deployment time
- First deploy: 5–12 minutes (environment + app)
- Subsequent deploys: 2–6 minutes
Times vary by region and account limits.

## 2) Frontend: S3 + CloudFront

### Step-by-step: first-time deploy
1) Install and build
```
cd frontend
npm install
npm run build
```

2) Configure API base URL
Create `frontend/.env`:
```
VITE_API_BASE_URL=https://<your-eb-domain>
```

3) Create an S3 bucket (static hosting)
Create a bucket for `frontend/dist/` and enable static website hosting.

4) Upload build output
Upload `frontend/dist/` to the bucket root.

5) Create CloudFront distribution
Set the S3 bucket as origin. Use the CloudFront URL as your frontend URL.

### Build
From `frontend/`:
```
npm install
npm run build
```

### Typical deployment time
- S3 upload: 1–3 minutes
- CloudFront distribution: 10–30 minutes to fully propagate

## 3) Redeploy after changes

### Backend redeploy (code change)
From `backend/`:
```
eb deploy
```
Typical time: 2–6 minutes.

### Backend redeploy (DB change)
If you add a migration:
```
eb deploy
alembic upgrade head
```
Typical time: 3–8 minutes.

### Frontend redeploy
From `frontend/`:
```
npm run build
```
Then upload `frontend/dist/` again to S3.
Typical time: 2–5 minutes (excluding CloudFront cache).

### CloudFront cache invalidation (optional)
If you need immediate updates:
- Invalidate `/*` in CloudFront.
- Typical time: 1–5 minutes.

## 4) Notes
- Keep `backend/.env` local and never commit it.
- If you change the backend URL, update `VITE_API_BASE_URL` and rebuild.
