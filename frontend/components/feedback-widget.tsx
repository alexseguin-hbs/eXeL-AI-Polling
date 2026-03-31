"use client";

import { useState, useCallback, useRef } from "react";
import { MessageSquarePlus, Camera, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useLexicon } from "@/lib/lexicon-context";
import { api } from "@/lib/api";

// Category options
const CATEGORIES = [
  { id: "bug", label: "Bug" },
  { id: "feature", label: "Feature Request" },
  { id: "usability", label: "Usability" },
  { id: "improvement", label: "Improvement" },
  { id: "general", label: "General" },
] as const;

interface FeedbackWidgetProps {
  screen: string; // landing | join | polling | results | dashboard | settings | ranking | sim
  sessionId?: string;
  position?: "bottom-left" | "bottom-right";
}

export function FeedbackWidget({
  screen,
  sessionId,
  position = "bottom-left",
}: FeedbackWidgetProps) {
  const { t } = useLexicon();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("general");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open file picker for screenshot upload — no desktop capture (privacy)
  const captureScreenshot = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot(reader.result as string);
      toast({ title: "Screenshot attached" });
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // reset for re-upload
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);

    try {
      const deviceType = /Mobi|Android/i.test(navigator.userAgent)
        ? "mobile"
        : /Tablet|iPad/i.test(navigator.userAgent)
        ? "tablet"
        : "desktop";

      await api.post("/feedback", {
        session_id: sessionId || null,
        feedback_text: screenshot
          ? `${text.trim()}\n\n[Screenshot attached: ${screenshot.length} bytes]`
          : text.trim(),
        screen,
        category,
        device_type: deviceType,
        language_code: navigator.language?.split("-")[0] || "en",
      });

      toast({ title: t("shared.feedback.thanks") });
      setText("");
      setCategory("general");
      setScreenshot(null);
      setOpen(false);
    } catch {
      toast({
        title: "Feedback failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const posClass =
    position === "bottom-left" ? "left-4" : "right-4";

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed bottom-4 ${posClass} z-40 flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-primary-foreground text-xs font-medium shadow-lg hover:opacity-90 transition-opacity`}
          title={t("shared.feedback.button")}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          {t("shared.feedback.button")}
        </button>
      )}

      {/* Feedback panel */}
      {open && (
        <div
          className={`fixed bottom-4 ${posClass} z-50 w-80 rounded-xl border border-border bg-card shadow-2xl`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquarePlus className="h-4 w-4 text-primary" />
              {t("shared.feedback.button")}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="px-4 py-3 space-y-3">
            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                    category === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Text area */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("shared.feedback.placeholder")}
              maxLength={2000}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {/* Screenshot */}
            {screenshot && (
              <div className="relative">
                <img
                  src={screenshot}
                  alt="Screenshot"
                  className="w-full rounded-md border border-border max-h-32 object-cover"
                />
                <button
                  onClick={() => setScreenshot(null)}
                  className="absolute top-1 right-1 rounded-full bg-destructive p-0.5"
                >
                  <X className="h-3 w-3 text-destructive-foreground" />
                </button>
              </div>
            )}

            {/* Hidden file input for manual screenshot upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={captureScreenshot}
                title="Capture or upload screenshot"
              >
                <Camera className="h-3.5 w-3.5 mr-1" />
                Screenshot
              </Button>

              <Button
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1" />
                    {t("shared.feedback.submit")}
                  </>
                )}
              </Button>
            </div>

            {/* Screen context badge */}
            <p className="text-[9px] text-muted-foreground text-center">
              Feedback from: <span className="font-mono">{screen}</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
