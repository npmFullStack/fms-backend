import express from "express";
import {
  addContainer,
  getLineContainers,
  getContainer,
  editContainer,
  removeContainer
} from "../controllers/containerController.js";

const router = express.Router();

router.post("/", addContainer);
router.get("/line/:shippingLineId", getLineContainers);
router.get("/:id", getContainer);
router.put("/:id", editContainer);
router.delete("/:id", removeContainer);

export default router;
