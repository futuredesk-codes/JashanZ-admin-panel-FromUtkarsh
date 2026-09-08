import { api } from "./client";

export const getBusinesses = (params) =>
  api.get("/admin/businesses/all", params);

export const verifyBusiness = (businessId, status) =>
  api.post(`/admin/business/${businessId}/verify`, { status });

export const deleteBusiness = (businessId) =>
  api.post(`/admin/business/${businessId}/delete`);

export const getBusinessBookings = (businessId, params) =>
  api.get(`/admin/business/${businessId}/bookings`, params);

export const getCategories = () => api.get("/business/categories");

export const getSupportBusinesses = (params) =>
  api.get("/support/businesses", params);

export const verifyBusinessAsSupport = (businessId, status) =>
  api.post(`/support/business/${businessId}/verify`, { status });

export const getSupportBusinessBookings = (businessId, params) =>
  api.get(`/support/business/${businessId}/bookings`, params);
