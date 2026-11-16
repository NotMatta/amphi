"use client";

import { useEffect, useId, useState } from "react";

declare global {
  interface Window {
    mermaid?: any;
    __mermaidLoading?: Promise<void>;
  }
}

function loadMermaid(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.mermaid) return Promise.resolve();
  if (window.__mermaidLoading) return window.__mermaidLoading;

  window.__mermaidLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
    script.async = true;
    script.onload = () => {
      try {
        window.mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "default",
        });
      } catch {}
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Mermaid"));
    document.head.appendChild(script);
  });
  return window.__mermaidLoading;
}

export function Mermaid({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        await loadMermaid();
        if (cancelled || !window.mermaid) return;
        const { svg } = await window.mermaid.render(`m-${id}`, chart);
        if (!cancelled) {
          setSvg(svg);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to render diagram");
        }
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <div>
        <p style={{ color: "#b91c1c", fontSize: 14, marginBottom: 8 }}>Diagram could not be rendered: {error}</p>
        <pre style={{ overflowX: "auto" }}><code>{chart}</code></pre>
      </div>
    );
  }

  if (!svg) {
    return <pre style={{ overflowX: "auto", opacity: 0.7 }}><code>{chart}</code></pre>;
  }

  return <div style={{ overflowX: "auto", margin: "1rem 0" }} dangerouslySetInnerHTML={{ __html: svg }} />;
}
