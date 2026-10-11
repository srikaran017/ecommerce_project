import { getApiBaseUrl } from "@/services/apiConfig";
import { AuthService } from "@/services/auth.service";
import { AdminOrder } from "@/types/admin.types";

export interface AccountDetails {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  phone?: string | null;
  role?: string;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerProfile {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  genderPreference?: "WOMENSWEAR" | "MENSWEAR" | "ALL";
  membershipTier?: "MEMBER" | "PRIVILEGE" | "VIP_COUTURE";
  createdAt?: string;
}

export interface UpdateAccountPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface CustomerAddress {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  company?: string | null;
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string | null;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Compatibility aliases
  addressLine1?: string;
  addressLine2?: string | null;
  street?: string;
  apartment?: string | null;
  phone?: string | null;
  tag?: "Home" | "Work" | "Other";
}

export interface CreateAddressPayload {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phoneNumber?: string;
  isDefault?: boolean;
}

export interface CustomerPreferences {
  orderSms: boolean;
  preSaleAccess: boolean;
  newsletter: boolean;
  whatsappUpdates: boolean;
  twoFactorEnabled: boolean;
  currency: string;
  language: string;
}

export interface OrderTrackingStage {
  key: "PLACED" | "CONFIRMED" | "DISPATCHED" | "OUT_FOR_DELIVERY" | "DELIVERED";
  label: string;
  description: string;
  timestamp: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface OrderTrackingDetails {
  orderId: string;
  orderNumber: string;
  status: string;
  carrierName: string;
  trackingNumber: string;
  trackingUrl: string;
  estimatedDeliveryDate: string;
  stages: OrderTrackingStage[];
  shippingAddress?: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
  };
}

const STORAGE_KEYS = {
  ADDRESSES: "customer_saved_addresses_v2",
  LEGACY_ADDRESS: "customer_saved_address",
  PREFERENCES: "customer_account_preferences",
  PROFILE_EXTRA: "customer_profile_extra",
};

function normalizeAddress(raw: any): CustomerAddress {
  const line1 = raw.address1 || raw.addressLine1 || raw.street || "";
  const line2 = raw.address2 || raw.addressLine2 || raw.apartment || "";
  const phone = raw.phoneNumber || raw.phone || "";

  return {
    id: raw.id || `addr_${Date.now()}`,
    userId: raw.userId,
    firstName: raw.firstName || "",
    lastName: raw.lastName || "",
    company: raw.company || "",
    address1: line1,
    address2: line2,
    city: raw.city || "",
    state: raw.state || "",
    postalCode: raw.postalCode || raw.pincode || "",
    country: raw.country || "India",
    phoneNumber: phone,
    isDefault: !!raw.isDefault,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    // Aliases
    addressLine1: line1,
    addressLine2: line2,
    street: line1,
    apartment: line2,
    phone,
    tag: raw.tag || "Home",
  };
}

export class CustomerService {
  private static getHeaders() {
    const token = AuthService.getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  // ==========================================
  // 1. ACCOUNT DETAILS & PROFILE APIS
  // ==========================================

  /**
   * GET /api/v1/customer/account
   * Retrieves authenticated customer account information
   */
  static async getAccountDetails(): Promise<{ success: boolean; data?: AccountDetails; message?: string }> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/customer/account`, {
        headers: this.getHeaders(),
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success && json.data?.account) {
        return {
          success: true,
          data: json.data.account,
          message: json.message,
        };
      }

      if (res.status === 401) {
        return { success: false, message: "Authentication required. Please log in." };
      }

      return { success: false, message: json.message || "Failed to load account details" };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to reach backend service" };
    }
  }

  /**
   * Alias for backward compatibility with ProfileTab
   */
  static async getProfile(): Promise<CustomerProfile | null> {
    const acc = await this.getAccountDetails();
    if (acc.success && acc.data) {
      return {
        id: acc.data.id,
        name: acc.data.name,
        firstName: acc.data.firstName,
        lastName: acc.data.lastName,
        email: acc.data.email,
        phone: acc.data.phone || acc.data.phoneNumber || undefined,
        phoneNumber: acc.data.phoneNumber || acc.data.phone || undefined,
        avatarUrl: acc.data.avatarUrl || undefined,
      };
    }

    if (typeof window !== "undefined") {
      try {
        const extraRaw = localStorage.getItem(STORAGE_KEYS.PROFILE_EXTRA);
        return extraRaw ? JSON.parse(extraRaw) : null;
      } catch {}
    }
    return null;
  }

  /**
   * PATCH /api/v1/customer/account
   * Updates customer profile: firstName, lastName, email, phoneNumber
   */
  static async updateAccountDetails(
    payload: UpdateAccountPayload
  ): Promise<{ success: boolean; data?: AccountDetails; message: string; error?: any }> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/customer/account`, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify({
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          email: payload.email.trim().toLowerCase(),
          phoneNumber: payload.phoneNumber?.trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        return {
          success: true,
          data: json.data?.account,
          message: json.message || "Account details updated successfully",
        };
      }

      return {
        success: false,
        message: json.message || "Failed to update account details",
        error: json.error,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Network error while saving account details",
      };
    }
  }

  /**
   * Alias for backward compatibility with ProfileTab
   */
  static async updateProfile(payload: Partial<CustomerProfile>): Promise<{ success: boolean; message: string; data?: CustomerProfile }> {
    const firstName = payload.firstName || payload.name?.split(" ")[0] || "Valued";
    const lastName = payload.lastName || payload.name?.split(" ").slice(1).join(" ") || "Client";
    const email = payload.email || "";
    const phoneNumber = payload.phoneNumber || payload.phone || "";

    const res = await this.updateAccountDetails({
      firstName,
      lastName,
      email,
      phoneNumber,
    });

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE_EXTRA, JSON.stringify(payload));
      } catch {}
    }

    return {
      success: res.success,
      message: res.message,
      data: payload as CustomerProfile,
    };
  }

  /**
   * PATCH /api/v1/customer/account/password
   * Changes customer password after verifying current password
   */
  static async changePassword(
    payload: ChangePasswordPayload
  ): Promise<{ success: boolean; message: string; error?: any }> {
    if (!payload.currentPassword) {
      return { success: false, message: "Current password is required" };
    }
    if (!payload.newPassword || payload.newPassword.length < 8) {
      return { success: false, message: "Password must be at least 8 characters long" };
    }
    if (payload.currentPassword === payload.newPassword) {
      return { success: false, message: "New password must be different from current password" };
    }

    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/customer/account/password`, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify({
          currentPassword: payload.currentPassword,
          newPassword: payload.newPassword,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        return {
          success: true,
          message: json.message || "Password changed successfully. Please log in again with your new password.",
        };
      }

      return {
        success: false,
        message: json.message || "Failed to change password",
        error: json.error,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Network error while changing password",
      };
    }
  }

  // ==========================================
  // 2. ADDRESSES CRUD API (PHASE 2 LIVE)
  // ==========================================

  /**
   * GET /api/v1/customer/addresses
   * Retrieves all saved addresses for the authenticated customer
   */
  static async getAddresses(): Promise<CustomerAddress[]> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/customer/addresses`, {
        headers: this.getHeaders(),
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success && Array.isArray(json.data?.addresses)) {
        const normalized = json.data.addresses.map(normalizeAddress);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(normalized));
          const defaultAddr = normalized.find((a: CustomerAddress) => a.isDefault) || normalized[0];
          if (defaultAddr) {
            localStorage.setItem(
              STORAGE_KEYS.LEGACY_ADDRESS,
              JSON.stringify({
                firstName: defaultAddr.firstName,
                lastName: defaultAddr.lastName,
                street: defaultAddr.address1,
                apartment: defaultAddr.address2,
                city: defaultAddr.city,
                state: defaultAddr.state,
                postalCode: defaultAddr.postalCode,
                country: defaultAddr.country,
                phone: defaultAddr.phoneNumber,
              })
            );
          }
        }
        return normalized;
      }
    } catch (err) {
      console.warn("Failed to fetch addresses from backend, falling back to local storage:", err);
    }

    return this.getStoredAddresses();
  }

  /**
   * Local storage fallback
   */
  static getStoredAddresses(): CustomerAddress[] {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.ADDRESSES);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list) && list.length > 0) return list.map(normalizeAddress);
        }

        const legRaw = localStorage.getItem(STORAGE_KEYS.LEGACY_ADDRESS);
        if (legRaw) {
          const leg = JSON.parse(legRaw);
          if (leg.street || leg.address1) {
            const migrated = normalizeAddress({
              id: "addr_1",
              firstName: leg.firstName || "Valued",
              lastName: leg.lastName || "Client",
              address1: leg.address1 || leg.street || "102, Skyline Residency, Linking Road",
              address2: leg.address2 || leg.apartment || "",
              city: leg.city || "Mumbai",
              state: leg.state || "Maharashtra",
              postalCode: leg.postalCode || "400050",
              country: leg.country || "India",
              phoneNumber: leg.phoneNumber || leg.phone || "+91 98765 00002",
              isDefault: true,
            });
            localStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify([migrated]));
            return [migrated];
          }
        }
      } catch {}
    }

    return [];
  }

  /**
   * POST /api/v1/customer/addresses or PATCH /api/v1/customer/addresses/:id
   * Creates or updates a delivery address
   */
  static async saveAddress(
    address: Partial<CustomerAddress>
  ): Promise<{ success: boolean; data: CustomerAddress[]; message: string; error?: any }> {
    const baseUrl = getApiBaseUrl();
    const isEdit = !!address.id && !address.id.startsWith("addr_local_");
    const endpoint = isEdit
      ? `${baseUrl}/customer/addresses/${address.id}`
      : `${baseUrl}/customer/addresses`;

    const line1 = address.address1 || address.addressLine1 || address.street || "";
    const line2 = address.address2 || address.addressLine2 || address.apartment || "";
    const phone = address.phoneNumber || address.phone || "";

    const payload: CreateAddressPayload = {
      firstName: address.firstName?.trim() || "",
      lastName: address.lastName?.trim() || "",
      company: address.company?.trim() || undefined,
      address1: line1.trim(),
      address2: line2.trim() || undefined,
      city: address.city?.trim() || "",
      state: address.state?.trim() || "",
      country: address.country?.trim() || "India",
      postalCode: (address.postalCode || "").trim(),
      phoneNumber: phone.trim() || undefined,
      isDefault: address.isDefault,
    };

    try {
      const res = await fetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        // Refresh list from server
        const freshList = await this.getAddresses();
        return {
          success: true,
          data: freshList,
          message: json.message || (isEdit ? "Address updated successfully" : "Address created successfully"),
        };
      }

      if (json.message) {
        return {
          success: false,
          data: this.getStoredAddresses(),
          message: json.message,
          error: json.error,
        };
      }
    } catch (err: any) {
      console.warn("Backend address mutation failed, applying local fallback:", err);
    }

    // Local fallback persistence
    const currentList = this.getStoredAddresses();
    const targetId = address.id || `addr_local_${Date.now()}`;
    const newRecord = normalizeAddress({
      ...address,
      id: targetId,
      address1: line1,
      address2: line2,
      phoneNumber: phone,
      isDefault: address.isDefault ?? (currentList.length === 0),
    });

    let updatedList: CustomerAddress[];
    if (isEdit) {
      updatedList = currentList.map((a) => (a.id === targetId ? newRecord : a));
    } else {
      updatedList = [newRecord, ...currentList];
    }

    if (newRecord.isDefault) {
      updatedList = updatedList.map((a) => ({
        ...a,
        isDefault: a.id === targetId,
      }));
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(updatedList));
      } catch {}
    }

    return {
      success: true,
      data: updatedList,
      message: isEdit ? "Address updated successfully." : "Address created successfully.",
    };
  }

  /**
   * DELETE /api/v1/customer/addresses/:addressId
   * Deletes an address
   */
  static async deleteAddress(id: string): Promise<{ success: boolean; data: CustomerAddress[]; message: string }> {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/customer/addresses/${id}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        const freshList = await this.getAddresses();
        return {
          success: true,
          data: freshList,
          message: json.message || "Address deleted successfully",
        };
      }
    } catch (err) {
      console.warn("Backend address deletion failed, applying local fallback:", err);
    }

    const currentList = this.getStoredAddresses();
    let updatedList = currentList.filter((a) => a.id !== id);
    if (updatedList.length > 0 && !updatedList.some((a) => a.isDefault)) {
      updatedList[0].isDefault = true;
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(updatedList));
      } catch {}
    }

    return { success: true, data: updatedList, message: "Address deleted successfully." };
  }

  /**
   * Sets default address via PATCH /api/v1/customer/addresses/:addressId { isDefault: true }
   */
  static async setDefaultAddress(id: string): Promise<{ success: boolean; data: CustomerAddress[]; message: string }> {
    return this.saveAddress({ id, isDefault: true });
  }

  // ==========================================
  // 3. PREFERENCES
  // ==========================================

  static getPreferences(): CustomerPreferences {
    const defaults: CustomerPreferences = {
      orderSms: true,
      preSaleAccess: true,
      newsletter: true,
      whatsappUpdates: false,
      twoFactorEnabled: false,
      currency: "INR",
      language: "en-IN",
    };

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
        if (raw) return { ...defaults, ...JSON.parse(raw) };
      } catch {}
    }
    return defaults;
  }

  static async savePreferences(prefs: Partial<CustomerPreferences>): Promise<{ success: boolean; data: CustomerPreferences; message: string }> {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
      } catch {}
    }

    return { success: true, data: updated, message: "Preferences saved successfully." };
  }

  // ==========================================
  // 4. ORDER TRACKING
  // ==========================================

  static getOrderTrackingDetails(order: AdminOrder): OrderTrackingDetails {
    const status = (order.status || "CONFIRMED").toUpperCase();
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();

    const seed = order.id ? order.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 100;
    const carriers = ["BlueDart Apex Luxury Express", "Delhivery Prime Logistics", "DHL Express Courier"];
    const carrierName = carriers[seed % carriers.length];
    const awbSuffix = Math.abs(seed * 73819).toString().slice(0, 9);
    const trackingNumber = `BLU-LUX${awbSuffix}`;

    const estDelivery = new Date(orderDate);
    estDelivery.setDate(estDelivery.getDate() + 4);
    const estDateFormatted = estDelivery.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const isDelivered = status === "DELIVERED";
    const isCancelled = status === "CANCELLED";
    const isShipped = status === "SHIPPED" || isDelivered;
    const isProcessing = status === "PROCESSING" || status === "CONFIRMED" || isShipped;

    const stages: OrderTrackingStage[] = [
      {
        key: "PLACED",
        label: "Order Placed",
        description: "Your bespoke garment order was successfully captured and verified.",
        timestamp:
          orderDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) +
          ", " +
          orderDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        isCompleted: true,
        isCurrent: status === "PENDING",
      },
      {
        key: "CONFIRMED",
        label: "Atelier Tailoring & Quality Check",
        description: "Artisans have inspected the weave, hand-steamed, and wrapped the garments in luxury dust-bags.",
        timestamp: isProcessing ? "Verified within 2 hours" : "Pending",
        isCompleted: isProcessing,
        isCurrent: status === "CONFIRMED" || status === "PROCESSING",
      },
      {
        key: "DISPATCHED",
        label: "Dispatched & In Transit",
        description: `Handed over to ${carrierName} under temperature-controlled transit.`,
        timestamp: isShipped ? "Dispatched from Mumbai Atelier Hub" : "Expected in 24-48 hrs",
        isCompleted: isShipped,
        isCurrent: status === "SHIPPED" && !isDelivered,
      },
      {
        key: "OUT_FOR_DELIVERY",
        label: "Out for White-Glove Delivery",
        description: "Dedicated courier associate is en route to your specified address.",
        timestamp: isDelivered ? "Delivered today" : isShipped ? "Scheduled for delivery morning" : "Pending transit",
        isCompleted: isDelivered,
        isCurrent: false,
      },
      {
        key: "DELIVERED",
        label: "Delivered to Client",
        description: isCancelled ? "Order was cancelled upon client request." : "Package securely received and signed for.",
        timestamp: isDelivered ? estDateFormatted : isCancelled ? "Cancelled" : `Estimated by ${estDateFormatted}`,
        isCompleted: isDelivered,
        isCurrent: isDelivered,
      },
    ];

    return {
      orderId: order.id,
      orderNumber: order.orderNumber || `#ORD-${order.id.slice(0, 8)}`,
      status,
      carrierName,
      trackingNumber,
      trackingUrl: `https://track.courier.in/?awb=${trackingNumber}`,
      estimatedDeliveryDate: estDateFormatted,
      stages,
      shippingAddress: {
        name: order.customerName,
        phone: order.customerPhone,
        street: order.notes && order.notes.includes("Street:") ? order.notes : undefined,
      },
    };
  }
}
