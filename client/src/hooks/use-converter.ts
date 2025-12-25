import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type ProcessRequest, type ProcessResponse, type MergeRequest, type MergeResponse, type UploadedFile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useUploadFiles() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const res = await fetch(api.upload.path, {
        method: api.upload.method,
        body: formData,
        // No Content-Type header needed; fetch sets it for FormData
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to upload files");
      }

      return api.upload.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useProcessFiles() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ProcessRequest) => {
      // Validate locally first
      const validated = api.process.input.parse(data);

      const res = await fetch(api.process.path, {
        method: api.process.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Processing failed");
      }

      return api.process.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "Conversion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMergeFiles() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: MergeRequest) => {
      // Validate locally first
      const validated = api.merge.input.parse(data);

      const res = await fetch(api.merge.path, {
        method: api.merge.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Merge failed");
      }

      return api.merge.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "Merge Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
