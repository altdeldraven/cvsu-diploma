import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldCheck,
  FileKey,
  GraduationCap,
  Clock,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import logoImage from "@assets/logo-image_1772160673349.png";

export default function AboutPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-4">
          <img
            src={logoImage}
            alt="CvSU Logo"
            className="h-20 w-20 object-contain mx-auto"
            data-testid="img-about-logo"
          />
          <h1
            className="text-3xl font-serif font-bold text-slate-900"
            data-testid="text-about-title"
          >
            CvSU-Trece Martires City Campus
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Diploma Issuance and Verification System
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              About the System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              The Diploma Issuance and Verification System is a digital platform
              developed for
              <strong>
                {" "}
                Cavite State University - Trece Martires City Campus
              </strong>
              . It streamlines the process of issuing academic diplomas and
              allows instant public verification of credentials.
            </p>
            <p>
              The system provides the Office of the Registrar with tools to
              manage student records, approve clearance for graduation, and
              issue blockchain-secured digital diplomas. Students can view their
              diploma status, access their digital credential, and share it with
              employers or other institutions.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
              <h3
                className="font-bold text-slate-900"
                data-testid="text-feature-security"
              >
                Blockchain Security
              </h3>
              <p className="text-sm text-slate-600">
                Each diploma is hashed using SHA-256 and stored with a unique
                transaction hash, ensuring tamper-proof authenticity.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <FileKey className="h-10 w-10 text-primary mx-auto" />
              <h3
                className="font-bold text-slate-900"
                data-testid="text-feature-verification"
              >
                QR Code Verification
              </h3>
              <p className="text-sm text-slate-600">
                Every diploma includes a scannable QR code that links to a
                public verification page, enabling instant credential checks.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <Clock className="h-10 w-10 text-primary mx-auto" />
              <h3
                className="font-bold text-slate-900"
                data-testid="text-feature-tracking"
              >
                Real-Time Tracking
              </h3>
              <p className="text-sm text-slate-600">
                Students can track their diploma processing status from
                clearance through final issuance in real time.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Campus Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Address</p>
                    <p className="text-sm text-slate-600">
                      Trece Martires City, Cavite, Philippines
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Contact</p>
                    <p className="text-sm text-slate-600">
                      Office of the Registrar
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Email</p>
                    <p className="text-sm text-slate-600">
                      registrar@cvsu-tmc.edu.ph
                    </p>
                  </div>
                </div>
              </div>
              {/* <div className="space-y-3">
                <p className="font-medium text-slate-900">System Roles</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <strong>Admin (Registrar)</strong> — Manage students, approve clearance, issue diplomas
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    <strong>Student</strong> — View diploma status, access and share credentials
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                    <strong>Public</strong> — Verify diploma via certificate ID or QR code
                  </li>
                </ul>
              </div> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
