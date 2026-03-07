import { DashboardLayout } from "@/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDiplomaSettingsSchema, type DiplomaSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<DiplomaSettings>({
    queryKey: ["/api/settings"],
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings updated", description: "Diploma settings have been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertDiplomaSettingsSchema),
    values: settings || { campusRegistrar: "", campusAdministrator: "" },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Diploma Settings
          </h1>
          <p className="text-slate-600 mt-1">Configure the names that appear on the diploma.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Signatories</CardTitle>
            <CardDescription>Enter the names for the campus registrar and administrator.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campusRegistrar">Campus Registrar *</Label>
                <Input id="campusRegistrar" {...form.register("campusRegistrar")} placeholder="Enter Registrar Name" />
                {form.formState.errors.campusRegistrar && <p className="text-sm text-red-500">{form.formState.errors.campusRegistrar.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="campusAdministrator">Campus Administrator *</Label>
                <Input id="campusAdministrator" {...form.register("campusAdministrator")} placeholder="Enter Administrator Name" />
                {form.formState.errors.campusAdministrator && <p className="text-sm text-red-500">{form.formState.errors.campusAdministrator.message}</p>}
              </div>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Settings
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
