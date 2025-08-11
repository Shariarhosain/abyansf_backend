# 🚀 Deployment Guide

## Quick Deployment Checklist

- [ ] PostgreSQL Database Setup
- [ ] RabbitMQ Server Installation
- [ ] Environment Variables Configuration
- [ ] Database Migration
- [ ] Service Dependencies Installation
- [ ] Service Startup
- [ ] Health Check Verification

## Prerequisites

### System Requirements

- **Node.js**: 18.0 or higher
- **PostgreSQL**: 13.0 or higher
- **RabbitMQ**: 3.8 or higher
- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: Minimum 20GB free space
- **OS**: Ubuntu 20.04 LTS, CentOS 8, or similar

### Required Accounts

- [ ] Firebase Project with Admin SDK
- [ ] Email Service (SendGrid/SMTP)
- [ ] SMS Provider (optional)
- [ ] Cloud Storage (AWS S3 - optional)

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/MTS-Services/abyansf_backend.git
cd abyansf_backend
```

### 2. Install Dependencies

```bash
# Backend Service
cd backend_branch_folder
npm install

# Image Service
cd ../img_branch_folder
npm install

# RabbitMQ Workers
cd ../rabbitmq_branch_folder
npm install

# Return to root
cd ..
```

### 3. Database Setup

#### Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE abyansf_db;
CREATE USER abyansf_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE abyansf_db TO abyansf_user;
\q
```

### 4. RabbitMQ Setup

#### Install RabbitMQ

```bash
# Ubuntu/Debian
sudo apt install rabbitmq-server

# Start RabbitMQ service
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server

# Enable management plugin
sudo rabbitmq-plugins enable rabbitmq_management

# Create admin user
sudo rabbitmqctl add_user admin admin123
sudo rabbitmqctl set_user_tags admin administrator
sudo rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"
```

### 5. Environment Configuration

#### Backend Service (.env)

```bash
cd backend_branch_folder
cp .env.example .env
```

```env
# Database Configuration
DATABASE_URL="postgresql://abyansf_user:your_password@localhost:5432/abyansf_db"

# JWT Configuration
SECRET_CODE="your-super-secret-jwt-key-min-32-characters"

# Server Configuration
PORT=3000
NODE_ENV=development

# Firebase Configuration
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# RabbitMQ Configuration
RABBITMQ_URL="amqp://admin:admin123@localhost:5672"

# Email Configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Redis Configuration (optional)
REDIS_URL="redis://localhost:6379"
```

#### Image Service (.env)

```bash
cd ../img_branch_folder
cp .env.example .env
```

```env
# Server Configuration
PORT=3200
NODE_ENV=development

# Base URL for image serving
BASE_URL="http://localhost:3200"

# Upload Configuration
MAX_FILE_SIZE=209715200  # 200MB
UPLOAD_DIR="./uploads"

# CORS Configuration
CORS_ORIGIN="*"
```

#### RabbitMQ Workers (.env)

```bash
cd ../rabbitmq_branch_folder
cp .env.example .env
```

```env
# RabbitMQ Configuration
RABBITMQ_URL="amqp://admin:admin123@localhost:5672"

# Database Configuration
DATABASE_URL="postgresql://abyansf_user:your_password@localhost:5432/abyansf_db"

# Firebase Configuration (same as backend)
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

### 6. Database Migration

```bash
cd backend_branch_folder

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed
```

### 7. Start Services

#### Option 1: Manual Start (Development)

```bash
# Terminal 1: RabbitMQ Workers
cd rabbitmq_branch_folder
npm start

# Terminal 2: Image Service
cd img_branch_folder
npm start

# Terminal 3: Main Backend
cd backend_branch_folder
npm run dev
```

#### Option 2: Using PM2 (Production-like)

```bash
# Install PM2 globally
npm install -g pm2

# Start all services
pm2 start ecosystem.config.js

# Monitor services
pm2 monit

# View logs
pm2 logs

# Stop all services
pm2 stop all
```

Create `ecosystem.config.js` in the root:

```javascript
module.exports = {
  apps: [
    {
      name: 'abyansf-backend',
      cwd: './backend_branch_folder',
      script: 'src/app.js',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'abyansf-images',
      cwd: './img_branch_folder',
      script: 'server.js',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'abyansf-workers',
      cwd: './rabbitmq_branch_folder',
      script: 'rabbitmq.js',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

## Production Deployment

### Docker Deployment

#### 1. Docker Compose Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: abyansf_db
      POSTGRES_USER: abyansf_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend_branch_folder
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://abyansf_user:${DB_PASSWORD}@postgres:5432/abyansf_db
      - RABBITMQ_URL=amqp://admin:${RABBITMQ_PASSWORD}@rabbitmq:5672
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - rabbitmq
      - redis

  image-service:
    build:
      context: ./img_branch_folder
      dockerfile: Dockerfile
    ports:
      - "3200:3200"
    volumes:
      - ./uploads:/app/uploads

  workers:
    build:
      context: ./rabbitmq_branch_folder
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://abyansf_user:${DB_PASSWORD}@postgres:5432/abyansf_db
      - RABBITMQ_URL=amqp://admin:${RABBITMQ_PASSWORD}@rabbitmq:5672
    depends_on:
      - postgres
      - rabbitmq

volumes:
  postgres_data:
  rabbitmq_data:
  redis_data:
```

#### 2. Dockerfiles

**Backend Dockerfile** (`backend_branch_folder/Dockerfile`):

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
```

**Image Service Dockerfile** (`img_branch_folder/Dockerfile`):

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p uploads

EXPOSE 3200

CMD ["npm", "start"]
```

**Workers Dockerfile** (`rabbitmq_branch_folder/Dockerfile`):

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["npm", "start"]
```

#### 3. Deploy with Docker Compose

```bash
# Create .env file for Docker Compose
echo "DB_PASSWORD=your_secure_password" > .env
echo "RABBITMQ_PASSWORD=your_rabbitmq_password" >> .env

# Build and start services
docker-compose up --build -d

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Cloud Deployment (AWS/DigitalOcean)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Docker (optional)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Database Setup (Managed)

Use managed database services:

- **AWS RDS** for PostgreSQL
- **AWS ElastiCache** for Redis
- **AWS MQ** for RabbitMQ

Update connection strings in environment variables.

#### 3. SSL/TLS Setup

```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Setup auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 4. Nginx Configuration

```nginx
# /etc/nginx/sites-available/abyansf
upstream backend {
    server localhost:3000;
}

upstream images {
    server localhost:3200;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # API routes
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Image service
    location /upload/ {
        proxy_pass http://images;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location / {
        root /var/www/html;
        try_files $uri $uri/ =404;
    }
}
```

## Health Checks & Monitoring

### Health Check Endpoints

Add to your backend service:

```javascript
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            database: 'connected',
            rabbitmq: 'connected',
            redis: 'connected'
        }
    });
});
```

### Monitoring with PM2

```bash
# Monitor all processes
pm2 monit

# Setup log rotation
pm2 install pm2-logrotate

# Setup startup script
pm2 startup
pm2 save

# Check status
pm2 status
```

### Database Backup

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup"
DB_NAME="abyansf_db"

# Create backup
pg_dump -h localhost -U abyansf_user $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql s3://your-backup-bucket/
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U abyansf_user -d abyansf_db

# Reset password
sudo -u postgres psql
ALTER USER abyansf_user PASSWORD 'new_password';
```

#### 2. RabbitMQ Connection Issues

```bash
# Check RabbitMQ status
sudo systemctl status rabbitmq-server

# Check management interface
curl http://localhost:15672

# Reset admin user
sudo rabbitmqctl delete_user admin
sudo rabbitmqctl add_user admin new_password
sudo rabbitmqctl set_user_tags admin administrator
```

#### 3. Port Already in Use

```bash
# Find process using port
lsof -i :3000
lsof -i :3200

# Kill process
kill -9 <PID>
```

#### 4. Permission Issues

```bash
# Fix upload directory permissions
sudo chown -R $USER:$USER uploads/
chmod 755 uploads/

# Fix log file permissions
sudo chown -R $USER:$USER logs/
```

### Log Locations

- **PM2 Logs**: `~/.pm2/logs/`
- **System Logs**: `/var/log/`
- **Application Logs**: `./logs/` (if configured)
- **Nginx Logs**: `/var/log/nginx/`

### Performance Monitoring

```bash
# Server resources
htop
iostat -x 1
free -h

# Application metrics
pm2 monit

# Database performance
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

## Security Checklist

- [ ] Change default passwords
- [ ] Enable firewall (ufw/iptables)
- [ ] Setup SSL certificates
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Setup log monitoring
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Environment variable security
- [ ] File upload restrictions
