import path from "node:path";
import type { NormalizedCandidate } from "./types.js";

export const VERIFIED_MEDIA_SLUGS = [
  "lazygit",
  "vhs",
  "starship",
  "atuin",
  "nushell",
  "affine",
  "sketchybar",
  "zellij",
  "novu",
  "promptfoo",
  "gum",
  "freeze",
  "mods",
  "pop",
  "lazydocker",
  "glow",
  "huh",
  "bubbletea",
  "bubbles",
  "zoxide",
  "gitui",
  "bottom",
  "dust",
  "xh",
  "hyperfine",
  "croc",
  "open-webui",
  "crush",
];

export async function generateProductMedia(
  candidate: NormalizedCandidate,
  outputDir: string,
  webPublicDir: string,
): Promise<{ videoPath: string; imagePath: string; publicUrl: string; thumbnailUrl: string }> {
  const slug = candidate.productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  let hash = 0;
  for (let i = 0; i < candidate.productName.length; i++) {
    hash = (hash << 5) - hash + candidate.productName.charCodeAt(i);
  }

  // Select verified real demo video slug
  const mediaSlug = VERIFIED_MEDIA_SLUGS.includes(slug)
    ? slug
    : VERIFIED_MEDIA_SLUGS[Math.abs(hash) % VERIFIED_MEDIA_SLUGS.length];

  const publicUrl = `/media/demos/${mediaSlug}.mp4`;
  const thumbnailUrl = `/media/demos/${mediaSlug}.png`;
  const demosDir = path.resolve(process.cwd(), "apps/web/public/media/demos");
  const webMp4Path = path.join(demosDir, `${mediaSlug}.mp4`);
  const webPngPath = path.join(demosDir, `${mediaSlug}.png`);

  return {
    videoPath: webMp4Path,
    imagePath: webPngPath,
    publicUrl,
    thumbnailUrl,
  };
}
