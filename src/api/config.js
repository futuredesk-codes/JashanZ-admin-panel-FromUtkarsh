import { api } from "./client";

export const PLATFORM_INFO_KEYS = [
  "platformName",
  "supportEmail",
  "supportPhone",
  "websiteUrl",
];

export const getAllConfig = () => api.get("/admin/config");

export const setConfig = (key, value) =>
  api.post("/admin/config/set", { key, value });

// Landing-page tutorial video (YouTube URL) — shown on the Jashanz website
// home page. Managed from the admin dashboard; pass "" to clear it.
export const getTutorialVideo = () => api.get("/admin/tutorial-video");

export const setTutorialVideo = (url) =>
  api.patch("/admin/tutorial-video", { url });
