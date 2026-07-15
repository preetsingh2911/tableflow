/**
 * API call functions — all backend endpoints
 */
import api from './axios';

// --- Auth ---
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
};

// --- Business ---
export const businessAPI = {
  getProfile: () => api.get('/business/profile'),
  updateProfile: (data) => api.put('/business/profile', data),
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/business/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadCover: (file) => {
    const formData = new FormData();
    formData.append('cover', file);
    return api.post('/business/cover', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// --- Outlets ---
export const outletAPI = {
  list: () => api.get('/outlets'),
  get: (id) => api.get(`/outlets/${id}`),
  create: (data) => api.post('/outlets', data),
  update: (id, data) => api.put(`/outlets/${id}`, data),
  delete: (id) => api.delete(`/outlets/${id}`),
};

// --- Time Slots ---
export const slotAPI = {
  list: (outletId) => api.get(`/slots?outletId=${outletId}`),
  create: (data) => api.post('/slots', data),
  createBulk: (data) => api.post('/slots/bulk', data),
  update: (id, data) => api.put(`/slots/${id}`, data),
  delete: (id) => api.delete(`/slots/${id}`),
};

// --- Tables ---
export const tableAPI = {
  list: (outletId) => api.get(`/tables?outletId=${outletId}`),
  get: (id) => api.get(`/tables/${id}`),
  create: (data) => api.post('/tables', data),
  update: (id, data) => api.put(`/tables/${id}`, data),
  delete: (id) => api.delete(`/tables/${id}`),
};

// --- Bookings ---
export const bookingAPI = {
  list: (params) => api.get('/bookings', { params }),
  get: (id) => api.get(`/bookings/${id}`),
  createManual: (data) => api.post('/bookings/manual', data),
  updateStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  getStats: () => api.get('/bookings/stats'),
};

// --- Customers ---
export const customerAPI = {
  list: (params) => api.get('/customers', { params }),
};

// --- Blocked Dates ---
export const blockedDatesAPI = {
  list: (params) => api.get('/blocked-dates', { params }),
  create: (data) => api.post('/blocked-dates', data),
  delete: (id) => api.delete(`/blocked-dates/${id}`),
};

// --- Public (no auth) ---
export const publicAPI = {
  getBusinessInfo: (slug) => api.get(`/public/${slug}`),
  getAvailability: (slug, outletId, date) => api.get(`/public/${slug}/outlets/${outletId}/availability?date=${date}`),
  getBlockedDates: (slug, outletId) => api.get(`/public/${slug}/blocked-dates/${outletId}`),
  createBooking: (slug, data) => api.post(`/public/${slug}/book`, data),
  joinWaitlist: (slug, data) => api.post(`/public/${slug}/waitlist`, data),
  getBookingStatus: (code) => api.get(`/public/booking/${code}`),
  cancelBooking: (code) => api.post(`/public/booking/${code}/cancel`),
};

// --- Subscriptions ---
export const subscriptionAPI = {
  listPlans: () => api.get('/subscriptions/plans'),
  create: (data) => api.post('/subscriptions/create', data),
  getStatus: () => api.get('/subscriptions/status'),
};
