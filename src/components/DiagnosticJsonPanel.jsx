import { Check, Clipboard, FileJson2 } from "lucide-react";
import { useState } from "react";

import { buildSanitizedDiagnosticJson } from "../utils/buildRecommendationDiagnostics.js";

function DiagnosticJsonPanel({ diagnostics }) {
  const [copied, setCopied] = useState(false);

  if (!diagnostics) {
    return null;
  }

  const diagnosticJson = buildSanitizedDiagnosticJson(diagnostics);

  const copyDiagnostics = async () => {
    try {
      await navigator.clipboard.writeText(diagnosticJson);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error("Could not copy diagnostics:", error);
      setCopied(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileJson2 size={19} className="text-purple-300" />
          <div>
            <h3 className="font-black text-white">
              Sanitized diagnostic JSON
            </h3>
            <p className="text-xs text-slate-500">
              No coordinates, emails, tokens, keys, or image data.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={copyDiagnostics}
          className="flex items-center gap-2 rounded-xl border border-purple-400/30 bg-purple-400/10 px-3 py-2 text-sm font-black text-purple-100 transition hover:bg-purple-400/20"
        >
          {copied ? <Check size={16} /> : <Clipboard size={16} />}
          {copied ? "Copied" : "Copy JSON"}
        </button>
      </div>

      <details>
        <summary className="cursor-pointer text-sm font-bold text-sky-300">
          View diagnostic snapshot
        </summary>
        <pre className="mt-4 max-h-[34rem] overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-slate-300">
          {diagnosticJson}
        </pre>
      </details>
    </section>
  );
}

export default DiagnosticJsonPanel;
