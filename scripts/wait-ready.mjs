const api = process.env.PUBLIC_API_URL || "http://localhost:4000",
  web = process.env.WEB_ORIGIN || "http://localhost:3000";
for (let n = 0; n < 60; n++) {
  try {
    const r = await Promise.all([fetch(`${api}/health`), fetch(web)]);
    if (r.every((r) => r.ok)) process.exit(0);
  } catch {}
  await new Promise((r) => setTimeout(r, 1000));
}
throw new Error("Application did not become ready in 60 seconds");
