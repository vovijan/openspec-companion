import OpenAI from "openai";

const providerConfigs = {
  openai: {
    label: "OpenAI",
    apiKeyEnv: "OPENAI_API_KEY",
    modelEnv: "OPENAI_MODEL",
    defaultModel: "gpt-5.4-mini",
    baseURL: undefined,
  },
  openrouter: {
    label: "OpenRouter",
    apiKeyEnv: "OPENROUTER_API_KEY",
    modelEnv: "OPENROUTER_MODEL",
    defaultModel: "anthropic/claude-sonnet-4",
    baseURL: "https://openrouter.ai/api/v1",
  },
  anthropic: {
    label: "Anthropic",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    modelEnv: "ANTHROPIC_MODEL",
    defaultModel: "claude-sonnet-4-20250514",
  },
};

const draftSchema = {
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
};

const improvementSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "proposal", "design", "tasks"],
  properties: {
    summary: { type: "string" },
    proposal: { type: "string" },
    design: { type: "string" },
    tasks: { type: "string" },
  },
};

export function getProviderId(value) {
  return typeof value === "string" && providerConfigs[value] ? value : "openai";
}

export function getProviderConfig(provider) {
  return providerConfigs[getProviderId(provider)];
}

export async function generateChangeDraft({ idea, context, provider }) {
  const providerId = getProviderId(provider);
  const config = providerConfigs[providerId];
  const model = process.env[config.modelEnv] ?? config.defaultModel;
  const projectPayload = {
    idea,
    project: {
      name: context?.projectName ?? "Unknown project",
      projectMd: truncate(context?.projectMd),
      readme: truncate(context?.readme),
      existingChanges: Array.isArray(context?.existingChanges) ? context.existingChanges.slice(0, 80) : [],
    },
  };
  const parsed = await requestStructuredJson({
    provider: providerId,
    model,
    schema: draftSchema,
    schemaName: "openspec_change_draft",
    system:
      "You generate OpenSpec change drafts for software projects. Return only valid JSON with keys: id, summary, proposal, design, tasks. The id must be kebab-case, <=64 chars. proposal/design/tasks must be markdown strings for proposal.md, design.md, tasks.md. Keep the drafts concrete, implementation-aware, and reviewable.",
    user: JSON.stringify(projectPayload),
  });

  return {
    id: normalizeChangeId(parsed.id || idea),
    summary: String(parsed.summary || idea),
    docs: {
      "proposal.md": ensureHeading(String(parsed.proposal || ""), "Proposal"),
      "design.md": ensureHeading(String(parsed.design || ""), "Design"),
      "tasks.md": ensureHeading(String(parsed.tasks || ""), "Tasks"),
    },
    source: providerId,
    model,
  };
}

export async function improveChange({ action, change, context, provider }) {
  const providerId = getProviderId(provider);
  const config = providerConfigs[providerId];
  const model = process.env[config.modelEnv] ?? config.defaultModel;
  const parsed = await requestStructuredJson({
    provider: providerId,
    model,
    schema: improvementSchema,
    schemaName: "openspec_change_improvement",
    system:
      "You improve an existing OpenSpec change. Return only valid JSON with keys: summary, proposal, design, tasks. Preserve the user's intent, keep markdown concise, concrete, implementation-aware, and reviewable. Do not invent unrelated product scope.",
    user: JSON.stringify({
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
  });

  return {
    summary: String(parsed.summary || change.summary || change.id),
    docs: {
      "proposal.md": ensureHeading(String(parsed.proposal || change.docs["proposal.md"] || ""), "Proposal"),
      "design.md": ensureHeading(String(parsed.design || change.docs["design.md"] || ""), "Design"),
      "tasks.md": ensureHeading(String(parsed.tasks || change.docs["tasks.md"] || ""), "Tasks"),
    },
    source: providerId,
    model,
  };
}

async function requestStructuredJson({ provider, model, schema, schemaName, system, user }) {
  const config = providerConfigs[provider];
  const apiKey = process.env[config.apiKeyEnv];

  if (!apiKey) {
    const error = new Error(`${config.apiKeyEnv} is not configured.`);
    error.status = 503;
    throw error;
  }

  if (provider === "anthropic") {
    return requestAnthropicJson({ apiKey, model, system, user });
  }

  return requestOpenAiCompatibleJson({ apiKey, baseURL: config.baseURL, model, schema, schemaName, system, user });
}

async function requestOpenAiCompatibleJson({ apiKey, baseURL, model, schema, schemaName, system, user }) {
  const client = new OpenAI({
    apiKey,
    baseURL,
    defaultHeaders: baseURL?.includes("openrouter.ai")
      ? {
          "HTTP-Referer": "http://127.0.0.1:5173",
          "X-Title": "OpenSpec Companion",
        }
      : undefined,
  });
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: schemaName,
        strict: true,
        schema,
      },
    },
  });
  const content = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}

async function requestAnthropicJson({ apiKey, model, system, user }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages: [
        {
          role: "user",
          content: `${user}\n\nReturn JSON only. Do not wrap the JSON in markdown fences.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = new Error(await readAnthropicError(response));
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  const text = payload.content?.find((item) => item.type === "text")?.text ?? "{}";
  return JSON.parse(extractJson(text));
}

async function readAnthropicError(response) {
  try {
    const payload = await response.json();
    return payload.error?.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

function extractJson(value) {
  const trimmed = String(value).trim();
  if (trimmed.startsWith("{")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  return start >= 0 && end > start ? trimmed.slice(start, end + 1) : "{}";
}

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
