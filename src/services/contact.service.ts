import { getApiBaseUrl } from "@/services/apiConfig";

export interface ContactInquiryPayload {
  name: string; // 2-100 chars
  email: string; // valid email
  phone?: string; // optional, max 25 chars
  subject: string; // 3-200 chars
  message: string; // 10-3000 chars
}

export interface ContactInquiryResponse {
  success: boolean;
  message: string;
  data?: {
    inquiry: {
      id: string;
      name: string;
      email: string;
      subject: string;
      createdAt: string;
    };
  };
  error?: {
    code?: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export class ContactService {
  /**
   * Submit Contact Concierge / Support Inquiry
   * POST /api/v1/contact
   */
  static async submitInquiry(
    payload: ContactInquiryPayload
  ): Promise<ContactInquiryResponse> {
    const baseUrl = getApiBaseUrl();

    try {
      const res = await fetch(`${baseUrl}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name.trim(),
          email: payload.email.toLowerCase().trim(),
          phone: payload.phone?.trim() || undefined,
          subject: payload.subject.trim(),
          message: payload.message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        return {
          success: true,
          message:
            data.message ||
            "Thank you for reaching out. Our concierge team has received your message and will respond shortly.",
          data: data.data,
        };
      }

      return {
        success: false,
        message:
          data.message ||
          "Failed to submit inquiry. Please review your details and try again.",
        error: data.error,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Network error. Please try again later.",
      };
    }
  }
}
