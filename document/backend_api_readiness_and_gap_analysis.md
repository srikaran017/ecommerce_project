# Backend Master Specification: Fixes, Pending Modules & Payment Enablement

**Document Reference:** `document/backend_api_readiness_and_gap_analysis.md`  
**Target Audience:** Backend Developers, Technical Lead, QA & DevOps  
**Target Service Base URL:** `http://localhost:5000/api/v1` (Local) / `https://dress-ecomm-backend.onrender.com/api/v1` (Production)  
**Authentication Scheme:** `Authorization: Bearer <jwt_access_token>` + `Cookie: refreshToken=<token>`  
**Date of Specification:** October 19, 2026  
**Status:** Complete Master Reference Document  

---

## 1. Executive Summary

This master document provides your backend engineering team with a complete, definitive blueprint of:
1. **Critical Bugs & Crashes to Fix:** Fixes for existing endpoints that crash with HTTP 500 under common query parameters or file uploads (Prisma type mismatches, multipart coercion).
2. **Payment Gateways & Direct UPI QR Enablement:** Detailed schema, endpoints, and validation for UI-level configurable payment methods (**Razorpay**, **Cash on Delivery**, and **Direct UPI Dynamic QR Code** with UTR verification).
3. **Pending Administrative Modules:** Complete request/response contracts for **Customer CRM 360**, **Hierarchical Staff Deletion**, **Single Inventory Item Lookup**, and **Order Deletion with Stock Restitution**.
4. **Mandatory Business Logic Invariants:** Address default exclusivity transactions, flat ₹150 delivery fee calculation, and zero additional tax.

---

## 2. API Global Standards & Conventions

### 2.1 Standard Response Envelope
All endpoints must return standard JSON response envelopes:

```json
// Success Response (200 / 201)
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error Response (400 / 401 / 403 / 404 / 409 / 500)
{
  "success": false,
  "statusCode": 400,
  "message": "Human-readable explanation of error",
  "error": {
    "code": "ERROR_CODE_STRING",
    "details": [
      {
        "field": "email",
        "message": "Email is already registered"
      }
    ]
  }
}
```

### 2.2 Standard Request Headers
* `Content-Type: application/json` (or `multipart/form-data` for image uploads)
* `Authorization: Bearer <access_token>` (for authenticated customer and admin routes)
* `x-guest-cart-token: <uuid>` (for guest cart operations before login)

---

## 3. High-Priority Backend Bugs & Gotchas (Fix Immediately)

### 🔴 Critical Bug 1: Prisma `findMany` 500 Crash on Query Parameters
* **Problem:** In `GET /api/v1/orders`, `GET /api/v1/products`, `GET /api/v1/wishlist`, and admin listing endpoints, passing `?limit=20` or `?page=1` crashes Prisma with an unhandled exception:
  `Argument 'take': Invalid value provided. Expected Int, provided String.`
* **Fix Required:** Always parse query strings into native integers in your controllers:
  ```typescript
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  const skip = (page - 1) * limit;

  // Use in Prisma:
  await prisma.product.findMany({
    skip,
    take: limit,
  });
  ```

### 🔴 Critical Bug 2: Product Creation & Variant Coercion in `multipart/form-data`
* **Problem:** When creating products with images via `multipart/form-data`, strings like `"isActive": "true"`, `"regularPrice": "14999"`, and `"variants": "[{...}]"` must be coerced to their expected schema types (`Boolean`, `Float/Int`, `Array/JSON`). Without coercion, backend Zod/Joi validation fails.
* **Fix Required:** Add a multipart parsing helper or allow creating the product via standard JSON first, followed by uploading images to `POST /api/v1/admin/products/:id/images`.

### 🔴 Critical Bug 3: Wishlist & Order Sort Parameter Crashes
* **Problem:** If an unknown sort parameter (e.g. `?sort=newest` vs `?sortBy=createdAt`) is received, controllers throw an unhandled 500 error instead of falling back to default descending order.
* **Fix Required:** Add a fallback:
  ```typescript
  const ALLOWED_SORTS: Record<string, object> = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    total_desc: { totalAmount: "desc" },
    total_asc: { totalAmount: "asc" },
  };
  const orderBy = ALLOWED_SORTS[req.query.sort as string] || { createdAt: "desc" };
  ```

---

## 4. NEW: Payment Gateways & Direct UPI QR Code System

The frontend allows the store owner to toggle payment methods dynamically at the UI level. The backend must persist these settings, support the `UPI_QR` payment method, and allow admins to verify submitted payments.

### 4.1 Database / Prisma Schema Updates

```prisma
// 1. Extend StoreSettings model with paymentMethodsJson
model StoreSettings {
  id                    String   @id @default(uuid())
  storeName             String
  tagline               String?
  currency              String   @default("INR")
  currencySymbol        String   @default("₹")
  supportEmail          String
  supportPhone          String?
  freeShippingThreshold Decimal  @default(2999.00)
  flatShippingRate      Decimal  @default(150.00)
  policiesJson          Json?
  featuresJson          Json?
  paymentMethodsJson    Json?    // 👈 Stores PaymentMethodsConfig
  activeTheme           String   @default("luxury-fashion")
  updatedAt             DateTime @updatedAt
}

// 2. Add UPI_QR to PaymentMethod Enum
enum PaymentMethod {
  RAZORPAY
  COD
  STRIPE
  UPI_QR    // 👈 NEW: Direct UPI & Dynamic QR code payment
}

// 3. Add upiReference to Order model
model Order {
  id              String        @id @default(uuid())
  orderNumber     String        @unique
  userId          String?
  customerName    String
  customerEmail   String
  customerPhone   String
  subtotal        Decimal
  discountAmount  Decimal       @default(0)
  shippingAmount  Decimal       @default(150.00)
  taxAmount       Decimal       @default(0)
  totalAmount     Decimal
  status          OrderStatus   @default(CONFIRMED)
  paymentStatus   PaymentStatus @default(PENDING)
  paymentMethod   PaymentMethod @default(RAZORPAY)
  upiReference    String?       // 👈 Customer's 12-digit UTR / reference number
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}
```

### 4.2 Payment Methods Configuration Structure (`paymentMethodsJson`)

```json
{
  "enableRazorpay": true,
  "enableCod": true,
  "enableUpiQr": true,
  "upiId": "maison@okhdfcbank",
  "payeeName": "Maison De Élégance",
  "instructions": "Scan the QR code or tap 'Pay via UPI App', then enter your 12-digit UPI Reference / UTR Number below to confirm.",
  "codMaxLimit": 25000
}
```

### 4.3 Payment Endpoints Specification

#### 1. Public Payment Methods Config (`GET /api/v1/settings/payment-methods` or `GET /api/v1/settings`)
* **Access:** Public (Storefront checkout reads this to render active payment cards)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Payment methods config retrieved successfully",
    "data": {
      "enableRazorpay": true,
      "enableCod": true,
      "enableUpiQr": true,
      "upiId": "maison@okhdfcbank",
      "payeeName": "Maison De Élégance",
      "instructions": "Scan the QR code or tap 'Pay via UPI App', then enter your 12-digit UPI Reference / UTR Number below to confirm.",
      "codMaxLimit": 25000
    }
  }
  ```

#### 2. Update Store Payment Settings (`PUT /api/v1/admin/settings`)
* **Access:** Admin (`SUPER_ADMIN` only)
* **Request Body:**
  ```json
  {
    "storeName": "Maison De Élégance",
    "paymentMethodsJson": {
      "enableRazorpay": true,
      "enableCod": true,
      "enableUpiQr": false,
      "upiId": "shop@okaxis",
      "payeeName": "Maison Garments",
      "instructions": "Scan the QR and enter UTR reference.",
      "codMaxLimit": 25000
    }
  }
  ```
* **Validation:** At least one of `enableRazorpay`, `enableCod`, or `enableUpiQr` must be `true`.

#### 3. Checkout Order Placement (`POST /api/v1/checkout`)
* **Access:** Authenticated Customer or Guest
* **Request Body with `UPI_QR`:**
  ```json
  {
    "paymentMethod": "UPI_QR",
    "upiReference": "428901234567",
    "shippingAddressId": "addr_uuid",
    "couponCode": "SUMMER10",
    "customerEmail": "customer@example.com"
  }
  ```
* **Backend Rules for `UPI_QR`:**
  * Validate that `upiReference` is present and at least 6 characters long.
  * Set `order.paymentStatus = "PENDING"`.
  * Set `order.status = "CONFIRMED"` (order is created, awaiting admin payment verification).
  * Save `upiReference` in the `Order` record.
  * Append entry to `OrderStatusHistory`:
    `"Order placed via Direct UPI QR Payment (UTR: 428901234567)"`.

* **Backend Rules for `COD`:**
  * Validate that customer telephone number is provided.
  * Check that `order.totalAmount <= paymentMethodsJson.codMaxLimit` (default ₹25,000). Reject with 400 if exceeded.

#### 4. Admin Payment Verification & Reconciliation (`PATCH /api/v1/admin/orders/:id/payment`)
* **Access:** Admin (`orders:write` permission)
* **Request Body:**
  ```json
  {
    "paymentStatus": "COMPLETED",
    "transactionId": "428901234567",
    "amount": 4999.00,
    "comment": "Bank credit verified on HDFC portal against UTR 428901234567"
  }
  ```
* **Backend Actions:**
  * Update `order.paymentStatus = "COMPLETED"`.
  * Insert payment record in `OrderPayment` table with gateway `UPI_QR` and transaction ID.
  * Append audit history entry: `"Payment verified and marked COMPLETED by admin"`.

---

## 5. Customer Default Address Exclusivity & Optimization

* **Requirement:** Each customer must have **at most one** address marked as `isDefault: true`.
* **Backend Implementation:** When creating (`POST /api/v1/customer/addresses`) or updating (`PUT /api/v1/customer/addresses/:id` or `PATCH /api/v1/customer/addresses/:id/default`):

```typescript
// Atomic transaction ensures zero race conditions and exactly 1 default address
await prisma.$transaction(async (tx) => {
  if (data.isDefault) {
    // Demote any existing default addresses for this customer
    await tx.address.updateMany({
      where: { userId: currentUserId, isDefault: true },
      data: { isDefault: false },
    });
  }

  // Update target address
  return await tx.address.update({
    where: { id: addressId, userId: currentUserId },
    data: { ...data, isDefault: data.isDefault ?? true },
  });
});
```

* **Deletion Rule:** When deleting an address (`DELETE /api/v1/customer/addresses/:id`):
  If the deleted address was the `isDefault: true` address, automatically promote the most recently updated remaining address to `isDefault: true`.

---

## 6. Complete Module-by-Module API Status Matrix

| Module | Method | Endpoint | Status | Backend Action Needed |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/register` | ✅ Ready | Returns `accessToken` + sets HttpOnly `refreshToken` cookie |
| **Auth** | `POST` | `/api/v1/auth/login` | ✅ Ready | Returns `accessToken` + user profile |
| **Auth** | `POST` | `/api/v1/auth/refresh` | ✅ Ready | Rotates refresh token and returns new `accessToken` |
| **Auth** | `POST` | `/api/v1/auth/logout` | ✅ Ready | Clears active refresh tokens |
| **Auth** | `GET` | `/api/v1/auth/me` | ✅ Ready | Returns logged-in user profile & role |
| **Address** | `GET` | `/api/v1/customer/addresses` | ✅ Ready | Returns saved address book |
| **Address** | `POST` | `/api/v1/customer/addresses` | ⚠️ Patch | Enforce default exclusivity transaction (Sec. 5) |
| **Address** | `PUT` | `/api/v1/customer/addresses/:id` | ⚠️ Patch | Enforce default exclusivity transaction (Sec. 5) |
| **Address** | `DELETE` | `/api/v1/customer/addresses/:id` | ⚠️ Patch | If default deleted, promote remaining address |
| **Address** | `PATCH` | `/api/v1/customer/addresses/:id/default` | ⚠️ Patch | Set single default atomically |
| **Catalog** | `GET` | `/api/v1/products` | ⚠️ Patch | Coerce `page`, `limit`, `minPrice`, `maxPrice` to native numbers |
| **Catalog** | `GET` | `/api/v1/products/:slug` | ✅ Ready | Returns product + variants + attributes + gallery |
| **Cart** | `GET` | `/api/v1/cart` | ✅ Ready | Supports both `Bearer` token & `x-guest-cart-token` |
| **Cart** | `POST` | `/api/v1/cart/items` | ✅ Ready | Adds SKU / variant to cart with quantity |
| **Cart** | `PATCH` | `/api/v1/cart/items/:id` | ✅ Ready | Updates item quantity (handles stock cap) |
| **Cart** | `DELETE` | `/api/v1/cart/items/:id` | ✅ Ready | Removes line item from cart |
| **Cart** | `POST` | `/api/v1/cart/merge` | ⚠️ Verify | Merges guest cart items into authenticated user cart upon login |
| **Settings**| `GET` | `/api/v1/settings` | 🔴 Update | Return `paymentMethodsJson` with booleans & UPI details |
| **Settings**| `PUT` | `/api/v1/admin/settings` | 🔴 Update | Save `paymentMethodsJson` (Sec. 4) |
| **Checkout** | `POST` | `/api/v1/coupons/validate` | ✅ Ready | Validates code, expiry, min spend, returns discount |
| **Checkout** | `POST` | `/api/v1/checkout/summary` | ⚠️ Patch | Enforce static ₹150 shipping and ₹0 extra tax |
| **Checkout** | `POST` | `/api/v1/checkout` | 🔴 Update | Accept `paymentMethod: "UPI_QR"` & `upiReference` (Sec. 4) |
| **Checkout** | `POST` | `/api/v1/payments/verify` | ✅ Ready | Validates Razorpay HMAC SHA256 signature |
| **Orders** | `GET` | `/api/v1/orders` | ⚠️ Patch | Coerce `page` and `limit` to Numbers |
| **Orders** | `GET` | `/api/v1/orders/:orderNumber` | ✅ Ready | Full customer order tracking file with UTR |
| **Admin Orders** | `GET` | `/api/v1/admin/orders` | 🔴 Update | Return `paymentMethod: "UPI_QR"` & `upiReference` in payload |
| **Admin Orders** | `PATCH` | `/api/v1/admin/orders/:id/payment` | 🔴 Update | Mark UPI/COD payment verified as `COMPLETED` |
| **Admin Orders** | `DELETE` | `/api/v1/admin/orders/:id` | 🔴 New | **Deletes order & restores stock if active** (Sec. 8) |
| **Admin CRM** | `GET` | `/api/v1/admin/customers` | 🔴 New | **Customer listing with LTV, order count, search** (Sec. 7.1) |
| **Admin CRM** | `GET` | `/api/v1/admin/customers/:id` | 🔴 New | **Customer 360 profile with order history & addresses** (Sec. 7.1) |
| **Admin CRM** | `POST` | `/api/v1/admin/customers` | 🔴 New | **Create customer with optional default address** (Sec. 7.1) |
| **Admin CRM** | `PUT` | `/api/v1/admin/customers/:id` | 🔴 New | **Update customer details, phone, or password** (Sec. 7.1) |
| **Admin CRM** | `DELETE` | `/api/v1/admin/customers/:id` | 🔴 New | **Safe deletion: soft-deactivates if 1+ orders exist** (Sec. 7.1) |
| **Admin Staff** | `DELETE` | `/api/v1/admin/users/:id` | 🔴 New | **Staff deletion with hierarchy checks** (Sec. 7.2) |
| **Admin Inv** | `GET` | `/api/v1/admin/inventory/:id` | 🔴 New | **Single SKU lookup with 10 recent movements** (Sec. 7.3) |

---

## 7. Specifications for Pending Administrative Modules

### 7.1 Customer CRM Module (`/api/v1/admin/customers`)

#### 1. List Customers (`GET /api/v1/admin/customers`)
* **Query Parameters:** `page` (number), `limit` (number), `search` (string), `sortBy` (`createdAt` | `totalSpent` | `ordersCount`), `sortOrder` (`asc` | `desc`)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": [
      {
        "id": "cust-uuid",
        "name": "Victoria Beckham",
        "email": "victoria@example.com",
        "phone": "+91 98765 93612 00683",
        "avatarUrl": "https://...",
        "isActive": true,
        "ordersCount": 4,
        "totalSpent": 48990.00,
        "averageOrderValue": 12247.50,
        "lastOrderDate": "2026-10-18T14:32:00.000Z",
        "createdAt": "2026-10-18T12:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
  ```

#### 2. Get Customer 360 Detail (`GET /api/v1/admin/customers/:id`)
* **Response:** Returns customer profile, metrics (`ordersCount`, `totalSpent`, `averageOrderValue`), list of saved addresses (with `isDefault`), and past orders.

#### 3. Create Customer (`POST /api/v1/admin/customers`)
* **Body:** `{ name, email, phone, password?, address? }`
* **Rule:** If `password` is omitted, generate a temporary password. If `address` is provided, save it with `isDefault: true`.

#### 4. Update Customer (`PUT /api/v1/admin/customers/:id`)
* **Body:** `{ name?, email?, phone?, password?, isActive? }`
* **Rule:** If password is changed, re-hash and revoke all existing refresh tokens for this user.

#### 5. Delete Customer (`DELETE /api/v1/admin/customers/:id`)
* **Rule:**
  * **0 orders placed:** Hard-delete the user record.
  * **1+ orders placed:** Soft-deactivate (`isActive: false`) to preserve accounting and tax records.

---

### 7.2 Staff User Deletion (`DELETE /api/v1/admin/users/:id`)

* **Strict Hierarchy Guards Required:**
  1. `CANNOT_DELETE_SELF`: Reject if `req.user.id === targetUser.id` (HTTP 400).
  2. `FORBIDDEN_USER_DELETE`: Reject if actor's role rank is equal to or lower than the target user's role rank (`ROLE_LEVEL[actor] <= ROLE_LEVEL[target]`, HTTP 403).
  3. `CANNOT_DELETE_LAST_SUPER_ADMIN`: Reject if deleting the only active `SUPER_ADMIN` (HTTP 400).
  4. **Foreign Key Integrity:** Set `createdById = null` on any records created by this user before deleting.

---

### 7.3 Single Inventory SKU Inspection (`GET /api/v1/admin/inventory/:id`)

* **Path Parameter:** `id` (Product UUID or Variant UUID)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": {
      "itemType": "VARIANT",
      "id": "var-uuid",
      "productId": "prod-uuid",
      "productName": "Evening Silk Gown",
      "sku": "MDE-EVE-001-S",
      "variantName": "Small / Crimson Red",
      "size": "S",
      "color": "Crimson Red",
      "stockQuantity": 15,
      "lowStockThreshold": 5,
      "status": "IN_STOCK",
      "regularPrice": "14999.00",
      "salePrice": "12999.00",
      "recentTransactions": [
        {
          "id": "tx-uuid",
          "type": "RESTOCK",
          "quantityChange": 10,
          "previousStock": 5,
          "newStock": 15,
          "reason": "Shipment PO-4481 Received",
          "createdAt": "2026-10-18T10:15:00.000Z",
          "createdBy": { "name": "Admin", "role": "SUPER_ADMIN" }
        }
      ]
    }
  }
  ```

---

## 8. Order Deletion with Automatic Stock Restitution (`DELETE /api/v1/admin/orders/:id`)

* **Path Parameter:** `id` (Order UUID)
* **Automatic Inventory Restoral Logic:**
  * If the order status is active (`PENDING`, `CONFIRMED`, `PROCESSING`, `PACKED`, `SHIPPED`):
    * Iterate through all line items and increment `stockQuantity` on the respective variant or product.
    * Append an audit movement entry to `InventoryTransaction` with `type: "RETURN"` and `reason: "Order Deletion Stock Restitution"`.
  * If the order is already in a terminal state (`CANCELLED` or `DELIVERED`):
    * Do not touch inventory quantities (prevents duplicate stock inflation).
  * Cascade delete associated payments, status histories, and coupon usage records.

---

## 9. Pricing & Shipping Invariants

1. **Shipping Fee:** Flat **₹150** on all carts with items.
2. **Tax:** **₹0** additional tax (prices are inclusive of GST).
3. Ensure `/api/v1/checkout/summary` computes:
   `totalAmount = Math.max(0, subtotal - discountAmount) + 150.00`.

---

## 10. Master Actionable Checklist for Backend Developer

Copy and send this checklist to your backend developer friend:

- [ ] **1. Query Parameter Coercion (Critical Bug Fix)**
  - [ ] Wrap `req.query.page` and `req.query.limit` with `parseInt()` across all controllers (`orders`, `products`, `inventory`, `wishlist`, `customers`).
  - [ ] Ensure unknown `sort` values fall back to `{ createdAt: "desc" }` instead of crashing with 500.

- [ ] **2. Payment Gateways & UPI QR System**
  - [ ] Add `paymentMethodsJson` field (JSON) to `StoreSettings` model.
  - [ ] Add `UPI_QR` to `PaymentMethod` enum.
  - [ ] Add `upiReference` (String?) to `Order` model.
  - [ ] Return `paymentMethodsJson` from `GET /api/v1/settings` (or `GET /api/v1/settings/payment-methods`).
  - [ ] Update `PUT /api/v1/admin/settings` to save `paymentMethodsJson`.
  - [ ] In `POST /api/v1/checkout`, accept `paymentMethod: "UPI_QR"` and `upiReference` (validate 6+ chars).
  - [ ] In `PATCH /api/v1/admin/orders/:id/payment`, allow marking payment as `COMPLETED` with transaction ID / UTR.

- [ ] **3. Customer Default Address Exclusivity**
  - [ ] Use `prisma.$transaction` to demote existing defaults (`updateMany isDefault: false`) before setting a new default address.
  - [ ] On address delete, promote remaining address if default was removed.

- [ ] **4. Customer CRM Module (`/api/v1/admin/customers`)**
  - [ ] `GET /api/v1/admin/customers` (List with computed LTV and order count).
  - [ ] `GET /api/v1/admin/customers/:id` (Customer 360 profile with order history and saved addresses).
  - [ ] `POST /api/v1/admin/customers` (Create customer with optional default address).
  - [ ] `PUT /api/v1/admin/customers/:id` (Update profile; revoke tokens if password changed).
  - [ ] `DELETE /api/v1/admin/customers/:id` (Safe delete: hard delete if 0 orders, `isActive: false` if 1+ orders).

- [ ] **5. Staff Deletion (`DELETE /api/v1/admin/users/:id`)**
  - [ ] Enforce guards: cannot delete self, cannot delete equal/higher rank, cannot delete last Super Admin.

- [ ] **6. Single Inventory Lookup (`GET /api/v1/admin/inventory/:id`)**
  - [ ] Return item details with the 10 most recent `InventoryTransaction` rows.

- [ ] **7. Order Deletion (`DELETE /api/v1/admin/orders/:id`)**
  - [ ] If active order, restore variant stock and log `RETURN` transaction. If cancelled/delivered, leave stock untouched.
