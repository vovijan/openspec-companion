import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateChangeDraft, getProviderConfig, getProviderId, improveChange, reviewChange } from "./ai-providers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const isProd = process.argv.includes("--prod") || process.env.NODE_ENV === "production";
const port = Number(process.env.PORT ?? 5173);

const app = express();
app.use(express.json({ limit: "1mb" }));

app.post("/api/generate-change", async (req, res) => {
  const { idea, context, provider } = req.body ?? {};

  if (!idea || typeof idea !== "string") {
    res.status(400).json({ error: "Idea is required." });
    return;
  }

  try {
    res.json(await generateChangeDraft({ idea, context, provider }));
  } catch (error) {
    console.error(error);
    res.status(error.status ?? 500).json({
      error: error.status === 503 ? error.message : "Could not generate OpenSpec draft.",
      provider: getProviderId(provider),
    });
  }
});

app.post("/api/improve-change", async (req, res) => {
  const { action, change, context, provider } = req.body ?? {};

  if (!action || typeof action !== "string" || !change?.docs) {
    res.status(400).json({ error: "Action and change docs are required." });
    return;
  }

  try {
    res.json(await improveChange({ action, change, context, provider }));
  } catch (error) {
    console.error(error);
    res.status(error.status ?? 500).json({
      error: error.status === 503 ? error.message : "Could not improve OpenSpec change.",
      provider: getProviderId(provider),
    });
  }
});

app.post("/api/review-change", async (req, res) => {
  const { change, context, health, provider } = req.body ?? {};

  if (!change?.docs) {
    res.status(400).json({ error: "Change docs are required." });
    return;
  }

  try {
    res.json(await reviewChange({ change, context, health, provider }));
  } catch (error) {
    console.error(error);
    res.status(error.status ?? 500).json({
      error: error.status === 503 ? error.message : "Could not review OpenSpec change.",
      provider: getProviderId(provider),
    });
  }
});

app.get("/api/ai-providers", (_req, res) => {
  res.json({
    providers: ["openai", "openrouter", "anthropic"].map((id) => {
      const config = getProviderConfig(id);
      return {
        id,
        label: config.label,
        configured: Boolean(process.env[config.apiKeyEnv]),
        model: process.env[config.modelEnv] ?? config.defaultModel,
      };
    }),
  });
});

if (isProd) {
  app.use(express.static(resolve(root, "dist")));
  app.get(/.*/, async (_req, res) => {
    res.type("html").send(await readFile(resolve(root, "dist", "index.html"), "utf8"));
  });
} else {
  const vite = await createViteServer({
    root,
    server: { middlewareMode: true, host: "127.0.0.1" },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.listen(port, "127.0.0.1", () => {
  console.log(`OpenSpec Companion running at http://127.0.0.1:${port}`);
});
