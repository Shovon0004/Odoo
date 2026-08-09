# 🚀 Odoo-Style Multi-Vendor Rental Management System (RMS)
### *Enterprise-Grade Multi-Tenant Rental Platform with AI Damage Inspection, SuperAdmin Vendor Authorization, Digital Wallet Ledger & Concurrency Control*

---

## 📑 Table of Contents
1. [Executive Summary & Core Objectives](#-executive-summary--core-objectives)
2. [High-Level Architectural Framework](#-high-level-architectural-framework)
3. [Component Architecture & Design Patterns](#-component-architecture--design-patterns)
4. [System Sequence & Workflow Diagrams](#-system-sequence--workflow-diagrams)
   - [SuperAdmin Vendor Authorization Workflow](#1-superadmin-vendor-authorization-workflow)
   - [Rental Checkout & 10-Minute Inventory Lock Engine](#2-rental-checkout--10-minute-inventory-lock-engine)
   - [3-Photo Handover Verification & AI Damage Inspector](#3-3-photo-handover-verification--ai-damage-inspector)
   - [Digital Wallet Settlement & Deposit Lifecycle](#4-digital-wallet-settlement--deposit-lifecycle)
5. [Comprehensive Database Schema & Data Dictionary](#-comprehensive-database-schema--data-dictionary)
6. [Complete REST API Specification](#-complete-rest-api-specification)
7. [Security & Concurrency Control Engineering](#-security--concurrency-control-engineering)
8. [Installation, Environment & Database Seeding](#-installation-environment--database-seeding)
9. [User Role Privileges & Access Matrix](#-user-role-privileges--access-matrix)
10. [Production Deployment & DevOps Guide](#-production-deployment--devops-guide)

---

## 📋 Executive Summary & Core Objectives

Modern rental operations face distinct challenges: track asset availability, prevent double bookings under peak traffic, manage multi-vendor inventory safely, calculate variable late fees, inspect hardware condition across handovers, and handle security deposits cleanly.

Inspired by **Odoo Rental Management**, this platform provides a unified interface for **Vendors**, **Customers**, and **SuperAdmins**:
- **Multi-Vendor Governance**: Restricts unapproved vendors from creating listings until approved by SuperAdmins.
- **Visual Proof & AI Diagnostics**: Enforces a 3-photo proof standard (Pre-Rental & Post-Rental) combined with an algorithmic AI Damage Inspection Engine.
- **Financial Ledger & Wallet**: Integrates a digital wallet for instant deposit refunds, damage penalty deductions, and seamless checkout payments.
- **Stock Lock Engine**: Enforces a 10-minute inventory reservation timer to prevent race conditions during concurrent user checkouts.

---

## 🏛️ High-Level Architectural Framework

The application follows a decoupled **Client-Server Architecture** utilizing **Next.js App Router** for rendering and interactive dashboards, connected via JSON REST APIs to a high-concurrency **Express.js / Node.js** backend powered by **PostgreSQL** and **Sequelize ORM**.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             PRESENTATION TIER (FRONTEND)                          │
│                                                                                  │
│   ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────┐   │
│   │   Customer Portal    │    │   Vendor Dashboard   │    │ SuperAdmin Suite │   │
│   │  Catalog, Cart, KYC, │    │ Product Spec, Handover│    │ User Approvals,  │   │
│   │  Checkout, Wallet    │    │ & AI Inspector Suite │    │ KYC Verification │   │
│   └──────────┬───────────┘    └──────────┬───────────┘    └────────┬─────────┘   │
│              │                           │                         │             │
│              └───────────────────────────┼─────────────────────────┘             │
│                                          │ Next.js Client API Bridge (Axios/Fetch)│
└──────────────────────────────────────────┼───────────────────────────────────────┘
                                           │ HTTPS / JSON REST API
┌──────────────────────────────────────────▼───────────────────────────────────────┐
│                              APPLICATION TIER (BACKEND)                          │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │                         Express.js REST API Server                       │   │
│   │  ├── JWT Authentication & Role-Based Access Control (RBAC)               │   │
│   │  ├── Stock Reservation & Concurrency Mutex Manager                       │   │
│   │  ├── AI Image Damage Inspection Engine                                   │   │
│   │  └── Atomic Financial Ledger & Wallet Service                            │   │
│   └──────────────────────────────────────┬───────────────────────────────────┘   │
└──────────────────────────────────────────┼───────────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼───────────────────────────────────────┐
│                               PERSISTENCE & CLOUD TIER                           │
│                                                                                  │
│   ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────┐ │
│   │ PostgreSQL Database    │  │  Cloudinary CDN        │  │  Razorpay Gateway  │ │
│   │ ACID Transactions,     │  │  Product & Inspection  │  │  PCI-DSS Compliant │ │
│   │ Relational Foreign Keys│  │  Photo Storage         │  │  Test Payment SDK  │ │
│   └────────────────────────┘  └────────────────────────┘  └────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Architecture & Design Patterns

### 1. Repository & Service Layer Pattern (Backend)
- **Controller Layer**: Parses request parameters, enforces validation rules, calls appropriate services, and returns standardized JSON responses (`successResponse` / `AppError`).
- **Service Layer**: Implements business rules (`orderService`, `paymentService`, `walletService`, `pickupService`, `aiDamageInspectorService`).
- **Data Access Layer**: Sequelize ORM models executing SQL queries wrapped in **ACID Transactions**.

### 2. Middleware Pipeline Guard Pattern
- `authenticateToken`: Decodes JWT tokens from HTTP Authorization headers (`Bearer <token>`).
- `authorizeRoles(...roles)`: Verifies user role (`SUPERADMIN`, `ADMIN`, `VENDOR`, `CUSTOMER`).
- `errorHandler`: Global error handling middleware ensuring no raw stack traces leak to clients.

### 3. Atomic Financial Ledger Pattern
- All wallet credits, debits, deposit holds, and penalty deductions use atomic PostgreSQL database transactions (`sequelize.transaction()`).

---

## 🔄 System Sequence & Workflow Diagrams

### 1. SuperAdmin Vendor Authorization Workflow

```
[ New Vendor ]          [ Express API ]        [ SuperAdmin ]          [ PostgreSQL ]
      │                        │                      │                      │
      ├─── Register Store ────►│                      │                      │
      │    (is_approved=false) │                      │                      │
      │                        ├──────────────────────┼─────────────────────►│ Save Vendor (PENDING)
      │                        │                      │                      │
      ├─── Attempt Create ────►│                      │                      │
      │    Product Listing     │                      │                      │
      │                        ├── Check Approval ────┼─────────────────────►│ Query is_approved
      │                        │   (Returns FALSE)    │                      │
      │◄── 403 Forbidden ──────┤                      │                      │
      │    "Approval Required"  │                      │                      │
      │                        │                      │                      │
      │                        │◄── Approve Vendor ───┤                      │
      │                        │    PUT /users/:id    │                      │
      │                        │                      ├─────────────────────►│ UPDATE is_approved=true
      │                        ├─── 200 OK ──────────►│                      │
      │                        │                      │                      │
      ├─── Create Product ────►│                      │                      │
      │                        ├── Check Approval ────┼─────────────────────►│ Returns TRUE
      │◄── 201 Published ──────┼──────────────────────┼─────────────────────►│ Save Product Listing
```

---

### 2. Rental Checkout & 10-Minute Inventory Lock Engine

```
[ Customer ]             [ Express API ]        [ Stock Manager ]       [ PostgreSQL ]
     │                          │                       │                      │
     ├─── Initiate Checkout ───►│                       │                      │
     │                          ├── Lock Stock ────────►│                      │
     │                          │   (Set Hold Window)   ├─────────────────────►│ Decrement quantity_on_hand
     │                          │                       │                      │ Set expires_at = NOW + 10m
     │◄── Order PENDING ────────┤                       │                      │
     │    (10 Min Timer Active) │                       │                      │
     │                          │                       │                      │
     ├─── Pay via Wallet/Online►│                       │                      │
     │                          ├── Validate Payment    │                      │
     │                          │   & Wallet Balance    │                      │
     │                          ├───────────────────────┼─────────────────────►│ Confirm Order (status=CONFIRMED)
     │                          │                       │                      │ Clear expires_at
     │◄── 200 OK Confirmed ─────┤                       │                      │
```

---

### 3. 3-Photo Handover Verification & AI Damage Inspector

```
[ Vendor ]               [ Express API ]     [ AI Inspection Engine ]   [ Cloudinary ]
    │                           │                       │                      │
    ├── Upload 3 Pre-Rental ───►│                       │                      │
    │   Photos (Pickup)         ├───────────────────────┼─────────────────────►│ Upload Photos
    │                           ├───────────────────────┼─────────────────────►│ Save Photo URLs
    │                           │                       │                      │
    ├── Upload 3 Post-Rental ──►│                       │                      │
    │   Photos (Return)         ├── Analyze Variance ──►│                      │
    │                           │   Pre vs Post Photos  │                      │
    │                           │                       ├── Compute Score (0-100%)
    │                           │                       ├── Detect Visual Flaws
    │                           │◄── Damage Report ─────┤ Recommend Penalty    │
    │◄── Display Assessment ────┤    (Score, Notes, Fee)│                      │
```

---

### 4. Digital Wallet Settlement & Deposit Lifecycle

```
   [ Customer Rental Checkout ]
                │
                ▼
     ₹1,000 Security Deposit Held
                │
                ▼
   [ Vendor Checks-In Equipment ]
                │
                ▼
   [ AI Damage Assessment Run ]
   ├── Score: 15% Visual Scratches
   └── Calculated Penalty: ₹300.00
                │
                ▼
   [ Final Settlement Executed ]
   ├── Debit Penalty: ₹300.00 -> Credit Vendor Ledger
   └── Net Refund: ₹700.00 -> Credit Customer Wallet
                │
                ▼
   [ Customer Wallet Ledger Updated ]
   Available Balance: ₹700.00 (Ready for next rental checkout)
```

---

## 🗄️ Comprehensive Database Schema & Data Dictionary

The application database consists of **21 PostgreSQL Relational Tables** managed via Sequelize ORM.

### 1. `users` Table
Stores SuperAdmins, Admins, Vendors, and Customers.
| Column | Data Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `name` | VARCHAR(255) | NO | - | Full User Name |
| `email` | VARCHAR(255) | NO | - | Unique Login Email |
| `password` | VARCHAR(255) | NO | - | Bcrypt Hashed Password |
| `role` | ENUM | NO | `'CUSTOMER'` | `'SUPERADMIN'`, `'ADMIN'`, `'VENDOR'`, `'CUSTOMER'` |
| `business_name` | VARCHAR(255) | YES | NULL | Store Name for Vendors |
| `phone` | VARCHAR(50) | YES | NULL | Contact Phone Number |
| `address` | TEXT | YES | NULL | Shipping/Store Address |
| `gst_number` | VARCHAR(50) | YES | NULL | GST Identification Number |
| `profile_image` | TEXT | YES | NULL | Avatar URL |
| `is_approved` | BOOLEAN | NO | `false` | SuperAdmin Vendor Listing Approval Flag |
| `wallet_balance` | DECIMAL(10,2)| NO | `0.00` | Current Digital Wallet Balance |
| `kyc_status` | ENUM | NO | `'NOT_SUBMITTED'`| `'NOT_SUBMITTED'`, `'PENDING'`, `'VERIFIED'`, `'REJECTED'` |
| `kyc_id_type` | VARCHAR(100) | YES | NULL | Government ID Type |
| `kyc_id_number` | VARCHAR(100) | YES | NULL | Government ID Document Number |
| `kyc_document_url`| TEXT | YES | NULL | Cloudinary Image URL of ID |
| `created_at` | TIMESTAMP | NO | `NOW()` | Creation Timestamp |

---

### 2. `products` Table
Stores rental equipment hardware listings.
| Column | Data Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `vendor_id` | UUID | NO | - | Foreign Key -> `users.id` |
| `name` | VARCHAR(255) | NO | - | Equipment Product Name |
| `description` | TEXT | YES | NULL | Detailed Product Specifications |
| `category` | VARCHAR(100) | NO | - | Equipment Category |
| `base_price` | DECIMAL(10,2)| NO | - | Daily Base Rental Rate |
| `quantity_on_hand`| INTEGER | NO | `1` | Available Hardware Inventory |
| `images` | JSONB | NO | `[]` | Array of 3 Photo URLs `[Front, Back, Tag]` |
| `status` | ENUM | NO | `'ACTIVE'` | `'ACTIVE'`, `'INACTIVE'` |
| `created_at` | TIMESTAMP | NO | `NOW()` | Creation Timestamp |

---

### 3. `orders` Table
Stores customer rental bookings and status.
| Column | Data Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `order_number` | VARCHAR(50) | NO | - | Unique Human-Readable Order Code |
| `customer_id` | UUID | NO | - | Foreign Key -> `users.id` |
| `status` | ENUM | NO | `'PENDING_PAYMENT'`| `'PENDING_PAYMENT'`, `'CONFIRMED'`, `'PICKED_UP'`, `'RETURNED'`, `'CANCELLED'` |
| `subtotal` | DECIMAL(10,2)| NO | - | Equipment Rental Charge |
| `delivery_fee` | DECIMAL(10,2)| NO | `0.00` | Shipping Delivery Fee |
| `delivery_method`| ENUM | NO | `'DELIVERY'` | `'DELIVERY'`, `'STORE_PICKUP'` |
| `delivery_address`| TEXT | YES | NULL | Destination Address |
| `start_date` | TIMESTAMP | NO | - | Rental Start Time |
| `end_date` | TIMESTAMP | NO | - | Scheduled Return Time |
| `expires_at` | TIMESTAMP | YES | NULL | 10-Minute Reservation Hold Timer |

---

### 4. `wallet_transactions` Table
Stores the audit ledger for all wallet balances.
| Column | Data Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | NO | - | Foreign Key -> `users.id` |
| `amount` | DECIMAL(10,2)| NO | - | Transaction Amount |
| `type` | ENUM | NO | - | `'CREDIT'`, `'DEBIT'` |
| `category` | ENUM | NO | - | `'DEPOSIT_REFUND'`, `'DAMAGE_PENALTY'`, `'RENTAL_PAYMENT'`, `'TOP_UP'` |
| `description` | TEXT | YES | NULL | Transaction Notes |
| `order_id` | UUID | YES | NULL | Foreign Key -> `orders.id` |
| `created_at` | TIMESTAMP | NO | `NOW()` | Transaction Timestamp |

---

## 📡 Complete REST API Specification

### Authentication & Profiles
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword",
  "role": "CUSTOMER"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "securepassword"
}
```

```http
POST /api/users/kyc
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "kyc_id_type": "Aadhaar Card",
  "kyc_id_number": "1234 5678 9012",
  "kyc_document_url": "https://res.cloudinary.com/demo/image/upload/v123/aadhaar.jpg"
}
```

---

### Products & Listings
```http
POST /api/products
Authorization: Bearer <vendor_jwt_token>
Content-Type: application/json

{
  "name": "Sony FX3 Cinema Camera",
  "description": "Full-frame cinema camera with 4K 120fps capability.",
  "category": "Cameras",
  "base_price": 2500,
  "quantity_on_hand": 3,
  "images": [
    "https://res.cloudinary.com/demo/image/upload/v1/front.jpg",
    "https://res.cloudinary.com/demo/image/upload/v1/back.jpg",
    "https://res.cloudinary.com/demo/image/upload/v1/serial.jpg"
  ]
}
```

---

### Checkout & Digital Wallet
```http
POST /api/orders/:orderId/payment
Authorization: Bearer <customer_jwt_token>
Content-Type: application/json

{
  "payment_method": "WALLET"
}
```

```http
POST /api/wallet/topup
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 5000
}
```

---

### Handover Verification & AI Damage Inspector
```http
POST /api/schedule/:orderId/return
Authorization: Bearer <vendor_jwt_token>
Content-Type: application/json

{
  "photos": [
    "https://res.cloudinary.com/demo/image/upload/v1/return_front.jpg",
    "https://res.cloudinary.com/demo/image/upload/v1/return_back.jpg",
    "https://res.cloudinary.com/demo/image/upload/v1/return_tag.jpg"
  ]
}
```

---

## 🔒 Security & Concurrency Control Engineering

1. **Race Condition Prevention**: Orders place a 10-minute hold (`expires_at`) on requested inventory items. Expired holds automatically release inventory back into the public pool if payment is not completed within 10 minutes.
2. **ACID Financial Transactions**: All wallet balance deductions, security deposit holds, and penalty allocations execute inside atomic PostgreSQL transactions (`sequelize.transaction()`).
3. **Role-Based Privilege Guards**: Route handlers check role permissions (`SUPERADMIN`, `ADMIN`, `VENDOR`, `CUSTOMER`) before executing state updates.
4. **Strict Request Body Validation**: Request bodies pass through sanitation checks to ensure non-strict JSON payloads do not cause uncaught server exceptions.

---

## 💻 Installation, Environment & Database Seeding

### 1. Environment Setup

#### Backend Environment File (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_jwt_key_2026

DB_HOST=localhost
DB_PORT=5432
DB_NAME=odoo_rental_db
DB_USER=postgres
DB_PASSWORD=postgres

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

RAZORPAY_KEY_ID=rzp_test_TNW0BBn4eKHxzc
RAZORPAY_KEY_SECRET=W0U4a3dyU3skpYom4tDdrEYA
```

#### Frontend Environment File (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### 2. Database Sync & Seeding

Run the seed script to reset tables and populate demo accounts:
```bash
cd backend
node src/seed.js
```

### 3. Launching Servers

```bash
# Terminal 1: Backend API Server
cd backend
npm run dev

# Terminal 2: Frontend Next.js Server
cd frontend
npm run dev
```

---

## 🔑 User Role Privileges & Access Matrix

| Feature / Resource | Customer | Vendor (Unapproved) | Vendor (Approved) | SuperAdmin / Admin |
| :--- | :---: | :---: | :---: | :---: |
| Browse Product Catalog & Search | ✓ | ✓ | ✓ | ✓ |
| Submit Government Identity KYC | ✓ | ✓ | ✓ | ✓ |
| Add Products to Cart & Rent | ✓ | ❌ | ❌ | ✓ |
| Pay via Wallet / Razorpay | ✓ | ❌ | ❌ | ✓ |
| Create & List Equipment Products | ❌ | ❌ (Blocked) | ✓ | ✓ |
| Upload 3-Photo Pickup / Return | ❌ | ❌ | ✓ | ✓ |
| Run AI Damage Inspector | ❌ | ❌ | ✓ | ✓ |
| Authorize Vendor Store Accounts | ❌ | ❌ | ❌ | **✓ FULL ACCESS** |
| Approve / Reject Customer KYC | ❌ | ❌ | ❌ | **✓ FULL ACCESS** |

---

## 🚀 Production Deployment & DevOps Guide

### 1. Production Build Verification

```bash
# Test Next.js Production Compilation
cd frontend
npm run build

# Start Next.js Production Server
npm run start
```

### 2. Managing Backend with PM2

```bash
cd backend
npm install -g pm2
pm2 start src/server.js --name "odoo-rental-backend"
pm2 save
```

---

### 3. Nginx Reverse Proxy Configuration

```nginx
server {
    listen 80;
    server_name rental.yourdomain.com;

    # Frontend App Router
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Express Backend REST API
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 📄 License
This project is licensed under the **MIT License** - see the `LICENSE` file for details.
