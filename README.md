# 🚀 CryptoShop v2.0 - Complete Crypto Marketplace

A fully-featured anonymous cryptocurrency marketplace with OxaPay payment integration, delivery tracking, and real-time admin chat.

## ✨ Features

### 🔐 Authentication
- Username + Password (no email required)
- Optional Telegram contact
- JWT-based authentication
- Admin role system

### 📦 Product Management v2.0
- Full CRUD operations with picture upload
- Quantity selector (1, 2, 3, 5, 10, 15, 20 units)
- **EUR as default currency** (also supports USD, BTC, ETH)
- Product picture (200x200 recommended)
- Description and pricing
- Soft delete (products become inactive)

### 💳 Shopping & Payments
- Product catalog with responsive grid
- Shopping cart system
- **Crypto payments via OxaPay API v1**
- Multiple cryptocurrency support
- Webhook integration with HMAC verification
- Real-time payment status updates

### 📦 Delivery Tracking System (NEW in v2.0)
- **Two-step delivery process:**
  1. Customer pays → Order status = 'paid', delivery_status = 'pending'
  2. Admin adds delivery info (map link + image link) → Status = 'delivered'
- **Delivery links revealed ONLY after admin confirmation**
- Map link and image link per order
- Delivery timestamp tracking

### 👥 User Management
- User registration and login
- Profile with order history
- **Total orders and total spent statistics**
- Search users by username (admin)
- Delete user functionality (admin)
- Toggle admin privileges

### 📊 Admin Panel v2.0 (Fully Responsive)
- **Dashboard:**
  - Total users, products, orders, revenue (EUR)
  - **Pending deliveries counter**
  - Recent orders table with delivery status

- **Products Management:**
  - Create/Edit/Delete products
  - Picture link upload with live preview
  - Quantity dropdown selector
  - EUR default currency

- **Orders Management:**
  - Payment status filter (pending/paid/failed/expired)
  - Delivery status filter (pending/delivered)
  - **Delivery form with "Изпрати!" button**
  - Add map link + image link for paid orders
  - View delivery info for completed orders

- **Users Management:**
  - Search by username
  - View total orders and total spent per user
  - Grant/revoke admin privileges
  - Delete users with confirmation

- **Settings:**
  - System information
  - Environment variables guide
  - Webhook configuration
  - Security checklist
  - Database management commands

### 🎨 Design
- Dark/Cyber/Hacker theme
- Neon green (#00ff00) / cyan (#00ffff) colors
- Terminal aesthetic with glitch effects
- **Fully responsive (mobile-first design)**
- Desktop sidebar + mobile hamburger menu

---

## 📋 Prerequisites

- **Node.js 18+** and npm
- **PostgreSQL 14+**
- **Git**
- Domain (optional, for production)
- **OxaPay merchant account**

---

## 🚀 Quick Start

### 1️⃣ Clone Repository

```bash
git clone <your-repo-url>
cd Crypto-shop
git checkout claude/upload-privacy-project-011CUKLk8uC5a66QpcumRJ5Z
```

### 2️⃣ Database Setup

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql
```

**In PostgreSQL prompt:**
```sql
CREATE DATABASE cryptoshop;
CREATE USER cryptoshop_user WITH PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE cryptoshop TO cryptoshop_user;
\q
```

**Import schema:**
```bash
# For new installation:
psql -U postgres -d cryptoshop -f database/schema.sql

# For upgrading from v1 to v2:
psql -U postgres -d cryptoshop -f database/migration_v2.sql
```

### 3️⃣ Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
nano .env
```

**Edit `.env` file:**
```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://cryptoshop_user:your_strong_password_here@localhost:5432/cryptoshop
JWT_SECRET=your_super_secret_random_string_change_this_NOW
OXAPAY_API_KEY=your_oxapay_merchant_api_key_here
```

**Start backend:**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

✅ Backend runs on **http://localhost:3001**

### 4️⃣ Frontend Setup

**Open new terminal:**
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
nano .env.local
```

**Edit `.env.local` file:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Start frontend:**
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

✅ Frontend runs on **http://localhost:3000**

### 5️⃣ Create Admin Account

**Generate bcrypt hash for password:**
```bash
cd backend
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));"
```

**Copy the hash and insert admin user:**
```bash
psql -U postgres -d cryptoshop
```

```sql
INSERT INTO users (username, password_hash, telegram, is_admin)
VALUES ('admin', 'paste_your_bcrypt_hash_here', '@admin_telegram', true);

\q
```

**⚠️ Important:** Change admin password after first login!

### 6️⃣ OxaPay Setup

1. **Register merchant account:**
   - Go to https://oxapay.com
   - Sign up for merchant account

2. **Get API credentials:**
   - Dashboard → API Settings
   - Copy **Merchant API Key**
   - Add to `backend/.env`:
     ```env
     OXAPAY_API_KEY=your_merchant_api_key_here
     ```

3. **Configure webhook:**
   - OxaPay Dashboard → Settings → Webhooks
   - Set webhook URL: `http://your-domain.com/api/webhook/oxapay`
   - Or for local testing: Use ngrok to expose localhost

**Webhook URL format:**
```
Production: https://your-domain.com/api/webhook/oxapay
Development: https://your-ngrok-url.ngrok.io/api/webhook/oxapay
```

---

## 🧪 Testing

### Test Backend Health:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","message":"CryptoShop API is running"}
```

### Test Complete Flow:

1. **Register Account:**
   - Go to http://localhost:3000/register
   - Create username + password
   - (Optional) Add Telegram contact

2. **Browse Products:**
   - View products on home page
   - See EUR prices
   - Check product pictures (200x200)

3. **Place Order:**
   - Add products to cart
   - Checkout → Redirects to OxaPay payment page
   - Complete payment with crypto

4. **Wait for Admin Delivery:**
   - Order status = 'paid', delivery_status = 'pending'
   - Admin receives notification in admin panel
   - Admin adds map link + image link
   - Admin clicks **"Изпрати!"** button

5. **Check Delivery:**
   - Go to http://localhost:3000/profile
   - See order with delivery_status = 'delivered'
   - **Map link and image link now visible!**

### Test Admin Panel:

1. **Login as admin:**
   - http://localhost:3000/login
   - Use admin credentials

2. **Access admin panel:**
   - http://localhost:3000/admin

3. **Test features:**
   - ✅ Dashboard: Check pending deliveries counter
   - ✅ Products: Add product with picture_link and quantity
   - ✅ Orders: Use filters, add delivery info
   - ✅ Users: Search users, view statistics
   - ✅ Settings: Review system info

### Test Mobile Responsive:

Open Chrome DevTools (F12) → Toggle Device Toolbar (Ctrl+Shift+M)

Test on:
- iPhone 12/13/14/15
- Samsung Galaxy S20/S21
- iPad Pro
- Desktop (1920x1080)

---

## 📁 Project Structure

```
Crypto-shop/
├── database/
│   ├── schema.sql              # v2.0 schema with delivery tracking
│   └── migration_v2.sql        # Migration from v1 to v2
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts     # PostgreSQL connection
│   │   ├── controllers/
│   │   │   ├── authController.ts       # Login, register, JWT
│   │   │   ├── productController.ts    # Product CRUD
│   │   │   ├── orderController.ts      # Order management
│   │   │   ├── paymentController.ts    # OxaPay integration
│   │   │   └── adminController.ts      # Admin panel APIs
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT auth, requireAdmin
│   │   ├── services/
│   │   │   └── oxapayService.ts        # OxaPay API v1 client
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript interfaces
│   │   └── server.ts           # Express app entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                    # Environment variables
│
├── frontend/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx        # Admin panel (1000+ lines, responsive)
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   ├── register/
│   │   │   └── page.tsx        # Registration page
│   │   ├── profile/
│   │   │   └── page.tsx        # User profile + order history
│   │   ├── layout.tsx          # Root layout with navigation
│   │   ├── page.tsx            # Home page with product catalog
│   │   └── globals.css         # Global styles + cyber theme
│   ├── lib/
│   │   └── api.ts              # API client functions
│   ├── package.json
│   ├── tailwind.config.ts      # Tailwind with custom colors
│   ├── next.config.js          # Next.js config
│   ├── .eslintrc.json          # ESLint config
│   └── .env.local              # Frontend environment variables
│
└── README.md                   # This file
```

---

## 🎯 v2.0 New Features Explained

### Delivery Tracking Workflow

**Before v2.0:**
- Product had map_link and image_link
- Links revealed immediately after payment

**v2.0 Enhancement:**
- Products have only picture_link (for display)
- Admin adds delivery info AFTER payment confirmation
- Two separate links per order: map_link + image_link
- Customer sees links only when delivery_status = 'delivered'

**Example workflow:**

```
1. Customer orders "Product A" → Pays with crypto
   ├─ Order status: pending → paid
   └─ Delivery status: pending

2. Admin sees notification in dashboard:
   ├─ "Pending Deliveries: 1"
   └─ Goes to Orders tab

3. Admin opens order:
   ├─ Clicks "📦 Add Delivery Info"
   ├─ Enters map link: https://maps.google.com/...
   ├─ Enters image link: https://imgur.com/delivery.jpg
   └─ Clicks "✉️ Изпрати!"

4. System updates:
   ├─ delivery_status: pending → delivered
   ├─ Sets delivered_at timestamp
   └─ Customer can now see delivery links

5. Customer checks profile:
   ├─ Order shows: ✓ Delivered
   ├─ 📍 View Map (clickable link)
   └─ 📷 View Image (clickable link)
```

### Quantity Selector

Products now have quantity field with preset values:
- 1, 2, 3, 5, 10, 15, 20 units

This allows bulk ordering and better inventory management.

### User Statistics

Admin can see for each user:
- **Total Orders:** Count of paid orders
- **Total Spent:** Sum of all paid orders in EUR

Useful for identifying VIP customers and sales analytics.

---

## 🔒 Security Features

✅ **Authentication:**
- JWT tokens with configurable expiration
- bcrypt password hashing (10 rounds)
- Admin-only route protection

✅ **Database:**
- Prepared statements (SQL injection protection)
- UUID primary keys
- Password hashing before storage

✅ **API Security:**
- CORS configuration
- OxaPay HMAC signature verification
- Environment variables for secrets

✅ **Delivery System:**
- Delivery links hidden until admin confirmation
- Admin self-delete protection
- Timestamp tracking for all actions

---

## 🚀 Production Deployment

### Using PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start backend
cd ~/Crypto-shop/backend
npm run build
pm2 start npm --name "cryptoshop-backend" -- start

# Start frontend
cd ~/Crypto-shop/frontend
npm run build
pm2 start npm --name "cryptoshop-frontend" -- start

# Save PM2 process list
pm2 save

# Auto-start on server reboot
pm2 startup
# Copy and run the command that PM2 outputs
```

### Using Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install nginx -y

# Create config
sudo nano /etc/nginx/sites-available/cryptoshop
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # OxaPay webhook
    location /api/webhook {
        proxy_pass http://localhost:3001/api/webhook;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/cryptoshop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

### Firewall Setup

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Check status
sudo ufw status
```

### Database Backup

```bash
# Manual backup
pg_dump -U cryptoshop_user cryptoshop > backup_$(date +%Y%m%d).sql

# Automated daily backup (cron)
crontab -e

# Add this line (backup at 2 AM daily):
0 2 * * * pg_dump -U cryptoshop_user cryptoshop > ~/backups/cryptoshop_$(date +\%Y\%m\%d).sql
```

---

## 🐛 Troubleshooting

### Backend Issues

**Backend won't start:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if port 3001 is in use
sudo lsof -i :3001

# Check logs
cd backend
npm run dev
# Read error messages
```

**Database connection error:**
```bash
# Test database connection
psql -U cryptoshop_user -d cryptoshop

# Verify DATABASE_URL in .env
cat backend/.env | grep DATABASE_URL

# Check PostgreSQL is accepting connections
sudo nano /etc/postgresql/14/main/postgresql.conf
# Ensure: listen_addresses = 'localhost'
```

### Frontend Issues

**Frontend build fails:**
```bash
# Clear cache and reinstall
cd frontend
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

**API connection error:**
```bash
# Verify NEXT_PUBLIC_API_URL
cat frontend/.env.local

# Check backend is running
curl http://localhost:3001/health
```

### OxaPay Issues

**Payments not working:**
- ✅ Verify OXAPAY_API_KEY in `backend/.env`
- ✅ Check OxaPay dashboard for API status
- ✅ Ensure webhook URL is publicly accessible
- ✅ Use ngrok for local testing: `ngrok http 3001`
- ✅ Check OxaPay webhook logs in their dashboard

**Webhook not receiving callbacks:**
```bash
# Test webhook manually
curl -X POST http://localhost:3001/api/webhook/oxapay \
  -H "Content-Type: application/json" \
  -d '{"orderId":"test","status":"Paid"}'
```

### Mobile Responsive Issues

**Layout broken on mobile:**
- Clear browser cache
- Test in Chrome DevTools device mode
- Check Tailwind classes (use `sm:`, `md:`, `lg:` prefixes)
- Verify viewport meta tag in `layout.tsx`

---

## 📊 Database Schema (v2.0)

### Tables Overview

**users**
- id (UUID, PK)
- username (unique)
- password_hash (bcrypt)
- telegram (optional)
- is_admin (boolean)
- created_at, updated_at

**products**
- id (UUID, PK)
- name, description
- price, currency (default: EUR)
- **picture_link** (200x200 recommended)
- **quantity** (1, 2, 3, 5, 10, 15, 20)
- is_active (soft delete)
- created_at, updated_at

**orders**
- id (UUID, PK)
- user_id (FK → users)
- total_amount, currency
- status (pending/paid/failed/expired)
- **delivery_status** (pending/delivered)
- payment_link, track_id
- created_at, updated_at

**order_items**
- id (UUID, PK)
- order_id (FK → orders)
- product_id (FK → products)
- product_name, product_price, **product_picture**
- quantity
- **delivery_map_link, delivery_image_link**
- **delivered_at**
- created_at

---

## 🔐 Production Security Checklist

**Before going live:**

- [ ] Change default admin password
- [ ] Generate strong JWT_SECRET (min 32 characters)
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS with SSL certificate
- [ ] Configure firewall (ufw)
- [ ] Set up database backups (automated)
- [ ] Update OxaPay webhook URL to production domain
- [ ] Enable CORS only for your domain
- [ ] Use strong PostgreSQL passwords
- [ ] Keep npm dependencies updated
- [ ] Configure fail2ban for SSH protection
- [ ] Set up monitoring (PM2 dashboard, uptime monitoring)
- [ ] Review and restrict PostgreSQL access
- [ ] Enable rate limiting on API endpoints
- [ ] Configure logging (PM2 logs, nginx logs)

---

## 📞 Support & Monitoring

### View Logs

**Backend logs (PM2):**
```bash
pm2 logs cryptoshop-backend
pm2 logs cryptoshop-backend --lines 100
```

**Frontend logs (PM2):**
```bash
pm2 logs cryptoshop-frontend
```

**Nginx logs:**
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

**PostgreSQL logs:**
```bash
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### PM2 Monitoring

```bash
# Process status
pm2 status

# Monitor CPU/RAM
pm2 monit

# Web dashboard
pm2 plus
```

---

## 🎨 Customization

### Change Theme Colors

Edit `frontend/app/globals.css`:
```css
:root {
  --neon-green: #00ff00;  /* Change to your color */
  --neon-cyan: #00ffff;   /* Change to your color */
  --cyber-dark: #0a0e27;  /* Change background */
}
```

### Change Default Currency

Edit `backend/src/controllers/paymentController.ts`:
```typescript
let currency = 'EUR'; // Change to USD, BTC, ETH, etc.
```

### Add More Quantity Options

Edit `frontend/app/admin/page.tsx`:
```typescript
<option value="1">1</option>
<option value="2">2</option>
<option value="25">25</option>  // Add more options
<option value="50">50</option>
```

---

## 📝 API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/products` - Get all products

### Authenticated Endpoints
- `GET /api/auth/me` - Get current user
- `GET /api/orders/my` - Get user's orders
- `POST /api/payment/create-invoice` - Create payment

### Admin Endpoints
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/products` - All products (including inactive)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/orders` - All orders (with filters)
- `PUT /api/admin/orders/:id/status` - Update order status
- `PUT /api/admin/orders/:orderId/deliver` - Add delivery info
- `GET /api/admin/users` - All users (with search)
- `PUT /api/admin/users/:id/admin` - Toggle admin
- `DELETE /api/admin/users/:id` - Delete user

### Webhook
- `POST /api/webhook/oxapay` - OxaPay payment callback

---

## 🚀 What's Next?

**Potential future enhancements:**
- Real-time notifications (WebSocket)
- Multi-language support
- Product categories and filtering
- Reviews and ratings system
- Referral program
- Admin analytics dashboard
- Email notifications (optional)
- 2FA authentication
- API rate limiting
- Admin activity logs

---

## 📜 License

MIT License - Free to use and modify for personal and commercial projects.

---

## 🏆 Credits

**Built with:**
- **Backend:** Node.js, Express, TypeScript, PostgreSQL
- **Frontend:** Next.js 14, React 18, TailwindCSS
- **Payments:** OxaPay API v1
- **Theme:** Cyberpunk/Hacker Dark with Neon accents
- **Deployment:** PM2, Nginx, Let's Encrypt

**Version:** 2.0
**Last Updated:** 2025

---

**🔥 Ready to give gas! Happy selling! 💎**
