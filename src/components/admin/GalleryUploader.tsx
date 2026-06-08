"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
}

export default function GalleryUploader({
  value = [],
  onChange,
  folder = "/iode/gallery",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList) {
    setUploading(true);
    setError("");
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);
        formData.append("fileName", file.name);
        const res = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok) uploaded.push(data.url);
      }
      onChange([...value, ...uploaded]);
    } catch {
      setError("Some uploads failed");
    } finally {
      setUploading(false);
    }
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {value.map((url, i) => (
          <div
            key={url}
            className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group"
          >
            <Image
              src={url}
              alt={`Gallery ${i + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span className="text-2xl text-gray-400">+</span>
              <span className="text-xs text-gray-400 mt-1">Add Images</span>
            </>
          )}
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
