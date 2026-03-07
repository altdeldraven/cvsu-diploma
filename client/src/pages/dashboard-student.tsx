import { DashboardLayout } from "@/components/layout";
import { useUser } from "@/hooks/use-auth";
import { useDiplomas } from "@/hooks/use-diplomas";
import { DiplomaCard } from "@/components/diploma-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, Share2, ExternalLink } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useUser();
  const { data: diplomas, isLoading } = useDiplomas();

  if (isLoading || !user) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  const myDiplomas = diplomas?.filter(d => d.studentId === user.id) || [];
  const issuedDiploma = myDiplomas.find(d => d.status === 'issued');

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900" data-testid="text-student-dashboard-title">Welcome, {user.firstName || user.username}</h1>
          <p className="text-slate-600 mt-2">View your credentials and track your diploma status.</p>
        </div>

        <div className="space-y-6">
          {!issuedDiploma ? (
            <StatusCard diplomas={myDiplomas} />
          ) : (
            <div className="space-y-6">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => {
                  const url = `${window.location.origin}/verify/${issuedDiploma.certificateId}`;
                  navigator.clipboard.writeText(url);
                  alert("Link copied: " + url);
                }} data-testid="button-share-link">
                  <Share2 className="mr-2 h-4 w-4" /> Share Link
                </Button>
                <Button asChild data-testid="button-view-public">
                  <a href={`/verify/${issuedDiploma.certificateId}`} target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" /> View Public Page
                  </a>
                </Button>
              </div>
              <DiplomaCard diploma={{...issuedDiploma, student: user}} />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatusCard({ diplomas }: { diplomas: any[] }) {
  const activeDiploma = diplomas[0];

  if (!activeDiploma) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Records Found</AlertTitle>
        <AlertDescription>
          No diploma records have been initialized for your account yet. Please contact the registrar.
        </AlertDescription>
      </Alert>
    );
  }

  const steps = [
    { id: 'pending_clearance', label: 'Pending Clearance', description: 'Registrar is reviewing your academic standing.' },
    { id: 'cleared', label: 'Cleared for Graduation', description: 'All requirements met. Preparing diploma.' },
    { id: 'issued', label: 'Diploma Issued', description: 'Available for download and sharing.' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === activeDiploma.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Status: {activeDiploma.course}</CardTitle>
        <CardDescription>Track the progress of your diploma issuance.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
          {steps.map((step, i) => {
            const isCompleted = i <= currentStepIndex;
            const isCurrent = i === currentStepIndex;

            return (
              <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${
                  isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <span className="text-slate-500 text-sm font-bold">{i + 1}</span>}
                </div>

                <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border shadow-sm ${
                  isCurrent ? 'bg-primary/5 border-primary' : 'bg-white'
                }`}>
                  <h4 className={`font-bold ${isCurrent ? 'text-primary' : 'text-slate-900'}`}>{step.label}</h4>
                  <p className="text-sm text-slate-500">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
