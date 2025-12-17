# AWS Migration Implementation Plan

## Goal

Migrate the MTG Tournament Manager Application (NestJS API + React Native/Expo Client + PostgreSQL) to Amazon Web Services (AWS) for production hosting.

## Architecture Overview

* **Database**: Amazon RDS for PostgreSQL (Managed Relational Database).
* **Backend API**: Amazon ECS (Elastic Container Service) with AWS Fargate (Serverless Compute).
  * **Container Registry**: Amazon ECR (Elastic Container Registry).
  * **Load Balancer**: Application Load Balancer (ALB) for HTTPS termination.
* **Frontend (Web)**: AWS Amplify Hosting (Managed hosting for modern web apps).
* **Authentication**: AWS Cognito (Already implemented).
* **Storage**: Amazon S3 (if image uploads are needed in future, currently not heavy usage).

---

## Phase 1: Preparation

### 1.1 Dockerize the API

Create a `Dockerfile` for the `apps/api` NestJS application.

* **Goal**: Build a lightweight, production-ready container image.
* **Action**: Create `Dockerfile` in root or `apps/api` context.

### 1.2 Environment Configuration

Identify all environment variables needed for production.

* `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
* `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`
* `AWS_REGION`
* `JWT_SECRET` (if used alongside Cognito)

---

## Phase 2: Database Layer (RDS)

### 2.1 Provision RDS Instance

* **Service**: Amazon RDS
* **Engine**: PostgreSQL (Free Tier eligible: db.t3.micro or db.t4g.micro)
* **Settings**:
  * Public Access: No (Connect via VPC/Bastion or allow temporary IP for migration).
  * VPC Security Group: Allow traffic on port 5432 from ECS Security Group.

### 2.2 Migrate Data

* Run TypeORM migrations against the new RDS instance.
* Seed initial data if necessary.

---

## Phase 3: Backend Deployment (ECS + Fargate)

### 3.1 Push Image to ECR

* Create an ECR Repository named `mtg-app-api`.
* Build and tag the Docker image.
* Push the image to ECR.

### 3.2 Create ECS Cluster & Task Definition

* **Cluster**: Create "Networking only" (Fargate) cluster.
* **Task Definition**:
  * Select Fargate launch type.
  * Image URI: Link to ECR image.
  * Environment Variables: Inject DB credentials and Cognito config here (or use Secrets Manager).
  * Port Mappings: 3000.

### 3.3 Create Service & Load Balancer

* Create an ECS Service.
* Configure **Application Load Balancer (ALB)**.
  * Listener: HTTP (80) -> Redirect to HTTPS (443) (if domain available).
  * Target Group: HTTP on port 3000 (Target type: IP).
* **Result**: You will get a DNS name for the Load Balancer (e.g., `mtg-api-loadbalancer-123.us-east-1.elb.amazonaws.com`). This is your new `API_URL`.

---

## Phase 4: Frontend Deployment

### 4.1 Update Client Configuration

* Update `apps/client/src/config.ts` (or env vars).
* Set `API_URL` to the ALB DNS name (or custom domain).

### 4.2 Deploy Web Client (AWS Amplify)

* **Service**: AWS Amplify Console.
* **Source**: Connect GitHub repository.
* **Build Settings**:
  * `amplify.yml` configuration for Expo Web build (`npx expo export:web`).
  * Artifact base directory: `dist` or `web-build`.
* **Rewrites**: Setup SPA redirect (Source: `</^[^.]+$/>`, Target: `/index.html`, Type: `200`).

### 4.3 Mobile Client

* Update the `API_URL` in the Expo project.
* Publish update via EAS Update or build new `.apk`/`.ipa` pointing to the production server.

---

## Phase 5: Verification

### 5.1 Sanity Checks

* [ ] Can I log in via the hosted Web App? (Cognito redirect URIs need updating).
* [ ] Can I create a Tournament? (Database write check).
* [ ] Do Notifications work? (API polling check).

### 5.2 Updates to External Services

* **Cognito**: Update "Allowed Callback URLs" and "Allowed Sign-out URLs" to include the production Amplify domain (e.g., `https://main.d12345.amplifyapp.com`).

---

## Estimated Cost (Free Tier eligible*)

* **RDS**: 750 hrs/month db.t3.micro (Free for 12 months).
* **ECS/Fargate**: Pay per vCPU/GB RAM per hour (Low cost for small task).
* **Amplify**: Free tier for build minutes and hosting.

*Always set up AWS Budgets to monitor costs.*
