import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateDiplomaRequest, type UpdateDiplomaRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// ============================================
// Diploma Hooks
// ============================================

export function useDiplomas() {
  return useQuery({
    queryKey: [api.diplomas.list.path],
    queryFn: async () => {
      const res = await fetch(api.diplomas.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch diplomas");
      return api.diplomas.list.responses[200].parse(await res.json());
    },
  });
}

export function useDiploma(id: number) {
  return useQuery({
    queryKey: [api.diplomas.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.diplomas.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch diploma");
      return api.diplomas.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useVerifyDiploma(certificateId: string | undefined) {
  return useQuery({
    queryKey: [api.diplomas.verify.path, certificateId],
    queryFn: async () => {
      if (!certificateId) return null;
      const url = buildUrl(api.diplomas.verify.path, { certificateId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to verify");
      return api.diplomas.verify.responses[200].parse(await res.json());
    },
    enabled: !!certificateId && certificateId.length > 5,
    retry: false,
  });
}

export function useCreateDiploma() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateDiplomaRequest) => {
      const res = await fetch(api.diplomas.create.path, {
        method: api.diplomas.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create diploma");
      return api.diplomas.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.diplomas.list.path] });
      toast({ title: "Success", description: "Diploma created successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateDiploma() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateDiplomaRequest) => {
      const url = buildUrl(api.diplomas.update.path, { id });
      const res = await fetch(url, {
        method: api.diplomas.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update diploma");
      return api.diplomas.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.diplomas.list.path] });
      toast({ title: "Success", description: "Diploma updated successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
