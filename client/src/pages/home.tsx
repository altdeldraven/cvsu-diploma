import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShieldCheck, FileKey, GraduationCap, ArrowRight } from "lucide-react";
import logoImage from "@assets/logo-image_1772160673349.png";

export default function HomePage() {
  const [certId, setCertId] = useState("");
  const [_, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (certId.trim()) {
      setLocation(`/verify/${certId}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="CvSU Logo" className="h-8 w-8 object-contain" />
            <span className="font-serif font-bold text-lg text-slate-900 hidden sm:inline">CvSU-Trece Martires City Campus</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/auth?tab=register">
              <Button>Register Student</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-white" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[url('https://pixabay.com/get/g1ceb1cbb5f33b90ff012de1084c69c9cb2a3954ecb0a439b9f36b87ff7cc726dcde797f0314115d16244030603b115800d63139d9a82188ed9285e965f305a2d_1280.png')] bg-cover bg-center opacity-5 mask-image-gradient" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium mb-6">
              <ShieldCheck className="h-4 w-4" />
              <span>Blockchain Verified Credentials</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 leading-tight mb-6">
              Verify Academic <br />
              <span className="text-primary">Excellence Instantly.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
              A secure, immutable platform for issuing and verifying academic diplomas using blockchain technology. Trust, simplified.
            </p>

            {/* Verification Search Box */}
            <div className="bg-white p-2 rounded-xl shadow-xl border max-w-lg flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input 
                  className="pl-10 h-12 border-none shadow-none text-base focus-visible:ring-0" 
                  placeholder="Enter Certificate ID (e.g. CERT-123456)" 
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                />
              </div>
              <Button size="lg" className="h-12 px-8" onClick={handleSearch}>
                Verify
              </Button>
            </div>
            <p className="text-sm text-slate-500 mt-4 ml-2">Try entering a certificate ID to verify.</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<ShieldCheck className="h-10 w-10 text-accent" />}
              title="Tamper-Proof Security"
              description="Diplomas are hashed and stored on the blockchain, making them impossible to forge or alter."
            />
            <FeatureCard 
              icon={<FileKey className="h-10 w-10 text-accent" />}
              title="Instant Verification"
              description="Employers and institutions can verify credentials in seconds using a unique certificate ID."
            />
            <FeatureCard 
              icon={<GraduationCap className="h-10 w-10 text-accent" />}
              title="Digital Ownership"
              description="Students truly own their records, accessible anytime, anywhere via a permanent link."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#004d01] text-green-100/70 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="CvSU Logo" className="h-6 w-6 object-contain" />
            <span className="font-serif font-bold text-lg text-white hidden sm:inline">CvSU-Trece Martires City Campus</span>
          </div>
          <p className="text-sm">© 2025 CvSU-Trece Martires City Campus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
      <div className="mb-6">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
