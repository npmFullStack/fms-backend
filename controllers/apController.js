// controllers/apController.js
import AccountsPayable from "../models/AccountsPayable.js";
import { notifyMultipleRoles, getUserFullName } from "../utils/notificationService.js";

// Get all AP summaries
export const getAllAP = async (_req, res) => {
    try {
        const apSummaries = await AccountsPayable.getAll();
        res.json({ apSummaries });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get AP by ID
export const getAPById = async (req, res) => {
    try {
        const apSummary = await AccountsPayable.getById(req.params.id);
        if (!apSummary) {
            return res.status(404).json({ error: "Accounts Payable record not found" });
        }
        res.json({ apSummary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get AP by booking ID
export const getAPByBookingId = async (req, res) => {
    try {
        const apSummary = await AccountsPayable.getByBookingId(req.params.bookingId);
        if (!apSummary) {
            return res.status(404).json({ error: "Accounts Payable record not found for this booking" });
        }
        res.json({ apSummary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get AP by booking number
export const getAPByBookingNumber = async (req, res) => {
    try {
        const apSummary = await AccountsPayable.getByBookingNumber(req.params.bookingNumber);
        if (!apSummary) {
            return res.status(404).json({ error: "Accounts Payable record not found for this booking number" });
        }
        res.json({ apSummary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create AP record
export const createAP = async (req, res) => {
    try {
        const { bookingId } = req.body;

        const apRecord = await AccountsPayable.create(bookingId);

        const fullName = await getUserFullName(req.user?.id);

        await notifyMultipleRoles(["admin_finance", "general_manager"], {
            title: "New Accounts Payable Created",
            message: `${fullName} created a new accounts payable record for booking #${apRecord.booking_number}.`,
            type: "accounts_payable",
            entity_type: "accounts_payable",
            entity_id: apRecord.id,
        });

        res.status(201).json({
            message: "Accounts Payable record created successfully",
            apRecord,
        });
    } catch (err) {
        res.status(400).json({
            message: "Failed to create Accounts Payable record",
            error: err.message,
        });
    }
};

// ==================== FREIGHT ====================

export const addFreight = async (req, res) => {
    try {
        const { apId } = req.params;
        const { amount, checkDate, voucher } = req.body;

        const freight = await AccountsPayable.addFreight(apId, amount, checkDate, voucher);

        const fullName = await getUserFullName(req.user?.id);

        await notifyMultipleRoles(["admin_finance", "general_manager"], {
            title: "Freight Charge Added",
            message: `${fullName} added a freight charge of ₱${amount} to AP record.`,
            type: "accounts_payable",
            entity_type: "accounts_payable",
            entity_id: apId,
        });

        res.status(201).json({
            message: "Freight charge added successfully",
            freight,
        });
    } catch (err) {
        res.status(400).json({
            message: "Failed to add freight charge",
            error: err.message,
        });
    }
};

export const updateFreight = async (req, res) => {
    try {
        const { freightId } = req.params;
        const { amount, checkDate, voucher } = req.body;

        const freight = await AccountsPayable.updateFreight(freightId, amount, checkDate, voucher);

        const fullName = await getUserFullName(req.user?.id);

        await notifyMultipleRoles(["admin_finance", "general_manager"], {
            title: "Freight Charge Updated",
            message: `${fullName} updated a freight charge to ₱${amount}.`,
            type: "accounts_payable",
            entity_type: "accounts_payable",
            entity_id: freight.ap_id,
        });

        res.json({
            message: "Freight charge updated successfully",
            freight,
        });
    } catch (err) {
        res.status(400).json({
            message: "Failed to update freight charge",
            error: err.message,
        });
    }
};

// ==================== TRUCKING ====================

export const addTrucking = async (req, res) => {
    try {
        const { apId } = req.params;
        const { type, amount, checkDate, voucher } = req.body;

        const trucking = await AccountsPayable.addTrucking(apId, type, amount, checkDate, voucher);

        const fullName = await getUserFullName(req.user?.id);

        await notifyMultipleRoles(["admin_finance", "general_manager"], {
            title: "Trucking Charge Added",
            message: `${fullName} added a ${type} trucking charge of ₱${amount}.`,
            type: "accounts_payable",
            entity_type: "accounts_payable",
            entity_id: apId,
        });

        res.status(201).json({
            message: "Trucking charge added successfully",
            trucking,
        });
    } catch (err) {
        res.status(400).json({
            message: "Failed to add trucking charge",
            error: err.message,
        });
    }
};

export const updateTrucking = async (req, res) => {
    try {
        const { truckingId } = req.params;
        const { amount, checkDate, voucher } = req.body;

        const trucking = await AccountsPayable.updateTrucking(truckingId, amount, checkDate, voucher);

        const fullName = await getUserFullName(req.user?.id);

        await notifyMultipleRoles(["admin_finance", "general_manager"], {
            title: "Trucking Charge Updated",
            message: `${fullName} updated a trucking charge to ₱${amount}.`,
            type: "accounts_payable",
            entity_type: "accounts_payable",
            entity_id: trucking.ap_id,
        });

        res.json({
            message: "Trucking charge updated successfully",
            trucking,
        });
    } catch (err) {
        res.status(400).json({
            message: "Failed to update trucking charge",
            error: err.message,
        });
    }
};

// ==================== PORT CHARGES ====================

export const addPortCharge = async (req, res) => {
    try {
        const { apId } = req.params;
        const { chargeType, payee, amount, checkDate, voucher } = req.body;

        const portCharge = await AccountsPayable.addPortCharge(apId, chargeType, payee, amount, checkDate, voucher);

        const fullName = await getUserFullName(req.user?.id);

        await notifyMultipleRoles(["admin_finance", "general_manager"], {
            title: "Port Charge Added",
            message: `${fullName} added a ${chargeType} port charge of ₱${amount}.`,
            type: "accounts_payable",
            entity_type: "accounts_payable",
            entity_id: apId,
        });

        res.status(201).json({
            message: "Port charge added successfully",
            portCharge,
        });
    } catch (err) {
        res.status(400).json({
            message: "Failed to add port charge",
            error: err.message,
        });
    }
};

export const updatePortCharge = async (req, res) => {
    try {
        const { portChargeId } = req.params;
        const { payee, amount, checkDate, voucher } = req.body;

        const portCharge = await AccountsPayable.updatePortCharge(portChargeId, payee, amount, checkDate, voucher);

        const fullName = await getUserFullName(req.user?.id);

        await notifyMultipleRoles(["admin_finance", "general_manager"], {
            title: "Port Charge Updated",
            message: `${fullName} updated a port charge to ₱${amount}.`,
            type: "accounts_payable",
            entity_type: "accounts_payable",
            entity_id: portCharge.ap_id,
        });

        res.json({
            message: "Port charge updated successfully",
            portCharge,
        });
    } catch (err) {
        res.status(400).json({
            message: "Failed to update port charge",
            error: err.message,
        });
    }
};

// ==================== MISC CHARGES ====================

export const addMiscCharge = async (req, res) => {
    try {
        const { apId } = req.params;
        const { chargeType, payee, amount, checkDate, voucher } = req.body;

        const miscCharge = await AccountsPayable.addMiscCharge(apId, chargeType, payee, amount, checkDate, voucher);

        const fullName = await getUserFullName(req.user?.id);

        await notifyMultipleRoles(["admin_finance", "general_manager"], {
            title: "Misc Charge Added",
            message: `${fullName} added a ${chargeType} misc charge of ₱${amount}.`,
            type: "accounts_payable",
            entity_type: "accounts_payable",
            entity_id: apId,
        });

        res.status(201).json({
            message: "Misc charge added successfully",
            miscCharge,
        });
    } catch (err) {
        res.status(400).json({
            message: "Failed to add misc charge",
            error: err.message,
        });
    }
};

export const updateMiscCharge = async (req, res) => {
    try {
        const { miscChargeId } = req.params;
        const { payee, amount, checkDate, voucher } = req.body;

        const miscCharge = await AccountsPayable.updateMiscCharge(miscChargeId, payee, amount, checkDate, voucher);

        const fullName = await getUserFullName(req.user?.id);

        await notifyMultipleRoles(["admin_finance", "general_manager"], {
            title: "Misc Charge Updated",
            message: `${fullName} updated a misc charge to ₱${amount}.`,
            type: "accounts_payable",
            entity_type: "accounts_payable",
            entity_id: miscCharge.ap_id,
        });

        res.json({
            message: "Misc charge updated successfully",
            miscCharge,
        });
    } catch (err) {
        res.status(400).json({
            message: "Failed to update misc charge",
            error: err.message,
        });
    }
};