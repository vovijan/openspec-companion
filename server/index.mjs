import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import { createServer as createViteServer } from "vite";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const isProd = process.argv.includes("--prod") || process.env.NODE_ENV === "production";
const port = Number(process.env.PORT ?? 5173);
const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.post("/api/generate-change", async (req, res) => {
  const { idea, context } = req.body ?? {};

  if (!idea || typeof idea !== "string") {
    res.status(400).json({ error: "Idea is required." });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(503).json({ error: "OPENAI_API_KEY is not configured." });
    return;
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "You generate OpenSpec change drafts for software projects. Return only valid JSON with keys: id, summary, proposal, design, tasks. The id must be kebab-case, <=64 chars. proposal/design/tasks must be markdown strings for proposal.md, design.md, tasks.md. Keep the drafts concrete, implementation-aware, and reviewable.",
        },
        {
          role: "user",
          content: JSON.stringify({
            idea,
            project: {
              name: context?.projectName ?? "Unknown project",
              projectMd: truncate(context?.projectMd),
              readme: truncate(context?.readme),
              existingChanges: Array.isArray(context?.existingChanges) ? context.existingChanges.slice(0, 80) : [],
            },
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "openspec_change_draft",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["id", "summary", "proposal", "design", "tasks"],
            properties: {
              id: { type: "string" },
              summary: { type: "string" },
              proposal: { type: "string" },
              design: { type: "string" },
              tasks: { type: "string" },
            },
          },
        },
      },
    });

    const parsed = JSON.parse(response.output_text ?? "{}");
    res.json({
      id: normalizeChangeId(parsed.id || idea),
      summary: String(parsed.summary || idea),
      docs: {
        "proposal.md": ensureHeading(String(parsed.proposal || ""), "Proposal"),
        "design.md": ensureHeading(String(parsed.design || ""), "Design"),
        "tasks.md": ensureHeading(String(parsed.tasks || ""), "Tasks"),
      },
      source: "openai",
      model,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not generate OpenSpec draft." });
  }
});

app.post("/api/improve-change", async (req, res) => {
  const { action, change, context } = req.body ?? {};

  if (!action || typeof action !== "string" || !change?.docs) {
    res.status(400).json({ error: "Action and change docs are required." });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(503).json({ error: "OPENAI_API_KEY is not configured." });
    return;
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "You improve an existing OpenSpec change. Return only valid JSON with keys: summary, proposal, design, tasks. Preserve the user's intent, keep markdown concise, concrete, implementation-aware, and reviewable. Do not invent unrelated product scope.",
        },
        {
          role: "user",
          content: JSON.stringify({
            action,
            change: {
              id: change.id,
              summary: change.summary,
              docs: change.docs,
            },
            context: {
              projectName: context?.projectName ?? "Unknown project",
              projectMd: truncate(context?.projectMd),
              readme: truncate(context?.readme),
              existingChanges: Array.isArray(context?.existingChanges) ? context.existingChanges.slice(0, 80) : [],
              existingSpecs: Array.isArray(context?.existingSpecs) ? context.existingSpecs.slice(0, 80) : [],
            },
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "openspec_change_improvement",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["summary", "proposal", "design", "tasks"],
            properties: {
              summary: { type: "string" },
              proposal: { type: "string" },
              design: { type: "string" },
              tasks: { type: "string" },
            },
          },
        },
      },
    });

    const parsed = JSON.parse(response.output_text ?? "{}");
    res.json({
      summary: String(parsed.summary || change.summary || change.id),
      docs: {
        "proposal.md": ensureHeading(String(parsed.proposal || change.docs["proposal.md"] || ""), "Proposal"),
        "design.md": ensureHeading(String(parsed.design || change.docs["design.md"] || ""), "Design"),
        "tasks.md": ensureHeading(String(parsed.tasks || change.docs["tasks.md"] || ""), "Tasks"),
      },
      source: "openai",
      model,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not improve OpenSpec change." });
  }
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

function truncate(value, max = 6000) {
  if (!value || typeof value !== "string") {
    return "";
  }

  return value.length > max ? `${value.slice(0, max)}\n\n[truncated]` : value;
}

function normalizeChangeId(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function ensureHeading(value, heading) {
  const trimmed = value.trim();
  if (!trimmed) {
    return `# ${heading}\n`;
  }

  return trimmed.startsWith("#") ? `${trimmed}\n` : `# ${heading}\n\n${trimmed}\n`;
}
