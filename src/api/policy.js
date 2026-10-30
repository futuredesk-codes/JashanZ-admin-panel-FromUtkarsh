import { api } from "./client";

export const getPolicies = (audience) => api.get(`/admin/policies?audience=${audience}`);

export const updatePolicy = (audience, slug, content) =>
  api.post("/admin/policies/update", { audience, slug, content });
