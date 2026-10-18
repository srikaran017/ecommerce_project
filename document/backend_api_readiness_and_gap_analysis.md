# Backend API Readiness, Complete Endpoint Specification & Gap Analysis

**Document Reference:** `document/backend_api_readiness_and_gap_analysis.md`  
**Target Audience:** Backend Engineers, Full-Stack Developers, QA & Technical Lead  
**Target Service Base URL:** `http://localhost:5000/api/v1` (Local) / `https://dress-ecomm-backend.onrender.com/api/v1` (Production)  
**Frontend Proxy Route:** `/api/v1/*` (Next.js server-side reverse proxy with fallback layers)  
**Authentication Scheme:** `Authorization: Bearer <jwt_access_token>` + `Cookie: refreshToken=<token>`  
**Date of Audit:** October 18, 2026  

---

## 1. Executive Summary & Purpose

This document provides a comprehensive audit of all API endpoints required by the E-Commerce Storefront and Administration Dashboard. It highlights:
1. **Fully Ready & Operational APIs:** Endpoints tested and functioning.
2. **APIs Requiring Backend Fixes or Patches:** Endpoints that exist but crash under certain conditions (e.g., Prisma type errors on query strings, multipart form coercion).
3. **Pending / Newly Specified APIs:** Recently specified administrative modules (Customer CRM 360, Staff Deletion with hierarchy guards, Single Inventory Item Lookup, Order Deletion with stock restitution) that require backend synchronization.
4. **Specific Business Logic Guarantees:** Address default exclusivity, flat ₹150 delivery fee, inventory restoral on cancellation, and guest cart merge.

Your backend friend can follow the **Checklist in Section 6** to complete and verify all backend routes.

---

## 2. API Global Conventions & Data Envelope

### 2.1 Standard JSON Response Format
All backend responses should conform to the standard API envelope:

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
* `Content-Type: application/json` (or `multipart/form-data` for file uploads)
* `Authorization: Bearer <access_token>` (for authenticated customer and admin routes)
* `x-guest-cart-token: <uuid>` (for guest cart operations before login)

---

## 3. High-Priority Backend Bugs & Gotchas (Immediate Action Needed)

### 🔴 Critical Bug 1: Prisma `findMany` 500 Crash on Query Parameters
* **Problem:** In routes like `GET /api/v1/orders`, `GET /api/v1/wishlist`, and admin lists, when query string parameters like `limit=20` or `page=1` are sent as strings, Prisma throws an unhandled exception (`Argument 'take': Invalid value provided. Expected Int, provided String.`) resulting in HTTP 500.
* **Frontend Workaround currently active:** The frontend proxy strips the `limit` query parameter before forwarding to avoid server crashes.
* **Backend Fix Required:** Always coerce query parameters in backend controllers:
  ```typescript
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(100, parseInt(req.query.limit as string, 10) || 20);
  const skip = (page - 1) * limit;
  ```

### 🔴 Critical Bug 2: Product Creation & Variant Attribute Coercion in `multipart/form-data`
* **Problem:** When sending product data with images via `multipart/form-data`, strings like `"isActive": "true"`, `"regularPrice": "14999"`, and `"variants": "[{...}]"` must be parsed to their respective types (`Boolean`, `Number`, `Array`). When backend parsers do not coerce them, validation fails.
* **Frontend Workaround currently active:** The frontend proxy intercepts product creation, sends cleaned JSON first, and then performs a secondary upload to `/api/v1/admin/products/:id/images`.
* **Backend Fix Required:** Add a multipart sanitation middleware or support JSON body with image URL arrays directly.

### 🔴 Critical Bug 3: Wishlist Sort Parameter Crashes
* **Problem:** If a query like `?sort=newestis` or an unhandled sort string is passed to `GET /api/v1/wishlist`, the backend returns 500 instead of falling back to default sorting (`createdAt: desc`).
* **Backend Fix Required:** Fall back gracefully to `newest` if the sort key is not recognized.

### 🟡 Business Logic 4: Customer Default Address Exclusivity
* **Requirement:** Each customer must have **at most one** address marked as `isDefault: true`.
* **Backend Implementation:** When creating or updating an address with `isDefault: true`:
  ```typescript
  await prisma.$transaction(async (tx) => {
    await tx.address.updateMany({
      where: { userId: currentUserId },
      data: { isDefault: false }
    });
    return await tx.address.update({
      where: { id: addressId },
      data: { ...data, isDefault: true }
    });
  });
  ```

### 🟡 Business Logic 5: Standard Shipping & Tax Policy
* **Requirement:** 
  * Flat shipping rate: **₹150** on all orders with items.
  * Standard tax amount: **₹0** (prices are inclusive of GST).
* **Backend Implementation:** Ensure `/api/v1/checkout/summary` and `/api/v1/cart` calculate `shippingAmount = 150` and `taxAmount = 0` whenever items exist in the cart.

---

## 4. Complete Module-by-Module API Status Matrix

| Module | Method | Endpoint | Status | Backend Action Needed |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/register` | ✅ Ready | Returns `accessToken` + sets HttpOnly `refreshToken` cookie |
| **Auth** | `POST` | `/api/v1/auth/login` | ✅ Ready | Returns `accessToken` + user profile |
| **Auth** | `POST` | `/api/v1/auth/refresh` | ✅ Ready | Rotates refresh token and returns new `accessToken` |
| **Auth** | `POST` | `/api/v1/auth/logout` | ✅ Ready | Clears active refresh tokens |
| **Auth** | `GET` | `/api/v1/auth/me` | ✅ Ready | Returns logged-in user profile & role |
| **Auth** | `POST` | `/api/v1/auth/forgot-password` | ⚠️ Check | Sends reset token via email / returns success |
| **Auth** | `POST` | `/api/v1/auth/reset-password` | ⚠️ Check | Accepts `{ token, newPassword }` |
| **Customer** | `GET` | `/api/v1/customer/account` | ✅ Ready | Returns user identity details |
| **Customer** | `PATCH` | `/api/v1/customer/account` | ✅ Ready | Updates name, phone, avatar |
| **Customer** | `POST` | `/api/v1/customer/change-password` | ✅ Ready | Validates current password and updates hash |
| **Address** | `GET` | `/api/v1/customer/addresses` | ✅ Ready | Returns saved address book |
| **Address** | `POST` | `/api/v1/customer/addresses` | ⚠️ Patch | Enforce default exclusivity transaction |
| **Address** | `PUT` | `/api/v1/customer/addresses/:id` | ⚠️ Patch | Enforce default exclusivity transaction |
| **Address** | `DELETE` | `/api/v1/customer/addresses/:id` | ✅ Ready | Deletes address (ensures one default remains if items exist) |
| **Address** | `PATCH` | `/api/v1/customer/addresses/:id/default` | ⚠️ Patch | Atomic transaction to set single default address |
| **Catalog** | `GET` | `/api/v1/products` | ⚠️ Patch | Coerce `page`, `limit`, `minPrice`, `maxPrice` to Numbers |
| **Catalog** | `GET` | `/api/v1/products/:slug` | ✅ Ready | Returns product + variants + attributes + gallery |
| **Catalog** | `GET` | `/api/v1/categories` | ✅ Ready | Returns flat list or hierarchical category tree |
| **Catalog** | `GET` | `/api/v1/categories/:slug` | ✅ Ready | Category details with subcategories |
| **Catalog** | `GET` | `/api/v1/collections` | ✅ Ready | Returns curated collections (e.g., Summer Atelier) |
| **Catalog** | `GET` | `/api/v1/collections/:slug` | ✅ Ready | Collection details with assigned products |
| **Cart** | `GET` | `/api/v1/cart` | ✅ Ready | Supports both `Bearer` token & `x-guest-cart-token` |
| **Cart** | `POST` | `/api/v1/cart/items` | ✅ Ready | Adds SKU / variant to cart with quantity |
| **Cart** | `PATCH` | `/api/v1/cart/items/:id` | ✅ Ready | Updates item quantity (handles stock cap) |
| **Cart** | `DELETE` | `/api/v1/cart/items/:id` | ✅ Ready | Removes line item from cart |
| **Cart** | `DELETE` | `/api/v1/cart` | ✅ Ready | Clears all items in cart |
| **Cart** | `POST` | `/api/v1/cart/merge` | ⚠️ Check | Merges guest cart items into authenticated user cart upon login |
| **Cart** | `POST` | `/api/v1/cart/coupon` | ✅ Ready | Applies promo coupon to cart |
| **Cart** | `DELETE` | `/api/v1/cart/coupon` | ✅ Ready | Removes promo coupon from cart |
| **Wishlist** | `GET` | `/api/v1/wishlist/ids` | ⚠️ Verify | Fast array return: `["prod-1", "prod-2"]` for instant UI heart states |
| **Wishlist** | `POST` | `/api/v1/wishlist/toggle` | ⚠️ Verify | Toggles item: `{ productId }` &rarr; `{ isInWishlist: boolean }` |
| **Wishlist** | `GET` | `/api/v1/wishlist` | ⚠️ Patch | Coerce `page` / `limit` to integers; prevent 500 on invalid `sort` |
| **Wishlist** | `DELETE` | `/api/v1/wishlist/:productId` | ✅ Ready | Removes product from wishlist |
| **Checkout** | `POST` | `/api/v1/coupons/validate` | ✅ Ready | Validates code, expiry, min spend, returns discount |
| **Checkout** | `POST` | `/api/v1/checkout/summary` | ⚠️ Patch | Enforce static ₹150 shipping and ₹0 extra tax |
| **Checkout** | `POST` | `/api/v1/checkout/orders` | ✅ Ready | Places order (creates Razorpay order or confirms COD) |
| **Checkout** | `POST` | `/api/v1/checkout/verify-payment` | ✅ Ready | Validates Razorpay HMAC SHA256 signature |
| **Customer Orders** | `GET` | `/api/v1/orders` | ⚠️ Patch | Coerce `page` and `limit` to Numbers |
| **Customer Orders** | `GET` | `/api/v1/orders/:orderNumber` | ✅ Ready | Full customer order tracking file |
| **Customer Orders** | `POST` | `/api/v1/orders/:orderNumber/cancel` | ⚠️ Verify | Restores reserved inventory on customer cancellation |
| **Contact** | `POST` | `/api/v1/contact` | ✅ Ready | Submits contact / customer support inquiry |
| **Admin Users** | `GET` | `/api/v1/admin/users` | ✅ Ready | Lists staff and store admins |
| **Admin Users** | `POST` | `/api/v1/admin/users` | ✅ Ready | Creates subordinate staff with scoped permissions |
| **Admin Users** | `PUT` | `/api/v1/admin/users/:id` | ✅ Ready | Updates subordinate profile & permissions |
| **Admin Users** | `DELETE` | `/api/v1/admin/users/:id` | 🔴 New | **Delete subordinate account with hierarchy checks** (See Sec. 5.2) |
| **Admin Catalog** | `GET` | `/api/v1/admin/products` | ✅ Ready | Admin product table with pagination |
| **Admin Catalog** | `POST` | `/api/v1/admin/products` | ⚠️ Patch | Accept parsed JSON with integer prices & boolean flags |
| **Admin Catalog** | `PUT` | `/api/v1/admin/products/:id` | ⚠️ Patch | Accept parsed JSON with integer prices & boolean flags |
| **Admin Catalog** | `POST` | `/api/v1/admin/products/:id/images` | ✅ Ready | Uploads array of images to Cloudinary / S3 |
| **Admin Catalog** | `DELETE` | `/api/v1/admin/products/:id` | ✅ Ready | Soft-deletes or archives product |
| **Admin Inventory** | `GET` | `/api/v1/admin/inventory` | ✅ Ready | SKU stock breakdown with threshold alerts |
| **Admin Inventory** | `GET` | `/api/v1/admin/inventory/:id` | 🔴 New | **Single SKU lookup with 10 recent audit movements** (See Sec. 5.3) |
| **Admin Inventory** | `POST` | `/api/v1/admin/inventory/adjust` | ✅ Ready | Restock, write-off, sale adjustment |
| **Admin Inventory** | `PUT` | `/api/v1/admin/inventory/:id/threshold` | ✅ Ready | Updates low-stock alert threshold |
| **Admin Orders** | `GET` | `/api/v1/admin/orders` | ✅ Ready | Admin order management table |
| **Admin Orders** | `GET` | `/api/v1/admin/orders/:id` | ✅ Ready | Complete order dossier |
| **Admin Orders** | `PATCH` | `/api/v1/admin/orders/:id/status` | ✅ Ready | Advances status (`CONFIRMED`, `PROCESSING`, etc.) |
| **Admin Orders** | `PATCH` | `/api/v1/admin/orders/:id/shipping` | ✅ Ready | Assigns courier partner and tracking number |
| **Admin Orders** | `POST` | `/api/v1/admin/orders/:id/cancel` | ✅ Ready | Cancels order & auto-restores inventory |
| **Admin Orders** | `DELETE` | `/api/v1/admin/orders/:id` | 🔴 New | **Deletes order & restores stock if active** (See Sec. 5.4) |
| **Admin CRM** | `GET` | `/api/v1/admin/customers` | 🔴 New | **Customer listing with LTV, order count, search** (See Sec. 5.1) |
| **Admin CRM** | `GET` | `/api/v1/admin/customers/:id` | 🔴 New | **Customer 360 profile with order history & addresses** (See Sec. 5.1) |
| **Admin CRM** | `POST` | `/api/v1/admin/customers` | 🔴 New | **Create customer with optional default address** (See Sec. 5.1) |
| **Admin CRM** | `PUT` | `/api/v1/admin/customers/:id` | 🔴 New | **Update customer details, phone, or password** (See Sec. 5.1) |
| **Admin CRM** | `DELETE` | `/api/v1/admin/customers/:id` | 🔴 New | **Safe deletion: soft-deactivates if 1+ orders exist** (See Sec. 5.1) |
| **Admin Promo** | `GET` | `/api/v1/admin/coupons` | ✅ Ready | Lists coupons with usage count |
| **Admin Promo** | `POST` | `/api/v1/admin/coupons` | ✅ Ready | Creates coupon with discount type, min spend, expiry |
| **Admin Promo** | `GET` | `/api/v1/admin/promotions` | ✅ Ready | Lists active and scheduled promotional banners |
| **Admin Analytics** | `GET` | `/api/v1/admin/analytics/dashboard` | ✅ Ready | Top-line revenue, order stats, sales graph |
| **Admin Analytics** | `GET` | `/api/v1/admin/analytics/wishlist` | ✅ Ready | High-demand garments wishlist analytics |
| **Admin Audit** | `GET` | `/api/v1/admin/audit-logs` | ✅ Ready | Immutable administrative activity trail |

---

## 5. Detailed Specifications for Newly Added / Updated Endpoints

### 5.1 Module 1: Customer CRM (`/api/v1/admin/customers`)

#### 1. List Customers (`GET /api/v1/admin/customers`)
* **Query Parameters:**
  * `page` (number, default: `1`)
  * `limit` (number, default: `20`, max: `100`)
  * `search` (string, optional): Matches customer name, email, or phone (case-insensitive)
  * `sortBy` (string, default: `createdAt`): One of `createdAt`, `totalSpent`, `ordersCount`, `name`
  * `sortOrder` (string, default: `desc`): `asc` or `desc`
  * `isActive` (boolean, optional): `true` or `false`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Customers fetched successfully",
    "data": [
      {
        "id": "uuid",
        "name": "Victoria Beckham",
        "email": "victoria@example.com",
        "phone": "9876543299",
        "avatarUrl": "https://...",
        "isActive": true,
        "ordersCount": 4,
        "totalSpent": 48990.00,
        "averageOrderValue": 12247.50,
        "lastOrderDate": "2026-10-18T14:32:00.000Z",
        "location": "London, London",
        "createdAt": "2026-10-18T12:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
  ```

#### 2. Get Customer 360 Detail (`GET /api/v1/admin/customers/:id`)
* **Path Parameter:** `id` (Customer user UUID)
* **Response (200 OK):**
  Returns `{ profile, metrics, savedAddresses, recentOrders }` containing lifetime value, order statuses breakdown, address book with default indicator, and past order history.

#### 3. Create Customer (`POST /api/v1/admin/customers`)
* **Body:**
  ```json
  {
    "name": "Victoria Beckham",
    "email": "victoria@example.com",
    "password": "OptionalPassword123",
    "phone": "9876543299",
    "avatarUrl": "https://...",
    "address": {
      "firstName": "Victoria",
      "lastName": "Beckham",
      "company": "VB Studio",
      "address1": "12 Kensington Palace Gardens",
      "address2": "Suite 2",
      "city": "London",
      "state": "London",
      "postalCode": "W8 4QP",
      "country": "UK",
      "phoneNumber": "9876543299"
    }
  }
  ```
* **Backend Rules:**
  * If `password` is omitted, auto-generate a secure random password.
  * If `address` is supplied, insert it into `Address` table and mark `isDefault: true`.

#### 4. Update Customer (`PUT /api/v1/admin/customers/:id`)
* **Body (all optional):** `{ name, email, phone, password, isActive, avatarUrl }`
* **Backend Rules:** If `password` is provided, re-hash password and invalidate all active user sessions/refresh tokens.

#### 5. Delete / Deactivate Customer (`DELETE /api/v1/admin/customers/:id`)
* **Backend Rules:**
  * **0 Orders:** Hard-delete the customer record (cascading wishlists, cart, addresses).
  * **1+ Orders:** Soft-deactivate (`isActive: false`) and revoke active refresh tokens to preserve historical sales and tax revenue records.

---

### 5.2 Module 2: Staff Deletion (`DELETE /api/v1/admin/users/:id`)
* **Path Parameter:** `id` (Staff user UUID)
* **Strict Security Guards Required in Backend:**
  1. `CANNOT_DELETE_SELF`: Reject if `req.user.id === targetUser.id` (HTTP 400).
  2. `FORBIDDEN_USER_DELETE`: Reject if actor's role rank is equal to or lower than the target user's role rank (`ROLE_LEVEL[actor] <= ROLE_LEVEL[target]`, HTTP 403).
  3. `CANNOT_DELETE_LAST_SUPER_ADMIN`: Reject if deleting the only active `SUPER_ADMIN` (HTTP 400).
  4. **Foreign Key Integrity:** Set `createdById = null` on any staff records originally created by this user before deletion.

---

### 5.3 Module 3: Single Inventory SKU Inspection (`GET /api/v1/admin/inventory/:id`)
* **Path Parameter:** `id` (UUID of Product or Variant)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Inventory item details fetched successfully",
    "data": {
      "itemType": "VARIANT",
      "id": "var-uuid",
      "variantId": "var-uuid",
      "productId": "prod-uuid",
      "productName": "Evening Silk Gown",
      "brand": "Maison De Élégance",
      "sku": "MDE-EVE-001-S",
      "variantName": "Small / Crimson Red",
      "size": "S",
      "color": "Crimson Red",
      "stockQuantity": 15,
      "lowStockThreshold": 5,
      "status": "IN_STOCK",
      "regularPrice": "14999.00",
      "salePrice": "12999.00",
      "costPrice": "6500.00",
      "isActive": true,
      "category": { "id": "cat-uuid", "name": "Eveningwear", "slug": "eveningwear" },
      "thumbnail": "https://...",
      "recentTransactions": [
        {
          "id": "tx-uuid",
          "type": "RESTOCK",
          "quantityChange": 10,
          "previousStock": 5,
          "newStock": 15,
          "reason": "Shipment PO-4481 Received",
          "referenceId": "PO-4481",
          "createdAt": "2026-10-18T10:15:00.000Z",
          "createdBy": { "name": "Admin Name", "role": "SUPER_ADMIN" }
        }
      ]
    }
  }
  ```

---

### 5.4 Module 4: Order Deletion with Stock Restitution (`DELETE /api/v1/admin/orders/:id`)
* **Path Parameter:** `id` (Order UUID)
* **Automatic Inventory Restoral Logic:**
  * If the order status is active (`PENDING`, `CONFIRMED`, `PROCESSING`, `PACKED`, `SHIPPED`):
    * Iterate through all line items and increment `stockQuantity` on the respective variant or product.
    * Append an audit movement entry to the `InventoryTransaction` ledger with `type: "RETURN"` and `reason: "Order Deletion Stock Restitution"`.
  * If the order is already in a terminal state (`CANCELLED` or `DELIVERED`):
    * Do not touch inventory quantities (prevents duplicate stock inflation).
  * Cascade delete associated payments, status histories, and coupon usage records.

---

## 6. Actionable Checklist for Your Backend Developer Friend

Copy and share this checklist with your friend:

- [ ] **1. Query Parameter Coercion**
  - [ ] Update all `findMany` queries in `orders`, `inventory`, `products`, `customers`, and `wishlist` controllers to parse `req.query.page` and `req.query.limit` into native integers with `parseInt()`.
  - [ ] Add fallback to default sorting if an unknown `sort` value is passed.

- [ ] **2. Customer CRM Module (`/api/v1/admin/customers`)**
  - [ ] `GET /api/v1/admin/customers` (Paginated list with computed LTV and order count).
  - [ ] `GET /api/v1/admin/customers/:id` (Customer 360 profile with order history and saved addresses).
  - [ ] `POST /api/v1/admin/customers` (Create customer with optional address marked as default).
  - [ ] `PUT /api/v1/admin/customers/:id` (Update customer profile; invalidate sessions if password changes).
  - [ ] `DELETE /api/v1/admin/customers/:id` (Safe delete: hard delete if 0 orders, soft-deactivate `isActive: false` if 1+ orders).

- [ ] **3. Staff User Deletion (`DELETE /api/v1/admin/users/:id`)**
  - [ ] Guard: Prevent self-deletion (`CANNOT_DELETE_SELF`).
  - [ ] Guard: Enforce role hierarchy; cannot delete equal or higher rank (`FORBIDDEN_USER_DELETE`).
  - [ ] Guard: Prevent deleting the last active Super Admin (`CANNOT_DELETE_LAST_SUPER_ADMIN`).
  - [ ] Clean up: Nullify `createdById` on created subordinates before deletion.

- [ ] **4. Inventory Single Item Lookup (`GET /api/v1/admin/inventory/:id`)**
  - [ ] Support both variant ID and standalone product ID lookup.
  - [ ] Include the 10 most recent `InventoryTransaction` records with creator attribution.

- [ ] **5. Order Deletion (`DELETE /api/v1/admin/orders/:id`)**
  - [ ] Check order status: if active (`PENDING`, `CONFIRMED`, `PROCESSING`, `PACKED`, `SHIPPED`), increment stock back into inventory and insert a `RETURN` ledger row.
  - [ ] If `CANCELLED` or `DELIVERED`, leave stock unchanged.

- [ ] **6. Address Default Exclusivity (`/api/v1/customer/addresses`)**
  - [ ] Wrap default address changes in a transaction (`tx.address.updateMany({ isDefault: false })` before setting `isDefault: true`).

- [ ] **7. Cart & Pricing Policy**
  - [ ] Verify `POST /api/v1/cart/merge` correctly associates guest cart items with user cart upon authentication.
  - [ ] Ensure shipping fee is flat ₹150 and tax is ₹0 on checkout summary calculations.

---

## 7. Frontend Resilience Guarantee

Even before your backend friend deploys these updates:
1. **Graceful Degradation:** The frontend includes smart local storage mirrors and mock fallbacks so that testing, demonstrations, and development continue without crashes.
2. **Reverse Proxy Safety:** The Next.js API proxy (`/api/v1/*`) actively catches errors, strips unsafe query string parameters, cleans multipart form payloads, and maintains synchronization between client and server tokens.
