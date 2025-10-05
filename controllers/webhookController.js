// controllers/webhookController.js
import crypto from "crypto";
import { pool } from "../db/index.js";
import dotenv from "dotenv";

dotenv.config();

// OPTIONAL: if you want to verify the webhook signature
const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET;

export const handlePaymongoWebhook = async (req, res) => {
  try {
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature (optional but recommended)
    if (PAYMONGO_WEBHOOK_SECRET) {
      const signatureHeader = req.headers["paymongo-signature"];
      if (!signatureHeader) {
        return res.status(401).send("Missing signature header");
      }

      const [timestamp, signature] = signatureHeader.split(",");
      const hmac = crypto.createHmac("sha256", PAYMONGO_WEBHOOK_SECRET);
      hmac.update(`${timestamp}.${rawBody}`);
      const expected = hmac.digest("hex");

      if (expected !== signature) {
        console.error("Webhook signature mismatch");
        return res.status(401).send("Invalid signature");
      }
    }

    const event = req.body.data.attributes;
    const type = req.body.data.type;

    // ✅ Check for payment success
    if (type === "payment.paid") {
      const paymentData = event.data.attributes;

      const intentId = paymentData.payment_intent_id;
      const amount = paymentData.amount / 100;
      const reference = paymentData.reference_number;

      console.log("✅ Payment success received from PayMongo");

      // Update local DB
      const result = await pool.query(
        `
        UPDATE paymongo_payments
        SET status = 'SUCCEEDED', reference_number = $1, updated_at = NOW()
        WHERE paymongo_payment_intent_id = $2
        RETURNING booking_id;
        `,
        [reference, intentId]
      );

      if (result.rows.length > 0) {
        const { booking_id } = result.rows[0];

        // Update booking payment status
        await pool.query(
          `
          UPDATE bookings
          SET payment_status = 'PAID', updated_at = NOW()
          WHERE id = $1;
          `,
          [booking_id]
        );
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};
