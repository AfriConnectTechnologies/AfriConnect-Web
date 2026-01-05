// Chapa Payment Gateway Integration
// Documentation: https://developer.chapa.co/

const CHAPA_BASE_URL = "https://api.chapa.co/v1";

interface ChapaInitializePayload {
  amount: string;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  meta?: Record<string, string>;
}

interface ChapaInitializeResponse {
  message: string;
  status: string;
  data: {
    checkout_url: string;
  };
}

interface ChapaVerifyResponse {
  message: string;
  status: string;
  data: {
    first_name: string;
    last_name: string;
    email: string;
    currency: string;
    amount: number;
    charge: number;
    mode: string;
    method: string;
    type: string;
    status: string;
    reference: string;
    tx_ref: string;
    customization: {
      title: string;
      description: string;
      logo: string;
    };
    meta: Record<string, string> | null;
    created_at: string;
    updated_at: string;
  };
}

export class ChapaError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "ChapaError";
  }
}

function getSecretKey(): string {
  const key = process.env.CHAPA_TEST_SECRET_KEY || process.env.CHAPA_SECRET_KEY;
  if (!key) {
    throw new ChapaError("Chapa secret key is not configured");
  }
  return key;
}

/**
 * Initialize a payment transaction with Chapa
 */
export async function initializePayment(
  payload: ChapaInitializePayload
): Promise<ChapaInitializeResponse> {
  const secretKey = getSecretKey();

  const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || data.status !== "success") {
    let errorMessage = "Failed to initialize payment";
    if (data.message) {
      errorMessage = typeof data.message === "string" 
        ? data.message 
        : JSON.stringify(data.message);
    } else if (data.errors) {
      errorMessage = Array.isArray(data.errors) 
        ? data.errors.join(", ")
        : typeof data.errors === "object"
          ? Object.entries(data.errors).map(([k, v]) => `${k}: ${v}`).join(", ")
          : String(data.errors);
    }
    
    console.error("Chapa initialization failed:", JSON.stringify(data, null, 2));
    
    throw new ChapaError(
      errorMessage,
      response.status,
      data
    );
  }

  return data as ChapaInitializeResponse;
}

/**
 * Verify a payment transaction
 */
export async function verifyPayment(
  txRef: string
): Promise<ChapaVerifyResponse> {
  const secretKey = getSecretKey();

  const response = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${txRef}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ChapaError(
      data.message || "Failed to verify payment",
      response.status,
      data
    );
  }

  return data as ChapaVerifyResponse;
}

/**
 * Get the list of supported banks for direct bank transfer
 */
export async function getBanks(): Promise<unknown> {
  const secretKey = getSecretKey();

  const response = await fetch(`${CHAPA_BASE_URL}/banks`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ChapaError(
      data.message || "Failed to fetch banks",
      response.status,
      data
    );
  }

  return data;
}

/**
 * Generate callback and return URLs
 */
export function getPaymentUrls(baseUrl: string, txRef: string) {
  return {
    callback_url: `${baseUrl}/api/payments/webhook`,
    return_url: `${baseUrl}/payment/complete?tx_ref=${txRef}`,
  };
}

