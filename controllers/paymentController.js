// controllers/paymentController.js
import { Payment } from "../models/Payment.js";
import { createPaymentIntent } from "../utils/paymongoService.js";

export const createPayment = async (req, res) => {
  try {
    const { booking_id, amount, method } = req.body;

    // 1. Create payment intent in PayMongo
    const intent = await createPaymentIntent(amount);

    // 2. Save in local DB
    const payment = await Payment.create({
      booking_id,
      intent_id: intent.id,
      amount,
      method,
      currency: "PHP",
    });

    res.json({
      success: true,
      message: "Payment intent created",
      data: {
        payment,
        client_key: intent.attributes.client_key, // use this client key in frontend
      },
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentsByBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const payments = await Payment.getByBooking(booking_id);
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error("Fetch payments error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch payments" });
  }
};
