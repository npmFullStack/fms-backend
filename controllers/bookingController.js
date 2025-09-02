import { bookingSchema, bookingUpdateSchema, bookingStatusSchema } from "../schemas/bookingSchema.js";
import {
  createBooking as createBookingModel,
  getAllBookings,
  getBookingById,
  updateBooking as updateBookingModel,
  deleteBooking as deleteBookingModel,
  getBookingsByCustomerId,
  updateBookingStatus as updateBookingStatusModel
} from "../models/Booking.js";

export const createBooking = async (req, res) => {
  try {
    const validated = bookingSchema.parse(req.body);
    const booking = await createBookingModel(validated);
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getBookings = async (req, res) => {
  try {
    const bookings = await getAllBookings();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBooking = async (req, res) => {
  try {
    const booking = await getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const validated = bookingUpdateSchema.parse(req.body);
    
    const booking = await updateBookingModel(id, validated);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteBookingModel(id);
    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCustomerBookings = async (req, res) => {
  try {
    const { customerId } = req.params;
    const bookings = await getBookingsByCustomerId(customerId);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const validated = bookingStatusSchema.parse(req.body);
    const userId = req.user?.id; // Assuming you have user info in req.user
    
    const booking = await updateBookingStatusModel(id, validated.status, userId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};