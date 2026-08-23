"use client";

import { useRef, useState } from "react";
import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME_TYPES } from "@/lib/config";
import { formatFileSize, validateFileMetadata } from "@/lib/file-validation";

type Props = { file: File | null; onFileChange: (file: File | null, error?: string) => void };

function UploadIcon() {
  return <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4M5 15.5v1.25A2.25 2.25 0 0 0 7.25 19h9.5A2.25 2.25 0 0 0 19 16.75V15.5" /></svg>;
}

function FileIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M7 3.75h6.25L18 8.5v11.75H7A1.25 1.25 0 0 1 5.75 19V5A1.25 1.25 0 0 1 7 3.75Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 3.75V9h5M9 13h6m-6 3h4" /></svg>;
}

export function UploadDropzone({ file, onFileChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const acceptFile = (nextFile: File | undefined) => {
    if (!nextFile) return;
    const result = validateFileMetadata(nextFile);
    onFileChange(result.valid ? nextFile : null, result.valid ? undefined : result.message);
  };

  return <div>
    <div
      className={`upload-zone relative rounded-2xl border-2 border-dashed p-6 text-center sm:p-9 ${isDragging ? "upload-zone-dragging" : ""}`}
      onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => { if (event.currentTarget === event.target) setIsDragging(false); }}
      onDrop={(event) => { event.preventDefault(); setIsDragging(false); acceptFile(event.dataTransfer.files[0]); }}
    >
      <input ref={inputRef} className="sr-only" type="file" accept={ACCEPTED_MIME_TYPES.join(",")} onChange={(event) => acceptFile(event.target.files?.[0])} />
      <button type="button" className="group mx-auto block rounded-xl p-2 text-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20" onClick={() => inputRef.current?.click()} aria-label="Choose a PDF or image file">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-secondary transition duration-200 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-contrast"><UploadIcon /></span>
        <span className="mt-4 block text-base font-semibold text-ink">Drag & drop your PDF or image here</span>
        <span className="mt-1 block text-sm text-muted">or <span className="font-semibold text-primary underline decoration-primary/30 underline-offset-4">choose a file</span></span>
      </button>
      <p className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-muted">{ACCEPTED_EXTENSIONS.join(" · ")} · Max 10 MB</p>
    </div>

    {file && <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-sm" aria-live="polite"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-primary"><FileIcon /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{file.name}</p><p className="text-xs text-muted">{formatFileSize(file.size)}</p></div></div><button type="button" onClick={() => { onFileChange(null); if (inputRef.current) inputRef.current.value = ""; }} className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-muted transition hover:bg-canvas hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Remove selected file">Remove</button></div>}
  </div>;
}


