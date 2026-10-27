export const limits = Object.freeze({
  imageBytes: 15 * 1024 * 1024,
  videoBytes: 100 * 1024 * 1024,
  dailyUploadBytes: 1024 * 1024 * 1024,
  maxPageSize: 40,
  videoDurationSeconds: 180,
});

export { storageConfig } from "./storage";
