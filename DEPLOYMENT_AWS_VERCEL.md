# AWS + Vercel Deployment Guide

This project is now prepared for the following production topology:

`Vercel Frontend -> AWS Application Load Balancer -> EC2 x 3 -> Amazon RDS MariaDB`

## 1. What changed in the codebase

- Frontend API URL now reads from `VITE_API_BASE_URL`
- Backend now supports `ALLOWED_ORIGINS` for CORS
- Backend exposes `GET /api/v1/health` for ALB health checks
- Backend trusts reverse proxy headers from the load balancer
- Production scripts now separate `migration` from `serve`

## 2. Frontend on Vercel

Set the Vercel project root to `front-end`.

Recommended no-domain setup:

- Keep frontend requests on the same Vercel origin with `/api/v1`
- Use `front-end/vercel.json` to externally rewrite `/api/*` to the AWS ALB
- This avoids browser mixed-content issues while your ALB is still HTTP-only

Environment variable on Vercel:

```bash
VITE_API_BASE_URL=/api/v1
```

Current backend rewrite target in this repo:

```bash
http://rtrs-alb-1142412083.ap-southeast-1.elb.amazonaws.com
```

Important:

- Use the ALB DNS name or a custom API domain, not an individual EC2 public IP
- This rewrite-based setup is a practical temporary solution when you do not yet own a domain
- For long-term production, move to `https://api.yourdomain.com/api/v1`

## 3. Backend environment on every EC2 instance

Create `back-end/.env` from `back-end/.env.example`.

Example:

```bash
DB_USERNAME=admin
DB_PASSWORD=your-rds-password
DB_NAME=rtrs_db
DB_NAME_TEST=rtrs_db_test
DB_HOST=rtrs-db-main.xxxxx.ap-southeast-1.rds.amazonaws.com
DB_DIALECT=mysql
DB_PORT=3306
PORT=5000
NODE_ENV=production
ALLOWED_ORIGINS=https://your-project.vercel.app,https://www.yourdomain.com
```

For Amazon RDS MariaDB with this project, keep `DB_DIALECT=mysql` because this codebase uses `mysql2`.

## 4. Security groups

Recommended setup:

- `alb-sg`
  - inbound `80` from `0.0.0.0/0`
  - inbound `443` from `0.0.0.0/0`
- `ec2-backend-sg`
  - inbound `22` from your IP only
  - inbound `5000` from `alb-sg` only
- `rds-sg`
  - inbound `3306` from `ec2-backend-sg` only

Do not open RDS to the public internet.

## 5. Install and run backend on EC2

Run these steps on all 3 backend instances:

```bash
git clone <your-repository-url>
cd restaurant-table-reservation-system/back-end
npm ci
```

Install PM2:

```bash
npm install -g pm2
```

Start the API on each instance:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## 6. Run database migrations safely

Important:

- Run migrations only once
- Do not let all 3 EC2 instances run migrations at the same time

Run this on only one backend instance:

```bash
cd restaurant-table-reservation-system/back-end
npm run migrate:prod
```

After migration is complete, keep the other instances on `npm run serve:prod` or PM2 only.

## 7. Create the target group and ALB

Target group:

- target type: `Instances`
- protocol: `HTTP`
- port: `5000`
- health check path: `/api/v1/health`
- success code: `200`

Register all 3 EC2 instances in the target group.

Application Load Balancer:

- internet-facing
- attach `alb-sg`
- listener `HTTP :80` -> forward to target group
- optional listener `HTTPS :443` with ACM certificate

## 8. Verify backend before connecting Vercel

Test directly on the ALB DNS:

```bash
http://your-alb-123456.ap-southeast-1.elb.amazonaws.com/api/v1/health
```

You should get JSON with `status: ok`.

Also test:

```bash
http://your-alb-123456.ap-southeast-1.elb.amazonaws.com/api/v1/reservations
```

## 9. Recommended production flow

Use this order:

1. Create RDS MariaDB
2. Configure security groups
3. Prepare 3 EC2 backend instances
4. Deploy backend to all instances
5. Run migration on one instance only
6. Create target group and ALB
7. Confirm `/api/v1/health` is healthy on all targets
8. Deploy frontend to Vercel with `VITE_API_BASE_URL`

## 10. Optional domain setup

Best practice:

- frontend domain: `www.yourdomain.com` on Vercel
- backend domain: `api.yourdomain.com` on ALB

Then use:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
ALLOWED_ORIGINS=https://www.yourdomain.com,https://your-project.vercel.app
```
