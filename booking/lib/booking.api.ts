// import api from "./api";

// // Create booking
// export const createBooking = (data: any) =>
//   api.post("/bookings", data);

// // Get booking by ID
// export const getBookingById = (id: string) =>
//   api.get(`/bookings/${id}`);

// // Update booking
// export const updateBooking = (id: string, data: any) =>
//   api.put(`/bookings/${id}`, data);

// // Update booking status
// export const updateBookingStatus = (id: string, status: string) =>
//   api.patch(`/bookings/${id}/status`, { status });

// // Cancel booking
// export const cancelBooking = (id: string) =>
//   api.patch(`/bookings/${id}/cancel`);

// // Delete booking
// export const deleteBooking = (id: string) =>
//   api.delete(`/bookings/${id}`);

// // Business bookings
// export const getBusinessBookings = (businessId: string) =>
//   api.get(`/businesses/${businessId}/bookings`);

// // Booking trends
// export const getBookingTrends = (businessId: string) =>
//   api.get(`/businesses/${businessId}/booking-trends`);

// // Available slots
// export const getAvailableSlots = (
//   businessId: string,
//   serviceId: string
// ) =>
//   api.get(
//     `/businesses/${businessId}/services/${serviceId}/available-slots`
//   );

// // User bookings
// export const getUserBookings = (userId: string) =>
//   api.get(`/users/${userId}/bookings`);
