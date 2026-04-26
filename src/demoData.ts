import type { SpecChange } from "./types";

export const demoChanges: SpecChange[] = [
  {
    id: "add-openspec-companion",
    status: "draft",
    summary: "Create a local companion app for OpenSpec changes.",
    updatedAt: "Today",
    docs: {
      "proposal.md":
        "# Proposal\n\nBuild a focused desktop-style interface for managing OpenSpec changes in local repositories.\n\n## Why\n\nOpenSpec work is durable, but editing files by hand can slow down quick iterations.\n\n## What Changes\n\n- Browse existing changes\n- Review proposal, design, and tasks in one workspace\n- Generate a first draft from a short idea\n- Validate missing sections before implementation\n",
      "design.md":
        "# Design\n\nThe app reads the selected repository through the browser File System Access API.\n\n## Flow\n\n1. Select a local project folder.\n2. Locate `openspec/changes`.\n3. Render each change as a navigable workspace.\n4. Write generated drafts back to the selected folder.\n",
      "tasks.md":
        "# Tasks\n\n- [x] Create project shell\n- [x] Read changes\n- [ ] Generate change draft\n- [ ] Validate required docs\n- [ ] Archive completed changes\n",
    },
  },
  {
    id: "improve-change-validation",
    status: "ready",
    summary: "Add stricter checks for empty docs and missing task checkboxes.",
    updatedAt: "Yesterday",
    docs: {
      "proposal.md": "# Proposal\n\nWarn when a change has no problem statement or impact description.\n",
      "design.md": "# Design\n\nValidation runs locally and reports actionable messages in the inspector.\n",
      "tasks.md": "# Tasks\n\n- [x] Define checks\n- [x] Show validation results\n",
    },
  },
];
