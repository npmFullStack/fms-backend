import express from "express";
import {
  addContainer,
  getLineContainers,
  getAllLineContainers,
  getAvailableContainers,
  getContainer,
  editContainer,
  removeContainer
} from "../controllers/containerController.js";

const router = express.Router();

router.post("/", addContainer);
router.get("/line/:shippingLineId", getLineContainers); // Only returned containers (for booking)
router.get("/line/:shippingLineId/all", getAllLineContainers); // ALL containers (for management)
router.get("/:id", getContainer);
router.put("/:id", editContainer);
router.delete("/:id", removeContainer);
router.get("/available-containers/:shipping_line_id", getAvailableContainers);

export default router;