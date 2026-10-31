import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { FastifyInstance, InjectOptions } from "fastify";
import { buildApp } from "../../apps/api/src/app";
import { db } from "../../packages/database/src/index";
import { hashPassword, accessToken, hash, token } from "../../apps/api/src/lib/core";

let app: FastifyInstance;
const suffix = Date.now().toString(36);
let authUser: { id: string; accessToken: string };

const call = (
  method: InjectOptions["method"],
  url: string,
  body?: unknown,
  access?: string,
) =>
  app.inject({
    method,
    url: `/api${url}`,
    headers: { ...(access ? { authorization: `Bearer ${access}` } : {}) },
    ...(body !== undefined
      ? {
          payload: JSON.stringify(body),
          headers: {
            "content-type": "application/json",
            ...(access ? { authorization: `Bearer ${access}` } : {}),
          },
        }
      : {}),
  });

beforeAll(async () => {
  app = await buildApp({
    logger: false,
    rateLimitNamespace: `productscroll:test:${suffix}:`,
  });
  await app.ready();

  // Create a verified test user directly in DB to be completely isolated from external email APIs
  const user = await db.user.create({
    data: {
      email: `radar_test_${suffix}@test.local`,
      username: `radar_${suffix}`,
      displayName: "Radar Tester",
      passwordHash: await hashPassword("Password123!"),
      emailVerifiedAt: new Date(),
      onboarded: true,
      role: "ADMIN",
    },
  });

  const rawToken = token();
  const rawRefresh = token();
  const session = await db.session.create({
    data: {
      userId: user.id,
      tokenHash: hash(rawToken),
      refreshHash: hash(rawRefresh),
      userAgent: "vitest-test-agent",
      expiresAt: new Date(Date.now() + 86400000),
    },
  });

  const jwt = await accessToken(user.id, session.id);

  authUser = {
    id: user.id,
    accessToken: jwt,
  };
});

afterAll(async () => {
  if (authUser?.id) {
    await db.user.delete({ where: { id: authUser.id } }).catch(() => {});
  }
  await app.close();
});

describe("BuildRadar Integration API", () => {
  it("GET /api/buildradar/health returns active engine status", async () => {
    const res = await call("GET", "/buildradar/health");
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(["online", "degraded", "offline"]).toContain(data.status);
    expect(data.model).toBeDefined();
    expect(data.provider).toBeDefined();
  });

  it("GET /api/buildradar/overview returns personalized recommendations", async () => {
    const res = await call("GET", "/buildradar/overview", undefined, authUser.accessToken);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.forYou).toBeDefined();
    expect(data.collaborators).toBeDefined();
    expect(data.projectRecommendations).toBeDefined();
    expect(data.opportunityRadar).toBeDefined();
    expect(data.stats.aiModel).toBeDefined();
  });

  it("POST /api/buildradar/analyze analyzes content and returns updated DNA", async () => {
    const res = await call("POST", "/buildradar/analyze", {}, authUser.accessToken);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.success).toBe(true);
    expect(data.message).toBeDefined();
  });

  it("GET /api/buildradar/dna returns current user Build DNA", async () => {
    const res = await call("GET", "/buildradar/dna", undefined, authUser.accessToken);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.dna).toBeDefined();
  });
});

describe("Invest Prototype Integration API", () => {
  let demoStartupId: string;
  let simulatedPositionId: string;

  it("GET /api/invest/overview returns demo featured startups and markets", async () => {
    const res = await call("GET", "/invest/overview");
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.disclaimer).toContain("PROTOTYPE MODE");
    expect(data.featured.length).toBeGreaterThan(0);
    expect(data.markets.length).toBe(3);
    demoStartupId = data.featured[0].id;
  });

  it("GET /api/invest/startups filters by market jurisdiction", async () => {
    const res = await call("GET", "/invest/startups?countryCode=NZ");
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.startups.length).toBeGreaterThan(0);
    expect(data.startups.every((s: { countryCode: string }) => s.countryCode === "NZ")).toBe(true);
  });

  it("POST /api/invest/startups/:id/watchlist toggles watchlist", async () => {
    const addRes = await call(
      "POST",
      `/invest/startups/${demoStartupId}/watchlist`,
      {},
      authUser.accessToken,
    );
    expect(addRes.statusCode).toBe(200);
    expect(JSON.parse(addRes.body).watchlisted).toBe(true);

    const getRes = await call("GET", "/invest/watchlist", undefined, authUser.accessToken);
    expect(getRes.statusCode).toBe(200);
    const wl = JSON.parse(getRes.body);
    expect(wl.watchlist.some((s: { id: string }) => s.id === demoStartupId)).toBe(true);
  });

  it("POST /api/invest/simulate enforces min ticket and creates educational position", async () => {
    // Attempt with below minimum ticket
    const lowRes = await call(
      "POST",
      "/invest/simulate",
      { startupId: demoStartupId, hypotheticalAmount: 5 },
      authUser.accessToken,
    );
    expect(lowRes.statusCode).toBe(400);

    // Valid hypothetical simulation
    const simRes = await call(
      "POST",
      "/invest/simulate",
      { startupId: demoStartupId, hypotheticalAmount: 1000 },
      authUser.accessToken,
    );
    expect(simRes.statusCode).toBe(200);
    const simData = JSON.parse(simRes.body);
    expect(simData.success).toBe(true);
    expect(simData.disclaimer).toContain("Educational simulation only");
    expect(simData.position.illustrativeEquityPercent).toBeGreaterThan(0);
    simulatedPositionId = simData.position.id;
  });

  it("GET /api/invest/portfolio retrieves simulated portfolio with positions & activity", async () => {
    const res = await call("GET", "/invest/portfolio", undefined, authUser.accessToken);
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.portfolio.totalSimulatedAllocated).toBeGreaterThanOrEqual(1000);
    expect(data.portfolio.positions.length).toBeGreaterThan(0);
    expect(data.portfolio.recentActivity.length).toBeGreaterThan(0);
  });

  it("DELETE /api/invest/positions/:id removes simulated position", async () => {
    const res = await call(
      "DELETE",
      `/invest/positions/${simulatedPositionId}`,
      undefined,
      authUser.accessToken,
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).success).toBe(true);
  });

  it("GET /api/invest/markets returns regulatory research for NZ, US, MY", async () => {
    const res = await call("GET", "/invest/markets");
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.markets.length).toBe(3);
    const nz = data.markets.find((m: { countryCode: string }) => m.countryCode === "NZ");
    expect(nz.regulatoryResearchTopics).toContain("Financial Markets Conduct Act 2013 (FMCA) crowd-funding provisions");
  });
});
