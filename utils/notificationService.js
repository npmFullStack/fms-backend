import Notification from "../models/Notification.js";

export class NotificationService {
  static async createBookingNotification(booking, user, action = 'created') {
    const title = `Booking ${action}`;
    const message = `Booking ${booking.booking_number} has been ${action} by ${user.first_name} ${user.last_name}`;
    
    // Notify relevant users (admins, managers, etc.)
    const adminUsers = await this.getAdminUsers();
    
    for (const adminUser of adminUsers) {
      await Notification.create({
        user_id: adminUser.id,
        title,
        message,
        type: 'booking',
        entity_type: 'booking',
        entity_id: booking.id
      });
    }
  }

  static async createShippingLineNotification(shippingLine, user, action = 'created') {
    const title = `Shipping Line ${action}`;
    const message = `Shipping Line "${shippingLine.name}" has been ${action} by ${user.first_name} ${user.last_name}`;
    
    const adminUsers = await this.getAdminUsers();
    
    for (const adminUser of adminUsers) {
      await Notification.create({
        user_id: adminUser.id,
        title,
        message,
        type: 'shipping_line',
        entity_type: 'shipping_line',
        entity_id: shippingLine.id
      });
    }
  }

  static async createShipNotification(ship, user, action = 'created') {
    const title = `Ship ${action}`;
    const message = `Ship "${ship.ship_name}" has been ${action} by ${user.first_name} ${user.last_name}`;
    
    const adminUsers = await this.getAdminUsers();
    
    for (const adminUser of adminUsers) {
      await Notification.create({
        user_id: adminUser.id,
        title,
        message,
        type: 'ship',
        entity_type: 'ship',
        entity_id: ship.id
      });
    }
  }

  static async createTruckingCompanyNotification(company, user, action = 'created') {
    const title = `Trucking Company ${action}`;
    const message = `Trucking Company "${company.name}" has been ${action} by ${user.first_name} ${user.last_name}`;
    
    const adminUsers = await this.getAdminUsers();
    
    for (const adminUser of adminUsers) {
      await Notification.create({
        user_id: adminUser.id,
        title,
        message,
        type: 'trucking_company',
        entity_type: 'trucking_company',
        entity_id: company.id
      });
    }
  }

  static async createTruckNotification(truck, user, action = 'created') {
    const title = `Truck ${action}`;
    const message = `Truck "${truck.name}" has been ${action} by ${user.first_name} ${user.last_name}`;
    
    const adminUsers = await this.getAdminUsers();
    
    for (const adminUser of adminUsers) {
      await Notification.create({
        user_id: adminUser.id,
        title,
        message,
        type: 'truck',
        entity_type: 'truck',
        entity_id: truck.id
      });
    }
  }

  static async createBookingStatusNotification(booking, oldStatus, newStatus, user) {
    const title = 'Booking Status Updated';
    const message = `Booking ${booking.booking_number} status changed from ${oldStatus} to ${newStatus}`;
    
    // Notify the booking owner and admins
    const usersToNotify = await this.getUsersToNotifyForBooking(booking.user_id);
    
    for (const userToNotify of usersToNotify) {
      await Notification.create({
        user_id: userToNotify.id,
        title,
        message,
        type: 'booking_status',
        entity_type: 'booking',
        entity_id: booking.id
      });
    }
  }

  static async getAdminUsers() {
    // This would query your database for admin users
    // For now, returning empty array - implement based on your user roles
    return [];
  }

  static async getUsersToNotifyForBooking(bookingUserId) {
    // This would query for users who should be notified about booking changes
    // For now, just return the booking user
    return [{ id: bookingUserId }];
  }
}