import { api } from "./client";

export const getPolicies = () => api.get("/admin/policies");

export const updatePolicy = (slug, content) =>
  api.post("/admin/policies/update", { slug, content });
