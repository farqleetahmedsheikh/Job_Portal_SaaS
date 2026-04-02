/** @format */
import { useState, useCallback, useRef } from "react";

export type Tone =
  | "professional"
  | "friendly"
  | "energetic"
  | "technical"
  | "concise";

interface JobContext {
  title: string;
  department: string;
  type: string;
  experienceLevel: string;
  locationType: string;
  skills: string[];
}

export function useAIDescription(
  onChunk: (text: string) => void,
  onDone: (full: string) => void,
) {
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (ctx: JobContext, tone: Tone, existing?: string) => {
      if (streaming) return;
      setStreaming(true);
      setError(null);
      onChunk(""); // clear field

      abortRef.current = new AbortController();

      const isImprove = !!existing?.trim();

      const prompt = isImprove
        ? `Improve this job description for ${ctx.title || "this role"}. Make it more ${tone}, clearer and more compelling. Keep all sections but enhance the language, fix awkward phrasing, and make it more engaging for top candidates. Return only plain text — no markdown symbols, no asterisks, no hashes.

Current description:
${existing}`
        : `Write a ${tone} job description for a ${ctx.title || "role"} position.
Details: ${ctx.type || "Full-time"}, ${ctx.locationType || "Remote"}${ctx.experienceLevel ? ", " + ctx.experienceLevel : ""}${ctx.department ? ", " + ctx.department + " department" : ""}.
${ctx.skills.length ? "Key skills: " + ctx.skills.join(", ") + "." : ""}

Structure it with these plain-text sections (no markdown, no asterisks, no hashes):

About the Role
[2-3 sentences overview]

Responsibilities
[5-6 lines starting with action verbs]

Requirements
[4-5 must-have qualifications]
${ctx.skills.length ? "\nNice to Have\n[2-3 bonus skills]\n" : ""}
What We Offer
[3-4 compelling benefits]

Keep it ${tone} and specific to the role. Plain text only.`;

      let full = "";

      try {
        const res = await fetch("/api/ai/description", {
          method: "POST",
          signal: abortRef.current.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }), // just send the prompt string
        });

        if (!res.ok) throw new Error(`API error ${res.status}`);
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(
            res.status === 429
              ? "Rate limit reached — wait a moment and try again."
              : msg,
          );
        }

        const reader = res.body!.getReader();
        const dec = new TextDecoder();
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                full += text;
                onChunk(full);
              }
            } catch (_) {}
          }
        }

        onDone(full);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setError(
            "AI generation failed. Check your connection and try again.",
          );
        }
      } finally {
        setStreaming(false);
      }
    },
    [streaming, onChunk, onDone],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return { streaming, error, generate, stop };
}
