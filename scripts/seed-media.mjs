import ffmpeg from "../apps/worker/node_modules/@ffmpeg-installer/ffmpeg/index.js";
import sharp from "../apps/worker/node_modules/sharp/lib/index.js";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
const { startups } = JSON.parse(
  await readFile(
    new URL("../packages/database/prisma/identities.json", import.meta.url),
    "utf8",
  ),
);
const dir = path.resolve(
  new URL("../apps/worker/", import.meta.url).pathname,
  process.env.MEDIA_DIR || "../../work/media",
  "public/seed",
);
await mkdir(dir, { recursive: true });
for (const [i, s] of startups.entries()) {
  const dark = i === 3 || i === 14,
    text = dark ? "#f3f3ed" : "#252822",
    muted = dark ? "#b5bcae" : "#73766d";
  let art = "";
  if (i % 3 === 0)
    art = `<g transform="translate(160,220) rotate(-3 440 250)"><rect width="870" height="480" rx="18" fill="${dark ? "#373e46" : "#fafaf5"}" stroke="${muted}" stroke-opacity=".25"/><path d="M0 58H870 M170 58V480" stroke="${muted}" stroke-opacity=".2"/><circle cx="28" cy="28" r="6" fill="#bd6852"/><circle cx="50" cy="28" r="6" fill="#c6b562"/><circle cx="72" cy="28" r="6" fill="#88996a"/><text x="195" y="36" font-size="15" fill="${muted}">${s.product} / workspace</text><text x="25" y="102" font-size="18" fill="${text}">Your workspace</text><text x="25" y="143" font-size="14" fill="${muted}">✦ Today</text><text x="25" y="180" font-size="14" fill="${muted}">↗ Explore</text><rect x="216" y="115" width="230" height="165" rx="7" fill="${s.ink}" opacity=".9"/><text x="240" y="155" fill="${dark ? "#263028" : "white"}" font-size="23">Start somewhere.</text><text x="240" y="190" fill="${dark ? "#263028" : "white"}" font-size="15">Every idea needs a little room.</text><rect x="485" y="110" width="290" height="280" rx="6" fill="${dark ? "#57614d" : "#e6e8dd"}"/><path d="M520 312L560 235L610 270L658 190L726 273" fill="none" stroke="${s.ink}" stroke-width="5"/><circle cx="635" cy="206" r="45" fill="${s.color}" stroke="${s.ink}" stroke-width="2"/><text x="217" y="348" font-size="27" fill="${text}">A little less friction.</text><text x="217" y="384" font-size="17" fill="${muted}">A lot more possibility.</text></g>`;
  else if (i % 3 === 1)
    art = `<g transform="translate(600 468)"><ellipse cy="208" rx="295" ry="32" fill="${s.ink}" opacity=".1"/><path d="M-230 170L100 185L235 128L-70 110Z" fill="${dark ? "#5e7182" : "#bcc4c6"}"/><path d="M-230 170V195L100 215V185Z" fill="#929b9e"/><path d="M100 185L235 128V158L100 215Z" fill="#a6b0b2"/><path d="M0 110V-2L-135-80L-65-225" stroke="${s.ink}" stroke-width="66" stroke-linejoin="round" fill="none"/><path d="M0 110V-2L-135-80L-65-225" stroke="${dark ? "#bdc9bd" : "#dce0dd"}" stroke-width="48" stroke-linejoin="round" fill="none"/><circle cx="-135" cy="-80" r="41" fill="${s.ink}"/><circle cx="-135" cy="-80" r="21" fill="${s.color}"/><circle cy="-2" r="35" fill="${s.ink}"/><circle cy="-2" r="15" fill="${s.color}"/><path d="M-65-225L17-220L38-177M17-220L56-240" stroke="${s.ink}" stroke-width="20" fill="none" stroke-linecap="round"/><circle cx="-65" cy="-225" r="24" fill="${s.ink}"/><rect x="120" y="25" width="70" height="77" rx="6" fill="${s.ink}" opacity=".8"/></g><path d="M195 415H300M830 330H980" stroke="${s.ink}" stroke-dasharray="3 5"/><text x="180" y="397" font-size="15" fill="${muted}">Thoughtfully engineered</text><text x="855" y="312" font-size="15" fill="${muted}">Made to last</text>`;
  else
    art = `<g transform="translate(600 435)"><ellipse cy="246" rx="240" ry="29" fill="${s.ink}" opacity=".1"/><path d="M-180 90L-140 220Q0 280 140 220L180 90Z" fill="${dark ? "#657080" : "#faf8ef"}"/><ellipse cy="90" rx="180" ry="55" fill="${dark ? "#94a187" : "#d1d5c4"}"/><ellipse cy="80" rx="146" ry="35" fill="${s.ink}" opacity=".8"/><path d="M0 75V-125M-35 65L-90-72M40 65L109-95" stroke="${s.ink}" stroke-width="9" fill="none"/><path d="M0-95C-145-220-175-55 0-28C125-145 120-217 0-95Z" fill="${s.ink}"/><path d="M-62-10C-190-122-170 16-45 26M76-5C188-133 200 0 49 31" fill="${s.ink}" opacity=".8"/><rect x="-43" y="140" width="86" height="38" rx="16" fill="${s.color}"/><circle cx="-16" cy="158" r="5" fill="${s.ink}"/><text x="-2" y="164" font-size="16" fill="${s.ink}">ready</text></g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="${s.color}"/><g font-family="Arial, sans-serif"><text x="60" y="65" font-size="20" font-weight="bold" fill="${s.ink}">${s.name.toUpperCase()} ↗</text><text x="60" y="125" font-size="15" letter-spacing="3" fill="${muted}">${s.label}</text>${art}<text x="60" y="798" font-size="38" letter-spacing="-1" fill="${text}">${s.pitch}</text><text x="62" y="848" font-size="18" fill="${muted}">A product idea by ${s.name}   ·   Demonstration artwork</text><text x="1090" y="70" font-size="17" fill="${muted}">${String(i + 1).padStart(2, "0")}/15</text></g></svg>`;
  await writeFile(path.join(dir, `${s.slug}.svg`), svg);
  await sharp(Buffer.from(svg))
    .webp({ quality: 90 })
    .toFile(path.join(dir, `${s.slug}.webp`));
  const result = spawnSync(
    process.env.FFMPEG_PATH || ffmpeg.path,
    [
      "-y",
      "-loglevel",
      "error",
      "-loop",
      "1",
      "-i",
      path.join(dir, `${s.slug}.webp`),
      "-vf",
      "scale=800:600,zoompan=z=min(zoom+0.0004\\,1.12):d=150:s=800x600:fps=25",
      "-t",
      "6",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      path.join(dir, `${s.slug}.mp4`),
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) throw new Error(result.stderr);
  console.log(`Created media for ${s.name}`);
}
