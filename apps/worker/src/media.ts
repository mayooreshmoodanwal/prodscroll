import { storageConfig } from "@productscroll/config";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable, Transform } from "node:stream";
import { db } from "@productscroll/database";
import { mkdir, writeFile, rm, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";
import ffmpeg from "@ffmpeg-installer/ffmpeg";
import ffprobe from "@ffprobe-installer/ffprobe";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
const root = path.resolve(process.env.MEDIA_DIR || "../../work/media");
function command(binary: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(
      binary === "ffmpeg"
        ? process.env.FFMPEG_PATH || ffmpeg.path
        : binary === "ffprobe"
          ? process.env.FFPROBE_PATH || ffprobe.path
          : binary,
      args,
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let out = "",
      error = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${binary} timed out`));
    }, 15 * 60000);
    child.stdout.on("data", (data) => {
      out += String(data);
      if (out.length > 1000000) child.kill("SIGKILL");
    });
    child.stderr.on("data", (data) => {
      error = (error + String(data)).slice(-5000);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(`${binary} exited ${code}: ${error.slice(-1000)}`));
    });
  });
}
const config = storageConfig();
const storage =
  config.driver === "r2"
    ? new S3Client({
        endpoint: config.endpoint,
        region: "auto",
        credentials: config.credentials,
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED",
        maxAttempts: 3,
        requestHandler: { connectionTimeout: 5000, requestTimeout: 120000 },
      })
    : null;
export async function removeIncoming(key: string) {
  if (config.driver === "r2")
    await storage!.send(
      new DeleteObjectCommand({ Bucket: config.uploadBucket, Key: key }),
    );
  await rm(path.join(root, key), { force: true });
}
export async function processMedia(assetId: string) {
  const asset = await db.mediaAsset.findUniqueOrThrow({
    where: { id: assetId },
  });
  const input = path.join(root, asset.storageKey);
  const directory = path.join(root, "public", asset.id);
  if (asset.processingStatus === "READY") {
    await removeIncoming(asset.storageKey);
    if (config.driver === "r2")
      await rm(directory, { recursive: true, force: true });
    return;
  }
  try {
    await mkdir(path.dirname(input), { recursive: true });
    await mkdir(directory, { recursive: true });
    if (config.driver === "r2") {
      const object = await storage!.send(
        new GetObjectCommand({
          Bucket: config.driver === "r2" ? config.uploadBucket : "",
          Key: asset.storageKey,
        }),
      );
      if (!object.Body) throw new Error("Object missing");
      if (object.ContentLength !== asset.fileSizeBytes)
        throw new Error("Uploaded size changed before processing.");
      let received = 0;
      const limit = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          received += chunk.length;
          callback(
            received > asset.fileSizeBytes
              ? new Error("Upload exceeded declared size")
              : null,
            chunk,
          );
        },
      });
      await pipeline(object.Body as Readable, limit, createWriteStream(input));
      if (received !== asset.fileSizeBytes)
        throw new Error("Incomplete R2 upload");
    }
    let width = 0,
      height = 0,
      durationMs: number | undefined;
    let processed = "image.webp";
    if (asset.mediaType === "IMAGE") {
      const image = sharp(input, {
        limitInputPixels: 40000000,
        failOn: "error",
      });
      const metadata = await image.metadata();
      if (
        !metadata.width ||
        !metadata.height ||
        !["jpeg", "png", "webp"].includes(metadata.format || "")
      )
        throw new Error("Unsupported or malformed image");
      width = Math.min(1920, metadata.width);
      height = Math.round((metadata.height * width) / metadata.width);
      await image
        .rotate()
        .resize({
          width: 1920,
          height: 1920,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toFile(path.join(directory, processed));
      await sharp(input)
        .rotate()
        .resize(480, 480, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 70 })
        .toFile(path.join(directory, "poster.webp"));
    } else {
      const metadata = JSON.parse(
        await command("ffprobe", [
          "-v",
          "error",
          "-protocol_whitelist",
          "file,pipe",
          "-show_format",
          "-show_streams",
          "-of",
          "json",
          input,
        ]),
      ) as {
        format: { duration?: string };
        streams: { codec_type: string; width?: number; height?: number }[];
      };
      const video = metadata.streams.find((s) => s.codec_type === "video");
      const duration = Number(metadata.format.duration);
      if (
        !video?.width ||
        !video.height ||
        !Number.isFinite(duration) ||
        duration <= 0 ||
        duration > 180 ||
        video.width * video.height > 3840 * 2160
      )
        throw new Error(
          "Video must be valid, at most 3 minutes and at most 4K.",
        );
      width = video.width;
      height = video.height;
      durationMs = Math.round(duration * 1000);
      await command("ffmpeg", [
        "-y",
        "-threads",
        "2",
        "-protocol_whitelist",
        "file,pipe",
        "-i",
        input,
        "-frames:v",
        "1",
        "-vf",
        "scale=480:-2",
        path.join(directory, "poster.png"),
      ]);
      await sharp(path.join(directory, "poster.png"))
        .webp({ quality: 80 })
        .toFile(path.join(directory, "poster.webp"));
      await rm(path.join(directory, "poster.png"));
      const variants = [
        { height: 360, rate: 600 },
        { height: 720, rate: 1800 },
      ].filter((v) => v.height <= height);
      if (!variants.length)
        variants.push({ height: Math.floor(height / 2) * 2, rate: 500 });
      for (const variant of variants) {
        await mkdir(path.join(directory, String(variant.height)), {
          recursive: true,
        });
        await command("ffmpeg", [
          "-y",
          "-threads",
          "2",
          "-protocol_whitelist",
          "file,pipe",
          "-i",
          input,
          "-vf",
          `scale=-2:${variant.height}`,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-b:v",
          `${variant.rate}k`,
          "-maxrate",
          `${Math.round(variant.rate * 1.1)}k`,
          "-bufsize",
          `${variant.rate * 2}k`,
          "-pix_fmt",
          "yuv420p",
          "-g",
          "48",
          "-keyint_min",
          "48",
          "-sc_threshold",
          "0",
          "-c:a",
          "aac",
          "-b:a",
          "96k",
          "-f",
          "hls",
          "-hls_time",
          "4",
          "-hls_playlist_type",
          "vod",
          "-hls_segment_filename",
          path.join(directory, String(variant.height), "segment-%03d.ts"),
          path.join(directory, String(variant.height), "index.m3u8"),
        ]);
      }
      processed = "master.m3u8";
      await writeFile(
        path.join(directory, processed),
        "#EXTM3U\n" +
          variants
            .map(
              (v) =>
                `#EXT-X-STREAM-INF:BANDWIDTH=${(v.rate + 128) * 1000},RESOLUTION=${Math.round((width * v.height) / height / 2) * 2}x${v.height}\n${v.height}/index.m3u8`,
            )
            .join("\n") +
          "\n",
      );
    }
    const base =
      config.driver === "r2"
        ? `${config.deliveryUrl}/${asset.id}`
        : `${process.env.MEDIA_PUBLIC_URL || (process.env.PUBLIC_API_URL ? `${process.env.PUBLIC_API_URL.replace(/\/api\/?$/, "")}/media` : "https://productscroll-api.onrender.com/media")}/${asset.id}`;
    if (config.driver === "r2") {
      async function upload(directoryPath: string, prefix: string) {
        for (const item of await readdir(directoryPath, {
          withFileTypes: true,
        })) {
          const file = path.join(directoryPath, item.name),
            key = `${prefix}/${item.name}`;
          if (item.isDirectory()) await upload(file, key);
          else {
            const mime = item.name.endsWith(".m3u8")
              ? "application/vnd.apple.mpegurl"
              : item.name.endsWith(".ts")
                ? "video/mp2t"
                : "image/webp";
            await storage!.send(
              new PutObjectCommand({
                Bucket: config.driver === "r2" ? config.mediaBucket : "",
                Key: key,
                Body: createReadStream(file),
                ContentLength: (await stat(file)).size,
                ContentType: mime,
                CacheControl: "public,max-age=31536000,immutable",
              }),
            );
          }
        }
      }
      await upload(directory, asset.id);
    }
    await db.mediaAsset.update({
      where: { id: asset.id },
      data: {
        processingStatus: "READY",
        processedUrl: `${base}/${processed}`,
        thumbnailUrl: `${base}/poster.webp`,
        width,
        height,
        durationMs,
      },
    });
    await removeIncoming(asset.storageKey);
  } finally {
    if (config.driver === "r2") {
      await rm(input, { force: true });
      await rm(directory, { recursive: true, force: true });
    }
  }
}
