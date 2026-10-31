import { db } from "@productscroll/database";
import type { MarketEvaluationDTO } from "@productscroll/types";

export const MARKETS_DATA: Record<string, MarketEvaluationDTO> = {
  NZ: {
    countryCode: "NZ",
    countryName: "New Zealand",
    currency: "NZD",
    currencySymbol: "NZ$",
    status: "Under evaluation — not an available investment market",
    marketOverview:
      "New Zealand boasts a vibrant, tech-forward entrepreneurial ecosystem with global category leaders emerging in AgriTech, SaaS, aerospace, and clean energy.",
    potentialOpportunity:
      "Democratizing discovery for high-conviction trans-Tasman and Kiwi founders connecting with regional supporters and diaspora early-stage capital.",
    startupEcosystem:
      "Active angel networks (Angel Association NZ), university commercialization hubs (Auckland, Canterbury), and established innovation agencies like Callaghan Innovation.",
    regulatoryResearchTopics: [
      "Financial Markets Conduct Act 2013 (FMCA) crowd-funding provisions",
      "Licensed crowd-funding intermediary obligations under Financial Markets Authority (FMA)",
      "Exemptions under Schedule 1 of the FMCA for wholesale and eligible investors",
      "Retail investor warning statements and risk acknowledgment requirements",
    ],
    licensingConsiderations: [
      "Must hold a market services licence as a crowd-funding service provider granted by the FMA before operating any live marketplace",
      "Caps on non-prospectus retail crowd-funding (currently NZ$2 million in any 12-month period without a full Product Disclosure Statement)",
      "Strict anti-money laundering and countering financing of terrorism (AML/CFT) compliance reporting",
    ],
    currentResearchStatus:
      "Preliminary regulatory scoping underway. No licence application has been submitted to the FMA. Operating purely in mock educational simulation mode.",
    outstandingQuestions: [
      "Direct equity holding versus nominee/custodial syndicate structures under NZ corporate law",
      "Cross-border investor onboarding standards under NZ Fair Trading and Privacy legislation",
    ],
    sampleStartupsCount: 2,
  },
  US: {
    countryCode: "US",
    countryName: "United States",
    currency: "USD",
    currencySymbol: "$",
    status: "Under evaluation — not an available investment market",
    marketOverview:
      "The world's deepest venture capital market, with expansive angel syndicates, accelerators, and a mature regulatory pathway for retail startup investment.",
    potentialOpportunity:
      "Enabling everyday supporters to follow builder trajectories from first prototype commit to seed-stage capital allocation in a transparent network.",
    startupEcosystem:
      "Robust density in Silicon Valley, NYC, Austin, Seattle, Boston, with prolific open-source and developer tools venture interest.",
    regulatoryResearchTopics: [
      "SEC Regulation Crowdfunding (Reg CF) under Title III of the JOBS Act",
      "FINRA registration requirements for funding portals and broker-dealer partnerships",
      "Form C disclosure requirements, progress updates, and annual reporting mandates",
      "12-month rolling offering limit of $5,000,000 for Reg CF issuers",
    ],
    licensingConsiderations: [
      "Operating an investment platform requires registration as a FINRA-member Funding Portal or operating through a licensed broker-dealer intermediary",
      "Tiered investor commitment limits based on annual income and net worth for non-accredited individuals",
      "Mandatory third-party escrow or qualified custodian integration for investor funds during offerings",
    ],
    currentResearchStatus:
      "Legal assessment of broker-dealer API partnerships versus independent FINRA funding portal registration. Completely simulated interactive prototype.",
    outstandingQuestions: [
      "Safe Harbor compliance for network discovery feeds versus regulated investment solicitation",
      "Transfer agent integration and cap-table synchronization with Carta and Pulley",
    ],
    sampleStartupsCount: 2,
  },
  MY: {
    countryCode: "MY",
    countryName: "Malaysia",
    currency: "MYR",
    currencySymbol: "RM",
    status: "Under evaluation — not an available investment market",
    marketOverview:
      "Southeast Asia's pioneering regulated Equity Crowdfunding (ECF) market, backed by Malaysia Digital Economy Corporation (MDEC) and progressive tech policies.",
    potentialOpportunity:
      "Connecting ASEAN grassroots builders, halal-tech, Islamic FinTech, and B2B SaaS innovators with cross-regional angel and retail discovery.",
    startupEcosystem:
      "Dynamic innovation hubs centered around Cyberjaya, Bangsar South, and Penang, supported by Cradle Fund and MyStartup initiatives.",
    regulatoryResearchTopics: [
      "Securities Commission Malaysia (SC Malaysia) Guidelines on Recognized Markets (RMO)",
      "Registered Electronic Facility Operator requirements for Equity Crowdfunding platforms",
      "Investor categorization: Retail (RM5,000 limit per issuer / RM50,000 annual), Angel (RM500,000 annual), and Sophisticated investors",
      "Offering limits up to RM20 million cumulative capital through registered ECF platforms",
    ],
    licensingConsiderations: [
      "Formal approval and registration as a Recognized Market Operator (RMO-ECF) from the Securities Commission Malaysia is mandatory",
      "Shariah-compliance screening framework for Islamic equity offerings",
      "Local trust account maintenance with a licensed Malaysian financial institution for applicant subscriptions",
    ],
    currentResearchStatus:
      "Reviewing SC Malaysia RMO eligibility criteria and compliance standards. Demonstration prototype only.",
    outstandingQuestions: [
      "Cross-border currency conversion and central bank foreign exchange policy (Bank Negara Malaysia)",
      "Co-investment arrangements with government matching funds (e.g., MyCIF)",
    ],
    sampleStartupsCount: 2,
  },
};

export const DEMO_STARTUPS_SEED = [
  {
    slug: "kahu-biotech",
    name: "Kahu BioTech",
    tagline: "Marine kelp biomaterials replacing single-use petroleum polymers.",
    description:
      "Kahu BioTech cultivates native New Zealand macroalgae in coastal aquaculture belts to produce heat-resistant, home-compostable film packaging for food producers across Australasia.",
    country: "New Zealand",
    countryCode: "NZ",
    currency: "NZD",
    currencySymbol: "NZ$",
    industry: "CleanTech & BioMaterials",
    stage: "Seed",
    businessModel: "B2B Supply & Licensing",
    technologies: ["Biopolymer Chemistry", "IoT Ocean Sensors", "Automated Harvest Hardware"],
    founderName: "Aroha Henare",
    founderBio: "Former marine researcher at University of Auckland, 8 years bio-nanomaterials engineering.",
    website: "https://kahubiotech.example.nz",
    targetMarket: "Asia-Pacific FMCG Packaging ($14B TAM)",
    demoTargetAmount: 750000,
    demoRaisedAmount: 485000,
    demoMinTicket: 250,
    demoPreMoneyValuation: 4500000,
    demoPostMoneyValuation: 5250000,
    featured: true,
    published: true,
    updates: [
      {
        title: "Commercial Trial with 3 Regional Dairy Co-ops",
        body: "Completed 90-day cold-chain barrier testing with zero package degradation across 10,000 unit batch.",
        updateType: "MILESTONE",
        date: new Date(Date.now() - 12 * 86400000),
      },
      {
        title: "Callaghan Innovation R&D Grant Approved",
        body: "Awarded non-dilutive matching grant to expand marine lease monitoring array in Hauraki Gulf.",
        updateType: "TRACTION",
        date: new Date(Date.now() - 35 * 86400000),
      },
    ],
  },
  {
    slug: "taranaki-cleangrid",
    name: "Taranaki CleanGrid",
    tagline: "Geothermal micro-inverters and sub-surface energy mesh networks.",
    description:
      "Next-generation modular energy storage and high-temperature solid state inverters designed for distributed geothermal and localized micro-grids.",
    country: "New Zealand",
    countryCode: "NZ",
    currency: "NZD",
    currencySymbol: "NZ$",
    industry: "EnergyTech",
    stage: "Pre-Seed",
    businessModel: "Hardware + Industrial SaaS",
    technologies: ["Rust", "Embedded C++", "Wide-Bandgap Semiconductors", "Time-Series Telemetry"],
    founderName: "Callum MacIntyre",
    founderBio: "Hardware engineer, former grid systems lead at Meridian Energy.",
    website: "https://cleangrid.example.nz",
    targetMarket: "Island & Geothermal Microgrids ($3.2B TAM)",
    demoTargetAmount: 500000,
    demoRaisedAmount: 310000,
    demoMinTicket: 500,
    demoPreMoneyValuation: 3200000,
    demoPostMoneyValuation: 3700000,
    featured: false,
    published: true,
    updates: [
      {
        title: "First Pilot Live at Taupo Geothermal Cluster",
        body: "Continuous 2,000-hour telemetry test completed with 99.98% runtime in high sulfur environment.",
        updateType: "BETA_LAUNCH",
        date: new Date(Date.now() - 18 * 86400000),
      },
    ],
  },
  {
    slug: "vectorpulse-ai",
    name: "VectorPulse AI",
    tagline: "Sub-millisecond model observability and trace quantization on the edge.",
    description:
      "VectorPulse provides autonomous model drift detection, token-level latency attribution, and automated kernel quantization for multi-modal Gemma and LLM deployments on local Apple Silicon and serverless GPUs.",
    country: "United States",
    countryCode: "US",
    currency: "USD",
    currencySymbol: "$",
    industry: "AI Infrastructure",
    stage: "Seed",
    businessModel: "Developer SaaS & Enterprise On-Prem",
    technologies: ["Gemma 4", "C++20", "WebAssembly", "TypeScript", "ClickHouse", "eBPF"],
    founderName: "Elena Rostova",
    founderBio: "Ex-Google DeepMind engineer, author of popular open-source profiling libraries.",
    website: "https://vectorpulse.example.com",
    targetMarket: "AI Engineering & Observability ($8.5B TAM)",
    demoTargetAmount: 1200000,
    demoRaisedAmount: 940000,
    demoMinTicket: 100,
    demoPreMoneyValuation: 8500000,
    demoPostMoneyValuation: 9700000,
    featured: true,
    published: true,
    updates: [
      {
        title: "Gemma 4 Native Quantization Adapter Released",
        body: "Enables sub-10ms TTFT profiling on consumer M2/M3 chips with zero telemetry overhead.",
        updateType: "MILESTONE",
        date: new Date(Date.now() - 6 * 86400000),
      },
      {
        title: "Surpassed 12,000 Developer Installs",
        body: "Community CLI package downloads crossed 12k with 400+ active GitHub stargazers.",
        updateType: "TRACTION",
        date: new Date(Date.now() - 25 * 86400000),
      },
    ],
  },
  {
    slug: "omniroute-logistics",
    name: "OmniRoute Logistics",
    tagline: "Autonomous dispatch mesh for last-mile middle-market couriers.",
    description:
      "Dynamic routing engine utilizing real-time sensor fleets and predictive curb-space reservation to eliminate 35% of dwell time for urban delivery fleets.",
    country: "United States",
    countryCode: "US",
    currency: "USD",
    currencySymbol: "$",
    industry: "Supply Chain & Mobility",
    stage: "Seed",
    businessModel: "Usage-Based API",
    technologies: ["Go", "PostGIS", "Redis Streams", "React Native", "Kafka"],
    founderName: "Marcus Vance",
    founderBio: "12 years supply chain logistics, founded and exited courier fleet operator in Texas.",
    website: "https://omniroute.example.com",
    targetMarket: "Regional Urban Delivery Fleets ($19B TAM)",
    demoTargetAmount: 1000000,
    demoRaisedAmount: 620000,
    demoMinTicket: 250,
    demoPreMoneyValuation: 6000000,
    demoPostMoneyValuation: 7000000,
    featured: false,
    published: true,
    updates: [
      {
        title: "Austin Metro Pilot Expanded to 150 Vans",
        body: "Measured average fuel savings of 14.8% and customer satisfaction lift across 45,000 drops.",
        updateType: "MILESTONE",
        date: new Date(Date.now() - 14 * 86400000),
      },
    ],
  },
  {
    slug: "nusantara-agritrace",
    name: "Nusantara AgriTrace",
    tagline: "Satellite deforestation verification for Southeast Asian smallholder farms.",
    description:
      "Nusantara AgriTrace equips independent agricultural co-ops with verified satellite polygon mapping and mobile provenance receipts required for EUDR compliance.",
    country: "Malaysia",
    countryCode: "MY",
    currency: "MYR",
    currencySymbol: "RM",
    industry: "AgriTech & ESG",
    stage: "Seed",
    businessModel: "B2B SaaS per Hectare",
    technologies: ["Python", "Sentinel-2 Imagery", "Flutter", "PostgreSQL", "Solana Provenance"],
    founderName: "Zulkifli bin Ahmad",
    founderBio: "Former geospatial lead at Malaysian Space Agency (MYSA), agricultural economist.",
    website: "https://nusantara-agri.example.my",
    targetMarket: "ASEAN Smallholder Export Compliance ($4.1B TAM)",
    demoTargetAmount: 1500000,
    demoRaisedAmount: 1120000,
    demoMinTicket: 500,
    demoPreMoneyValuation: 7500000,
    demoPostMoneyValuation: 9000000,
    featured: true,
    published: true,
    updates: [
      {
        title: "Onboarded 4,200 Smallholder Farmers in Perak",
        body: "First bulk EUDR export certificate generated and cleared through Rotterdam customs.",
        updateType: "MILESTONE",
        date: new Date(Date.now() - 8 * 86400000),
      },
    ],
  },
  {
    slug: "batikpay-openfin",
    name: "BatikPay OpenFin",
    tagline: "Cross-border ASEAN micro-merchant QR and embedded wallet infrastructure.",
    description:
      "Enables roadside night market vendors and boutique artisans across Malaysia, Indonesia, and Thailand to accept instant cross-border DuitNow / QRIS payments with zero fee friction.",
    country: "Malaysia",
    countryCode: "MY",
    currency: "MYR",
    currencySymbol: "RM",
    industry: "FinTech & Payments",
    stage: "Pre-Seed",
    businessModel: "Micro-interchange & Merchant Credit Tools",
    technologies: ["Next.js", "Fastify", "PostgreSQL", "HSM Encryption", "WebAuthn"],
    founderName: "Mei-Ling Tan",
    founderBio: "FinTech product architect, previously senior technical lead at Grab Financial.",
    website: "https://batikpay.example.my",
    targetMarket: "ASEAN Informal Retail & MSMEs ($22B volume)",
    demoTargetAmount: 800000,
    demoRaisedAmount: 430000,
    demoMinTicket: 200,
    demoPreMoneyValuation: 4000000,
    demoPostMoneyValuation: 4800000,
    featured: false,
    published: true,
    updates: [
      {
        title: "Penang Heritage Market Pilot Launched",
        body: "120 artisan stalls processed over RM180,000 in tourist payments in first 30 days.",
        updateType: "BETA_LAUNCH",
        date: new Date(Date.now() - 20 * 86400000),
      },
    ],
  },
];

export async function ensureDemoStartupsSeeded(): Promise<void> {
  const count = await db.demoStartup.count();
  if (count > 0) return;

  console.log("[Invest] Seeding demo startup listings and milestone updates...");
  for (const startup of DEMO_STARTUPS_SEED) {
    const { updates, ...startupData } = startup;
    const created = await db.demoStartup.create({
      data: startupData,
    });
    for (const update of updates) {
      await db.demoStartupUpdate.create({
        data: {
          startupId: created.id,
          title: update.title,
          body: update.body,
          updateType: update.updateType,
          date: update.date,
        },
      });
    }
  }
  console.log(`[Invest] Successfully seeded ${DEMO_STARTUPS_SEED.length} demo startups across NZ, US, MY.`);
}

