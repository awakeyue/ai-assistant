"use client";

import { useEffect } from "react";
import { useModelStore } from "@/store/chat";

/**
 * Client component to initialize model list once on app mount.
 * Only fetches if modelList is empty.
 */
export default function ModelInitializer() {
  const { modelList, fetchModels } = useModelStore();

  useEffect(() => {
    if (modelList.length === 0) {
      fetchModels();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
