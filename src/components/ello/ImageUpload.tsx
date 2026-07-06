import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  onUpload: (fileBase64: string, fileName: string) => Promise<{ success: boolean; url?: string; error?: string }>;
  maxSize?: number; // in MB
  multiple?: boolean;
  label?: string;
}

export function ImageUpload({ onUpload, maxSize = 5, multiple = false, label = "Adicionar Foto" }: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsLoading(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const result = fileReader.result as string;
          const base64String = result.split(",")[1];
          resolve(base64String);
        };
        fileReader.readAsDataURL(file);
      });

      const result = await onUpload(base64, file.name);
      if (result.success) {
        toast.success("Foto enviada com sucesso!");
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast.error(result.error || "Erro ao fazer upload");
        setPreview(null);
      }
    } catch (error) {
      toast.error("Erro ao fazer upload da imagem");
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isLoading}
        className="hidden"
      />

      {preview ? (
        <Card className="relative overflow-hidden border-2 border-dashed border-blue-400 bg-blue-50">
          <img src={preview} alt="Preview" className="h-48 w-full object-cover" />
          <button
            onClick={() => setPreview(null)}
            className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
          >
            <X size={16} />
          </button>
        </Card>
      ) : (
        <Card
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer border-2 border-dashed border-gray-300 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50"
        >
          <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-xs text-gray-500">PNG, JPG até {maxSize}MB</p>
        </Card>
      )}

      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading || !preview}
        className="w-full"
        variant={isLoading || !preview ? "outline" : "default"}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : preview ? (
          "Enviar Foto"
        ) : (
          "Selecionar Foto"
        )}
      </Button>
    </div>
  );
}
