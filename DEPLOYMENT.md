# SyndicateOS — Production Self-Hosted Deployment Guide (Option C)

This guide walks you through deploying the complete **SyndicateOS ERP** (Frontend + Backend + PostgreSQL Database) on a single server/host with your custom domain **`sos.krishisetu9.in`**.

---

## 1. Architecture Overview (Single Server)

```
                       [ User Browser / Mobile App ]
                                     │
                                     ▼
                    HTTPS https://sos.krishisetu9.in
                                     │
                           [ Nginx Reverse Proxy ]
                              (Port 80 / 443 SSL)
                                     │
                      ┌──────────────┴──────────────┐
                      ▼                             ▼
         [ Express Full-Stack Server ]      [ PostgreSQL 16 ]
             (Port 3000: API + React)          (Port 5432)
```

* **Frontend & Backend on Same Host:** Express (`server.ts`) serves both the React production application and all REST API endpoints on port 3000.
* **Database on Same Host:** PostgreSQL 16 with persistent volume storage (`pgdata`), auto-initialized with `init.sql`.
* **Zero Third-Party Link Dependencies:** Your domain `sos.krishisetu9.in` connects directly to your own server.

---

## 2. Server Prerequisites

Any standard Linux server (Ubuntu 22.04 or 24.04 LTS recommended):
* **Provider:** DigitalOcean Droplet ($6–$12/mo), AWS EC2 (t3.small), Hetzner, GCP Compute Engine, Hostinger, or Linode.
* **Specs:** 2 vCPU, 2GB–4GB RAM, 20GB+ SSD.
* **Installed tools:** Docker & Docker Compose (`apt install docker.io docker-compose-v2`).

---

## 3. Step-by-Step Deployment (Takes 5 Minutes)

### Step 1: Point GoDaddy DNS to Your Server IP
In **GoDaddy DNS Management** for `krishisetu9.in`:
1. Add an **`A` record**:
   * **Type:** `A`
   * **Name:** `sos`
   * **Value:** `<YOUR_SERVER_PUBLIC_IP>` (e.g. `142.93.xxx.xxx`)
   * **TTL:** `600 seconds` (or 1/2 Hour)

---

### Step 2: Clone & Launch via Docker Compose
On your Linux server, run:

```bash
# 1. Clone your repository
git clone <YOUR_GIT_REPO_URL> syndicate-os
cd syndicate-os

# 2. Build and launch the full-stack container & database
docker compose up -d --build
```

Docker Compose will automatically:
1. Compile the React 19 frontend into optimized production assets.
2. Spin up the PostgreSQL 16 database and auto-execute `init.sql` (creating all tables and pre-seeding Super Admin `9550247162`).
3. Start the Express full-stack application server on `http://localhost:3000`.

---

### Step 3: Install Nginx & SSL Certificate (Free Let's Encrypt)
On your server:

```bash
# Install Nginx and Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Copy the pre-configured Nginx template
sudo cp nginx.conf /etc/nginx/sites-available/sos.krishisetu9.in
sudo ln -s /etc/nginx/sites-available/sos.krishisetu9.in /etc/nginx/sites-enabled/

# Obtain free automatic SSL certificate
sudo certbot --nginx -d sos.krishisetu9.in
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

---

## 4. Verification

Visit: **`https://sos.krishisetu9.in`**

You will see:
* Direct SSL padlock 🔒
* No Google studio links or external domains
* Clean URL address bar
* Production Security Gate with Mobile & PIN Authentication:
  * **Super Admin:** Mobile: `9550247162` | Default PIN: `9999`
  * **Firm Accountant:** Firm Code: `SC-AP` | Mobile: `9440156789` | PIN: `9999`
  * **Field Partner (srini):** Firm Code: `SC-AP` | Mobile: `9848011111` | PIN: `9999`
  * **Field Partner (Naresh):** Firm Code: `SC-AP` | Mobile: `9848022222` | PIN: `9999`
