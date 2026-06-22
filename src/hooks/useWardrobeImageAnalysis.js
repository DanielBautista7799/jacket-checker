import { useState } from "react";

import { supabase } from "../lib/supabaseClient";
import { normalizeWardrobeAnalysis } from "../utils/normalizeWardrobeAnalysis";
import { validateClosetImage } from "../utils/uploadClosetImage";

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
if (!(response instanceof Response)) {
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

async function getFunctionErrorMessage(error) {
const payload = await readErrorPayload(error?.context);

if (typeof payload?.error === "string" && payload.error.trim()) {
return payload.error;
}

if (typeof error?.message === "string" && error.message.trim()) {
return error.message;
}

return "The wardrobe item could not be analyzed.";
}

function useWardrobeImageAnalysis() {
const [analysis, setAnalysis] = useState(null);
const [analysisStatus, setAnalysisStatus] = useState("idle");
const [analysisError, setAnalysisError] = useState("");

const analyzeImage = async (file, categoryHint = null) => {
if (!file) {
    setAnalysisError("Select an image first.");
    setAnalysisStatus("error");
    return null;
}

const validation = validateClosetImage(file);

if (!validation.valid) {
    setAnalysisError(validation.error);
    setAnalysisStatus("error");
    return null;
}

setAnalysis(null);
setAnalysisError("");
setAnalysisStatus("analyzing");

try {
    const imageBase64 = await fileToBase64(file);

    const { data, error } = await supabase.functions.invoke(
    "analyze-wardrobe-item",
    {
        body: {
        imageBase64,
        mimeType: file.type,
        categoryHint,
        },
    }
    );

    if (error) {
    throw error;
    }

    if (!data?.success || !data?.analysis) {
    throw new Error(
        data?.error || "The wardrobe item could not be identified."
    );
    }

    const normalized = normalizeWardrobeAnalysis(data.analysis);
    const result = {
    ...normalized,
    provider: data.provider || "gemini",
    model: data.model || null,
    originalAiJson: data.analysis,
    };

    setAnalysis(result);
    setAnalysisStatus("success");
    return result;
} catch (error) {
    console.error("Wardrobe analysis failed:", error);

    const message = await getFunctionErrorMessage(error);
    setAnalysisError(message);
    setAnalysisStatus("error");
    return null;
}
};

const resetAnalysis = () => {
setAnalysis(null);
setAnalysisError("");
setAnalysisStatus("idle");
};

return {
analysis,
analysisStatus,
analysisError,
analyzeImage,
resetAnalysis,
};
}

export default useWardrobeImageAnalysis;