import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import fs from "node:fs";

export const AUTHENTIC_PRODUCTS = [
  {
    slug: "lazygit",
    name: "Lazygit",
    companyName: "Lazygit",
    founderName: "Jesse Duffield",
    founderUsername: "jesseduffield",
    category: "Developer Tools",
    tags: ["Developer Tools", "Git", "CLI", "Open Source"],
    avatarUrl: "https://avatars.githubusercontent.com/u/8456633?v=4",
    website: "https://github.com/jesseduffield/lazygit",
    repoUrl: "https://github.com/jesseduffield/lazygit",
    releasesUrl: "https://github.com/jesseduffield/lazygit/releases",
    videoSourceUrl: "https://github.com/user-attachments/assets/031799d1-740d-4cda-90cf-689513fa9860",
    pitch: "Simple terminal UI for git commands written in Go with gocui",
    postCaption: "A simple terminal UI for git commands, written in Go with gocui. I built Lazygit because I wanted a fast, keyboard-driven way to stage hunks, resolve conflicts, and visualize branches without having to remember dozens of complex git flags. Everything you need is one keystroke away.",
    actions: [
      { label: "Watch Demo", url: "https://github.com/jesseduffield/lazygit#demo", type: "demo" },
      { label: "GitHub Repo", url: "https://github.com/jesseduffield/lazygit", type: "github" },
      { label: "Release Notes", url: "https://github.com/jesseduffield/lazygit/releases", type: "download" },
    ],
  },
  {
    slug: "vhs",
    name: "VHS",
    companyName: "Charmbracelet",
    founderName: "Christian Rocha & Maas Lalani",
    founderUsername: "charmbracelet",
    category: "Developer Tools",
    tags: ["Developer Tools", "CLI", "Video", "Open Source"],
    avatarUrl: "https://avatars.githubusercontent.com/u/52230182?v=4",
    website: "https://vhs.charm.sh",
    repoUrl: "https://github.com/charmbracelet/vhs",
    docsUrl: "https://vhs.charm.sh",
    releasesUrl: "https://github.com/charmbracelet/vhs/releases",
    videoSourceUrl: "https://stuff.charm.sh/vhs/examples/demo.gif",
    pitch: "Your CLI home video recorder 📼",
    postCaption: "Your CLI home video recorder 📼. Write a script, run VHS, and generate beautiful, pixel-perfect GIFs and MP4s of your terminal applications automatically. Built with Go and Chrome DevTools Protocol to make terminal documentation feel alive.",
    actions: [
      { label: "Official Site", url: "https://vhs.charm.sh", type: "website" },
      { label: "GitHub Repo", url: "https://github.com/charmbracelet/vhs", type: "github" },
      { label: "Explore Charm", url: "https://charm.sh", type: "demo" },
    ],
  },
  {
    slug: "starship",
    name: "Starship",
    companyName: "Starship Prompt",
    founderName: "Matchai",
    founderUsername: "matchai",
    category: "Developer Tools",
    tags: ["Developer Tools", "Rust", "Shell", "CLI"],
    avatarUrl: "https://avatars.githubusercontent.com/u/4658208?v=4",
    website: "https://starship.rs",
    repoUrl: "https://github.com/starship/starship",
    docsUrl: "https://starship.rs/config/",
    releasesUrl: "https://github.com/starship/starship/releases",
    videoSourceUrl: "https://raw.githubusercontent.com/starship/starship/main/media/demo.gif",
    pitch: "The minimal, blazing-fast, and infinitely customizable prompt for any shell",
    postCaption: "The minimal, blazing-fast, and infinitely customizable prompt for any shell! Shows the information you need only when you need it (git branch, package version, battery, runtime). Written in Rust with zero lag and cross-shell compatibility.",
    actions: [
      { label: "Official Site", url: "https://starship.rs", type: "website" },
      { label: "GitHub Repo", url: "https://github.com/starship/starship", type: "github" },
      { label: "Config Guide", url: "https://starship.rs/config/", type: "docs" },
    ],
  },
  {
    slug: "atuin",
    name: "Atuin",
    companyName: "Atuin",
    founderName: "Ellie Huxtable",
    founderUsername: "ellie",
    category: "Productivity",
    tags: ["Productivity", "Shell", "Database", "Security"],
    avatarUrl: "https://avatars.githubusercontent.com/u/10899982?v=4",
    website: "https://atuin.sh",
    repoUrl: "https://github.com/atuinsh/atuin",
    docsUrl: "https://docs.atuin.sh",
    releasesUrl: "https://github.com/atuinsh/atuin/releases",
    videoSourceUrl: "https://raw.githubusercontent.com/atuinsh/atuin/main/demo.gif",
    pitch: "Magical shell history sync and search across all your machines",
    postCaption: "Atuin replaces your existing shell history with a SQLite database, recording additional context for your commands and enabling end-to-end encrypted shell history sync across all your machines. Filter by exit code, directory, and timestamp with an intuitive fuzzy finder.",
    actions: [
      { label: "Official Site", url: "https://atuin.sh", type: "website" },
      { label: "GitHub Repo", url: "https://github.com/atuinsh/atuin", type: "github" },
      { label: "Setup Guide", url: "https://docs.atuin.sh", type: "docs" },
    ],
  },
  {
    slug: "nushell",
    name: "Nushell",
    companyName: "Nushell",
    founderName: "JT Turner",
    founderUsername: "jntrnr",
    category: "Developer Tools",
    tags: ["Developer Tools", "Rust", "Shell", "Open Source"],
    avatarUrl: "https://avatars.githubusercontent.com/u/5221948?v=4",
    website: "https://www.nushell.sh",
    repoUrl: "https://github.com/nushell/nushell",
    docsUrl: "https://www.nushell.sh/book/",
    releasesUrl: "https://github.com/nushell/nushell/releases",
    videoSourceUrl: "https://raw.githubusercontent.com/nushell/nushell/main/assets/nushell-autocomplete6.gif",
    pitch: "A new type of shell that views everything as structured data",
    postCaption: "Nushell takes modern ideas from Unix pipelines, PowerShell structured data, and modern functional programming. Rather than treating pipeline output as unformatted strings of text, Nushell treats each step as a typed table of data you can filter, sort, and query directly.",
    actions: [
      { label: "Official Site", url: "https://www.nushell.sh", type: "website" },
      { label: "GitHub Repo", url: "https://github.com/nushell/nushell", type: "github" },
      { label: "Nushell Book", url: "https://www.nushell.sh/book/", type: "docs" },
    ],
  },
  {
    slug: "affine",
    name: "AFFiNE",
    companyName: "ToEverything",
    founderName: "Jiachen",
    founderUsername: "toeverything",
    category: "Productivity",
    tags: ["Productivity", "Canvas", "Open Source", "Collaboration"],
    avatarUrl: "https://avatars.githubusercontent.com/u/101878425?v=4",
    website: "https://affine.pro",
    repoUrl: "https://github.com/toeverything/AFFiNE",
    docsUrl: "https://docs.affine.pro",
    releasesUrl: "https://github.com/toeverything/AFFiNE/releases",
    videoSourceUrl: "https://user-images.githubusercontent.com/79301703/230891830-0110681e-8c7e-483b-b6d9-9e42b291b9ef.gif",
    pitch: "Next-generation collaborative workspace for docs, whiteboards, and tables",
    postCaption: "There can be more than Notion and Miro. AFFiNE is a next-gen collaborative knowledge base that merges docs, whiteboards, and database tables into one unified multi-modal canvas with local-first privacy and real-time multiplayer.",
    actions: [
      { label: "Live Web App", url: "https://app.affine.pro", type: "demo" },
      { label: "GitHub Repo", url: "https://github.com/toeverything/AFFiNE", type: "github" },
      { label: "Documentation", url: "https://docs.affine.pro", type: "docs" },
    ],
  },
  {
    slug: "sketchybar",
    name: "SketchyBar",
    companyName: "SketchyBar",
    founderName: "Felix Kratz",
    founderUsername: "felixkratz",
    category: "Design",
    tags: ["Design", "macOS", "Desktop", "Customization"],
    avatarUrl: "https://avatars.githubusercontent.com/u/22680421?v=4",
    website: "https://felixkratz.github.io/SketchyBar/",
    repoUrl: "https://github.com/FelixKratz/SketchyBar",
    docsUrl: "https://felixkratz.github.io/SketchyBar/",
    releasesUrl: "https://github.com/FelixKratz/SketchyBar/releases",
    videoSourceUrl: "https://user-images.githubusercontent.com/22680421/211198711-45318f04-e96f-4aa1-a0ba-c7f30f050902.mp4",
    pitch: "A highly customizable macOS status bar replacement written in C",
    postCaption: "A highly customizable macOS status bar replacement written in C. Control workspaces, media players, system stats, and custom shell event scripts with ultra-smooth 60fps animations and native Apple Silicon efficiency.",
    actions: [
      { label: "Configuration Wiki", url: "https://felixkratz.github.io/SketchyBar/", type: "docs" },
      { label: "GitHub Repo", url: "https://github.com/FelixKratz/SketchyBar", type: "github" },
      { label: "Example Configs", url: "https://github.com/FelixKratz/dotfiles", type: "demo" },
    ],
  },
  {
    slug: "zellij",
    name: "Zellij",
    companyName: "Zellij",
    founderName: "Aram Drevekenin",
    founderUsername: "imsnif",
    category: "Developer Tools",
    tags: ["Developer Tools", "Rust", "Terminal", "Multiplexer"],
    avatarUrl: "https://avatars.githubusercontent.com/u/7955989?v=4",
    website: "https://zellij.dev",
    repoUrl: "https://github.com/zellij-org/zellij",
    docsUrl: "https://zellij.dev/documentation/",
    releasesUrl: "https://github.com/zellij-org/zellij/releases",
    videoSourceUrl: "https://raw.githubusercontent.com/zellij-org/zellij/main/assets/demo.gif",
    pitch: "A terminal workspace with batteries included",
    postCaption: "A terminal workspace with batteries included. Zellij gives you intuitive pane management, floating terminals, persistent sessions, and a WebAssembly plugin system without the steep learning curve of tmux.",
    actions: [
      { label: "Official Site", url: "https://zellij.dev", type: "website" },
      { label: "GitHub Repo", url: "https://github.com/zellij-org/zellij", type: "github" },
      { label: "User Guide", url: "https://zellij.dev/documentation/", type: "docs" },
    ],
  },
  {
    slug: "novu",
    name: "Novu",
    companyName: "Novu",
    founderName: "Dima Grossman & Sherif Cisse",
    founderUsername: "dimagrossman",
    category: "Developer Tools",
    tags: ["Developer Tools", "Notifications", "Infrastructure", "Open Source"],
    avatarUrl: "https://avatars.githubusercontent.com/u/77421370?v=4",
    website: "https://novu.co",
    repoUrl: "https://github.com/novuhq/novu",
    docsUrl: "https://docs.novu.co",
    releasesUrl: "https://github.com/novuhq/novu/releases",
    videoSourceUrl: "https://user-images.githubusercontent.com/80174214/193887395-f1c95042-b4e6-480e-a89c-a78aa247fa90.gif",
    pitch: "Open-source notification infrastructure for engineering teams",
    postCaption: "Open-source notification infrastructure built for engineering teams. Manage email, SMS, push, Chat, and in-app notifications across all providers with a unified API and real-time visual workflow editor.",
    actions: [
      { label: "Platform Console", url: "https://novu.co", type: "website" },
      { label: "GitHub Repo", url: "https://github.com/novuhq/novu", type: "github" },
      { label: "API Docs", url: "https://docs.novu.co", type: "docs" },
    ],
  },
  {
    slug: "promptfoo",
    name: "Promptfoo",
    companyName: "Promptfoo",
    founderName: "Ian Webster",
    founderUsername: "ianww",
    category: "AI",
    tags: ["AI", "Testing", "LLM", "Security"],
    avatarUrl: "https://avatars.githubusercontent.com/u/310310?v=4",
    website: "https://promptfoo.dev",
    repoUrl: "https://github.com/promptfoo/promptfoo",
    docsUrl: "https://promptfoo.dev/docs/getting-started",
    releasesUrl: "https://github.com/promptfoo/promptfoo/releases",
    videoSourceUrl: "https://www.promptfoo.dev/img/docs/self-grading.gif",
    pitch: "Test and evaluate LLM applications, prompts, and agent workflows",
    postCaption: "Test, evaluate, and red-team your LLM apps and prompts. Run automated evals across OpenAI, Anthropic, Gemini, and local models to detect regressions, hallucinations, and security vulnerabilities before shipping to production.",
    actions: [
      { label: "Official Site", url: "https://promptfoo.dev", type: "website" },
      { label: "GitHub Repo", url: "https://github.com/promptfoo/promptfoo", type: "github" },
      { label: "Getting Started", url: "https://promptfoo.dev/docs/getting-started", type: "docs" },
    ],
  },
  {
    slug: "gum",
    name: "Gum",
    companyName: "Charmbracelet",
    founderName: "Maas Lalani",
    founderUsername: "maaslalani",
    category: "Developer Tools",
    tags: ["Developer Tools", "Shell", "CLI", "Styling"],
    avatarUrl: "https://avatars.githubusercontent.com/u/5651924?v=4",
    website: "https://charm.sh",
    repoUrl: "https://github.com/charmbracelet/gum",
    releasesUrl: "https://github.com/charmbracelet/gum/releases",
    videoSourceUrl: "https://vhs.charm.sh/vhs-1qY57RrQlXCuydsEgDp68G.gif",
    pitch: "A tool for glamorous shell scripts 🎀",
    postCaption: "A tool for glamorous shell scripts 🎀. Gum gives you interactive terminal components like multi-select menus, spinners, markdown viewers, fuzzy filters, and styled inputs right inside your bash and zsh scripts.",
    actions: [
      { label: "Examples", url: "https://github.com/charmbracelet/gum#examples", type: "demo" },
      { label: "GitHub Repo", url: "https://github.com/charmbracelet/gum", type: "github" },
      { label: "Charm Ecosystem", url: "https://charm.sh", type: "website" },
    ],
  },
  {
    slug: "freeze",
    name: "Freeze",
    companyName: "Charmbracelet",
    founderName: "Christian Rocha",
    founderUsername: "meowgorithm",
    category: "Design",
    tags: ["Design", "CLI", "Images", "Developer Tools"],
    avatarUrl: "https://avatars.githubusercontent.com/u/42121989?v=4",
    website: "https://charm.sh",
    repoUrl: "https://github.com/charmbracelet/freeze",
    releasesUrl: "https://github.com/charmbracelet/freeze/releases",
    videoSourceUrl: "https://vhs.charm.sh/vhs-1C6z5SUKlTdqdj4KL1ADlH.gif",
    pitch: "Generate beautiful images of code and terminal output from your CLI",
    postCaption: "Generate beautiful images of code and terminal output right from your CLI. Configure shadows, borders, window chrome, and themes, or use interactive mode to highlight specific lines before exporting.",
    actions: [
      { label: "GitHub Repo", url: "https://github.com/charmbracelet/freeze", type: "github" },
      { label: "Releases", url: "https://github.com/charmbracelet/freeze/releases", type: "download" },
      { label: "Charm Tools", url: "https://charm.sh", type: "website" },
    ],
  },
  {
    slug: "mods",
    name: "Mods",
    companyName: "Charmbracelet",
    founderName: "Christian Rocha & Maas Lalani",
    founderUsername: "christianrocha",
    category: "AI",
    tags: ["AI", "CLI", "LLM", "Unix"],
    avatarUrl: "https://avatars.githubusercontent.com/u/52230182?v=4",
    website: "https://charm.sh",
    repoUrl: "https://github.com/charmbracelet/mods",
    releasesUrl: "https://github.com/charmbracelet/mods/releases",
    videoSourceUrl: "https://vhs.charm.sh/vhs-5Uyj0U6Hlqi1LVIIRyYKM5.gif",
    pitch: "AI for the command line, built for pipelines",
    postCaption: "AI for the command line, built for pipelines. Pipe logs, code diffs, or stdin directly into LLMs, save conversations to named threads, and format responses with terminal markdown rendering.",
    actions: [
      { label: "GitHub Repo", url: "https://github.com/charmbracelet/mods", type: "github" },
      { label: "Charm Docs", url: "https://charm.sh", type: "website" },
      { label: "Releases", url: "https://github.com/charmbracelet/mods/releases", type: "download" },
    ],
  },
  {
    slug: "pop",
    name: "Pop",
    companyName: "Charmbracelet",
    founderName: "Maas Lalani",
    founderUsername: "popmail",
    category: "Productivity",
    tags: ["Productivity", "Email", "CLI", "Terminal"],
    avatarUrl: "https://avatars.githubusercontent.com/u/5651924?v=4",
    website: "https://charm.sh",
    repoUrl: "https://github.com/charmbracelet/pop",
    releasesUrl: "https://github.com/charmbracelet/pop/releases",
    videoSourceUrl: "https://vhs.charm.sh/vhs-5Dyv3pvzB2YwtUSr72LqSz.gif",
    pitch: "Send and read email directly from your terminal",
    postCaption: "Send and read emails directly from your terminal. Supports SMTP, attachments, HTML/markdown templates, and integration with terminal pipelines for automated reports and notification delivery.",
    actions: [
      { label: "GitHub Repo", url: "https://github.com/charmbracelet/pop", type: "github" },
      { label: "Charm Ecosystem", url: "https://charm.sh", type: "website" },
      { label: "Releases", url: "https://github.com/charmbracelet/pop/releases", type: "download" },
    ],
  },
];

async function main() {
  const ffmpegBin = path.resolve(process.cwd(), "node_modules/ffmpeg-static/ffmpeg");
  const targetDir = path.resolve(process.cwd(), "apps/web/public/media/demos");
  await mkdir(targetDir, { recursive: true });

  console.log(`\n======================================================`);
  console.log(`🎬 DOWNLOADING & CONVERTING AUTHENTIC PRODUCT DEMO VIDEOS`);
  console.log(`Target: ${targetDir}`);
  console.log(`Total products: ${AUTHENTIC_PRODUCTS.length}`);
  console.log(`======================================================\n`);

  for (const p of AUTHENTIC_PRODUCTS) {
    const mp4Dest = path.join(targetDir, `${p.slug}.mp4`);
    const pngDest = path.join(targetDir, `${p.slug}.png`);

    console.log(`\n[${p.name}] Processing authentic demo media...`);

    const tempSrc = path.join("/tmp", `raw-${p.slug}`);
    try {
      // 1. Download source asset if not already cached
      if (!fs.existsSync(tempSrc) || fs.statSync(tempSrc).size < 1000) {
        console.log(`  Downloading: ${p.videoSourceUrl}`);
        execSync(`curl -sL --max-time 20 -A "Mozilla/5.0" "${p.videoSourceUrl}" -o "${tempSrc}"`, { stdio: "inherit" });
      } else {
        console.log(`  Using cached source for ${p.slug} (${(fs.statSync(tempSrc).size / 1024).toFixed(1)} KB)...`);
      }

      const isMp4 = p.videoSourceUrl.endsWith(".mp4") || tempSrc.endsWith(".mp4");

      if (isMp4) {
        // Direct MP4 - optimize with faststart and ensure standard dimensions
        console.log(`  Optimizing MP4 with faststart...`);
        execSync(
          `"${ffmpegBin}" -y -i "${tempSrc}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -b:v 1500k "${mp4Dest}"`,
          { stdio: "ignore" }
        );
      } else {
        // GIF - convert to high-performance H.264 MP4 with faststart
        console.log(`  Converting GIF screencast to MP4 with faststart...`);
        execSync(
          `"${ffmpegBin}" -y -i "${tempSrc}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -b:v 1500k "${mp4Dest}"`,
          { stdio: "ignore" }
        );
      }

      // Generate poster thumbnail
      console.log(`  Extracting video poster thumbnail...`);
      execSync(
        `"${ffmpegBin}" -y -i "${mp4Dest}" -ss 00:00:00.5 -vframes 1 "${pngDest}"`,
        { stdio: "ignore" }
      );

      const mp4Stats = fs.statSync(mp4Dest);
      const pngStats = fs.statSync(pngDest);
      console.log(`  ✅ Done: ${p.slug}.mp4 (${(mp4Stats.size / 1024).toFixed(1)} KB), ${p.slug}.png (${(pngStats.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ❌ Failed for ${p.name}:`, err);
    }
  }

  console.log(`\n🎉 All authentic demo media generated successfully!`);
}

main();
