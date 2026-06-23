import { useCallback, useEffect, useState } from "react";

import { supabase } from "../lib/supabaseClient";
import { normalizeWardrobeAnalysis } from "../utils/normalizeWardrobeAnalysis";
import { validateWardrobeImage } from "../utils/wardrobeImageStorage";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Could not read the selected image."));
        return;
      }

      const commaIndex = result.indexOf(",");

      if (commaIndex === -1) {
        reject(new Error("The selected image is invalid."));
        return;
      }

      resolve(result.slice(commaIndex + 1));
    };

    reader.onerror = () => {
      reject(new Error("Could not read the selected image."));
    };

    reader.readAsDataURL(file);
  });
}

async function readErrorPayload(response) {
  if (!response || typeof response.clone !== "function") {
    return null;
  }

  try {
    return await response.clone().json();
  } catch {
    try {
      const text = await response.clone().text();
      return text ? { error: text } : null;
    } catch {
      return null;
    }
  }
}

async function getFunctionError(error) {
  const payload = await readErrorPayload(error?.context);
  const status = Number(error?.context?.status) || null;

  return {
    message:
      typeof payload?.error === "string" && payload.error.trim()
        ? payload.error
        : typeof error?.message === "string" && error.message.trim()
          ? error.message
          : "The jacket could not be analyzed.",
    code:
      typeof payload?.code === "string" && payload.code.trim()
        ? payload.code
        : "analysis_failed",
    provider:
      typeof payload?.provider === "string" && payload.provider.trim()
        ? payload.provider
        : null,
    status,
    retryable: payload?.retryable === true,
    availableProviders: Array.isArray(payload?.availableProviders)
      ? payload.availableProviders
      : null,
  };
}

function useWardrobeImageAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle");
  const [analysisError, setAnalysisError] = useState("");
  const [analysisRetryable, setAnalysisRetryable] = useState(false);
  const [analysisProviders, setAnalysisProviders] = useState([
    "gemini",
    "manual",
  ]);
  const [analysisProvider, setAnalysisProviderState] = useState("gemini");

  const loadProviders = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "analyze-wardrobe-item",
        { body: { action: "providers" } }
      );

      if (error || !data?.success) {
        return;
      }

      const providers = Array.isArray(data.providers)
        ? data.providers
        : ["gemini", "manual"];

      setAnalysisProviders(providers);

      const nextDefault = providers.includes(data.defaultProvider)
        ? data.defaultProvider
        : providers.find((provider) => provider !== "manual") || "manual";

      setAnalysisProviderState((current) =>
        providers.includes(current) ? current : nextDefault
      );
    } catch {
      // Provider discovery is optional. Gemini/manual defaults remain usable.
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProviders();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadProviders]);

  const setAnalysisProvider = (provider) => {
    if (!analysisProviders.includes(provider)) {
      return;
    }

    setAnalysisProviderState(provider);
    setAnalysis(null);
    setAnalysisError("");
    setAnalysisRetryable(false);
    setAnalysisStatus("idle");
  };

  const analyzeImage = async (
    file,
    categoryHint = "jacket",
    providerOverride = null
  ) => {
    void categoryHint;

    if (!file) {
      setAnalysisError("Select an image first.");
      setAnalysisStatus("error");
      return null;
    }

    const validation = validateWardrobeImage(file);

    if (!validation.valid) {
      setAnalysisError(validation.error);
      setAnalysisStatus("error");
      return null;
    }

    const provider = providerOverride || analysisProvider;

    if (provider === "manual") {
      setAnalysis(null);
      setAnalysisError("");
      setAnalysisRetryable(false);
      setAnalysisStatus("manual");
      return null;
    }

    setAnalysis(null);
    setAnalysisError("");
    setAnalysisRetryable(false);
    setAnalysisStatus("analyzing");

    try {
      const imageBase64 = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke(
        "analyze-wardrobe-item",
        {
          body: {
            action: "analyze",
            imageBase64,
            mimeType: file.type,
            categoryHint: "jacket",
            provider,
          },
        }
      );

      if (error) {
        throw error;
      }

      if (!data?.success || !data?.analysis) {
        throw new Error(
          data?.error || "The jacket could not be identified."
        );
      }

      if (Array.isArray(data.availableProviders)) {
        setAnalysisProviders(data.availableProviders);
      }

      const normalized = normalizeWardrobeAnalysis(data.analysis);
      const result = {
        ...normalized,
        category: "jacket",
        provider: data.provider || provider,
        model: data.model || null,
        analysisVersion: data.analysisVersion || "phase10-v1",
        originalAiJson: data.rawResponse || data.analysis,
      };

      setAnalysis(result);
      setAnalysisProviderState(result.provider);
      setAnalysisStatus("success");
      return result;
    } catch (error) {
      const details = await getFunctionError(error);

      console.error("Jacket analysis failed:", {
        message: details.message,
        code: details.code,
        provider: details.provider,
        status: details.status,
        retryable: details.retryable,
      });

      if (details.availableProviders) {
        setAnalysisProviders(details.availableProviders);
      }

      setAnalysisError(details.message);
      setAnalysisRetryable(details.retryable);
      setAnalysisStatus("error");
      return null;
    }
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setAnalysisError("");
    setAnalysisRetryable(false);
    setAnalysisStatus("idle");
  };

  return {
    analysis,
    analysisStatus,
    analysisError,
    analysisRetryable,
    analysisProviders,
    analysisProvider,
    setAnalysisProvider,
    loadProviders,
    analyzeImage,
    resetAnalysis,
  };
}

export default useWardrobeImageAnalysis;
