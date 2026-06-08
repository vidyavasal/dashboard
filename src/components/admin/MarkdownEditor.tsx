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
  // Custom toolbar command: upload an image and insert its markdown.
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
          if (res.ok) {
            api.replaceSelection(`![${file.name}](${data.url})`);
          }
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
