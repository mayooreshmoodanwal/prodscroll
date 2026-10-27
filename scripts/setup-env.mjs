import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
const example = await readFile(
  new URL("../.env.example", import.meta.url),
  "utf8",
);
const content = example
  .replace(
    /^SESSION_SECRET=.*$/m,
    `SESSION_SECRET=${randomBytes(48).toString("hex")}`,
  )
  .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${randomBytes(48).toString("hex")}`);
try {
  await writeFile(new URL("../.env", import.meta.url), content, {
    flag: "wx",
    mode: 0o600,
  });
  console.log("Created .env with new local secrets.");
} catch (error) {
  if (error.code === "EEXIST")
    console.log(".env already exists; retained existing configuration.");
  else throw error;
}
