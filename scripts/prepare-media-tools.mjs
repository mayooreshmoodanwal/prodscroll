import { chmod } from "node:fs/promises";
import ffmpeg from "../apps/worker/node_modules/@ffmpeg-installer/ffmpeg/index.js";
import ffprobe from "../apps/worker/node_modules/@ffprobe-installer/ffprobe/index.js";
// The published macOS ffprobe archive lacks its executable bit when lifecycle
// scripts are disabled. Set it only on our two known dependency binaries.
if (process.platform !== "win32") {
  await chmod(ffmpeg.path, 0o755);
  await chmod(ffprobe.path, 0o755);
}
