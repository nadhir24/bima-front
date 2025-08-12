import React, { useRef } from "react";
import { Button } from "@heroui/button";

interface FileInputProps {
  id: string;
  name: string;
  onChange: (file: File | null) => void;
  acceptedFileTypes?: string[]; // Tipe file yang diterima (opsional)
}

export const FileInput: React.FC<FileInputProps> = ({
  id,
  name,
  onChange,
  acceptedFileTypes = [],
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    // Validasi file jika ada tipe yang diterima
    if (file && acceptedFileTypes.length > 0) {
      const isValid = acceptedFileTypes.some((type) => file.type === type);
      if (!isValid) {
        alert(
          `File type not supported. Allowed types: ${acceptedFileTypes.join(
            ", "
          )}`
        );
        e.target.value = ""; // Reset input
        onChange(null);
        return;
      }
    }

    onChange(file); // Kirim file ke parent melalui prop onChange
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click(); // Trigger file input saat tombol diklik
  };

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        id={id}
        name={name}
        ref={fileInputRef}
        accept={acceptedFileTypes.join(",")}
        onChange={handleFileChange}
        className="hidden" // Sembunyikan input asli
      />
      <Button type="button" onPress={handleButtonClick} variant="solid">
        Choose File
      </Button>
    </div>
  );
};
