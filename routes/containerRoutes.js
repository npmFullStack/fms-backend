import express from "express";
import {
    addContainer,
    getLineContainers,
    getAvailableContainers,
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
router.get("/available-containers/:shipping_line_id", getAvailableContainers);

export default router;
