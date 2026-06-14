"use client";

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";

// Dynamically import to avoid SSR issues with window references.
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface Props {
  value: string;
  onChange: (val: string) => void;
  folder?: string;
  height?: number;
}

export default function MarkdownEditor({
  value,
  onChange,
  folder = "/iode/content",
  height = 500,
}: Props) {
  // Size presets → ImageKit width transform + public-site figure class.
  // The public renderer styles `.md-figure--<size>` (and optional --left/--right).
  const SIZES: Record<string, number> = {
    full: 1600,
    large: 1000,
    medium: 700,
    small: 420,
  };

  // Custom toolbar command: upload an image, pick a display size, insert a
  // responsive <figure> the public site renders (resizable + captioned).
  const imageUploadCommand = {
    name: "image-upload",
    keyCommand: "image-upload",
    buttonProps: { "aria-label": "Upload image" },
    icon: (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    execute: (
      _state: unknown,
      api: { replaceSelection: (text: string) => void }
    ) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        // Ask for a display size before uploading.
        const choice = (
          window.prompt(
            "Image size? Type one of: full, large, medium, small\n(add ' left' or ' right' to wrap text beside it, e.g. \"medium right\")",
            "large"
          ) || "large"
        )
          .trim()
          .toLowerCase();
        const [sizeRaw, alignRaw] = choice.split(/\s+/);
        const size = SIZES[sizeRaw] ? sizeRaw : "large";
        const align = alignRaw === "left" || alignRaw === "right" ? alignRaw : "";

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);
        formData.append("fileName", file.name);
        try {
          const res = await fetch("/api/upload/image", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error();

          const sep = String(data.url).includes("?") ? "&" : "?";
          const src = `${data.url}${sep}tr=w-${SIZES[size]}`;
          const caption = file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
          const cls = `md-figure md-figure--${size}${align ? ` md-figure--${align}` : ""}`;

          api.replaceSelection(
            `\n<figure class="${cls}">\n  <img src="${src}" alt="${caption}" />\n  <figcaption>${caption}</figcaption>\n</figure>\n`
          );
        } catch {
          alert("Image upload failed");
        }
      };
      input.click();
    },
  };

  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        height={height}
        extraCommands={[imageUploadCommand]}
        preview="live"
      />
    </div>
  );
}
