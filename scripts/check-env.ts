/**
 * Ensures .env exists and OPENAI_API_KEY is set. Exits with a clear message otherwise.
 * Used by setup and eval scripts.
 */
import { existsSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env");

if (!existsSync(envPath)) {
  console.error("Error: .env not found. Copy .env.example to .env and set OPENAI_API_KEY.");
  console.error("  cp .env.example .env");
  process.exit(1);
}

// Bun loads .env automatically when running scripts; we need to check the file content
const content = await Bun.file(envPath).text();
const hasKey = /OPENAI_API_KEY=.+/.test(content.replace(/#.*/g, "").trim());

if (!hasKey) {
  console.error("Error: .env exists but OPENAI_API_KEY is empty or missing.");
  console.error("Set OPENAI_API_KEY in .env (see .env.example).");
  process.exit(1);
}
