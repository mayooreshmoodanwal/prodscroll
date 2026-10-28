import { spawnSync } from "node:child_process";
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import type { NormalizedCandidate } from "./types.js";

const PALETTES = [
  { bg: "#0f172a", text: "#f8fafc", accent: "#38bdf8", muted: "#94a3b8" }, // Slate Cyan
  { bg: "#18181b", text: "#fafafa", accent: "#a855f7", muted: "#a1a1aa" }, // Zinc Purple
  { bg: "#0c1a1a", text: "#f0fdf4", accent: "#34d399", muted: "#9ca3af" }, // Emerald Dark
  { bg: "#1c1917", text: "#fafaf9", accent: "#f97316", muted: "#a8a29e" }, // Warm Amber
  { bg: "#111827", text: "#f9fafb", accent: "#6366f1", muted: "#9ca3af" }, // Indigo Slate
  { bg: "#1e1b4b", text: "#fdf4ff", accent: "#e879f9", muted: "#c084fc" }, // Deep Violet
];

async function getSharp() {
  try {
    const mod = await import("sharp");
    return mod.default || mod;
  } catch {
    try {
      const mod = await import("../apps/worker/node_modules/sharp/lib/index.js");
      return mod.default || mod;
    } catch {
      return null;
    }
  }
}

async function getFfmpegPath(): Promise<string> {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try {
    const installer = await import("@ffmpeg-installer/ffmpeg");
    if (installer?.default?.path) return installer.default.path;
  } catch {}
  return "ffmpeg";
}

export async function generateProductMedia(
  candidate: NormalizedCandidate,
  outputDir: string,
  webPublicDir: string,
): Promise<{ videoPath: string; imagePath: string; publicUrl: string; thumbnailUrl: string }> {
  await mkdir(outputDir, { recursive: true });
  await mkdir(webPublicDir, { recursive: true });

  const slug = candidate.productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Pick palette based on name hash
  let hash = 0;
  for (let i = 0; i < candidate.productName.length; i++) {
    hash = (hash << 5) - hash + candidate.productName.charCodeAt(i);
  }
  const palette = PALETTES[Math.abs(hash) % PALETTES.length];

  const svgPath = path.join(outputDir, `${slug}.svg`);
  const pngPath = path.join(outputDir, `${slug}.png`);
  const mp4Path = path.join(outputDir, `${slug}.mp4`);
  const webMp4Path = path.join(webPublicDir, `${slug}.mp4`);
  const webPngPath = path.join(webPublicDir, `${slug}.png`);

  const publicUrl = `/media/discovered/${slug}.mp4`;
  const thumbnailUrl = `/media/discovered/${slug}.png`;

  // 1. If media already exists in webPublicDir or outputDir, reuse immediately
  try {
    const s = await stat(webMp4Path);
    if (s.size > 1000) {
      return {
        videoPath: webMp4Path,
        imagePath: webPngPath,
        publicUrl,
        thumbnailUrl,
      };
    }
  } catch {}

  try {
    const s = await stat(mp4Path);
    if (s.size > 1000) {
      return {
        videoPath: mp4Path,
        imagePath: pngPath,
        publicUrl,
        thumbnailUrl,
      };
    }
  } catch {}

  function escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  const escapedName = escapeXml(candidate.productName.slice(0, 24));
  const escapedPitch = escapeXml(candidate.pitch);
  const escapedCategory = escapeXml(candidate.category);
  let escapedDomain = "official product link";
  try {
    escapedDomain = escapeXml(new URL(candidate.canonicalUrl).hostname);
  } catch {}

  const d1 = escapeXml(candidate.description.slice(0, 52));
  const d2 = escapeXml(candidate.description.slice(52, 110));
  const d3 = candidate.description.length > 110 ? escapeXml(candidate.description.slice(110, 170) + "…") : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bg}" />
      <stop offset="100%" stop-color="#05070a" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.3" />
      <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0" />
    </linearGradient>
  </defs>

  <rect width="1080" height="1920" fill="url(#bg)" />
  <circle cx="900" cy="400" r="450" fill="url(#glow)" />
  <circle cx="180" cy="1500" r="350" fill="url(#glow)" />

  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <!-- Top Badge -->
    <rect x="80" y="140" width="370" height="56" rx="28" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-opacity="0.2" />
    <text x="110" y="176" font-size="24" font-weight="600" fill="${palette.accent}">🔍 DISCOVERED BY PRODGRAM</text>

    <!-- Category Pill -->
    <text x="80" y="480" font-size="32" font-weight="700" letter-spacing="4" fill="${palette.accent}">${escapedCategory.toUpperCase()}</text>

    <!-- Product Title -->
    <text x="80" y="580" font-size="80" font-weight="900" fill="${palette.text}">${escapedName}</text>

    <!-- Pitch / Headline -->
    <text x="80" y="680" font-size="40" font-weight="500" fill="${palette.muted}">
      ${escapedPitch.length > 70 ? escapedPitch.slice(0, 68) + "…" : escapedPitch}
    </text>

    <!-- Feature Card -->
    <rect x="80" y="820" width="920" height="420" rx="24" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.12" />
    
    <text x="140" y="900" font-size="30" font-weight="600" fill="${palette.accent}">VERIFIED CAPABILITIES</text>
    <text x="140" y="980" font-size="34" font-weight="400" fill="${palette.text}">
      ${d1}
    </text>
    <text x="140" y="1040" font-size="34" font-weight="400" fill="${palette.text}">
      ${d2}
    </text>
    <text x="140" y="1100" font-size="34" font-weight="400" fill="${palette.text}">
      ${d3}
    </text>
    
    <text x="140" y="1180" font-size="28" font-weight="500" fill="${palette.muted}">
      Canonical Source: ${escapedDomain}
    </text>

    <!-- Bottom Swipe / Action Prompt -->
    <rect x="80" y="1620" width="920" height="110" rx="55" fill="${palette.accent}" />
    <text x="540" y="1688" font-size="38" font-weight="800" text-anchor="middle" fill="#000000">
      SWIPE RIGHT FOR ACTIONS ➔
    </text>

    <!-- Branding Footer -->
    <text x="540" y="1810" font-size="28" font-weight="500" text-anchor="middle" fill="${palette.muted}">
      prodgram.com · autonomous startup discovery
    </text>
  </g>
</svg>`;

  await writeFile(svgPath, svg);

  // Convert SVG to PNG using Sharp if available
  try {
    const sharp = await getSharp();
    if (sharp) {
      await sharp(Buffer.from(svg)).png().toFile(pngPath);
      spawnSync("cp", [pngPath, webPngPath]);
    }
  } catch (err) {
    console.warn(`[Media] Warning: could not rasterize svg to png:`, err);
  }

  // Generate 6-second MP4 reel with bundled ffmpeg if available
  try {
    const ffmpeg = await getFfmpegPath();
    const res = spawnSync(ffmpeg, [
      "-y",
      "-loglevel",
      "error",
      "-loop",
      "1",
      "-i",
      pngPath,
      "-t",
      "6",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      mp4Path,
    ]);

    if (res.status === 0) {
      spawnSync("cp", [mp4Path, webMp4Path]);
    } else {
      console.warn(`[Media] ffmpeg status ${res.status}:`, res.stderr?.toString());
    }
  } catch (err) {
    console.warn(`[Media] Warning: could not encode mp4 with ffmpeg:`, err);
  }

  return {
    videoPath: mp4Path,
    imagePath: pngPath,
    publicUrl,
    thumbnailUrl,
  };
}
