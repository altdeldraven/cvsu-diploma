import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout";
import {
  useDiplomas,
  useCreateDiploma,
  useUpdateDiploma,
} from "@/hooks/use-diplomas";
import { useUsers, useUpdateUser } from "@/hooks/use-users";
import { DiplomaCard } from "@/components/diploma-card";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Search,
  Eye,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Plus,
  ShieldCheck,
  FileSignature,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User, Diploma } from "@shared/schema";

const PAGE_SIZE = 10;

export default function AdminDiplomasPage() {
  const { data: diplomas, isLoading } = useDiplomas();
  const { mutate: updateDiploma } = useUpdateDiploma();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<
    "name" | "course" | "status" | "date"
  >("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [viewDiploma, setViewDiploma] = useState<
    (Diploma & { student?: User; studentName?: string }) | null
  >(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleApproveClearance = (id: number) => {
    updateDiploma({ id, status: "cleared" });
  };

  const handleIssueDiploma = (id: number) => {
    updateDiploma({ id, status: "issued" });
  };

  const issuedDiplomas = useMemo(() => {
    return (diplomas || []).map((d) => ({
      ...d,
      studentName: d.student
        ? `${d.student.firstName || ""} ${d.student.lastName || ""}`.trim()
        : "Unknown",
    }));
  }, [diplomas]);

  const filtered = useMemo(() => {
    let result = [...issuedDiplomas];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.studentName.toLowerCase().includes(q) ||
          d.course.toLowerCase().includes(q) ||
          (d.certificateId || "").toLowerCase().includes(q) ||
          (d.student?.studentId || "").toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.studentName.localeCompare(b.studentName);
          break;
        case "course":
          cmp = a.course.localeCompare(b.course);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "date":
          cmp =
            new Date(a.issueDate || 0).getTime() -
            new Date(b.issueDate || 0).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [issuedDiplomas, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

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
          <h1
            className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3"
            data-testid="text-diplomas-title"
          >
            <ScrollText className="h-8 w-8 text-primary" />
            Diploma Records
          </h1>
          <p className="text-slate-600 mt-1">
            Manage diploma records — create, approve clearance, and issue
            diplomas.
          </p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-slate-50 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, course, certificate ID..."
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                data-testid="input-search-diplomas"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className="w-[180px] bg-white"
                  data-testid="select-status-filter"
                >
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="cleared">Cleared</SelectItem>
                  <SelectItem value="pending_clearance">
                    Pending Clearance
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="gap-2"
                data-testid="button-create-diploma"
              >
                <Plus className="h-4 w-4" /> Create Diploma
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3 font-semibold"
                    onClick={() => toggleSort("name")}
                    data-testid="button-sort-name"
                  >
                    Student Name <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3 font-semibold"
                    onClick={() => toggleSort("course")}
                    data-testid="button-sort-course"
                  >
                    Course / Degree <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3 font-semibold"
                    onClick={() => toggleSort("status")}
                    data-testid="button-sort-status"
                  >
                    Status <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Certificate ID</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3 font-semibold"
                    onClick={() => toggleSort("date")}
                    data-testid="button-sort-date"
                  >
                    Issue Date <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((diploma) => (
                <TableRow
                  key={diploma.id}
                  data-testid={`row-diploma-${diploma.id}`}
                >
                  <TableCell className="font-mono text-xs">
                    {diploma.student?.studentId ||
                      diploma.studentId.toString().padStart(6, "0")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {diploma.studentName || "Unknown"}
                    <div className="text-xs text-slate-500">
                      {diploma.student?.program || ""}
                      {diploma.student?.graduationYear
                        ? ` • Class of ${diploma.student.graduationYear}`
                        : ""}
                    </div>
                  </TableCell>
                  <TableCell>{diploma.course}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        diploma.status === "issued"
                          ? "default"
                          : diploma.status === "cleared"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {diploma.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {diploma.certificateId || "Pending"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {diploma.issueDate
                      ? (() => {
                          try {
                            return format(
                              new Date(diploma.issueDate),
                              "MMM dd, yyyy",
                            );
                          } catch {
                            return "-";
                          }
                        })()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {diploma.status === "pending_clearance" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-green-200 hover:bg-green-50 text-green-700 gap-1"
                          onClick={() => handleApproveClearance(diploma.id)}
                          data-testid={`button-approve-${diploma.id}`}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" /> Approve
                        </Button>
                      )}
                      {diploma.status === "cleared" && (
                        <Button
                          size="sm"
                          className="h-8 bg-accent hover:bg-accent/90 text-accent-foreground gap-1"
                          onClick={() => handleIssueDiploma(diploma.id)}
                          data-testid={`button-issue-${diploma.id}`}
                        >
                          <FileSignature className="h-3.5 w-3.5" /> Issue
                        </Button>
                      )}
                      {diploma.status === "issued" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 h-8"
                          onClick={() => setViewDiploma(diploma)}
                          data-testid={`button-view-diploma-${diploma.id}`}
                        >
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-slate-500"
                  >
                    No diploma records found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
            <p
              className="text-sm text-slate-600"
              data-testid="text-diploma-count"
            >
              Showing {paginated.length} of {filtered.length} diploma records
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span
                className="text-sm text-slate-600"
                data-testid="text-page-number"
              >
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                data-testid="button-next-page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={!!viewDiploma}
        onOpenChange={(open) => !open && setViewDiploma(null)}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="sr-only">Diploma Preview</DialogTitle>
          </DialogHeader>
          {viewDiploma && (
            <div className="space-y-4">
              <DiplomaCard diploma={viewDiploma} />
              {viewDiploma.certificateId && viewDiploma.status === "issued" && (
                <div className="text-center">
                  <a
                    href={`/verify/${viewDiploma.certificateId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline hover:text-primary/80"
                    data-testid="link-open-verification"
                  >
                    Open Public Verification Page
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Diploma Record</DialogTitle>
          </DialogHeader>
          <CreateDiplomaForm onSuccess={() => setIsCreateOpen(false)} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function toSentenceCase(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const AVAILABLE_COURSES = [
  { name: "Bachelor of Science in Psychology", acronym: "BSP" },
  { name: "Bachelor of Science in Business Administration", acronym: "BSBA" },
  { name: "Bachelor of Science in Information Technology", acronym: "BSIT" },
  { name: "Bachelor of Science in Hospitality Management", acronym: "BSHM" },
];

function generateAcronym(course: string): string {
  const found = AVAILABLE_COURSES.find((c) => c.name === course);
  if (found) return found.acronym;
  if (!course) return "";
  const words = course.trim().split(/\s+/);
  if (words.length <= 1) return course.toUpperCase();
  const skipWords = new Set(["of", "in", "the", "and", "for", "with", "a", "an", "on", "to"]);
  return words
    .filter((w) => w.length > 0 && !skipWords.has(w.toLowerCase()))
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

function formatStudentName(s: User): string {
  if (s.firstName && s.lastName) {
    return `${toSentenceCase(s.firstName)} ${toSentenceCase(s.lastName)}`;
  }
  if (s.firstName) return toSentenceCase(s.firstName);
  return toSentenceCase(s.username);
}

function CreateDiplomaForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: users } = useUsers();
  const { data: diplomas } = useDiplomas();
  const { mutate: create, isPending } = useCreateDiploma();
  const { mutateAsync: updateStudent } = useUpdateUser();
  const [studentSearch, setStudentSearch] = useState("");
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

  const formSchema = z.object({
    studentId: z.string().min(1, "Select a student"),
    course: z.string().min(1, "Course is required"),
    program: z.string().optional(),
    graduationYear: z.string().optional(),
    latinHonor: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: "",
      course: "",
      program: "",
      graduationYear: "",
      latinHonor: "",
    },
  });

  const studentIdsWithDiplomas = useMemo(() => {
    return new Set((diplomas || []).map((d) => d.studentId));
  }, [diplomas]);

  const availableStudents = useMemo(() => {
    return (users || []).filter(
      (u) => u.role === "student" && u.isApproved && !studentIdsWithDiplomas.has(u.id),
    );
  }, [users, studentIdsWithDiplomas]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return availableStudents;
    const q = studentSearch.toLowerCase();
    return availableStudents.filter((s) => {
      const name = formatStudentName(s).toLowerCase();
      const sid = (s.studentId || "").toLowerCase();
      return name.includes(q) || sid.includes(q) || s.username.toLowerCase().includes(q);
    });
  }, [availableStudents, studentSearch]);

  const selectedStudent = useMemo(() => {
    const id = form.watch("studentId");
    if (!id) return null;
    return availableStudents.find((s) => s.id === parseInt(id)) || null;
  }, [form.watch("studentId"), availableStudents]);

  const handleSelectStudent = (student: User) => {
    form.setValue("studentId", String(student.id));
    setStudentSearch(formatStudentName(student));
    setIsStudentDropdownOpen(false);

    if (student.program) {
      const matchedCourse = AVAILABLE_COURSES.find(
        (c) => c.acronym === student.program || c.name === student.program
      );
      if (matchedCourse) {
        form.setValue("course", matchedCourse.name);
        form.setValue("program", matchedCourse.acronym);
      } else {
        form.setValue("program", student.program);
      }
    }
    if (student.latinHonor) {
      form.setValue("latinHonor", student.latinHonor);
    }
    if (student.graduationYear) {
      form.setValue("graduationYear", String(student.graduationYear));
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(async (data) => {
        const studentId = parseInt(data.studentId);

        await updateStudent({
          id: studentId,
          program: data.program,
          graduationYear: data.graduationYear
            ? parseInt(data.graduationYear)
            : undefined,
          latinHonor: data.latinHonor,
        });

        create(
          {
            studentId,
            course: data.course,
            grade: data.latinHonor,
            status: "pending_clearance",
            issueDate: new Date(),
          },
          { onSuccess },
        );
      })}
      className="space-y-4"
    >
      <div className="space-y-2 relative">
        <Label>Select Student</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or student ID..."
            className="pl-9"
            value={studentSearch}
            onChange={(e) => {
              setStudentSearch(e.target.value);
              setIsStudentDropdownOpen(true);
              if (!e.target.value) {
                form.setValue("studentId", "");
              }
            }}
            onFocus={() => setIsStudentDropdownOpen(true)}
            data-testid="input-search-student"
          />
        </div>
        {isStudentDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto" data-testid="dropdown-student-list">
            {filteredStudents.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">
                {availableStudents.length === 0
                  ? "No approved students without diploma records found."
                  : "No students found matching your search."}
              </div>
            ) : (
              filteredStudents.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center justify-between ${
                    selectedStudent?.id === s.id ? "bg-slate-50 font-medium" : ""
                  }`}
                  onClick={() => handleSelectStudent(s)}
                  data-testid={`option-student-${s.id}`}
                >
                  <span>{formatStudentName(s)}</span>
                  {s.studentId && (
                    <span className="text-xs text-slate-400 ml-2">{s.studentId}</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
        {selectedStudent && (
          <p className="text-xs text-green-600" data-testid="text-selected-student">
            Selected: {formatStudentName(selectedStudent)}
            {selectedStudent.studentId ? ` (${selectedStudent.studentId})` : ""}
          </p>
        )}
        <input type="hidden" {...form.register("studentId")} />
      </div>
      <div className="space-y-2">
        <Label>Course/Degree</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          {...form.register("course", {
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
              form.setValue("program", generateAcronym(e.target.value));
            },
          })}
          data-testid="select-course"
        >
          <option value="">Select a course...</option>
          {AVAILABLE_COURSES.map((c) => (
            <option key={c.acronym} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Latin Honor (if any)</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          {...form.register("latinHonor")}
          data-testid="select-latin-honor"
        >
          <option value="">None</option>
          <option value="Cum Laude">Cum Laude</option>
          <option value="Magna Cum Laude">Magna Cum Laude</option>
          <option value="Summa Cum Laude">Summa Cum Laude</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Program</Label>
        <Input
          {...form.register("program")}
          placeholder="e.g. BSCS"
          data-testid="input-program"
        />
      </div>
      <div className="space-y-2">
        <Label>Graduation Year</Label>
        <Input
          type="number"
          {...form.register("graduationYear")}
          placeholder="e.g. 2026"
          data-testid="input-grad-year"
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={isPending}
        data-testid="button-submit-create"
      >
        {isPending ? "Creating..." : "Create Record"}
      </Button>
    </form>
  );
}
