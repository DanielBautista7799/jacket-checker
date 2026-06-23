import { useEffect, useMemo, useState } from "react";
import { Download, Plus, RefreshCw, Save, Upload } from "lucide-react";
import TrendPreviewPanel from "../components/TrendPreviewPanel.jsx";
import TrendRuleCard from "../components/TrendRuleCard.jsx";
import useProfile from "../hooks/useProfile.js";
import useStyleTrends from "../hooks/useStyleTrends.js";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-3 text-sm text-white outline-none focus:border-violet-400/60";

const EMPTY_FORM = {
  id: null,
  name: "",
  slug: "",
  description: "",
  seasons: "spring, fall",
  climate_tags: "mild, transitional",
  style_tags: "streetwear",
  jacket_subtypes: "",
  color_families: "",
  fit_tags: "",
  material_tags: "",
  subtle: "",
  balanced: "",
  source_label: "Internal seasonal style research",
  source_date: new Date().toISOString().slice(0, 10),
  starts_at: new Date().toISOString().slice(0, 10),
  expires_at: "2030-12-31",
  weight: "0.6",
  is_active: true,
};

function csv(value) {
  return String(value || "").split(",").map((entry) => entry.trim()).filter(Boolean);
}

function dateInput(value) {
  return value ? String(value).slice(0, 10) : "";
}

function toForm(rule) {
  return {
    id: rule.id || null,
    name: rule.name || "",
    slug: rule.slug || "",
    description: rule.description || "",
    seasons: (rule.seasons || []).join(", "),
    climate_tags: (rule.climate_tags || []).join(", "),
    style_tags: (rule.style_tags || []).join(", "),
    jacket_subtypes: (rule.jacket_subtypes || []).join(", "),
    color_families: (rule.color_families || []).join(", "),
    fit_tags: (rule.fit_tags || []).join(", "),
    material_tags: (rule.material_tags || []).join(", "),
    subtle: (rule.suggestion_phrases?.subtle || []).join("\n"),
    balanced: (rule.suggestion_phrases?.balanced || []).join("\n"),
    source_label: rule.source_label || "Internal seasonal style research",
    source_date: dateInput(rule.source_date),
    starts_at: dateInput(rule.starts_at),
    expires_at: dateInput(rule.expires_at),
    weight: String(rule.weight ?? 0.6),
    is_active: rule.is_active !== false,
  };
}

function toPayload(form) {
  return {
    ...(form.id ? { id: form.id } : {}),
    name: form.name.trim(),
    slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    description: form.description.trim(),
    seasons: csv(form.seasons),
    climate_tags: csv(form.climate_tags),
    style_tags: csv(form.style_tags),
    jacket_subtypes: csv(form.jacket_subtypes),
    color_families: csv(form.color_families),
    fit_tags: csv(form.fit_tags),
    material_tags: csv(form.material_tags),
    suggestion_phrases: {
      subtle: String(form.subtle).split("\n").map((entry) => entry.trim()).filter(Boolean),
      balanced: String(form.balanced).split("\n").map((entry) => entry.trim()).filter(Boolean),
    },
    source_label: form.source_label.trim(),
    source_date: form.source_date || null,
    starts_at: form.starts_at ? new Date(`${form.starts_at}T00:00:00Z`).toISOString() : null,
    expires_at: form.expires_at ? new Date(`${form.expires_at}T23:59:59Z`).toISOString() : null,
    weight: Number(form.weight),
    is_active: form.is_active,
  };
}

export default function DeveloperTrendsPage() {
  const { profile } = useProfile();
  const { rules, trendSource, adminAction, fetchTrendRules } = useStyleTrends();
  const [adminRules, setAdminRules] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [importText, setImportText] = useState("");
  const [filterNow] = useState(() => Date.now());

  const loadAdminRules = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await adminAction("list");
      setAdminRules(result.rules || []);
    } catch (error) {
      setMessage(error.message || "Could not load admin trend rules.");
      setAdminRules(rules);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadAdminRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleRules = useMemo(() => {
    return adminRules.filter((rule) => {
      if (filter === "all") return true;
      if (filter === "inactive") return !rule.is_active;
      const starts = rule.starts_at ? new Date(rule.starts_at).getTime() : null;
      const expires = rule.expires_at ? new Date(rule.expires_at).getTime() : null;
      if (filter === "upcoming") return rule.is_active && starts && starts > filterNow;
      if (filter === "expired") return rule.is_active && expires && expires < filterNow;
      return rule.is_active && (!starts || starts <= filterNow) && (!expires || expires >= filterNow);
    });
  }, [adminRules, filter, filterNow]);

  const saveRule = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await adminAction(form.id ? "update" : "create", toPayload(form));
      setForm(EMPTY_FORM);
      await loadAdminRules();
      await fetchTrendRules({ force: true });
      setMessage("Trend rule saved.");
    } catch (error) {
      setMessage(error.message || "Could not save the trend rule.");
    } finally {
      setBusy(false);
    }
  };

  const toggleRule = async (rule) => {
    setBusy(true);
    setMessage("");
    try {
      await adminAction(rule.is_active ? "disable" : "enable", { id: rule.id });
      await loadAdminRules();
      await fetchTrendRules({ force: true });
    } catch (error) {
      setMessage(error.message || "Could not update the rule.");
    } finally {
      setBusy(false);
    }
  };

  const exportRules = () => {
    const safeRules = adminRules.map((rule) => {
      const safeRule = { ...rule };
      delete safeRule.created_by;
      delete safeRule.updated_by;
      return safeRule;
    });
    const blob = new Blob([JSON.stringify(safeRules, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "style-trend-rules.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importRules = async () => {
    setBusy(true);
    setMessage("");
    try {
      const parsed = JSON.parse(importText);
      await adminAction("import", { rules: parsed });
      setImportText("");
      await loadAdminRules();
      await fetchTrendRules({ force: true });
      setMessage("Trend rules imported.");
    } catch (error) {
      setMessage(error.message || "Could not import the trend JSON.");
    } finally {
      setBusy(false);
    }
  };

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-violet-400/20 bg-violet-400/10 p-5">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-200">Developer-only trends</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-white">Trend rule studio</h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-300">
          Manage seasonal style language without scraping, shopping, prices, brands, or external links. Current source: {trendSource}.
        </p>
      </div>

      {message && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">{message}</div>
      )}

      <TrendPreviewPanel rules={rules} profile={profile} />

      <form onSubmit={saveRule} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-white">{form.id ? "Edit trend rule" : "Create trend rule"}</h2>
          {form.id && (
            <button type="button" onClick={() => setForm(EMPTY_FORM)} className="text-sm font-black text-slate-400 hover:text-white">Cancel edit</button>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input required placeholder="Rule name" value={form.name} onChange={(event) => update("name", event.target.value)} className={inputClass} />
          <input required placeholder="rule-slug" value={form.slug} onChange={(event) => update("slug", event.target.value)} className={inputClass} />
          <textarea placeholder="Description" value={form.description} onChange={(event) => update("description", event.target.value)} className={`${inputClass} md:col-span-2`} />
          <input placeholder="Styles: streetwear, minimal" value={form.style_tags} onChange={(event) => update("style_tags", event.target.value)} className={inputClass} />
          <input placeholder="Seasons: spring, fall" value={form.seasons} onChange={(event) => update("seasons", event.target.value)} className={inputClass} />
          <input placeholder="Climate tags" value={form.climate_tags} onChange={(event) => update("climate_tags", event.target.value)} className={inputClass} />
          <input placeholder="Jacket subtypes" value={form.jacket_subtypes} onChange={(event) => update("jacket_subtypes", event.target.value)} className={inputClass} />
          <input placeholder="Color families" value={form.color_families} onChange={(event) => update("color_families", event.target.value)} className={inputClass} />
          <input placeholder="Fit tags" value={form.fit_tags} onChange={(event) => update("fit_tags", event.target.value)} className={inputClass} />
          <input placeholder="Material tags" value={form.material_tags} onChange={(event) => update("material_tags", event.target.value)} className={inputClass} />
          <input placeholder="Source label" value={form.source_label} onChange={(event) => update("source_label", event.target.value)} className={inputClass} />
          <textarea required placeholder="Subtle phrases, one per line" value={form.subtle} onChange={(event) => update("subtle", event.target.value)} className={`${inputClass} min-h-28`} />
          <textarea required placeholder="Balanced phrases, one per line" value={form.balanced} onChange={(event) => update("balanced", event.target.value)} className={`${inputClass} min-h-28`} />
          <label className="text-sm text-slate-300">Source date<input type="date" value={form.source_date} onChange={(event) => update("source_date", event.target.value)} className={`mt-1 ${inputClass}`} /></label>
          <label className="text-sm text-slate-300">Weight<input type="number" min="0" max="1" step="0.05" value={form.weight} onChange={(event) => update("weight", event.target.value)} className={`mt-1 ${inputClass}`} /></label>
          <label className="text-sm text-slate-300">Starts<input type="date" value={form.starts_at} onChange={(event) => update("starts_at", event.target.value)} className={`mt-1 ${inputClass}`} /></label>
          <label className="text-sm text-slate-300">Expires<input type="date" value={form.expires_at} onChange={(event) => update("expires_at", event.target.value)} className={`mt-1 ${inputClass}`} /></label>
        </div>

        <label className="mt-4 flex items-center gap-3 text-sm font-bold text-white">
          <input type="checkbox" checked={form.is_active} onChange={(event) => update("is_active", event.target.checked)} className="h-4 w-4 accent-violet-400" /> Active
        </label>

        <button disabled={busy} type="submit" className="mt-5 flex items-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 font-black text-white hover:bg-violet-400 disabled:opacity-50">
          {form.id ? <Save size={17} /> : <Plus size={17} />}
          {form.id ? "Save changes" : "Create rule"}
        </button>
      </form>

      <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {["all", "active", "upcoming", "expired", "inactive"].map((value) => (
              <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full px-3 py-2 text-xs font-black capitalize ${filter === value ? "bg-violet-500 text-white" : "bg-white/[0.05] text-slate-300"}`}>{value}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={loadAdminRules} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-black text-white"><RefreshCw size={15} /> Refresh</button>
            <button type="button" onClick={exportRules} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-black text-white"><Download size={15} /> Export</button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {visibleRules.map((rule) => (
            <TrendRuleCard key={rule.id || rule.slug} rule={rule} busy={busy} onEdit={(selected) => setForm(toForm(selected))} onToggle={toggleRule} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
        <div className="flex items-center gap-2 text-white"><Upload size={18} /><h2 className="font-black">Import validated rule JSON</h2></div>
        <textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder='[{"name":"..."}]' className={`${inputClass} mt-4 min-h-36 font-mono`} />
        <button type="button" disabled={!importText.trim() || busy} onClick={importRules} className="mt-3 rounded-xl bg-sky-500 px-4 py-3 font-black text-white disabled:opacity-50">Import rules</button>
      </section>
    </section>
  );
}
