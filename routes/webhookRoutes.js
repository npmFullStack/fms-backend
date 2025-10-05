// routes/webhookRoutes.js
import express from "express";
import { handlePaymongoWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// Raw body parsing middleware
router.post(
  "/paymongo",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    try {
      req.body = JSON.parse(req.body.toString("utf8"));
      next();
    } catch (err) {
      console.error("Webhook body parse error:", err);
      return res.status(400).send("Invalid JSON");
    }
  },
  handlePaymongoWebhook
);

export default router;
