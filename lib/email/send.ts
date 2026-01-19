import { resend, EMAIL_FROM, getAdminEmails } from "./resend";
import { WelcomeEmail } from "./templates/welcome";
import { BusinessRegisteredEmail } from "./templates/business-registered";
import { BusinessVerifiedEmail } from "./templates/business-verified";
import { BusinessRejectedEmail } from "./templates/business-rejected";
import { AdminNewBusinessEmail } from "./templates/admin-new-business";

// Email types
export type EmailType =
  | "welcome"
  | "business-registered"
  | "business-verified"
  | "business-rejected"
  | "admin-new-business";

// Email payload types
export interface WelcomeEmailPayload {
  type: "welcome";
  to: string;
  userName?: string;
  locale?: string;
}

export interface BusinessRegisteredEmailPayload {
  type: "business-registered";
  to: string;
  businessName: string;
  ownerName?: string;
  category: string;
  country: string;
  locale?: string;
}

export interface BusinessVerifiedEmailPayload {
  type: "business-verified";
  to: string;
  businessName: string;
  ownerName?: string;
  locale?: string;
}

export interface BusinessRejectedEmailPayload {
  type: "business-rejected";
  to: string;
  businessName: string;
  ownerName?: string;
  locale?: string;
}

export interface AdminNewBusinessEmailPayload {
  type: "admin-new-business";
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  category: string;
  country: string;
  city?: string;
}

export type EmailPayload =
  | WelcomeEmailPayload
  | BusinessRegisteredEmailPayload
  | BusinessVerifiedEmailPayload
  | BusinessRejectedEmailPayload
  | AdminNewBusinessEmailPayload;

// Email subjects by type and locale
const subjects: Record<EmailType, Record<string, string>> = {
  welcome: {
    en: "Welcome to AfriConnect!",
    am: "እንኳን ደህና መጡ ወደ AfriConnect!",
    sw: "Karibu AfriConnect!",
  },
  "business-registered": {
    en: "Business Registration Received",
    am: "የንግድ ምዝገባ ተቀብሏል",
    sw: "Usajili wa Biashara Umepokelewa",
  },
  "business-verified": {
    en: "Your Business is Verified!",
    am: "ንግድዎ ተረጋግጧል!",
    sw: "Biashara Yako Imethibitishwa!",
  },
  "business-rejected": {
    en: "Business Registration Update Required",
    am: "የንግድ ምዝገባ ማዘመን ያስፈልጋል",
    sw: "Sasisho la Usajili wa Biashara Linahitajika",
  },
  "admin-new-business": {
    en: "New Business Registration",
    am: "New Business Registration",
    sw: "New Business Registration",
  },
};

function getSubject(type: EmailType, locale: string = "en"): string {
  return subjects[type][locale] || subjects[type]["en"];
}

// Send email function
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    switch (payload.type) {
      case "welcome": {
        const { to, userName, locale = "en" } = payload;
        const { error } = await resend.emails.send({
          from: EMAIL_FROM,
          to,
          subject: getSubject("welcome", locale),
          react: WelcomeEmail({ userName, locale }),
        });
        if (error) throw new Error(error.message);
        break;
      }

      case "business-registered": {
        const { to, businessName, ownerName, category, country, locale = "en" } = payload;
        const { error } = await resend.emails.send({
          from: EMAIL_FROM,
          to,
          subject: getSubject("business-registered", locale),
          react: BusinessRegisteredEmail({ businessName, ownerName, category, country, locale }),
        });
        if (error) throw new Error(error.message);
        break;
      }

      case "business-verified": {
        const { to, businessName, ownerName, locale = "en" } = payload;
        const { error } = await resend.emails.send({
          from: EMAIL_FROM,
          to,
          subject: getSubject("business-verified", locale),
          react: BusinessVerifiedEmail({ businessName, ownerName, locale }),
        });
        if (error) throw new Error(error.message);
        break;
      }

      case "business-rejected": {
        const { to, businessName, ownerName, locale = "en" } = payload;
        const { error } = await resend.emails.send({
          from: EMAIL_FROM,
          to,
          subject: getSubject("business-rejected", locale),
          react: BusinessRejectedEmail({ businessName, ownerName, locale }),
        });
        if (error) throw new Error(error.message);
        break;
      }

      case "admin-new-business": {
        const { businessName, ownerName, ownerEmail, category, country, city } = payload;
        const adminEmails = getAdminEmails();
        
        if (adminEmails.length === 0) {
          console.warn("No admin emails configured for notifications");
          return { success: true }; // Don't fail if no admins configured
        }

        const { error } = await resend.emails.send({
          from: EMAIL_FROM,
          to: adminEmails,
          subject: `${getSubject("admin-new-business", "en")}: ${businessName}`,
          react: AdminNewBusinessEmail({ businessName, ownerName, ownerEmail, category, country, city }),
        });
        if (error) throw new Error(error.message);
        break;
      }

      default:
        throw new Error(`Unknown email type`);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

// Convenience functions
export async function sendWelcomeEmail(
  to: string,
  userName?: string,
  locale?: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({ type: "welcome", to, userName, locale });
}

export async function sendBusinessRegisteredEmail(
  to: string,
  businessName: string,
  category: string,
  country: string,
  ownerName?: string,
  locale?: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    type: "business-registered",
    to,
    businessName,
    ownerName,
    category,
    country,
    locale,
  });
}

export async function sendBusinessVerifiedEmail(
  to: string,
  businessName: string,
  ownerName?: string,
  locale?: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    type: "business-verified",
    to,
    businessName,
    ownerName,
    locale,
  });
}

export async function sendBusinessRejectedEmail(
  to: string,
  businessName: string,
  ownerName?: string,
  locale?: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    type: "business-rejected",
    to,
    businessName,
    ownerName,
    locale,
  });
}

export async function sendAdminNewBusinessEmail(
  businessName: string,
  ownerName: string,
  ownerEmail: string,
  category: string,
  country: string,
  city?: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    type: "admin-new-business",
    businessName,
    ownerName,
    ownerEmail,
    category,
    country,
    city,
  });
}
