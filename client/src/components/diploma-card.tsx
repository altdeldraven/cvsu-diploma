import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ShieldCheck, ExternalLink } from "lucide-react";
import type { Diploma, User } from "@shared/schema";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import logoImage from "@assets/logo-image_1772160673349.png";

interface DiplomaCardProps {
    diploma: Diploma & { student?: User; studentName?: string };
    isInteractive?: boolean;
}

function isEthereumTxHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

function getEtherscanUrl(txHash: string): string {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
}

export function DiplomaCard({ diploma, isInteractive = false }: DiplomaCardProps) {
    const { data: settings } = useQuery<any>({
        queryKey: ["/api/settings"],
    });

    const student = diploma.student;
    const studentName = student 
        ? `${student.firstName} ${student.lastName}`
        : diploma.studentName || "Student Name";
        
    const formattedDate = diploma.issueDate 
        ? format(new Date(diploma.issueDate), "MMMM do, yyyy") 
        : "Date not set";

    const verificationUrl = `${window.location.origin}/verify/${diploma.certificateId}`;
    const latinHonor = student?.latinHonor || diploma.grade;
    const isOnChain = diploma.ipfsHash === "confirmed";
    const hasRealTx = diploma.txHash && isEthereumTxHash(diploma.txHash);

    const registrarName = settings?.campusRegistrar || "Campus Registrar";
    const administratorName = settings?.campusAdministrator || "Campus Administrator";

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={cn(
                "diploma-border bg-white text-center text-slate-900 shadow-2xl relative overflow-hidden",
                "max-w-4xl mx-auto p-6 md:p-8 lg:p-10 aspect-[1.414/1]"
            )}
        >
            <div className="absolute top-3 left-3 w-12 h-12 border-t-4 border-l-4 border-primary/20" />
            <div className="absolute top-3 right-3 w-12 h-12 border-t-4 border-r-4 border-primary/20" />
            <div className="absolute bottom-3 left-3 w-12 h-12 border-b-4 border-l-4 border-primary/20" />
            <div className="absolute bottom-3 right-3 w-12 h-12 border-b-4 border-r-4 border-primary/20" />

            <div className="h-full flex flex-col justify-between relative z-10">
                <header className="space-y-0.5">
                    <div className="flex justify-center mb-1">
                        <img src={logoImage} alt="CvSU Logo" className="h-16 w-16 object-contain" data-testid="img-diploma-logo" />
                    </div>
                    <p className="font-serif text-xs md:text-sm font-semibold uppercase tracking-widest text-slate-700">
                        Republic of the Philippines
                    </p>
                    <h2 className="font-display text-lg md:text-xl font-bold uppercase tracking-wider text-primary">
                        Cavite State University
                    </h2>
                    <p className="font-serif text-xs md:text-sm text-slate-500">
                        Trece Martires City Campus
                    </p>
                    <p className="font-serif italic text-sm text-slate-400 pt-4">This is to certify that</p>
                </header>

                <div className="my-1">
                    <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 border-b-2 border-slate-200 pb-1 inline-block min-w-[50%]">
                        {studentName}
                    </h2>
                    {student?.studentId && (
                        <p className="text-xs text-slate-500 mt-0.5">Student ID: {student.studentId}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <p className="font-serif text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        has successfully completed the requirements for the degree
                    </p>
                    <h3 className="font-display text-lg md:text-xl font-bold text-primary">
                        {diploma.course}
                    </h3>
                    {student?.program && (
                        <p className="text-xs font-semibold text-slate-700">({student.program})</p>
                    )}
                    {latinHonor && (
                        <p className="text-sm font-serif italic text-amber-700 font-semibold" data-testid="text-latin-honor">
                            {latinHonor}
                        </p>
                    )}
                    {student?.graduationYear && (
                        <p className="text-xs text-slate-600 font-serif">
                            Class of <span className="font-bold">{student.graduationYear}</span>
                        </p>
                    )}
                </div>

                <footer className="mt-3 flex justify-between items-end">
                    <div className="text-left space-y-0.5">
                        <div className="h-px w-36 bg-slate-900 mb-0.5" />
                        <p className="font-serif font-bold text-[10px] uppercase tracking-wider">{registrarName}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-medium">Campus Registrar</p>
                        <p className="text-[9px] text-slate-500">{formattedDate}</p>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <div className="bg-white p-1.5 rounded shadow-sm border">
                            <QRCodeSVG value={verificationUrl} size={70} />
                        </div>
                        {diploma.certificateId && (
                            <p className="text-[7px] text-slate-400 font-mono">
                                ID: {diploma.certificateId}
                            </p>
                        )}
                    </div>

                    <div className="text-right space-y-0.5">
                        <div className="h-px w-36 bg-slate-900 mb-0.5" />
                        <p className="font-serif font-bold text-[10px] uppercase tracking-wider">{administratorName}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-medium">Campus Administrator</p>
                    </div>
                </footer>
            </div>

            {diploma.txHash && (
                <div className="absolute bottom-0 left-0 right-0 bg-slate-50/90 border-t border-slate-100 py-0.5 px-4 flex items-center justify-center gap-2 text-[9px] text-slate-500 font-mono">
                    <ShieldCheck className="h-3 w-3" />
                    {isOnChain && hasRealTx ? (
                        <a
                            href={getEtherscanUrl(diploma.txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                            data-testid="link-etherscan"
                        >
                            <span>Verified on Ethereum (Sepolia) • Tx: {diploma.txHash.substring(0, 16)}...</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                    ) : (
                        <span>Secured on Blockchain • Tx: {diploma.txHash.substring(0, 16)}...</span>
                    )}
                </div>
            )}
        </motion.div>
    );
}
