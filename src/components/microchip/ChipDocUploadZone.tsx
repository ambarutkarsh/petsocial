import { toast } from "sonner";
import { useRef, useState } from "react";
import { FileText } from "lucide-react";
import { CameraIcon, CloseIcon, DocumentIcon, UploadIcon } from "@/components/icons/PetosauraIcons";

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 2 * 1024 * 1024;

export interface PickedFile {
  file: File;
  previewUrl?: string;
}

interface Props {
  value: PickedFile | null;
  onChange: (f: PickedFile | null) => void;
}

const ChipDocUploadZone = ({ value, onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Only PDF, JPG or PNG files accepted.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File too large. Maximum size is 2MB. Please compress and try again.");
      return;
    }
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    onChange({ file, previewUrl });
  };

  const clear = () => {
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (value) {
    const sizeKb = Math.round(value.file.size / 1024);
    const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${sizeKb} KB`;
    return (
      <div className="rounded-[16px] border-[1.5px] border-border bg-card p-4">
        <div className="flex items-start gap-3">
          {value.previewUrl ? (
            <img src={value.previewUrl} alt="preview" className="w-[72px] h-[72px] object-cover rounded-[12px] border border-border" />
          ) : (
            <div className="w-[72px] h-[72px] rounded-[12px] bg-primary-light flex items-center justify-center">
              <DocumentIcon className="w-7 h-7 text-primary" strokeWidth={1.6} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-semibold truncate">{value.file.name}</p>
            <p className="text-xs text-muted-foreground font-body mt-0.5">{sizeLabel}</p>
            <p className="text-xs text-[#1F8A4D] font-body font-medium mt-1.5">✅ File ready to upload</p>
          </div>
          <button
            type="button"
            onClick={clear}
            aria-label="Remove file"
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors"
          >
            <CloseIcon className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      className={`w-full rounded-[16px] border-[2px] border-dashed p-6 flex flex-col items-center justify-center gap-2 transition-colors ${
        dragOver ? "border-primary bg-primary-light" : "border-primary/40 bg-primary-light/40 hover:bg-primary-light"
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center">
        <DocumentIcon className="w-6 h-6 text-primary" strokeWidth={1.8} />
      </div>
      <p className="font-body text-sm font-semibold">UploadIcon your proof document</p>
      <p className="text-xs text-muted-foreground font-body">PDF, JPG or PNG · Max 2MB</p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </button>
  );
};

export default ChipDocUploadZone;
