import { chmod } from "node:fs/promises";

try {
  const ffmpeg = await import("@ffmpeg-installer/ffmpeg");
  const ffprobe = await import("@ffprobe-installer/ffprobe");
  if (process.platform !== "win32") {
    if (ffmpeg?.default?.path) await chmod(ffmpeg.default.path, 0o755);
    if (ffprobe?.default?.path) await chmod(ffprobe.default.path, 0o755);
  }
} catch {
  // Optional binary chmod - ignore if not installed or system binaries are used
}
