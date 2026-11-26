"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Challan = {
  id: string;
  challanNumber: string;
  applicantName: string;
  fatherName: string | null;
  cnic: string;
  feeLabel: string;
  amount: number;
  dueDate: string;
  status: string;
  educationLevel: string | null;
  semester: number | null;
  session: string | null;
  particulars: string | null;
  gender: string | null;
  paidId: string | null;
  paidAt: string | null;
  program?: { name: string; code: string | null } | null;
};

function toWords(n: number): string {
  const a = ["","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  const b = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
  if (n === 0) return "zero";
  if (n < 20)   return a[n];
  if (n < 100)  return b[Math.floor(n/10)] + (n%10 ? " "+a[n%10] : "");
  if (n < 1000) return a[Math.floor(n/100)]+" hundred"+(n%100 ? " "+toWords(n%100) : "");
  if (n < 100000) return toWords(Math.floor(n/1000))+" thousand"+(n%1000 ? " "+toWords(n%1000) : "");
  return toWords(Math.floor(n/100000))+" lakh"+(n%100000 ? " "+toWords(n%100000) : "");
}

export default function PrintChallanPage() {
  const params = useParams();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      // Parallel fetch challan and settings
      Promise.all([
        fetch(`/api/challans/${params.id}`).then(r => r.json()),
        fetch(`/api/settings`).then(r => r.json())
      ])
      .then(([challanData, settingsData]) => {
        if (challanData && !challanData.error && challanData.amount !== undefined) {
          setChallan(challanData);
        } else {
          setChallan(null);
        }
        if (settingsData && !settingsData.error) {
          setSettings(settingsData);
        }
        setLoading(false);
      })
      .catch(() => {
        setChallan(null);
        setLoading(false);
      });
    }
  }, [params.id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-semibold">Loading Challan printable copy...</div>;
  }

  if (!challan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black">
            ✕
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Challan Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">
            The challan ID is invalid, or the challan was deleted during a database reset.
          </p>
          <a
            href="/bs/fees"
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors w-full block"
          >
            Back to Fees Dashboard
          </a>
        </div>
      </div>
    );
  }

  const copies = [
    { title: "Depositor Copy - 1", num: 1 },
    { title: "Attach with Form - 2", num: 2 },
    { title: "College Copy - 3", num: 3 },
    { title: "Bank Copy - 4", num: 4 },
  ];
  return (
    <div className="min-h-screen bg-slate-100 p-4 print:p-0 print:bg-white flex flex-col items-center font-sans">
      <style>{`
        @media print { 
          @page { size: letter landscape; margin: 5mm 6mm; } 
          html, body { width: 100% !important; height: auto !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
        }
      `}</style>
      {/* Control bar */}
      <div className="mb-6 print:hidden w-full max-w-7xl bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Official Challan - {challan.challanNumber}</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Ready for US Letter landscape printing.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm shadow-blue-500/20 flex items-center gap-2"
        >
          🖨️ Print Document
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="w-full max-w-[1056px] print:max-w-none print:w-full bg-white print:p-0 flex justify-between border-2 border-slate-800 print:border-none shadow-2xl print:shadow-none min-h-[195mm] print:min-h-0 overflow-hidden print:overflow-visible text-[10px] text-slate-800 leading-tight relative">
        {copies.map((copy, i) => (
          <div
            key={copy.num}
            className={`w-[25%] flex flex-col justify-between p-3 relative ${
              i < 3 ? "border-r-[1.5px] border-dashed border-slate-400" : ""
            }`}
          >
            {/* Watermark Logo */}
            {settings.COLLEGE_LOGO && (
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                <img src={settings.COLLEGE_LOGO} alt="watermark" className="w-48 h-48 grayscale" />
              </div>
            )}
            
            <div className="relative z-10 space-y-2">
              {/* Copy Title */}
              <div className="flex justify-between items-center border-b-[1.5px] border-slate-800 pb-1.5 mb-2">
                <span className="font-black text-slate-900 text-[10px] uppercase tracking-widest">{copy.title}</span>
                <span className="font-bold text-slate-500 text-[8px]">Copy {copy.num}/4</span>
              </div>

              {/* Logo & title */}
              <div className="flex items-center gap-2 mb-2">
                {settings.COLLEGE_LOGO ? (
                  <img src={settings.COLLEGE_LOGO} alt="Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
                ) : (
                  <span className="text-2xl">🏛️</span>
                )}
                <div className="leading-tight">
                  <div className="font-black text-[10px] text-slate-900 uppercase tracking-tight">
                    {settings.COLLEGE_NAME || "Govt. Postgraduate College"}
                  </div>
                  <div className="text-[7px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Official Fee Challan</div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-slate-50 border border-slate-300 p-1.5 rounded text-[7.5px] font-bold text-slate-700 uppercase tracking-wide leading-relaxed shadow-sm">
                <div className="flex justify-between"><span>Bank:</span> <span className="text-slate-900">{settings.CHALLAN_BANK_NAME || "HBL"}</span></div>
                <div className="flex justify-between"><span>Branch:</span> <span className="text-slate-900">{settings.CHALLAN_BRANCH_CODE || "0873"}</span></div>
                <div className="flex justify-between"><span>Title:</span> <span className="text-slate-900 truncate max-w-[120px]">{settings.CHALLAN_ACCOUNT_TITLE || "Principal Govt College"}</span></div>
                <div className="flex justify-between"><span>A/C No:</span> <span className="text-slate-900 font-black">{settings.CHALLAN_BANK_ACCOUNT || "08730001324203"}</span></div>
              </div>

              {/* Barcode/QR mockup */}
              <div className="my-2 flex flex-col items-center justify-center">
                <div className="flex items-center h-5 w-32 bg-slate-900 px-1">
                  {[1,2,1,3,1,2,4,1,2,3,1,2,1,4,1,2,3,1,2,1,3,1,2,4,1].map((w, idx) => (
                    <div key={idx} className="bg-white h-full" style={{ width: `${w}px`, marginRight: '1px' }}></div>
                  ))}
                </div>
                <div className="text-[9px] font-black tracking-widest text-slate-700 mt-1">*{challan.challanNumber}*</div>
              </div>

              {/* Status indicator on printed challan */}
              {challan.status === "PAID" && (
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-[3px] border-emerald-500/40 text-emerald-500/40 font-black text-2xl uppercase px-4 py-1 rounded-lg">
                  PAID
                </div>
              )}

              {/* Details table */}
              <div className="space-y-1 mt-3">
                <div className="flex justify-between items-end border-b border-slate-300 pb-0.5">
                  <span className="text-slate-600 font-bold uppercase text-[7.5px]">Challan No.</span>
                  <span className="font-black text-slate-900 text-[9px]">{challan.challanNumber}</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-300 pb-0.5">
                  <span className="text-slate-600 font-bold uppercase text-[7.5px]">CNIC / B-Form</span>
                  <span className="font-black font-mono text-slate-900">{challan.cnic}</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-300 pb-0.5">
                  <span className="text-slate-600 font-bold uppercase text-[7.5px]">Student Name</span>
                  <span className="font-black text-slate-900 truncate max-w-[130px]">{challan.applicantName}</span>
                </div>
                {challan.fatherName && (
                  <div className="flex justify-between items-end border-b border-slate-300 pb-0.5">
                    <span className="text-slate-600 font-bold uppercase text-[7.5px]">Father Name</span>
                    <span className="font-bold text-slate-800 truncate max-w-[130px]">{challan.fatherName}</span>
                  </div>
                )}
                <div className="flex justify-between items-end border-b border-slate-300 pb-0.5">
                  <span className="text-slate-600 font-bold uppercase text-[7.5px]">Program</span>
                  <span className="font-black text-slate-900 truncate max-w-[130px]">{challan.program?.name || "BS"}</span>
                </div>
                {challan.semester && (
                  <div className="flex justify-between items-end border-b border-slate-300 pb-0.5">
                    <span className="text-slate-600 font-bold uppercase text-[7.5px]">Semester</span>
                    <span className="font-bold text-slate-800">{challan.semester}</span>
                  </div>
                )}
                <div className="flex justify-between items-end border-b border-slate-300 pb-0.5">
                  <span className="text-slate-600 font-bold uppercase text-[7.5px]">Due Date</span>
                  <span className="font-black text-rose-700">{new Date(challan.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-300 pb-0.5">
                  <span className="text-slate-600 font-bold uppercase text-[7.5px]">Fee Type</span>
                  <span className="font-bold text-slate-800 truncate">{challan.feeLabel}</span>
                </div>
              </div>

              {/* Amount Info */}
              <div className="mt-3 bg-slate-900 p-2 rounded text-white shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase tracking-wider text-[8px] text-slate-300">Total Payable</span>
                  <span className="font-black text-sm tracking-tight">Rs. {challan.amount.toLocaleString()}</span>
                </div>
                <div className="text-[7.5px] text-slate-400 uppercase font-medium mt-1 leading-tight border-t border-slate-700 pt-1">
                  {toWords(challan.amount)} rupees only
                </div>
              </div>

              {/* Paid details */}
              {challan.paidId && (
                <div className="mt-2 p-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[7.5px] font-bold uppercase tracking-wide flex justify-between">
                  <span>Trx ID: <span className="font-black font-mono">{challan.paidId}</span></span>
                  <span>Date: {challan.paidAt ? new Date(challan.paidAt).toLocaleDateString() : ""}</span>
                </div>
              )}
            </div>

            {/* Bottom section (signatures + footer) */}
            <div className="relative z-10 mt-4 flex flex-col justify-end flex-1 space-y-4">
              {/* Stamp and QR Code */}
              <div className="flex justify-between items-end gap-3">
                <div className="w-12 h-12 border-2 border-slate-800 rounded bg-white flex items-center justify-center shadow-sm shrink-0 p-0.5">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                      `CHALLAN:${challan.challanNumber}|NAME:${challan.applicantName}|CNIC:${challan.cnic}|AMOUNT:${challan.amount}`
                    )}`}
                    alt="QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 h-12 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 font-black text-[9px] uppercase tracking-widest bg-slate-50/50">
                  Bank Stamp
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 text-[7.5px] font-bold text-slate-600 uppercase tracking-wider pt-2">
                <div className="text-center border-t border-slate-800 pt-1">Depositor</div>
                <div className="text-center border-t border-slate-800 pt-1">Bank Officer</div>
              </div>

              {/* Disclaimers */}
              <div className="text-[6.5px] text-slate-500 space-y-0.5 border-t border-slate-300 pt-1.5 font-medium leading-tight">
                <p>• Valid till due date. Late fee may apply afterwards.</p>
                <p>• Bank is requested to receive amount and return relevant copies.</p>
                <p>• Computer generated document, no signature required.</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
