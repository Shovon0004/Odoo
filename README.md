# 🚀 Odoo-Style Multi-Vendor Rental Management System (RMS)

An enterprise-grade, multi-vendor rental management platform built with **Next.js (App Router)**, **Node.js/Express**, **PostgreSQL (Sequelize ORM)**, **Cloudinary**, and **Razorpay**. Inspired by Odoo Rental, this platform automates the end-to-end rental lifecycle—from vendor store authorization and multi-attribute product listing to 3-photo handover verification, AI damage inspection, customer KYC identity verification, and digital wallet financial settlements.

---

## 🌟 Key Features & Core Capabilities

### 1. 🛡️ SuperAdmin Vendor Authorization Workflow
- **Mandatory Approval**: New vendor registrations default to `is_approved = false`.
- **Backend Guard**: Unapproved vendors are blocked (`403 Forbidden`) from creating or listing products until authorized by SuperAdmin.
- **SuperAdmin Dashboard**: SuperAdmins can approve or revoke vendor listing permissions with one click in `/admin/users`.
- **Frontend Dashboard Guard**: Displays a **"⚠️ Store Authorization Pending"** warning banner and disables product creation buttons for unauthorized vendors.

### 2. 📦 Odoo-Style Product Specification & Mandatory 3 Photos
- **Odoo Specification**: Tabbed product builder supporting General Info, Variants (Brand, Manufacturer, Color, Size), and Rental Pricing Configuration.
- **Vendor-Scoped Rental Periods**: Vendors can define custom rental durations (Hours, Days, Weeks) with custom discount percentages.
- **Mandatory 3 Photos**: Vendors must upload 3 distinct photos (**Front View**, **Side/Back View**, **Detail/Serial Tag**) before publishing equipment.

### 3. 📷 3-Photo Handover Verification & AI Damage Inspector
- **Pre-Rental Handover**: 3 photos captured upon customer equipment pickup.
- **Post-Rental Return**: 3 photos captured upon equipment check-in.
- **AI Damage Inspector Engine**: Analyzes pre-rental baseline photos against post-rental return photos, calculates a damage score (0–100%), details detected visual flaws, and recommends monetary deposit penalties.

### 4. 💳 Digital Wallet System & Checkout Integration
- **Customer & Vendor Wallet (`/wallet`)**: Digital balance ledger tracking `CREDIT`, `DEBIT`, `DEPOSIT_REFUND`, `DAMAGE_PENALTY`, and `TOP_UP`.
- **Pay via Wallet at Checkout**: Customers can complete rental checkout using their digital wallet balance with real-time balance validation.
- **Instant Deposit Refunds**: Net security deposit refunds (Deposit minus AI Damage Penalty) credit directly into the customer's wallet balance.

### 5. 🛡️ Customer Identity KYC Verification
- **Govt Identity Documents**: Customers submit Aadhaar Card, Passport, Driving License, or Voter ID along with photo proof.
- **Verification Status Badges**: Real-time status indicators (`✓ VERIFIED`, `⏳ PENDING REVIEW`, `❌ REJECTED`, `⚠️ NOT SUBMITTED`).
- **Admin Verification**: Admins review customer KYC submissions and high-res document previews in `/admin/users`.

### 6. 🗓️ Schedule Calendar & Overdue Management
- **Interactive Schedule Dashboard (`/admin/schedule`)**: Kanban & calendar view of pending pickups, active rentals, and returns due today.
- **Automated Late Fee Engine**: Calculates daily late fees for overdue equipment returns.
- **Automatic Invoicing**: Generates PDF/printable invoices for rentals and settlements.

---

## 🏗️ Technical Architecture & Tech Stack

```
   ┌─────────────────────────────────────────────────────────┐
   │                  Next.js (App Router)                   │
   │  React 19 • Tailwind CSS • Lucide Icons • Client State  │
   └────────────────────────────┬────────────────────────────┘
                                │ REST API (JSON)
   ┌────────────────────────────▼────────────────────────────┐
   │                    Express.js Backend                   │
   │ Authenticated Routes • Controllers • Services • Middleware│
   └──────┬─────────────────────┬─────────────────────┬──────┘
          │                     │                     │
   ┌──────▼──────┐       ┌──────▼──────┐       ┌──────▼──────┐
   │ PostgreSQL  │       │ Cloudinary  │       │  Razorpay   │
   │ (Sequelize) │       │ Image Upload│       │ Payment SDK │
   └─────────────┘       └─────────────┘       └─────────────┘
```

### Stack Breakdown:
- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS, Lucide React.
- **Backend**: Node.js, Express.js, Sequelize ORM, PostgreSQL.
- **Storage & Hosting**: Cloudinary API (Base64 & image URL uploads).
- **Payment Processing**: Razorpay Gateway (Test Mode) & Internal Wallet Ledger.

---

## 📊 Database Schema Design

```
 Users (SUPERADMIN, ADMIN, VENDOR, CUSTOMER)
   │
   ├──< Products (vendor_id)
   │       │
   │       └──< ProductVariants
   │
   ├──< Carts (customer_id)
   │       │
   │       └──< CartItems (product_id, variant_id, rental_period_id)
   │
   ├──< Orders (customer_id)
   │       │
   │       ├──< OrderItems
   │       ├──< Payments
   │       ├──< SecurityDeposits
   │       ├──< RentalPickups (Pre-Rental 3 Photos)
   │       ├──< RentalReturns (Post-Rental 3 Photos & AI Damage Score)
   │       └──< Invoices
   │
   └──< WalletTransactions (user_id)
```

### Key Models & Schemas

#### 1. `User` Model (`users` table)
- `id` (UUID, Primary Key)
- `name`, `email`, `password_hash`, `role` (`SUPERADMIN`, `ADMIN`, `VENDOR`, `CUSTOMER`)
- `business_name`, `phone`, `address`, `gst_number`
- `is_approved` (BOOLEAN, default: `false`) - SuperAdmin Vendor Authorization Flag
- `wallet_balance` (DECIMAL, default: `0.00`)
- `kyc_status` (`NOT_SUBMITTED`, `PENDING`, `VERIFIED`, `REJECTED`)
- `kyc_id_type`, `kyc_id_number`, `kyc_document_url`

#### 2. `Product` Model (`products` table)
- `id` (UUID, Primary Key)
- `vendor_id` (Foreign Key -> `users.id`)
- `name`, `description`, `category`, `base_price`, `quantity_on_hand`
- `images` (JSON ARRAY) - Mandatory 3 photos: `[front_view, side_view, serial_tag]`
- `status` (`ACTIVE`, `INACTIVE`)

#### 3. `RentalPickup` & `RentalReturn` Models
- `order_id` (Foreign Key -> `orders.id`)
- `pre_rental_photos` (JSON ARRAY) - 3 handover photos
- `post_rental_photos` (JSON ARRAY) - 3 return inspection photos
- `ai_damage_score` (FLOAT 0.0 - 1.0)
- `ai_damage_notes` (TEXT)
- `recommended_penalty` (DECIMAL)

#### 4. `WalletTransaction` Model (`wallet_transactions` table)
- `id` (UUID, Primary Key)
- `user_id` (Foreign Key -> `users.id`)
- `amount`, `type` (`CREDIT`, `DEBIT`)
- `category` (`DEPOSIT_REFUND`, `DAMAGE_PENALTY`, `RENTAL_PAYMENT`, `TOP_UP`)
- `description`, `order_id`

---

## 🛠️ Installation & Setup Guide

### Prerequisites
- **Node.js** (v18+ or v22+)
- **PostgreSQL** (Running locally on port 5432 or remote URI)
- **Git**

---

### Step 1: Clone Repository & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Shovon0004/Odoo.git
cd Odoo

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

---

### Step 2: Configure Environment Variables

#### Backend `.env` (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=odoo_rental_db
DB_USER=postgres
DB_PASSWORD=postgres

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay Configuration (Test Mode)
RAZORPAY_KEY_ID=rzp_test_TNW0BBn4eKHxzc
RAZORPAY_KEY_SECRET=W0U4a3dyU3skpYom4tDdrEYA
```

#### Frontend `.env.local` (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### Step 3: Database Reset & Seed Data

Run the database seed script to automatically create PostgreSQL tables, populate demo users, equipment products, rental periods, sample orders, and wallet balances:

```bash
cd backend
node src/seed.js
```

---

### Step 4: Run Application Servers

#### Start Backend Server
```bash
cd backend
npm run dev
# Backend running at: http://localhost:5000
```

#### Start Frontend Application
```bash
cd frontend
npm run dev
# Frontend running at: http://localhost:3000
```

---

## 🔑 Demo Account Credentials

| Role | Email | Password | Listing Approval |
| :--- | :--- | :--- | :--- |
| **SuperAdmin** | `super@admin123` | `admin123` | N/A |
| **Approved Vendor** | `vendor@rental.com` | `vendor123` | `✓ APPROVED` |
| **New Pending Vendor** | `newvendor@rental.com` | `vendor123` | `⏳ PENDING` |
| **Customer** | `customer@gmail.com` | `customer123` | N/A |

---

## 🔗 Major API Endpoints Summary

### Authentication & Users
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Fetch authenticated user profile
- `POST /api/users/kyc` - Submit government ID KYC document
- `PUT /api/users/:id/approval` - SuperAdmin toggle vendor authorization status
- `PUT /api/users/:id/kyc-status` - Admin approve/reject customer KYC

### Products & Inventory
- `GET /api/products` - List products with filter & search
- `POST /api/products` - Create product (Requires 3 photos & Vendor Authorization)
- `PUT /api/products/:id` - Update product details
- `DELETE /api/products/:id` - Remove product listing

### Checkout, Payments & Digital Wallet
- `POST /api/orders` - Create rental order from cart
- `POST /api/orders/:orderId/payment` - Process payment (`ONLINE`, `CASH`, `WALLET`)
- `GET /api/wallet` - Fetch user digital wallet balance & ledger history
- `POST /api/wallet/topup` - Add funds to digital wallet

### Inspection & Handover
- `POST /api/schedule/:orderId/pickup` - Upload 3 pre-rental handover photos
- `POST /api/schedule/:orderId/return` - Upload 3 post-rental photos & run AI Damage Inspector
- `POST /api/schedule/:orderId/settle` - Refund security deposit to customer wallet minus AI damage fee

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
