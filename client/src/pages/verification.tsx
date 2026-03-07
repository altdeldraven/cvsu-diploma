import { useRoute } from "wouter";
import { useVerifyDiploma } from "@/hooks/use-diplomas";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, XCircle, ArrowLeft, CheckCircle, ExternalLink, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

function isEthereumTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

export default function VerificationPage() {
  const [match, params] = useRoute("/verify/:certificateId");
  const certificateId = params?.certificateId;

  const { data: result, isLoading, error } = useVerifyDiploma(certificateId);

  const blockchainVerified = result?.blockchainVerified;
  const blockchainConfigured = result?.blockchainConfigured;
  const txHash = result?.diploma?.txHash;
  const hasRealTx = txHash && isEthereumTxHash(txHash);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <header className="bg-white border-b py-4">
         <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
           <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
             <ArrowLeft className="h-4 w-4" /> Back to Search
           </Link>
           <div className="flex items-center gap-2 font-serif font-bold text-slate-900">
             <ShieldCheck className="h-5 w-5 text-primary" />
             Official Verification Portal
           </div>
         </div>
       </header>

       <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center">
        {isLoading ? (
          <div className="text-center space-y-4 mt-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-slate-500">Verifying credential on Ethereum blockchain...</p>
          </div>
        ) : error || !result?.valid ? (
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center mt-20 border-t-4 border-red-500">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Credential</h1>
            <p className="text-slate-600 mb-6">
              The certificate ID <span className="font-mono bg-slate-100 px-2 py-1 rounded">{certificateId}</span> could not be found or verified in our registry.
            </p>
            <Button asChild variant="outline">
              <Link href="/">Verify Another ID</Link>
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-4xl space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-800 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
              <div>
                <p className="font-bold">Verification Successful</p>
                <p className="text-sm">This diploma is valid and has been cryptographically secured.</p>
              </div>
            </div>

            {blockchainConfigured && (
              <div className={`rounded-lg p-4 flex items-center gap-3 mb-4 ${
                blockchainVerified === true
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : blockchainVerified === false
                  ? "bg-amber-50 border border-amber-200 text-amber-800"
                  : "bg-slate-50 border border-slate-200 text-slate-700"
              }`} data-testid="blockchain-status">
                {blockchainVerified === true ? (
                  <>
                    <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold flex items-center gap-2">
                        Verified on Ethereum Blockchain
                      </p>
                      <p className="text-sm">This diploma hash has been confirmed on the Ethereum Sepolia network.</p>
                      {hasRealTx && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono underline flex items-center gap-1 mt-1 hover:text-emerald-900"
                          data-testid="link-etherscan-verify"
                        >
                          View on Etherscan <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </>
                ) : blockchainVerified === false ? (
                  <>
                    <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold">Blockchain Record Pending</p>
                      <p className="text-sm">This diploma is valid in our database but has not yet been confirmed on the Ethereum network.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-slate-500 shrink-0" />
                    <div>
                      <p className="font-bold">Blockchain Check Unavailable</p>
                      <p className="text-sm">Could not connect to the Ethereum network to verify on-chain status.</p>
                    </div>
                  </>
                )}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-slate-500">Student Name</span>
                <span className="font-semibold text-slate-900">{result.diploma?.student ? `${result.diploma.student.firstName} ${result.diploma.student.lastName}` : "-"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-slate-500">Student ID</span>
                <span className="font-semibold text-slate-900">{result.diploma?.student?.studentId || "-"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-slate-500">Degree/Course</span>
                <span className="font-semibold text-primary">{result.diploma?.course}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-slate-500">Program</span>
                <span className="font-semibold text-slate-900">{result.diploma?.student?.program || "-"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-slate-500">Graduation Year</span>
                <span className="font-semibold text-slate-900">{result.diploma?.student?.graduationYear || "-"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-slate-500">Latin Honor</span>
                <span className="font-semibold text-slate-900">{result.diploma?.student?.latinHonor || "-"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-slate-500">Issue Date</span>
                <span className="font-semibold text-slate-900">
                  {result.diploma?.issueDate ? format(new Date(result.diploma.issueDate), "MMMM dd, yyyy") : "-"}
                </span>
              </div>
              {txHash && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-slate-500">Transaction Hash</span>
                  <span className="font-mono text-xs text-slate-700">
                    {hasRealTx ? (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-primary flex items-center gap-1"
                      >
                        {txHash.substring(0, 20)}... <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span>{txHash.substring(0, 20)}...</span>
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-center py-6">
               <div className="bg-white p-4 rounded-xl shadow-md border-2 border-primary/10">
                 <QRCodeSVG value={window.location.href} size={150} />
                 <p className="text-[10px] text-center mt-2 text-slate-400 font-mono">Scan to Verify Original</p>
               </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-400 font-mono">
                Verified at {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        )}
       </main>
    </div>
  );
}
