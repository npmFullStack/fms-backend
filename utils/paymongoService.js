// utils/paymongoService.js
import dotenv from "dotenv";

dotenv.config();

const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET_KEY;
const BASE_URL = "https://api.paymongo.com/v1";

/**
 * Helper function to handle fetch responses cleanly
 */
async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    console.error("PayMongo API Error:", data);
    throw new Error(data?.errors?.[0]?.detail || "PayMongo API request failed");
  }
  return data.data;
}

/**
 * Create a new payment intent in PayMongo
 */
export const createPaymentIntent = async (amount, currency = "PHP") => {
  try {
    const body = JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100), // PayMongo expects cents
          currency,
          payment_method_allowed: ["gcash", "card"],
          capture_type: "automatic",
        },
      },
    });

    const response = await fetch(`${BASE_URL}/payment_intents`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body,
    });

    return await handleResponse(response);
  } catch (error) {
    console.error("PayMongo Intent Error:", error.message);
    throw new Error("Failed to create payment intent");
  }
};

/**
 * Attach a payment method to an existing intent
 */
export const attachPaymentMethod = async (intentId, paymentMethodId) => {
  try {
    const body = JSON.stringify({
      data: {
        attributes: {
          payment_method: paymentMethodId,
        },
      },
    });

    const response = await fetch(`${BASE_URL}/payment_intents/${intentId}/attach`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body,
    });

    return await handleResponse(response);
  } catch (error) {
    console.error("PayMongo Attach Error:", error.message);
    throw new Error("Failed to attach payment method");
  }
};
