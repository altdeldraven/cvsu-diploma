import { useMemo } from "react";
import { DashboardLayout } from "@/components/layout";
import { useUsers } from "@/hooks/use-users";
import { useDiplomas } from "@/hooks/use-diplomas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, GraduationCap, Users, ScrollText, Award } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import type { User, Diploma } from "@shared/schema";

const COLORS = [
  "hsl(221, 83%, 53%)", "hsl(262, 83%, 58%)", "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(199, 89%, 48%)",
  "hsl(330, 81%, 60%)", "hsl(173, 80%, 40%)", "hsl(25, 95%, 53%)",
  "hsl(280, 67%, 51%)"
];

export default function AdminDashboard() {
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: diplomas, isLoading: diplomasLoading } = useDiplomas();

  const isLoading = usersLoading || diplomasLoading;

  const students = useMemo(() => (users || []).filter(u => u.role === "student"), [users]);
  const issuedDiplomas = useMemo(() => (diplomas || []).filter(d => d.status === "issued"), [diplomas]);

  const graduatesWithData = useMemo(() => {
    const graduateStudentIds = new Set(issuedDiplomas.map(d => d.studentId));
    return students.filter(s => graduateStudentIds.has(s.id));
  }, [students, issuedDiplomas]);

  const perYearData = useMemo(() => {
    const counts: Record<string, number> = {};
    graduatesWithData.forEach(s => {
      const year = s.graduationYear ? String(s.graduationYear) : "Unknown";
      counts[year] = (counts[year] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, count]) => ({ year, count }));
  }, [graduatesWithData]);

  const perProgramData = useMemo(() => {
    const counts: Record<string, number> = {};
    graduatesWithData.forEach(s => {
      const program = s.program || "Unspecified";
      counts[program] = (counts[program] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([program, count]) => ({ program, count }));
  }, [graduatesWithData]);

  const perSexData = useMemo(() => {
    const counts: Record<string, number> = {};
    graduatesWithData.forEach(s => {
      const sex = s.sex || "Unspecified";
      counts[sex] = (counts[sex] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([sex, count]) => ({ sex, count }));
  }, [graduatesWithData]);

  const perProgramAndSexData = useMemo(() => {
    const grouped: Record<string, Record<string, number>> = {};
    const sexSet = new Set<string>();
    graduatesWithData.forEach(s => {
      const program = s.program || "Unspecified";
      const sex = s.sex || "Unspecified";
      sexSet.add(sex);
      if (!grouped[program]) grouped[program] = {};
      grouped[program][sex] = (grouped[program][sex] || 0) + 1;
    });
    const sexes = Array.from(sexSet).sort();
    return {
      data: Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([program, sexCounts]) => ({ program, ...sexCounts })),
      sexes,
    };
  }, [graduatesWithData]);

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
          <h1 className="text-3xl font-serif font-bold text-slate-900" data-testid="text-dashboard-title">Registrar Dashboard</h1>
          <p className="text-slate-600 mt-1">Overview of graduates and diploma statistics.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard icon={<Users className="h-5 w-5" />} label="Total Students" value={students.length} color="text-blue-600 bg-blue-50" />
          <SummaryCard icon={<GraduationCap className="h-5 w-5" />} label="Graduates" value={graduatesWithData.length} color="text-green-600 bg-green-50" />
          <SummaryCard icon={<ScrollText className="h-5 w-5" />} label="Diplomas Issued" value={issuedDiplomas.length} color="text-purple-600 bg-purple-50" />
          <SummaryCard icon={<Award className="h-5 w-5" />} label="Programs" value={perProgramData.length} color="text-amber-600 bg-amber-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg" data-testid="text-chart-per-year">Graduates per Year</CardTitle>
            </CardHeader>
            <CardContent>
              {perYearData.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={perYearData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                    <Bar dataKey="count" name="Graduates" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg" data-testid="text-chart-per-program">Graduates per Program</CardTitle>
            </CardHeader>
            <CardContent>
              {perProgramData.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={perProgramData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis dataKey="program" type="category" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                    <Bar dataKey="count" name="Graduates" fill="hsl(262, 83%, 58%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg" data-testid="text-chart-per-sex">Graduates per Sex</CardTitle>
            </CardHeader>
            <CardContent>
              {perSexData.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={perSexData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="count"
                      nameKey="sex"
                      label={({ sex, count, percent }) => `${sex}: ${count} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={true}
                    >
                      {perSexData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg" data-testid="text-chart-program-sex">Graduates per Program and Sex</CardTitle>
            </CardHeader>
            <CardContent>
              {perProgramAndSexData.data.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={perProgramAndSexData.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="program" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                    <Legend />
                    {perProgramAndSexData.sexes.map((sex, i) => (
                      <Bar key={sex} dataKey={sex} name={sex} stackId="stack" fill={COLORS[i % COLORS.length]} radius={i === perProgramAndSexData.sexes.length - 1 ? [4, 4, 0, 0] : undefined} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900" data-testid={`text-stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
      No data available yet. Add students and issue diplomas to see statistics.
    </div>
  );
}
