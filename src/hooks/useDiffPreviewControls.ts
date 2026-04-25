import { useState } from "react";
import type { DocName } from "../types";

const allPatchFilesSelected: Record<DocName, boolean> = {
  "proposal.md": true,
  "design.md": true,
  "tasks.md": true,
};

const defaultExpandedDiffFiles: Record<DocName, boolean> = {
  "proposal.md": true,
  "design.md": false,
  "tasks.md": false,
};

export function useDiffPreviewControls() {
  const [selectedPatchFiles, setSelectedPatchFiles] = useState<Record<DocName, boolean>>(allPatchFilesSelected);
  const [expandedDiffFiles, setExpandedDiffFiles] = useState<Record<DocName, boolean>>(defaultExpandedDiffFiles);

  function resetDiffPreviewControls() {
    setSelectedPatchFiles(allPatchFilesSelected);
    setExpandedDiffFiles(defaultExpandedDiffFiles);
  }

  function togglePatchFile(name: DocName) {
    setSelectedPatchFiles((current) => ({ ...current, [name]: !current[name] }));
  }

  function toggleDiffFile(name: DocName) {
    setExpandedDiffFiles((current) => ({ ...current, [name]: !current[name] }));
  }

  return {
    expandedDiffFiles,
    resetDiffPreviewControls,
    selectedPatchFiles,
    toggleDiffFile,
    togglePatchFile,
  };
}
