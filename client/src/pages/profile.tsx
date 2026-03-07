import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { useUser } from "@/hooks/use-auth";
import { useUpdateUser } from "@/hooks/use-users";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user } = useUser();

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1
            className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3"
            data-testid="text-profile-title"
          >
            <UserCircle className="h-8 w-8 text-primary" />
            My Profile
          </h1>
          <p className="text-slate-600 mt-1">
            {isAdmin
              ? "View and update your profile information."
              : "View and update your personal information."}
          </p>
        </div>

        {isAdmin ? (
          <AdminProfileForm user={user} />
        ) : (
          <StudentProfileForm user={user} />
        )}
      </div>
    </DashboardLayout>
  );
}

function AdminProfileForm({ user }: { user: any }) {
  const { mutate: update, isPending } = useUpdateUser();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    address: user.address || "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update(
      {
        id: user.id,
        ...formData,
      },
      {
        onSuccess: () => {
          toast({
            title: "Profile updated",
            description: "Your profile has been saved successfully.",
          });
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your personal details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          data-testid="admin-profile-form"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                data-testid="input-profile-firstname"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                data-testid="input-profile-lastname"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              data-testid="input-profile-email"
            />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              data-testid="input-profile-address"
            />
          </div>
          <Button
            type="submit"
            disabled={isPending}
            data-testid="button-save-profile"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function StudentProfileForm({ user }: { user: any }) {
  const { mutate: update, isPending } = useUpdateUser();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: user.username || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    sex: user.sex || "",
    address: user.address || "",
    studentId: user.studentId || "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username before saving.",
        variant: "destructive",
      });
      return;
    }
    update(
      {
        id: user.id,
        ...formData,
      },
      {
        onSuccess: () => {
          toast({
            title: "Profile updated",
            description: "Your profile has been saved successfully.",
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {!user.isApproved && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm" data-testid="notice-pending-approval">
          Your account is pending approval from the registrar. Some features may be limited until your account is approved.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            data-testid="student-profile-form"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Username *</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  placeholder="Choose a username"
                  required
                  data-testid="input-profile-username"
                />
              </div>
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input
                  value={formData.studentId}
                  onChange={(e) => handleChange("studentId", e.target.value)}
                  placeholder="e.g. 2024-0001"
                  data-testid="input-profile-studentid"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  data-testid="input-profile-firstname"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  data-testid="input-profile-lastname"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                value={formData.email}
                disabled
                className="bg-slate-50"
                data-testid="input-profile-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Sex</Label>
              <Select
                value={formData.sex}
                onValueChange={(v) => handleChange("sex", v)}
              >
                <SelectTrigger data-testid="select-profile-sex">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                data-testid="input-profile-address"
              />
            </div>
            <Button
              type="submit"
              disabled={isPending}
              data-testid="button-save-profile"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Details</CardTitle>
          <CardDescription>
            These details are managed by the registrar and cannot be edited.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="academic-details-readonly">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-500">Program</Label>
                <Input
                  value={user.program || "-"}
                  disabled
                  className="bg-slate-50"
                  data-testid="input-readonly-program"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-500">Graduation Year</Label>
                <Input
                  value={user.graduationYear ? String(user.graduationYear) : "-"}
                  disabled
                  className="bg-slate-50"
                  data-testid="input-readonly-gradyear"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-500">Latin Honor</Label>
              <Input
                value={user.latinHonor || "-"}
                disabled
                className="bg-slate-50"
                data-testid="input-readonly-latinhonor"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
