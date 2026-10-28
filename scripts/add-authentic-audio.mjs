import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { AUTHENTIC_PRODUCTS } from "./download-authentic-demos.mjs";

const ffmpeg = "./node_modules/ffmpeg-static/ffmpeg";
const demosDir = "apps/web/public/media/demos";

// High-impact narration scripts introducing the product and founders
const PRODUCT_NARRATIONS = {
  lazygit: {
    voice: "Samantha",
    rate: 180,
    text: "Meet Lazygit, built by Jesse Duffield. Lazygit is a fast, keyboard-driven terminal UI for git commands written in Go. Stage hunks, resolve merge conflicts, and navigate your branch tree with intuitive keyboard shortcuts."
  },
  vhs: {
    voice: "Daniel",
    rate: 180,
    text: "This is VHS, built by Christian Rocha and Maas Lalani at Charm. Write a simple script, and VHS automatically records pixel-perfect terminal demos and GIFs for your product documentation."
  },
  starship: {
    voice: "Samantha",
    rate: 180,
    text: "Meet Starship, created by Matchai. The cross-shell prompt written in Rust that displays git status, package versions, and system context with blazing speed."
  },
  atuin: {
    voice: "Samantha",
    rate: 180,
    text: "This is Atuin, built by Ellie Huxtable. Atuin replaces your default shell history with an encrypted, searchable SQLite database synced securely across all your machines."
  },
  nushell: {
    voice: "Daniel",
    rate: 180,
    text: "Meet Nushell, founded by Yehuda Katz and Jonathan Turner. A modern shell with structured data pipelines, typed tables, and cross-platform productivity."
  },
  affine: {
    voice: "Daniel",
    rate: 180,
    text: "Meet AFFiNE, the open source, privacy-first workspace for notes, docs, and whiteboards. Built by the AFFiNE team, bringing offline-first speed and multimodal canvas collaboration to modern builders."
  },
  sketchybar: {
    voice: "Samantha",
    rate: 180,
    text: "This is SketchyBar, created by Felix Krasnow. A highly customizable, scriptable macOS status bar replacement with dynamic event updates and shell integrations."
  },
  zellij: {
    voice: "Daniel",
    rate: 180,
    text: "Meet Zellij, created by Aram Drevekenin. A modern terminal workspace and multiplexer written in Rust with built-in layouts, plugins, and collaborative sessions."
  },
  novu: {
    voice: "Samantha",
    rate: 180,
    text: "This is Novu, the open source notification infrastructure for developers, built by Dima Grossman and the Novu team. Connect in-app feeds, email, SMS, and push notifications with one unified workflow engine."
  },
  promptfoo: {
    voice: "Daniel",
    rate: 180,
    text: "Meet Promptfoo, founded by Ian Webster. The leading open source CLI and testing library to benchmark, red-team, and evaluate large language model output quality and security."
  },
  gum: {
    voice: "Samantha",
    rate: 180,
    text: "This is Gum, built by Charmbracelet. Create glamorous, interactive shell scripts and CLI prompts with zero boilerplate."
  },
  freeze: {
    voice: "Samantha",
    rate: 180,
    text: "Meet Freeze, created by Charm. Generate beautiful, styled code screenshots and terminal snapshots with custom themes and syntax highlighting."
  },
  mods: {
    voice: "Daniel",
    rate: 180,
    text: "This is Mods, built by Charmbracelet. Bring AI into your command line pipelines to summarize text, format code, and transform data on the fly."
  },
  pop: {
    voice: "Samantha",
    rate: 180,
    text: "Meet Pop, built by Maas Lalani at Charm. Send and read emails directly from your terminal using clean templates and Unix pipes."
  },
  lazydocker: {
    voice: "Daniel",
    rate: 180,
    text: "This is Lazydocker, built by Jesse Duffield. A simple terminal UI for managing Docker containers, images, volumes, and service logs in real time."
  },
  glow: {
    voice: "Samantha",
    rate: 180,
    text: "Meet Glow, created by Charm. A markdown reader for the terminal with beautiful syntax themes and stash support."
  },
  huh: {
    voice: "Daniel",
    rate: 180,
    text: "This is Huh, built by Maas Lalani at Charm. A lightweight, accessible terminal forms and prompt library for Go developers."
  },
  bubbletea: {
    voice: "Samantha",
    rate: 180,
    text: "Meet Bubble Tea, created by Christian Rocha at Charm. The Elm-inspired framework for building rich, interactive terminal user interfaces in Go."
  },
  bubbles: {
    voice: "Daniel",
    rate: 180,
    text: "This is Bubbles, the official TUI component library for Bubble Tea, built by Charm. Includes spinners, paginators, text inputs, and tables."
  },
  zoxide: {
    voice: "Samantha",
    rate: 180,
    text: "Meet Zoxide, created by Ajeet D'Souza. A smarter cd command written in Rust that learns your habits and lets you jump across directories with a few keystrokes."
  },
  gitui: {
    voice: "Daniel",
    rate: 180,
    text: "This is GitUI, built by Stephan Dilly. A blazing-fast, terminal-based git interface written in Rust with vim keybindings and responsive diffs."
  },
  bottom: {
    voice: "Samantha",
    rate: 180,
    text: "Meet Bottom, created by Clement Tsang. A customizable graphical system monitor for your terminal inspired by top and htop, written in Rust."
  },
  dust: {
    voice: "Daniel",
    rate: 180,
    text: "This is Dust, built by Andy Boot. An intuitive du alternative in Rust that gives you an instant graphical overview of your disk usage."
  },
  xh: {
    voice: "Samantha",
    rate: 180,
    text: "Meet XH, built by David Peter. A friendly and fast command-line HTTP client written in Rust with syntax highlighting and automatic JSON formatting."
  },
  hyperfine: {
    voice: "Daniel",
    rate: 180,
    text: "This is Hyperfine, created by David Peter. A command-line benchmarking tool with statistical analysis, warmup runs, and export options."
  },
  croc: {
    voice: "Samantha",
    rate: 180,
    text: "Meet Croc, built by Zack Scholl. Securely transfer files and folders between any two computers using end-to-end encryption and simple code phrases."
  },
  "open-webui": {
    voice: "Daniel",
    rate: 180,
    text: "This is Open WebUI, founded by Timothy J. Baek. An extensible, feature-rich self-hosted interface for local and cloud AI models."
  },
  crush: {
    voice: "Samantha",
    rate: 180,
    text: "Meet Crush, the modern terminal workspace and productivity tool built for developers to organize workflows seamlessly."
  }
};

function getVideoDuration(filePath) {
  try {
    const out = execSync(`${ffmpeg} -i "${filePath}" 2>&1 | grep "Duration"`).toString();
    const m = out.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)/);
    if (m) {
      return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
    }
  } catch {}
  return 0;
}

function getAudioDuration(filePath) {
  try {
    const out = execSync(`${ffmpeg} -i "${filePath}" 2>&1 | grep "Duration"`).toString();
    const m = out.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)/);
    if (m) {
      return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
    }
  } catch {}
  return 0;
}

async function main() {
  console.log(`Starting audio synthesis and muxing for ${AUTHENTIC_PRODUCTS.length} products...`);
  const tmpDir = "/tmp/ps_audio";
  fs.mkdirSync(tmpDir, { recursive: true });

  let processedCount = 0;

  for (const prod of AUTHENTIC_PRODUCTS) {
    const videoFile = path.join(demosDir, `${prod.slug}.mp4`);
    if (!fs.existsSync(videoFile)) {
      console.warn(`Video file not found: ${videoFile}`);
      continue;
    }

    const narration = PRODUCT_NARRATIONS[prod.slug] || {
      voice: "Samantha",
      rate: 180,
      text: `Meet ${prod.name}, built by ${prod.founderName}. ${prod.pitch}.`
    };

    const voiceWav = path.join(tmpDir, `${prod.slug}_voice.wav`);
    const tempMuxed = path.join(tmpDir, `${prod.slug}_muxed.mp4`);

    console.log(`\nSynthesizing voice for ${prod.name} (${prod.slug}) using voice "${narration.voice}"...`);
    execSync(`say --data-format=LEF32@44100 -r ${narration.rate} -v "${narration.voice}" "${narration.text}" -o "${voiceWav}"`);

    const videoDur = getVideoDuration(videoFile);
    const audioDur = getAudioDuration(voiceWav);
    console.log(`  Video duration: ${videoDur.toFixed(2)}s, Audio duration: ${audioDur.toFixed(2)}s`);

    if (videoDur < audioDur + 0.5) {
      // Loop video enough times to cover audio duration + small tail
      const loopCount = Math.ceil((audioDur + 1.0) / Math.max(videoDur, 1)) + 1;
      console.log(`  Video shorter than voiceover. Looping ${loopCount} times...`);
      execSync(
        `${ffmpeg} -y -stream_loop ${loopCount} -i "${videoFile}" -i "${voiceWav}" ` +
        `-c:v copy -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart "${tempMuxed}"`,
        { stdio: "ignore" }
      );
    } else {
      // Video is long enough: mux audio alongside original video
      console.log(`  Muxing audio into video...`);
      execSync(
        `${ffmpeg} -y -i "${videoFile}" -i "${voiceWav}" ` +
        `-c:v copy -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart "${tempMuxed}"`,
        { stdio: "ignore" }
      );
    }

    // Replace original video with muxed version
    fs.copyFileSync(tempMuxed, videoFile);
    fs.unlinkSync(tempMuxed);
    fs.unlinkSync(voiceWav);

    // Verify audio stream exists
    const streamInfo = execSync(`${ffmpeg} -i "${videoFile}" 2>&1 | grep "Stream #"`).toString();
    const hasAudio = streamInfo.includes("Audio: aac");
    console.log(`  Done: ${hasAudio ? "✓ AAC audio stream verified" : "✗ Audio stream missing!"}`);
    processedCount++;
  }

  console.log(`\nSuccessfully processed and added audio to all ${processedCount} product demo reels!`);
}

main().catch(err => {
  console.error("Audio generation failed:", err);
  process.exit(1);
});
