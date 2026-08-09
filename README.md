# 🚀 Odoo-Style Multi-Vendor Rental Management System (RMS)
### *Enterprise-Grade Multi-Tenant Rental Platform with AI Damage Inspection, SuperAdmin Vendor Authorization, Digital Wallet Ledger & Complete Database Reference*

---

## 📑 Table of Contents
1. [Executive Summary](#-executive-summary)
2. [High-Level Architectural Framework](#-high-level-architectural-framework)
3. [System Workflow Diagrams](#-system-workflow-diagrams)
4. [Exhaustive Database Schema Reference (All 21 Tables)](#-exhaustive-database-schema-reference-all-21-tables)
   1. [users](#1-users-table)
   2. [products](#2-products-table)
   3. [product_variants](#3-product_variants-table)
   4. [rental_periods](#4-rental_periods-table)
   5. [rental_carts](#5-rental_carts-table)
   6. [rental_cart_items](#6-rental_cart_items-table)
   7. [rental_orders](#7-rental_orders-table)
   8. [rental_order_items](#8-rental_order_items-table)
   9. [payments](#9-payments-table)
   10. [security_deposits](#10-security_deposits-table)
   11. [rental_pickups](#11-rental_pickups-table)
   12. [rental_returns](#12-rental_returns-table)
   13. [deposit_settlements](#13-deposit_settlements-table)
   14. [late_fees](#14-late_fees-table)
   15. [late_fee_configs](#15-late_fee_configs-table)
   16. [invoices](#16-invoices-table)
   17. [wallet_transactions](#17-wallet_transactions-table)
   18. [pricelists](#18-pricelists-table)
   19. [pricelist_rules](#19-pricelist_rules-table)
   20. [quotation_templates](#20-quotation_templates-table)
   21. [SequelizeMeta](#21-sequelizemeta-table)
5. [Complete REST API Specification](#-complete-rest-api-specification)
6. [Security & Concurrency Control Engineering](#-security--concurrency-control-engineering)
7. [Installation, Environment & Database Seeding](#-installation-environment--database-seeding)
8. [User Role Privileges & Access Matrix](#-user-role-privileges--access-matrix)
9. [Production Deployment Guide](#-production-deployment-guide)

---

## 📋 Executive Summary

Modern rental operations face distinct challenges: track asset availability, prevent double bookings under peak traffic, manage multi-vendor inventory safely, calculate variable late fees, inspect hardware condition across handovers, and handle security deposits cleanly.

Inspired by **Odoo Rental Management**, this platform provides a unified interface for **Vendors**, **Customers**, and **SuperAdmins**:
- **Multi-Vendor Governance**: Restricts unapproved vendors from creating listings until approved by SuperAdmins.
- **Visual Proof & AI Diagnostics**: Enforces a 3-photo proof standard (Pre-Rental & Post-Rental) combined with an algorithmic AI Damage Inspection Engine.
- **Financial Ledger & Wallet**: Integrates a digital wallet for instant deposit refunds, damage penalty deductions, and seamless checkout payments.
- **Stock Lock Engine**: Enforces a 10-minute inventory reservation timer to prevent race conditions during concurrent user checkouts.

---

## 🏛️ High-Level Architectural Framework

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

## 🗄️ Exhaustive Database Schema Reference (All 21 Tables)

The application persistence layer contains **21 PostgreSQL Relational Tables** managed via Sequelize ORM.

---

### 1. `users` Table
Stores account credentials, store branding, digital wallet balance, vendor listing authorization flags, and government KYC status.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Unique user identifier |
| `name` | `VARCHAR(255)` | **NO** | - | - | User full name |
| `email` | `VARCHAR(255)` | **NO** | - | **UNIQUE** | Login email address |
| `password` | `VARCHAR(255)` | **NO** | - | - | Bcrypt hashed password |
| `role` | `ENUM` | **NO** | `'CUSTOMER'`| `'SUPERADMIN'`, `'ADMIN'`, `'VENDOR'`, `'CUSTOMER'` | System access role |
| `business_name` | `VARCHAR(255)` | YES | `NULL` | - | Vendor store / brand name |
| `phone` | `VARCHAR(50)` | YES | `NULL` | - | Contact phone number |
| `address` | `TEXT` | YES | `NULL` | - | Shipping/Store physical address |
| `gst_number` | `VARCHAR(50)` | YES | `NULL` | - | GSTIN Tax Registration Number |
| `profile_image` | `TEXT` | YES | `NULL` | - | Cloudinary avatar image URL |
| `is_approved` | `BOOLEAN` | **NO** | `false` | - | SuperAdmin Vendor Listing Privilege Flag |
| `wallet_balance` | `DECIMAL(10,2)`| **NO** | `0.00` | - | Live Digital Wallet Balance |
| `kyc_status` | `ENUM` | **NO** | `'NOT_SUBMITTED'`| `'NOT_SUBMITTED'`, `'PENDING'`, `'VERIFIED'`, `'REJECTED'` | Customer Govt Identity status |
| `kyc_id_type` | `VARCHAR(100)` | YES | `NULL` | - | Aadhaar / Passport / License |
| `kyc_id_number` | `VARCHAR(100)` | YES | `NULL` | - | Government ID Document Number |
| `kyc_document_url`| `TEXT` | YES | `NULL` | - | Cloudinary Govt ID photo URL |
| `reset_password_token`| `VARCHAR` | YES | `NULL` | - | Reset token |
| `reset_password_expires`| `DATE` | YES | `NULL` | - | Reset expiration |
| `created_at` | `TIMESTAMP` | **NO** | `NOW()` | - | Creation timestamp |
| `updated_at` | `TIMESTAMP` | **NO** | `NOW()` | - | Last update timestamp |

---

### 2. `products` Table
Stores rental hardware items created by vendors.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Product unique ID |
| `vendor_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `users.id` | Vendor owner |
| `name` | `VARCHAR(255)` | **NO** | - | - | Equipment title |
| `description` | `TEXT` | YES | `NULL` | - | Detailed hardware specifications |
| `category` | `VARCHAR(100)` | **NO** | - | - | Hardware category |
| `base_price` | `DECIMAL(10,2)`| **NO** | - | Non-negative price | Base daily rental rate |
| `quantity_on_hand`| `INTEGER` | **NO** | `1` | Min 0 | Total hardware stock |
| `images` | `JSONB` | **NO** | `[]` | - | Mandatory 3 Photo URLs |
| `status` | `ENUM` | **NO** | `'ACTIVE'` | `'ACTIVE'`, `'INACTIVE'` | Publishing status |
| `created_at` | `TIMESTAMP` | **NO** | `NOW()` | - | Creation timestamp |
| `updated_at` | `TIMESTAMP` | **NO** | `NOW()` | - | Last update timestamp |

---

### 3. `product_variants` Table
Stores multi-attribute variants for products (e.g. Lens mount, size, color, manufacturer).

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Variant unique ID |
| `product_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `products.id` (CASCADE) | Parent product |
| `brand` | `VARCHAR` | YES | `NULL` | - | Equipment brand |
| `manufacturer` | `VARCHAR` | YES | `NULL` | - | Original manufacturer |
| `color` | `VARCHAR` | YES | `NULL` | - | Color attribute |
| `size` | `VARCHAR` | YES | `NULL` | - | Size / Spec attribute |
| `status` | `ENUM` | **NO** | `'ACTIVE'` | `'ACTIVE'`, `'INACTIVE'` | Variant status |
| `created_at` | `TIMESTAMP` | **NO** | `NOW()` | - | Creation timestamp |
| `updated_at` | `TIMESTAMP` | **NO** | `NOW()` | - | Last update timestamp |

---

### 4. `rental_periods` Table
Stores vendor-scoped or platform global rental durations and discount rules.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Rental period ID |
| `vendor_id` | `UUID` | YES | `NULL` | **FOREIGN KEY** -> `users.id` | Vendor owner (null = global) |
| `name` | `VARCHAR` | **NO** | - | Non-empty | Display title (e.g. 3-Day Special) |
| `duration` | `INTEGER` | **NO** | - | Min 1 | Duration count |
| `unit` | `ENUM` | **NO** | - | `'HOUR'`, `'DAY'`, `'WEEK'`, `'MONTH'` | Duration unit |
| `discount_percent`| `DECIMAL(5,2)`| **NO** | `0.00` | 0 - 100% | Discount percentage |
| `status` | `ENUM` | **NO** | `'ACTIVE'` | `'ACTIVE'`, `'INACTIVE'` | Period status |
| `created_at` | `TIMESTAMP` | **NO** | `NOW()` | - | Creation timestamp |
| `updated_at` | `TIMESTAMP` | **NO** | `NOW()` | - | Last update timestamp |

---

### 5. `rental_carts` Table
Stores customer active shopping carts.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Cart unique ID |
| `customer_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `users.id` (CASCADE) | Cart owner |
| `status` | `ENUM` | **NO** | `'ACTIVE'` | `'ACTIVE'`, `'CHECKED_OUT'` | Cart status |
| `created_at` | `TIMESTAMP` | **NO** | `NOW()` | - | Creation timestamp |
| `updated_at` | `TIMESTAMP` | **NO** | `NOW()` | - | Last update timestamp |

---

### 6. `rental_cart_items` Table
Stores individual rental equipment items added to customer carts.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Cart item ID |
| `cart_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `rental_carts.id` (CASCADE)| Parent cart |
| `product_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `products.id` | Target product |
| `variant_id` | `UUID` | YES | `NULL` | **FOREIGN KEY** -> `product_variants.id` | Target variant |
| `rental_period_id`| `UUID` | **NO** | - | **FOREIGN KEY** -> `rental_periods.id` | Chosen rental periodicity |
| `start_date` | `DATEONLY` | **NO** | - | - | Rental start date |
| `end_date` | `DATEONLY` | **NO** | - | - | Scheduled return date |
| `quantity` | `INTEGER` | **NO** | `1` | Min 1 | Rental quantity |
| `price` | `DECIMAL(10,2)`| **NO** | - | Min 0 | Calculated subtotal price |
| `created_at` | `TIMESTAMP` | **NO** | `NOW()` | - | Creation timestamp |
| `updated_at` | `TIMESTAMP` | **NO** | `NOW()` | - | Last update timestamp |

---

### 7. `rental_orders` Table
Stores confirmed rental reservations and stock locks.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Order unique ID |
| `order_number` | `VARCHAR(50)` | **NO** | - | **UNIQUE** | Code (e.g. `ORD-2026-9921`) |
| `customer_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `users.id` | Customer owner |
| `status` | `ENUM` | **NO** | `'PENDING_PAYMENT'`| `'PENDING_PAYMENT'`, `'CONFIRMED'`, `'PICKED_UP'`, `'RETURNED'`, `'CANCELLED'` | Order lifecycle state |
| `subtotal` | `DECIMAL(10,2)`| **NO** | - | - | Equipment rental subtotal |
| `delivery_fee` | `DECIMAL(10,2)`| **NO** | `0.00` | - | Delivery fee |
| `delivery_method`| `ENUM` | **NO** | `'DELIVERY'` | `'DELIVERY'`, `'STORE_PICKUP'` | Fulfillment choice |
| `delivery_address`| `TEXT` | YES | `NULL` | - | Shipping address |
| `start_date` | `TIMESTAMP` | **NO** | - | - | Rental start timestamp |
| `end_date` | `TIMESTAMP` | **NO** | - | - | Rental return timestamp |
| `expires_at` | `TIMESTAMP` | YES | `NULL` | - | 10-Min Reservation Hold Timer |
| `created_at` | `TIMESTAMP` | **NO** | `NOW()` | - | Creation timestamp |
| `updated_at` | `TIMESTAMP` | **NO** | `NOW()` | - | Last update timestamp |

---

### 8. `rental_order_items` Table
Stores line items associated with a confirmed order.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Line item ID |
| `order_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `rental_orders.id` (CASCADE)| Parent order |
| `product_id` | `UUID` | **NO** | - | - | Product reference |
| `variant_id` | `UUID` | YES | `NULL` | - | Variant reference |
| `rental_period_id`| `UUID` | **NO** | - | - | Rental period reference |
| `product_name` | `VARCHAR` | **NO** | - | - | Historical product title |
| `variant_details` | `JSONB` | YES | `NULL` | - | Snapshot of variant attributes |
| `start_date` | `DATEONLY` | **NO** | - | - | Start date |
| `end_date` | `DATEONLY` | **NO** | - | - | End date |
| `quantity` | `INTEGER` | **NO** | - | - | Reserved quantity |
| `unit_price` | `DECIMAL(10,2)`| **NO** | - | - | Price per unit |
| `total_price` | `DECIMAL(10,2)`| **NO** | - | - | Item total |
| `created_at` | `TIMESTAMP` | **NO** | `NOW()` | - | Creation timestamp |

---

### 9. `payments` Table
Stores payment Gateway transactions (Online, Razorpay, Cash, Digital Wallet).

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Payment record ID |
| `order_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `rental_orders.id` | Target order |
| `customer_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `users.id` | Paying customer |
| `amount` | `DECIMAL(10,2)`| **NO** | - | Min 0 | Paid amount |
| `currency` | `VARCHAR` | **NO** | `'INR'` | - | Currency ISO code |
| `payment_type` | `ENUM` | **NO** | `'RENTAL'` | `'RENTAL'`, `'SECURITY_DEPOSIT'` | Payment breakdown type |
| `payment_method` | `ENUM` | **NO** | - | `'ONLINE'`, `'CASH'`, `'RAZORPAY'`, `'WALLET'`| Gateway method |
| `status` | `ENUM` | **NO** | `'PENDING'` | `'PENDING'`, `'SUCCESS'`, `'FAILED'`, `'REFUNDED'` | Gateway transaction status |
| `transaction_reference`| `VARCHAR`| YES | `NULL` | **UNIQUE** | Payment gateway reference ID |
| `paid_at` | `TIMESTAMP` | YES | `NULL` | - | Payment timestamp |

---

### 10. `security_deposits` Table
Tracks refundable security deposits held during rentals.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Security deposit ID |
| `order_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `rental_orders.id` | Associated order |
| `customer_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `users.id` | Customer owner |
| `amount` | `DECIMAL(10,2)`| **NO** | - | Min 0 | Total deposit held |
| `status` | `ENUM` | **NO** | `'PENDING'` | `'PENDING'`, `'HELD'`, `'PARTIALLY_REFUNDED'`, `'REFUNDED'`, `'DEDUCTED'` | Deposit state |
| `held_at` | `TIMESTAMP` | YES | `NULL` | - | Timestamp when held |
| `refunded_at` | `TIMESTAMP` | YES | `NULL` | - | Timestamp when settled |
| `refunded_amount`| `DECIMAL(10,2)`| **NO** | `0.00` | - | Net refunded amount |
| `deducted_amount`| `DECIMAL(10,2)`| **NO** | `0.00` | - | Net penalty deducted amount |

---

### 11. `rental_pickups` Table
Stores pre-rental handover records and mandatory 3 pickup photos.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Pickup record ID |
| `order_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `rental_orders.id` | Associated order |
| `customer_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `users.id` | Target customer |
| `pickup_type` | `ENUM` | **NO** | - | `'DELIVERY'`, `'STORE_PICKUP'` | Pickup method |
| `scheduled_at` | `TIMESTAMP` | **NO** | - | - | Scheduled date |
| `status` | `ENUM` | **NO** | `'SCHEDULED'` | `'SCHEDULED'`, `'READY'`, `'COMPLETED'`, `'CANCELLED'` | Pickup status |
| `confirmed_at` | `TIMESTAMP` | YES | `NULL` | - | Handover timestamp |
| `confirmed_by` | `UUID` | YES | `NULL` | **FOREIGN KEY** -> `users.id` | Vendor user who handed over |
| `pickup_code` | `VARCHAR` | **NO** | - | **UNIQUE** | Verification code |
| `checklist` | `JSONB` | YES | `[]` | - | 3 Pre-Rental Handover Photos |
| `notes` | `TEXT` | YES | `NULL` | - | Handover notes |

---

### 12. `rental_returns` Table
Stores post-rental return inspection, 3 return photos, and AI Damage Score outputs.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Return record ID |
| `order_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `rental_orders.id` | Associated order |
| `customer_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `users.id` | Returning customer |
| `scheduled_return_at`| `TIMESTAMP`| **NO** | - | - | Target return date |
| `actual_return_at`| `TIMESTAMP`| YES | `NULL` | - | Actual return date |
| `status` | `ENUM` | **NO** | `'PENDING'` | `'PENDING'`, `'INSPECTION'`, `'COMPLETED'`, `'CANCELLED'` | Return state |
| `condition` | `ENUM` | **NO** | `'GOOD'` | `'GOOD'`, `'DAMAGED'`, `'MISSING_ITEMS'` | Final condition |
| `damage_report` | `TEXT` | YES | `NULL` | - | AI Damage Inspector Report |
| `missing_accessories`| `JSONB` | YES | `[]` | - | Missing gear array |
| `repair_required`| `BOOLEAN` | **NO** | `false` | - | Major damage repair flag |
| `return_timing` | `ENUM` | YES | `NULL` | `'ON_TIME'`, `'LATE'` | Timeliness badge |
| `notes` | `TEXT` | YES | `NULL` | - | Additional return notes |
| `inspected_by` | `UUID` | YES | `NULL` | **FOREIGN KEY** -> `users.id` | Vendor inspector user ID |

---

### 13. `deposit_settlements` Table
Stores final security deposit financial reconciliation.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Settlement record ID |
| `deposit_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `security_deposits.id` | Parent deposit record |
| `order_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `rental_orders.id` | Associated order |
| `late_fee_id` | `UUID` | YES | `NULL` | **FOREIGN KEY** -> `late_fees.id` | Late fee reference |
| `deducted_amount`| `DECIMAL(10,2)`| **NO** | `0.00` | - | Deducted penalty |
| `refunded_amount`| `DECIMAL(10,2)`| **NO** | `0.00` | - | Amount refunded to wallet |
| `outstanding_amount`|`DECIMAL(10,2)`| **NO** | `0.00` | - | Uncollected damage excess |
| `settlement_status`| `ENUM` | **NO** | - | `'FULL_REFUND'`, `'PARTIAL_REFUND'`, `'FULL_DEDUCTION'`, `'OUTSTANDING'` | Settlement classification |
| `settled_at` | `TIMESTAMP` | **NO** | `NOW()` | - | Settlement timestamp |

---

### 14. `late_fees` Table
Stores calculated late fees for overdue rental returns.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Late fee record ID |
| `order_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `rental_orders.id` | Associated order |
| `return_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `rental_returns.id` | Return inspection ID |
| `customer_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `users.id` | Customer charged |
| `config_id` | `UUID` | YES | `NULL` | **FOREIGN KEY** -> `late_fee_configs.id` | Pricing rule config |
| `late_duration_hours`|`DECIMAL(10,2)`| **NO** | - | - | Hours past return time |
| `chargeable_units`| `INTEGER` | **NO** | - | - | Units charged |
| `charging_unit` | `ENUM` | **NO** | - | `'HOURLY'`, `'DAILY'`, `'WEEKLY'`, `'MONTHLY'` | Billing unit |
| `rate` | `DECIMAL(10,2)`| **NO** | - | - | Hourly/Daily late rate |
| `calculated_amount`|`DECIMAL(10,2)`| **NO** | - | - | Raw calculated fee |
| `final_amount` | `DECIMAL(10,2)`| **NO** | - | - | Final fee after cap |
| `status` | `ENUM` | **NO** | `'CALCULATED'` | `'CALCULATED'`, `'SETTLED'`, `'WAIVED'` | Fee status |
| `notes` | `TEXT` | YES | `NULL` | - | Administrative notes |

---

### 15. `late_fee_configs` Table
Stores vendor or platform late fee billing configurations.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Late fee config ID |
| `name` | `VARCHAR` | **NO** | - | - | Configuration title |
| `charging_unit` | `ENUM` | **NO** | `'DAILY'` | `'HOURLY'`, `'DAILY'`, `'WEEKLY'`, `'MONTHLY'` | Rate basis |
| `rate` | `DECIMAL(10,2)`| **NO** | - | - | Late rate amount |
| `grace_period` | `INTEGER` | **NO** | `0` | - | Grace period in hours |
| `max_fee` | `DECIMAL(10,2)`| YES | `NULL` | - | Maximum fee ceiling cap |
| `status` | `ENUM` | **NO** | `'ACTIVE'` | `'ACTIVE'`, `'INACTIVE'` | Rule status |

---

### 16. `invoices` Table
Stores customer & vendor transaction invoices.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Invoice unique ID |
| `invoice_number` | `VARCHAR` | **NO** | - | **UNIQUE** | Code (e.g. `INV-2026-001`) |
| `order_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `rental_orders.id` | Target order |
| `customer_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `users.id` | Billed customer |
| `amount` | `DECIMAL(10,2)`| **NO** | `0.00` | - | Total invoice amount |
| `amount_paid` | `DECIMAL(10,2)`| **NO** | `0.00` | - | Amount settled |
| `status` | `ENUM` | **NO** | `'DRAFT'` | `'DRAFT'`, `'POSTED'`, `'CANCELLED'` | Invoice state |
| `payment_status` | `ENUM` | **NO** | `'UNPAID'` | `'UNPAID'`, `'PARTIALLY_PAID'`, `'PAID'` | Settlement state |
| `due_date` | `DATEONLY` | YES | `NULL` | - | Due payment date |

---

### 17. `wallet_transactions` Table
Stores digital wallet balance audit logs.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Transaction ID |
| `user_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `users.id` (CASCADE) | Target user wallet |
| `amount` | `DECIMAL(10,2)`| **NO** | - | Min 0 | Transaction amount |
| `type` | `ENUM` | **NO** | - | `'CREDIT'`, `'DEBIT'` | Balance direction |
| `category` | `ENUM` | **NO** | - | `'DEPOSIT_REFUND'`, `'DAMAGE_PENALTY'`, `'RENTAL_PAYMENT'`, `'TOP_UP'` | Category classification |
| `description` | `TEXT` | YES | `NULL` | - | Human-readable log note |
| `order_id` | `UUID` | YES | `NULL` | **FOREIGN KEY** -> `rental_orders.id` | Reference order ID |

---

### 18. `pricelists` Table
Stores custom price lists for special customer groups or seasons.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Pricelist ID |
| `name` | `VARCHAR` | **NO** | - | - | Pricelist title |
| `vendor_id` | `UUID` | YES | `NULL` | **FOREIGN KEY** -> `users.id` | Vendor owner |
| `currency` | `VARCHAR` | **NO** | `'INR'` | - | Currency code |
| `is_selectable` | `BOOLEAN` | **NO** | `true` | - | Selectable flag |
| `status` | `ENUM` | **NO** | `'ACTIVE'` | `'ACTIVE'`, `'INACTIVE'` | Pricelist status |

---

### 19. `pricelist_rules` Table
Stores specific discount rules inside custom pricelists.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Rule ID |
| `pricelist_id` | `UUID` | **NO** | - | **FOREIGN KEY** -> `pricelists.id` | Parent pricelist |
| `product_id` | `UUID` | YES | `NULL` | **FOREIGN KEY** -> `products.id` | Target product |
| `min_quantity` | `INTEGER` | **NO** | `1` | - | Minimum quantity |
| `rule_type` | `ENUM` | **NO** | `'PERCENT'`| `'PERCENT'`, `'FIXED'` | Discount formula |
| `discount_percentage`| `DECIMAL(5,2)`| **NO** | `0.00` | - | Discount percentage |
| `fixed_price` | `DECIMAL(10,2)`| **NO** | `0.00` | - | Fixed price amount |
| `start_date` | `DATEONLY` | YES | `NULL` | - | Validity start date |
| `end_date` | `DATEONLY` | YES | `NULL` | - | Validity end date |

---

### 20. `quotation_templates` Table
Stores reusable quotation templates for B2B rental estimates.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | **NO** | `UUIDV4` | **PRIMARY KEY** | Template ID |
| `name` | `VARCHAR` | **NO** | - | - | Template name |
| `vendor_id` | `UUID` | YES | `NULL` | **FOREIGN KEY** -> `users.id` | Vendor owner |
| `validity_days` | `INTEGER` | **NO** | `30` | - | Offer validity period |
| `note` | `TEXT` | YES | `NULL` | - | Terms & notes |
| `items` | `JSONB` | **NO** | `[]` | - | Line items JSON |

---

### 21. `SequelizeMeta` Table
Tracks execution history of database migration scripts.

| Column | Data Type | Nullable | Default | Constraints & Relationships | Purpose |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `name` | `VARCHAR(255)` | **NO** | - | **PRIMARY KEY** | Migration filename executed |

---

## 🛠️ Installation, Environment & Database Seeding

### Environment Configuration

#### Backend `.env` File Configuration (`backend/.env`)
```env
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/odoo_rental_db
JWT_SECRET=super_secret_rental_jwt_key_2026
JWT_EXPIRES_IN=24h

# Gmail SMTP for Email Notifications
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# Razorpay Gateway Test Placeholders
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# Cloudinary Image Hosting Placeholders
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

#### Frontend `.env.local` Configuration (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### Database Seeding Command

Run the seed script to automatically reset tables and populate demo accounts, products, orders, and wallet balances:

```bash
cd backend
node src/seed.js
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Listing Privilege |
| :--- | :--- | :--- | :--- |
| **SuperAdmin** | `super@admin123` | `admin123` | N/A |
| **Approved Vendor** | `vendor@rental.com` | `vendor123` | `✓ APPROVED` |
| **New Pending Vendor** | `newvendor@rental.com` | `vendor123` | `⏳ PENDING` |
| **Customer** | `customer@gmail.com` | `customer123` | N/A |

---

## 📄 License
This project is licensed under the **MIT License** - see the `LICENSE` file for details.
