#!/bin/bash
# setup_ec2.sh
# Automated setup for Amazon Linux 2023 EC2 Instance
# Run this script with: sudo bash setup_ec2.sh

set -e

echo "========================================="
echo " Starting Amazon Linux 2023 Setup Script"
echo "========================================="

# 1. System Updates & Dependencies
echo "[1/7] Updating system and installing basic tools..."
dnf update -y
dnf install -y git curl wget unzip nano

# 2. Node.js Setup
echo "[2/7] Installing Node.js 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs
npm install -g pm2 typescript ts-node

# 3. PostgreSQL Setup
echo "[3/7] Installing and Configuring PostgreSQL 15..."
dnf install -y postgresql15.x86_64 postgresql15-server
postgresql-setup --initdb
systemctl enable postgresql
systemctl start postgresql

# Configure PostgreSQL Password Authentication
sed -i 's/ident/md5/g' /var/lib/pgsql/data/pg_hba.conf
systemctl restart postgresql

# Create Database and User
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'Blackraven-11@';" || true
sudo -u postgres psql -c "ALTER USER postgres WITH SUPERUSER;" || true
sudo -u postgres psql -c "CREATE DATABASE mydeb_db;" || true

# 4. Nginx Setup
echo "[4/7] Installing Nginx..."
dnf install -y nginx
systemctl enable nginx
systemctl start nginx

# 5. Clone Repository
echo "[5/7] Cloning Repository..."
read -p "Enter your GitHub Repository HTTPS URL: " REPO_URL
cd /home/ec2-user
git clone $REPO_URL app
cd app

# 6. Backend Setup & Start
echo "[6/7] Setting up Backend..."
cd backend
npm install
# Initialize DB
node init_pg.js
# Start PM2
pm2 start src/index.ts --name "coursue-api"
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user | grep "sudo env" | bash -
cd ..

# 7. Frontend Setup & Build
echo "[7/7] Setting up Frontend..."
cd frontend
# Create .env.production file to point API to relative path
echo "VITE_API_URL=/api" > .env.production
npm install
npm run build

# Move build to Nginx directory
rm -rf /usr/share/nginx/html/*
cp -r dist/* /usr/share/nginx/html/
chmod -R 755 /usr/share/nginx/html

# 8. Configure Nginx
echo "[8/7] Configuring Nginx for learning.kael.es..."
cat > /etc/nginx/conf.d/learning.kael.es.conf << 'EOF'
server {
    listen 80;
    server_name learning.kael.es;

    root /usr/share/nginx/html;
    index index.html;

    # Frontend routes (React Router fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Remove default nginx conf to avoid conflicts if necessary
rm -f /etc/nginx/conf.d/default.conf
systemctl restart nginx

echo "========================================="
echo " Setup Complete! 🎉"
echo " Ensure your EC2 Security Group allows Inbound Traffic on Port 80 (HTTP)."
echo " Point learning.kael.es to this instance's Public IP in your DNS settings."
echo "========================================="
