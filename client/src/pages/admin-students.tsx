import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout";
import { useUsers, useUpdateUser, useDeleteUser, useResetPassword, useCreateStudent } from "@/hooks/use-users";
import { useDiplomas } from "@/hooks/use-diplomas";
import { format } from "date-fns";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Loader2, MoreHorizontal, Trash2, KeyRound, Search, Eye, ScrollText, Pencil,
  FileDown, FileSpreadsheet, ChevronLeft, ChevronRight, ArrowUpDown, Users, UserPlus,
  CheckCircle2, XCircle, ShieldCheck
} from "lucide-react";
import type { User, Diploma } from "@shared/schema";

const PAGE_SIZE = 10;

export default function AdminStudentsPage() {
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: diplomas, isLoading: diplomasLoading } = useDiplomas();
  const { mutate: deleteUser } = useDeleteUser();

  const { mutate: updateUser } = useUpdateUser();
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [sortField, setSortField] = useState<"name" | "studentId" | "program" | "year">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const [viewProfile, setViewProfile] = useState<User | null>(null);
  const [editProfile, setEditProfile] = useState<User | null>(null);
  const [viewDiploma, setViewDiploma] = useState<(Diploma & { student?: User }) | null>(null);
  const [resetId, setResetId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const students = useMemo(() => {
    return (users || []).filter(u => u.role === "student");
  }, [users]);

  const programs = useMemo(() => {
    const set = new Set(students.map(s => s.program).filter(Boolean));
    return Array.from(set).sort();
  }, [students]);

  const years = useMemo(() => {
    const set = new Set(students.map(s => s.graduationYear).filter(Boolean));
    return Array.from(set).sort((a, b) => (b || 0) - (a || 0));
  }, [students]);

  const diplomaMap = useMemo(() => {
    const map = new Map<number, Diploma & { student?: User }>();
    diplomas?.forEach(d => {
      const existing = map.get(d.studentId);
      if (!existing || d.status === "issued" || (d.status === "cleared" && existing.status === "pending_clearance")) {
        map.set(d.studentId, d);
      }
    });
    return map;
  }, [diplomas]);

  const filtered = useMemo(() => {
    let result = [...students];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        (s.studentId || "").toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q)
      );
    }

    if (programFilter !== "all") {
      result = result.filter(s => s.program === programFilter);
    }
    if (yearFilter !== "all") {
      result = result.filter(s => String(s.graduationYear) === yearFilter);
    }

    if (approvalFilter !== "all") {
      result = result.filter(s => approvalFilter === "approved" ? s.isApproved : !s.isApproved);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case "studentId":
          cmp = (a.studentId || "").localeCompare(b.studentId || "");
          break;
        case "program":
          cmp = (a.program || "").localeCompare(b.program || "");
          break;
        case "year":
          cmp = (a.graduationYear || 0) - (b.graduationYear || 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [students, search, programFilter, yearFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const exportToPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(18);
    doc.text("Student List Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "MMMM dd, yyyy h:mm a")}`, 14, 28);
    doc.text(`Total Students: ${filtered.length}`, 14, 34);

    const rows = filtered.map(s => [
      s.studentId || "-",
      `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.username,
      s.email || "-",
      s.program || "-",
      s.graduationYear ? String(s.graduationYear) : "-",
      s.latinHonor || "-",
      diplomaMap.has(s.id) ? diplomaMap.get(s.id)!.status.replace("_", " ") : "No Diploma"
    ]);

    autoTable(doc, {
      startY: 40,
      head: [["Student ID", "Full Name", "Email", "Program", "Year", "Latin Honor", "Diploma Status"]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    doc.save("student-list.pdf");
  };

  const exportToExcel = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const data = filtered.map(s => ({
      "Student ID": s.studentId || "-",
      "Full Name": `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.username,
      "Username": s.username,
      "Email": s.email || "-",
      "Program": s.program || "-",
      "Graduation Year": s.graduationYear || "-",
      "Latin Honor": s.latinHonor || "-",
      "Address": s.address || "-",
      "Diploma Status": diplomaMap.has(s.id) ? diplomaMap.get(s.id)!.status.replace("_", " ") : "No Diploma",
      "Certificate ID": diplomaMap.has(s.id) ? (diplomaMap.get(s.id)!.certificateId || "Pending") : "-",
      "Course": diplomaMap.has(s.id) ? diplomaMap.get(s.id)!.course : "-",
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Students");

    if (data.length > 0) {
      worksheet.columns = Object.keys(data[0]).map(key => ({
        header: key,
        key,
        width: 22,
      }));
      data.forEach(row => worksheet.addRow(row));
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student-list.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = usersLoading || diplomasLoading;

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3" data-testid="text-page-title">
              <Users className="h-8 w-8 text-primary" />
              Student List
            </h1>
            <p className="text-slate-600 mt-1">View and manage all registered students.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={exportToPdf} data-testid="button-export-pdf">
              <FileDown className="h-4 w-4" /> Export PDF
            </Button>
            <Button variant="outline" className="gap-2" onClick={exportToExcel} data-testid="button-export-excel">
              <FileSpreadsheet className="h-4 w-4" /> Export Excel
            </Button>
            <Button className="gap-2" onClick={() => setIsCreateOpen(true)} data-testid="button-create-student">
              <UserPlus className="h-4 w-4" /> Create Student
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-slate-50 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, ID, email..."
                className="pl-9 bg-white"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                data-testid="input-search-students"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={programFilter} onValueChange={v => { setProgramFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px] bg-white" data-testid="select-program-filter">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map(p => (
                    <SelectItem key={p} value={p!}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={v => { setYearFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px] bg-white" data-testid="select-year-filter">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{String(y)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={approvalFilter} onValueChange={v => { setApprovalFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px] bg-white" data-testid="select-approval-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm" className="gap-1 -ml-3 font-semibold" onClick={() => toggleSort("studentId")} data-testid="button-sort-studentid">
                    Student ID <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="gap-1 -ml-3 font-semibold" onClick={() => toggleSort("name")} data-testid="button-sort-name">
                    Full Name <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="gap-1 -ml-3 font-semibold" onClick={() => toggleSort("program")} data-testid="button-sort-program">
                    Program <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="gap-1 -ml-3 font-semibold" onClick={() => toggleSort("year")} data-testid="button-sort-year">
                    Year <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Diploma</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((student) => {
                const diploma = diplomaMap.get(student.id);
                return (
                  <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                    <TableCell className="font-mono text-xs">
                      {student.studentId || student.id.toString().padStart(6, "0")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.firstName
                        ? `${student.firstName} ${student.lastName}`
                        : <span className="text-slate-400 italic">Profile incomplete</span>}
                      <div className="text-xs text-slate-500">@{student.username}</div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{student.email || "-"}</TableCell>
                    <TableCell>{student.program || "-"}</TableCell>
                    <TableCell>{student.graduationYear || "-"}</TableCell>
                    <TableCell>
                      {student.isApproved ? (
                        <Badge variant="default" className="bg-green-600 gap-1" data-testid={`badge-approved-${student.id}`}>
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300" data-testid={`badge-pending-${student.id}`}>
                          <XCircle className="h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {diploma ? (
                        <Badge
                          variant={diploma.status === "issued" ? "default" : diploma.status === "cleared" ? "secondary" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setViewDiploma(diploma)}
                          data-testid={`badge-diploma-${student.id}`}
                        >
                          {diploma.status.replace("_", " ")}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-actions-${student.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setViewProfile(student)} data-testid={`menu-view-profile-${student.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditProfile(student)} data-testid={`menu-edit-profile-${student.id}`}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                          </DropdownMenuItem>
                          {!student.isApproved ? (
                            <DropdownMenuItem
                              onClick={() => updateUser({ id: student.id, isApproved: true })}
                              data-testid={`menu-approve-${student.id}`}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4 text-green-600" /> Approve Student
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => updateUser({ id: student.id, isApproved: false })}
                              data-testid={`menu-revoke-${student.id}`}
                            >
                              <XCircle className="mr-2 h-4 w-4 text-amber-600" /> Revoke Approval
                            </DropdownMenuItem>
                          )}
                          {diploma && (
                            <DropdownMenuItem onClick={() => setViewDiploma(diploma)} data-testid={`menu-view-diploma-${student.id}`}>
                              <ScrollText className="mr-2 h-4 w-4" /> View Diploma
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setResetId(student.id)} data-testid={`menu-reset-password-${student.id}`}>
                            <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              if (confirm("Are you sure? This action cannot be undone.")) deleteUser(student.id);
                            }}
                            data-testid={`menu-delete-${student.id}`}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                    No students found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
            <p className="text-sm text-slate-600" data-testid="text-student-count">
              Showing {paginated.length} of {filtered.length} students
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-600" data-testid="text-page-number">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                data-testid="button-next-page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!viewProfile} onOpenChange={(open) => !open && setViewProfile(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>
          {viewProfile && <StudentProfileView student={viewProfile} diploma={diplomaMap.get(viewProfile.id)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editProfile} onOpenChange={(open) => !open && setEditProfile(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student Profile</DialogTitle>
          </DialogHeader>
          {editProfile && <EditStudentForm student={editProfile} onClose={() => setEditProfile(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewDiploma} onOpenChange={(open) => !open && setViewDiploma(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Diploma Details</DialogTitle>
          </DialogHeader>
          {viewDiploma && <DiplomaDetailView diploma={viewDiploma} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetId} onOpenChange={(open) => !open && setResetId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <ResetPasswordForm userId={resetId!} onClose={() => setResetId(null)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Student</DialogTitle>
          </DialogHeader>
          <CreateStudentForm onClose={() => setIsCreateOpen(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function StudentProfileView({ student, diploma }: { student: User; diploma?: Diploma & { student?: User } }) {
  const fields = [
    { label: "Full Name", value: `${student.firstName || ""} ${student.lastName || ""}`.trim() || "-" },
    { label: "Username", value: student.username },
    { label: "Student ID", value: student.studentId || "-" },
    { label: "Email", value: student.email || "-" },
    { label: "Program", value: student.program || "-" },
    { label: "Sex", value: student.sex || "-" },
    { label: "Graduation Year", value: student.graduationYear ? String(student.graduationYear) : "-" },
    { label: "Latin Honor", value: student.latinHonor || "-" },
    { label: "Address", value: student.address || "-" },
    { label: "Registered", value: student.createdAt ? (() => { try { return format(new Date(student.createdAt), "MMM dd, yyyy"); } catch { return "-"; } })() : "-" },
    { label: "Diploma Status", value: diploma ? diploma.status.replace("_", " ") : "No diploma" },
  ];

  return (
    <div className="space-y-3" data-testid="student-profile-view">
      {fields.map(f => (
        <div key={f.label} className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-sm text-slate-500">{f.label}</span>
          <span className="text-sm font-medium text-slate-900 text-right max-w-[60%] truncate">{f.value}</span>
        </div>
      ))}
    </div>
  );
}

function DiplomaDetailView({ diploma }: { diploma: Diploma & { student?: User } }) {
  const fields = [
    { label: "Student", value: diploma.student ? `${diploma.student.firstName} ${diploma.student.lastName}` : `ID: ${diploma.studentId}` },
    { label: "Course", value: diploma.course },
    { label: "Status", value: diploma.status.replace("_", " ") },
    { label: "Certificate ID", value: diploma.certificateId || "Pending" },
    { label: "Issue Date", value: diploma.issueDate ? format(new Date(diploma.issueDate), "MMM dd, yyyy") : "-" },
    { label: "Blockchain Tx", value: diploma.txHash ? `${diploma.txHash.substring(0, 20)}...` : "Not yet secured", link: diploma.txHash && /^0x[a-fA-F0-9]{64}$/.test(diploma.txHash) && diploma.ipfsHash === "confirmed" ? `https://sepolia.etherscan.io/tx/${diploma.txHash}` : undefined },
    { label: "Program", value: diploma.student?.program || "-" },
    { label: "Graduation Year", value: diploma.student?.graduationYear ? String(diploma.student.graduationYear) : "-" },
    { label: "Latin Honor", value: diploma.student?.latinHonor || "-" },
  ];

  return (
    <div className="space-y-3" data-testid="diploma-detail-view">
      {fields.map(f => (
        <div key={f.label} className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-sm text-slate-500">{f.label}</span>
          {f.link ? (
            <a href={f.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary underline text-right max-w-[60%] truncate font-mono">{f.value}</a>
          ) : (
            <span className="text-sm font-medium text-slate-900 text-right max-w-[60%] truncate font-mono">{f.value}</span>
          )}
        </div>
      ))}
      {diploma.status === "issued" && diploma.certificateId && (
        <div className="pt-2">
          <a
            href={`/verify/${diploma.certificateId}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary underline hover:text-primary/80"
            data-testid="link-verify-diploma"
          >
            Open Verification Page
          </a>
        </div>
      )}
    </div>
  );
}

function EditStudentForm({ student, onClose }: { student: User; onClose: () => void }) {
  const { mutate: update, isPending } = useUpdateUser();
  const [formData, setFormData] = useState({
    firstName: student.firstName || "",
    lastName: student.lastName || "",
    email: student.email || "",
    studentId: student.studentId || "",
    address: student.address || "",
    program: student.program || "",
    sex: student.sex || "",
    latinHonor: student.latinHonor || "",
    graduationYear: student.graduationYear ? String(student.graduationYear) : "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update({
      id: student.id,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      studentId: formData.studentId,
      address: formData.address,
      program: formData.program,
      sex: formData.sex,
      latinHonor: formData.latinHonor,
      graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
    }, { onSuccess: onClose });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="edit-student-form">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input value={formData.firstName} onChange={e => handleChange("firstName", e.target.value)} data-testid="input-edit-firstname" />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input value={formData.lastName} onChange={e => handleChange("lastName", e.target.value)} data-testid="input-edit-lastname" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Student ID</Label>
          <Input value={formData.studentId} onChange={e => handleChange("studentId", e.target.value)} data-testid="input-edit-studentid" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={formData.email} onChange={e => handleChange("email", e.target.value)} data-testid="input-edit-email" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Program</Label>
          <Input value={formData.program} onChange={e => handleChange("program", e.target.value)} placeholder="e.g. BSCS" data-testid="input-edit-program" />
        </div>
        <div className="space-y-2">
          <Label>Sex</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={formData.sex}
            onChange={e => handleChange("sex", e.target.value)}
            data-testid="select-edit-sex"
          >
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Graduation Year</Label>
          <Input type="number" value={formData.graduationYear} onChange={e => handleChange("graduationYear", e.target.value)} placeholder="e.g. 2026" data-testid="input-edit-gradyear" />
        </div>
        <div className="space-y-2">
          <Label>Latin Honor</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={formData.latinHonor}
            onChange={e => handleChange("latinHonor", e.target.value)}
            data-testid="select-edit-latinhonor"
          >
            <option value="">None</option>
            <option value="Cum Laude">Cum Laude</option>
            <option value="Magna Cum Laude">Magna Cum Laude</option>
            <option value="Summa Cum Laude">Summa Cum Laude</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input value={formData.address} onChange={e => handleChange("address", e.target.value)} data-testid="input-edit-address" />
      </div>
      <Button type="submit" className="w-full" disabled={isPending} data-testid="button-save-profile">
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}

function CreateStudentForm({ onClose }: { onClose: () => void }) {
  const { mutate: create, isPending } = useCreateStudent();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    program: "",
    sex: "",
    address: "",
    graduationYear: "",
    latinHonor: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create({
      username: formData.username,
      password: formData.password,
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
      email: formData.email || undefined,
      studentId: formData.studentId || undefined,
      program: formData.program || undefined,
      sex: formData.sex || undefined,
      address: formData.address || undefined,
      latinHonor: formData.latinHonor || undefined,
      graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
      role: "student",
    }, { onSuccess: onClose });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="create-student-form">
      <p className="text-sm text-slate-500 -mt-2">Login Credentials</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Username *</Label>
          <Input value={formData.username} onChange={e => handleChange("username", e.target.value)} required data-testid="input-create-username" />
        </div>
        <div className="space-y-2">
          <Label>Password *</Label>
          <Input type="password" value={formData.password} onChange={e => handleChange("password", e.target.value)} required data-testid="input-create-password" />
        </div>
      </div>

      <p className="text-sm text-slate-500 pt-2">Personal Information</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input value={formData.firstName} onChange={e => handleChange("firstName", e.target.value)} data-testid="input-create-firstname" />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input value={formData.lastName} onChange={e => handleChange("lastName", e.target.value)} data-testid="input-create-lastname" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={formData.email} onChange={e => handleChange("email", e.target.value)} data-testid="input-create-email" />
        </div>
        <div className="space-y-2">
          <Label>Sex *</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={formData.sex}
            onChange={e => handleChange("sex", e.target.value)}
            required
            data-testid="select-create-sex"
          >
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Mailing Address</Label>
        <Input value={formData.address} onChange={e => handleChange("address", e.target.value)} data-testid="input-create-address" />
      </div>

      <p className="text-sm text-slate-500 pt-2">Academic Information</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Student ID</Label>
          <Input value={formData.studentId} onChange={e => handleChange("studentId", e.target.value)} placeholder="e.g. 2024-0001" data-testid="input-create-studentid" />
        </div>
        <div className="space-y-2">
          <Label>Program</Label>
          <Input value={formData.program} onChange={e => handleChange("program", e.target.value)} placeholder="e.g. BSCS" data-testid="input-create-program" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Graduation Year</Label>
          <Input type="number" value={formData.graduationYear} onChange={e => handleChange("graduationYear", e.target.value)} placeholder="e.g. 2026" data-testid="input-create-gradyear" />
        </div>
        <div className="space-y-2">
          <Label>Latin Honor</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={formData.latinHonor}
            onChange={e => handleChange("latinHonor", e.target.value)}
            data-testid="select-create-latinhonor"
          >
            <option value="">None</option>
            <option value="Cum Laude">Cum Laude</option>
            <option value="Magna Cum Laude">Magna Cum Laude</option>
            <option value="Summa Cum Laude">Summa Cum Laude</option>
          </select>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={!formData.username || !formData.password || isPending} data-testid="button-submit-create-student">
        {isPending ? "Creating..." : "Create Student Account"}
      </Button>
    </form>
  );
}

function ResetPasswordForm({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { mutate, isPending } = useResetPassword();
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>New Password</Label>
        <Input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter new password"
          data-testid="input-new-password"
        />
      </div>
      <Button
        className="w-full"
        disabled={!password || isPending}
        onClick={() => mutate({ id: userId, password }, { onSuccess: onClose })}
        data-testid="button-submit-password"
      >
        {isPending ? "Updating..." : "Update Password"}
      </Button>
    </div>
  );
}
