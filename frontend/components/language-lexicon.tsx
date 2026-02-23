"use client";

import { useState, useRef, useCallback } from "react";
import { ArrowLeft, Plus, ShieldCheck, Globe, Check, X, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLexicon } from "@/lib/lexicon-context";
import {
  CUBE_GROUPS,
  DEFAULT_ENGLISH_TRANSLATIONS,
  type LexiconLanguage,
} from "@/lib/lexicon-data";

// ─── Sub-view type ───────────────────────────────────────────────

type LexiconView = "list" | "editor" | "propose" | "approvals";

// ─── Props ───────────────────────────────────────────────────────

interface LanguageLexiconProps {
  userEmail?: string;
}

// ─── Completeness badge color ────────────────────────────────────

function completenessColor(percent: number): string {
  if (percent > 80) return "bg-green-500/20 text-green-400";
  if (percent >= 20) return "bg-yellow-500/20 text-yellow-400";
  return "bg-muted text-muted-foreground";
}

// ─── Main component ──────────────────────────────────────────────

export function LanguageLexicon({ userEmail }: LanguageLexiconProps) {
  const {
    languages,
    translations,
    getLanguageCompleteness,
    getPendingLanguages,
    updateTranslation,
    bulkUpdateTranslations,
    proposeLanguage,
    approveLanguage,
    rejectLanguage,
    isAdmin,
    t,
  } = useLexicon();

  const [view, setView] = useState<LexiconView>("list");
  const [editingLang, setEditingLang] = useState<string | null>(null);
  const [cubeFilter, setCubeFilter] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const admin = isAdmin(userEmail);
  const pending = getPendingLanguages();

  // Navigate to language editor
  const openEditor = useCallback((code: string) => {
    setEditingLang(code);
    setCubeFilter(null);
    setView("editor");
  }, []);

  if (!expanded) {
    return (
      <section>
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/50"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t("cube1.settings.language_lexicon")}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {languages.filter((l) => l.status === "approved").length} {t("cube1.settings.languages_count")}
          </span>
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Globe className="h-4 w-4" />
          {t("cube1.settings.language_lexicon")}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setExpanded(false)}
        >
          {t("cube1.settings.collapse")}
        </Button>
      </div>

      {view === "list" && (
        <LanguageListView
          languages={languages}
          getLanguageCompleteness={getLanguageCompleteness}
          pendingCount={pending.length}
          isAdmin={admin}
          onSelectLanguage={openEditor}
          onPropose={() => setView("propose")}
          onApprovals={() => setView("approvals")}
        />
      )}

      {view === "editor" && editingLang && (
        <TranslationEditorView
          langCode={editingLang}
          language={languages.find((l) => l.code === editingLang)!}
          translations={translations}
          cubeFilter={cubeFilter}
          setCubeFilter={setCubeFilter}
          getLanguageCompleteness={getLanguageCompleteness}
          updateTranslation={updateTranslation}
          bulkUpdateTranslations={bulkUpdateTranslations}
          onBack={() => {
            setView("list");
            setEditingLang(null);
          }}
        />
      )}

      {view === "propose" && (
        <ProposeLanguageView
          proposeLanguage={proposeLanguage}
          userEmail={userEmail}
          onBack={() => setView("list")}
        />
      )}

      {view === "approvals" && admin && (
        <PendingApprovalsView
          pending={pending}
          approveLanguage={approveLanguage}
          rejectLanguage={rejectLanguage}
          userEmail={userEmail!}
          onBack={() => setView("list")}
        />
      )}
    </section>
  );
}

// ─── Language List View ──────────────────────────────────────────

interface LanguageListViewProps {
  languages: LexiconLanguage[];
  getLanguageCompleteness: (code: string) => { filled: number; total: number; percent: number };
  pendingCount: number;
  isAdmin: boolean;
  onSelectLanguage: (code: string) => void;
  onPropose: () => void;
  onApprovals: () => void;
}

function LanguageListView({
  languages,
  getLanguageCompleteness,
  pendingCount,
  isAdmin,
  onSelectLanguage,
  onPropose,
  onApprovals,
}: LanguageListViewProps) {
  const { t } = useLexicon();
  // Show approved first, then pending
  const sorted = [...languages].sort((a, b) => {
    if (a.status === "approved" && b.status !== "approved") return -1;
    if (a.status !== "approved" && b.status === "approved") return 1;
    return a.nameEn.localeCompare(b.nameEn);
  });

  return (
    <div className="space-y-2">
      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs flex items-center gap-1"
          onClick={onPropose}
        >
          <Plus className="h-3 w-3" />
          {t("cube1.settings.propose_new")}
        </Button>
        {isAdmin && pendingCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs flex items-center gap-1"
            onClick={onApprovals}
          >
            <ShieldCheck className="h-3 w-3" />
            {t("cube1.settings.pending_approvals")} ({pendingCount})
          </Button>
        )}
      </div>

      {/* Language list */}
      <div className="max-h-64 overflow-y-auto space-y-1 rounded-md border border-border">
        {sorted
          .filter((l) => l.status !== "rejected")
          .map((lang) => {
            const { percent } = getLanguageCompleteness(lang.code);
            return (
              <button
                key={lang.code}
                onClick={() => onSelectLanguage(lang.code)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium truncate">{lang.nameNative}</span>
                  <span className="text-muted-foreground text-xs truncate">
                    ({lang.nameEn})
                  </span>
                  {lang.status === "pending" && (
                    <span className="shrink-0 rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] text-yellow-400">
                      Pending
                    </span>
                  )}
                </div>
                <span
                  className={`shrink-0 ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${completenessColor(
                    percent
                  )}`}
                >
                  {percent}%
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}

// ─── Translation Editor View ─────────────────────────────────────

interface TranslationEditorViewProps {
  langCode: string;
  language: LexiconLanguage;
  translations: Record<string, Record<string, string>>;
  cubeFilter: number | null;
  setCubeFilter: (cubeId: number | null) => void;
  getLanguageCompleteness: (
    code: string,
    cubeId?: number
  ) => { filled: number; total: number; percent: number };
  updateTranslation: (langCode: string, key: string, text: string) => void;
  bulkUpdateTranslations: (langCode: string, entries: Record<string, string>) => void;
  onBack: () => void;
}

function TranslationEditorView({
  langCode,
  language,
  translations,
  cubeFilter,
  setCubeFilter,
  getLanguageCompleteness,
  updateTranslation,
  bulkUpdateTranslations,
  onBack,
}: TranslationEditorViewProps) {
  const { t } = useLexicon();
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const completeness = getLanguageCompleteness(
    langCode,
    cubeFilter ?? undefined
  );

  const downloadCSV = useCallback(() => {
    const rows: string[][] = [["Key", "Cube", "Context", "English", language.nameEn]];
    const groups = cubeFilter !== null
      ? CUBE_GROUPS.filter((g) => g.cubeId === cubeFilter)
      : CUBE_GROUPS;
    for (const group of groups) {
      for (const entry of group.keys) {
        const translated = translations[langCode]?.[entry.key] ?? "";
        const eng = DEFAULT_ENGLISH_TRANSLATIONS[entry.key]?.englishDefault ?? "";
        rows.push([
          entry.key,
          group.label,
          entry.context,
          eng,
          translated,
        ]);
      }
    }
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lexicon_en_${langCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [langCode, language.nameEn, translations, cubeFilter]);

  const handleCSVUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      // Strip BOM if present
      const clean = text.replace(/^\uFEFF/, "");
      // Parse CSV rows (handle quoted fields with commas/newlines)
      const rows: string[][] = [];
      let current: string[] = [];
      let field = "";
      let inQuotes = false;
      for (let i = 0; i < clean.length; i++) {
        const ch = clean[i];
        if (inQuotes) {
          if (ch === '"' && clean[i + 1] === '"') {
            field += '"';
            i++;
          } else if (ch === '"') {
            inQuotes = false;
          } else {
            field += ch;
          }
        } else {
          if (ch === '"') {
            inQuotes = true;
          } else if (ch === ",") {
            current.push(field);
            field = "";
          } else if (ch === "\n" || (ch === "\r" && clean[i + 1] === "\n")) {
            current.push(field);
            field = "";
            if (current.length > 1) rows.push(current);
            current = [];
            if (ch === "\r") i++;
          } else {
            field += ch;
          }
        }
      }
      // Last row
      if (field || current.length > 0) {
        current.push(field);
        if (current.length > 1) rows.push(current);
      }
      if (rows.length < 2) {
        setUploadStatus("No data rows found in CSV");
        setTimeout(() => setUploadStatus(null), 3000);
        return;
      }
      // Header row — find Key column (index 0) and translation column (index 4+)
      const header = rows[0];
      const keyIdx = header.findIndex((h) => h.trim().toLowerCase() === "key");
      // Translation is the last column (or column index 4)
      const transIdx = header.length - 1;
      if (keyIdx < 0 || transIdx <= keyIdx) {
        setUploadStatus("Invalid CSV format — Key column not found");
        setTimeout(() => setUploadStatus(null), 3000);
        return;
      }
      const entries: Record<string, string> = {};
      let imported = 0;
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        const key = row[keyIdx]?.trim();
        const val = row[transIdx]?.trim();
        if (key && val && DEFAULT_ENGLISH_TRANSLATIONS[key]) {
          entries[key] = val;
          imported++;
        }
      }
      if (imported > 0) {
        bulkUpdateTranslations(langCode, entries);
      }
      setUploadStatus(`Imported ${imported} translations`);
      setTimeout(() => setUploadStatus(null), 3000);
    };
    reader.readAsText(file, "utf-8");
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  }, [langCode, bulkUpdateTranslations]);

  const groups =
    cubeFilter !== null
      ? CUBE_GROUPS.filter((g) => g.cubeId === cubeFilter)
      : CUBE_GROUPS;

  const handleChange = useCallback(
    (key: string, value: string) => {
      // Debounce localStorage writes at 300ms
      if (debounceTimers.current[key]) {
        clearTimeout(debounceTimers.current[key]);
      }
      debounceTimers.current[key] = setTimeout(() => {
        updateTranslation(langCode, key, value);
      }, 300);
    },
    [langCode, updateTranslation]
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {language.nameNative}{" "}
            <span className="text-muted-foreground">({language.nameEn})</span>
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${completeness.percent}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {completeness.filled}/{completeness.total} ({completeness.percent}
              %)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="text-xs flex items-center gap-1"
            onClick={downloadCSV}
            title={`Download English + ${language.nameEn} CSV`}
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs flex items-center gap-1"
            onClick={() => fileInputRef.current?.click()}
            title={`Upload ${language.nameEn} translations CSV`}
          >
            <Upload className="h-3 w-3" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSVUpload}
          />
        </div>
      </div>
      {uploadStatus && (
        <p className="text-xs text-green-400 text-center">{uploadStatus}</p>
      )}

      {/* Cube filter tabs */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setCubeFilter(null)}
          className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
            cubeFilter === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          {t("cube1.settings.all_tab")}
        </button>
        {CUBE_GROUPS.map((g) => (
          <button
            key={g.cubeId}
            onClick={() => setCubeFilter(g.cubeId)}
            className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
              cubeFilter === g.cubeId
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {g.cubeId === 0 ? "Shared" : `C${g.cubeId}`}
          </button>
        ))}
      </div>

      {/* Translation table */}
      <div className="max-h-72 overflow-y-auto space-y-px rounded-md border border-border">
        {groups.map((group) => (
          <div key={group.cubeId}>
            <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-3 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </span>
            </div>
            {group.keys.map((entry) => {
              const currentValue =
                translations[langCode]?.[entry.key] ?? "";
              return (
                <div
                  key={entry.key}
                  className="grid grid-cols-1 gap-1 px-3 py-2 border-b border-border/50"
                >
                  <div className="flex items-baseline gap-2">
                    <code className="text-[10px] text-muted-foreground font-mono truncate">
                      {entry.key}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground/70 truncate">
                    {DEFAULT_ENGLISH_TRANSLATIONS[entry.key]?.englishDefault}
                  </p>
                  <Input
                    defaultValue={currentValue}
                    placeholder={
                      DEFAULT_ENGLISH_TRANSLATIONS[entry.key]?.englishDefault
                    }
                    dir="auto"
                    className="h-8 text-xs"
                    onChange={(e) => handleChange(entry.key, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Propose Language View ───────────────────────────────────────

interface ProposeLanguageViewProps {
  proposeLanguage: (
    code: string,
    nameEn: string,
    nameNative: string,
    dir: "ltr" | "rtl",
    proposerEmail: string
  ) => void;
  userEmail?: string;
  onBack: () => void;
}

function ProposeLanguageView({
  proposeLanguage,
  userEmail,
  onBack,
}: ProposeLanguageViewProps) {
  const { t } = useLexicon();
  const [code, setCode] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameNative, setNameNative] = useState("");
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = code.trim().length >= 2 && nameEn.trim() && nameNative.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    proposeLanguage(
      code.trim().toLowerCase(),
      nameEn.trim(),
      nameNative.trim(),
      dir,
      userEmail ?? "anonymous"
    );
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("cube1.settings.back_languages")}
        </Button>
        <div className="rounded-md border border-green-500/30 bg-green-500/10 p-4 text-center">
          <Check className="h-5 w-5 text-green-400 mx-auto mb-2" />
          <p className="text-sm font-medium">{t("cube1.settings.language_proposed")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("cube1.settings.admin_approve")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h4 className="text-sm font-medium">{t("cube1.settings.propose_heading")}</h4>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {t("cube1.settings.iso_code")}
          </label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="xx"
            maxLength={5}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {t("cube1.settings.english_name")}
          </label>
          <Input
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="Afrikaans"
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {t("cube1.settings.native_name")}
          </label>
          <Input
            value={nameNative}
            onChange={(e) => setNameNative(e.target.value)}
            placeholder="Afrikaans"
            dir="auto"
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {t("cube1.settings.text_direction")}
          </label>
          <Select
            value={dir}
            onValueChange={(v) => setDir(v as "ltr" | "rtl")}
          >
            <SelectTrigger className="h-8 text-xs w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ltr">{t("cube1.settings.ltr")}</SelectItem>
              <SelectItem value="rtl">{t("cube1.settings.rtl")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          className="w-full text-xs"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {t("cube1.settings.submit_proposal")}
        </Button>
      </div>
    </div>
  );
}

// ─── Pending Approvals View (Admin only) ─────────────────────────

interface PendingApprovalsViewProps {
  pending: LexiconLanguage[];
  approveLanguage: (code: string, approverEmail: string) => void;
  rejectLanguage: (code: string) => void;
  userEmail: string;
  onBack: () => void;
}

function PendingApprovalsView({
  pending,
  approveLanguage,
  rejectLanguage,
  userEmail,
  onBack,
}: PendingApprovalsViewProps) {
  const { t } = useLexicon();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h4 className="text-sm font-medium">{t("cube1.settings.pending_approvals")}</h4>
      </div>

      {pending.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          {t("cube1.settings.no_pending")}
        </p>
      ) : (
        <div className="space-y-2">
          {pending.map((lang) => (
            <div
              key={lang.code}
              className="flex items-center justify-between rounded-md border border-border p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {lang.nameNative}{" "}
                  <span className="text-muted-foreground">
                    ({lang.nameEn})
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Code: {lang.code} | Dir: {lang.direction.toUpperCase()}
                </p>
                {lang.proposerEmail && (
                  <p className="text-[10px] text-muted-foreground">
                    Proposed by: {lang.proposerEmail}
                  </p>
                )}
                {lang.proposedAt && (
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(lang.proposedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                  onClick={() => approveLanguage(lang.code, userEmail)}
                  title="Approve"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => rejectLanguage(lang.code)}
                  title="Reject"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
