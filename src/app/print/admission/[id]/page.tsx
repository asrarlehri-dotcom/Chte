import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { IALPrintFooter } from "@/components/common/IALBranding";

export default async function PrintAdmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admission = await prisma.admission.findUnique({
    where: { id },
    include: {
      program: true,
      challans: true,
    }
  });

  if (!admission) {
    notFound();
  }

  // Get the application fee challan if it exists
  const applicationChallan = admission.challans.find(c => c.feeType === "APPLICATION_FEE") || admission.challans[0];

  let customFields: Record<string, string> = {};
  try {
    if (admission.customFields) {
      customFields = JSON.parse(admission.customFields);
    }
  } catch (e) {
    // Ignore parse error
  }

  // We need the custom fields definition from settings to get the labels
  let customFieldsSettings: any[] = [];
  try {
    const settings = await prisma.systemSetting.findUnique({ where: { key: "ADMISSION_CUSTOM_FIELDS" }});
    if (settings && settings.value) {
      customFieldsSettings = JSON.parse(settings.value);
    }
  } catch (e) {
    // Ignore parse error
  }

  const settingsRows = await prisma.systemSetting.findMany();
  const settingsMap = settingsRows.reduce<Record<string, string>>((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
  const collegeName = settingsMap.COLLEGE_NAME || "Government Post Graduate College Quetta";
  const collegeLogo = settingsMap.COLLEGE_LOGO || "";

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:p-0 print:bg-white flex flex-col items-center font-sans">
      <style>{`
        @media print { 
          @page { size: letter portrait; margin: 8mm 9mm; } 
          html, body { width: 100% !important; height: auto !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
        }
      `}</style>
      
      {/* Control bar */}
      <div className="mb-6 print:hidden w-full max-w-4xl bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Official Admission Form</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Ready for US Letter portrait printing.</p>
        </div>
        <button
          id="print-btn"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm shadow-blue-500/20 flex items-center gap-2"
        >
          🖨️ Print Document
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="w-full max-w-[816px] print:max-w-none print:w-full bg-white p-10 print:p-0 border-2 border-slate-800 print:border-none shadow-2xl print:shadow-none min-h-[279mm] print:min-h-0 text-slate-900 relative">
        
        {/* Watermark in print */}
        {collegeLogo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
            <img src={collegeLogo} alt="watermark" className="w-96 h-96 grayscale" />
          </div>
        )}

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between border-b-[3px] border-slate-900 pb-5 mb-8">
            <div className="flex items-center gap-4">
              {collegeLogo ? (
                <img src={collegeLogo} alt="Logo" className="w-16 h-16 object-contain drop-shadow-sm" />
              ) : (
                <span className="text-4xl mt-1">🏛️</span>
              )}
              <div>
                <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900">{collegeName}</h1>
                <div className="inline-block mt-2 bg-slate-900 text-white px-4 py-1 rounded-full border border-slate-700">
                  <p className="text-[10px] font-black tracking-widest uppercase">Admission Application Form</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Form No.</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{admission.id.substring(0, 8).toUpperCase()}</p>
              </div>
              {/* Passport Size Photo Box */}
              <div className="w-[35mm] h-[45mm] border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-center text-[9px] text-slate-400 font-bold p-2 bg-slate-50/50 leading-tight uppercase">
                <span className="mb-2 text-xl opacity-30">📷</span>
                Paste Passport Size Photo Here
              </div>
            </div>
          </div>

          {/* Challan & Program Info */}
          <div className="bg-slate-50 print:bg-slate-50/50 p-5 rounded-xl mb-8 flex justify-between items-center border border-slate-200">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Applied Program</p>
              <p className="text-xl font-black text-blue-900 tracking-tight">{admission.program?.name || "N/A"}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-700">Level: {admission.educationLevel}</span>
                {admission.session && <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-700">Session: {admission.session}</span>}
                {admission.educationLevel === "BS" && admission.bsAdmissionType && <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-[10px] font-bold text-blue-700 bg-blue-50">Type: {admission.bsAdmissionType.replace(/_/g, " ")}</span>}
              </div>
            </div>
            <div className="text-right border-l-2 border-slate-200 pl-6 py-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Associated Challan No.</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight font-mono">{applicationChallan?.challanNumber || "N/A"}</p>
            </div>
          </div>

          {/* Personal Details */}
          <div className="mb-8">
            <h2 className="text-sm font-black text-slate-900 border-b-2 border-slate-800 pb-2 mb-5 uppercase tracking-widest flex items-center gap-2">
              <span className="bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
              Personal Details
            </h2>
            <div className="grid grid-cols-2 gap-y-5 gap-x-12">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Student Name</p>
                <p className="text-base font-black text-slate-900 uppercase">{admission.studentName}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Father's Name</p>
                <p className="text-base font-black text-slate-900 uppercase">{admission.fatherName}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">CNIC / B-Form</p>
                <p className="text-base font-black text-slate-900 font-mono tracking-wider">{admission.cnic || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Date of Birth</p>
                <p className="text-base font-black text-slate-900">{new Date(admission.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Contact Number</p>
                <p className="text-base font-black text-slate-900 font-mono tracking-wider">{admission.contactNumber}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Email Address</p>
                <p className="text-base font-black text-slate-900">{admission.email}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Gender</p>
                <p className="text-base font-black text-slate-900 uppercase">{admission.gender || "N/A"}</p>
              </div>
              {admission.residentAddress && (
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Resident Address</p>
                  <p className="text-base font-black text-slate-900 uppercase">{admission.residentAddress}</p>
                </div>
              )}
              {customFieldsSettings.map(cf => {
                 if (customFields[cf.id]) {
                   return (
                     <div key={cf.id} className={cf.type === 'text' ? 'col-span-2' : ''}>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{cf.label}</p>
                       <p className="text-base font-black text-slate-900 uppercase">{customFields[cf.id]}</p>
                     </div>
                   );
                 }
                 return null;
              })}
            </div>
          </div>

          {/* Academic Details */}
          <div className="mb-8">
            <h2 className="text-sm font-black text-slate-900 border-b-2 border-slate-800 pb-2 mb-5 uppercase tracking-widest flex items-center gap-2">
              <span className="bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
              Academic Qualifications
            </h2>
            <table className="w-full border-collapse border border-slate-300 text-sm text-left">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-4 py-2.5 font-bold text-[10px] uppercase tracking-widest text-slate-700">Degree/Certificate</th>
                  <th className="border border-slate-300 px-4 py-2.5 font-bold text-[10px] uppercase tracking-widest text-slate-700">Group/Subject</th>
                  <th className="border border-slate-300 px-4 py-2.5 font-bold text-[10px] uppercase tracking-widest text-slate-700">Passing Year</th>
                  <th className="border border-slate-300 px-4 py-2.5 font-bold text-[10px] uppercase tracking-widest text-slate-700">Obtained / Total Marks</th>
                  <th className="border border-slate-300 px-4 py-2.5 font-bold text-[10px] uppercase tracking-widest text-slate-700">Board / University</th>
                </tr>
              </thead>
              <tbody>
                {admission.sscGroup && (
                  <tr>
                    <td className="border border-slate-300 px-4 py-3 font-black text-slate-900 uppercase">SSC / Matric</td>
                    <td className="border border-slate-300 px-4 py-3 font-bold text-slate-700 uppercase">{admission.sscGroup}</td>
                    <td className="border border-slate-300 px-4 py-3 font-bold text-slate-700 text-center">{admission.sscYear || "—"}</td>
                    <td className="border border-slate-300 px-4 py-3 font-black text-slate-900 text-center">{admission.sscObtained} / {admission.sscTotal}</td>
                    <td className="border border-slate-300 px-4 py-3 font-bold text-slate-700 uppercase">{admission.sscBoard || "—"}</td>
                  </tr>
                )}
                {admission.hsscGroup && (
                  <tr>
                    <td className="border border-slate-300 px-4 py-3 font-black text-slate-900 uppercase">HSSC / Intermediate</td>
                    <td className="border border-slate-300 px-4 py-3 font-bold text-slate-700 uppercase">{admission.hsscGroup.replace(/_/g, " ")}</td>
                    <td className="border border-slate-300 px-4 py-3 font-bold text-slate-700 text-center">{admission.hsscYear || "—"}</td>
                    <td className="border border-slate-300 px-4 py-3 font-black text-slate-900 text-center">{admission.hsscObtained} / {admission.hsscTotal}</td>
                    <td className="border border-slate-300 px-4 py-3 font-bold text-slate-700 uppercase">{admission.hsscBoard || "—"}</td>
                  </tr>
                )}
                {admission.bscGroup && (
                  <tr>
                    <td className="border border-slate-300 px-4 py-3 font-black text-slate-900 uppercase">B.Sc / ADP</td>
                    <td className="border border-slate-300 px-4 py-3 font-bold text-slate-700 uppercase">{admission.bscGroup.replace(/_/g, " ")}</td>
                    <td className="border border-slate-300 px-4 py-3 font-bold text-slate-700 text-center">{admission.bscYear || "—"}</td>
                    <td className="border border-slate-300 px-4 py-3 font-black text-slate-900 text-center">{admission.bscObtained} / {admission.bscTotal}</td>
                    <td className="border border-slate-300 px-4 py-3 font-bold text-slate-700 uppercase">{admission.bscBoard || "—"}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {admission.bsAdmissionType === "MIGRATION" && admission.previousMarksJson && (
              <div className="mt-6">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Previous Semester Courses Marks (Migration into Semester {admission.migrationSemester})</p>
                <table className="w-full border-collapse border border-slate-300 text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-300 px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-slate-700">Course ID/Code</th>
                      <th className="border border-slate-300 px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-slate-700">Obtained Marks</th>
                      <th className="border border-slate-300 px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-slate-700">Total Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      try {
                        const courses = JSON.parse(admission.previousMarksJson || "[]");
                        return courses.map((c: any, idx: number) => (
                          <tr key={idx}>
                            <td className="border border-slate-300 px-3 py-2 font-mono font-bold text-slate-900">{c.courseId}</td>
                            <td className="border border-slate-300 px-3 py-2 font-bold text-slate-700 text-center">{c.obtainedMarks}</td>
                            <td className="border border-slate-300 px-3 py-2 font-bold text-slate-700 text-center">{c.totalMarks}</td>
                          </tr>
                        ));
                      } catch (e) {
                        return <tr><td colSpan={3} className="border border-slate-300 px-3 py-2 text-rose-500 font-bold italic">Error parsing previous marks</td></tr>;
                      }
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="mt-28 pt-10 border-t border-slate-300 grid grid-cols-2 gap-8 relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-bold italic w-full text-center">
              I hereby declare that the information provided is correct to the best of my knowledge.
            </div>
            <div className="text-center">
              <div className="border-b-[1.5px] border-slate-800 w-56 mx-auto mb-3"></div>
              <p className="text-[10px] font-black tracking-widest text-slate-600 uppercase">Applicant Signature</p>
            </div>
            <div className="text-center">
              <div className="border-b-[1.5px] border-slate-800 w-56 mx-auto mb-3"></div>
              <p className="text-[10px] font-black tracking-widest text-slate-600 uppercase">Parent/Guardian Signature</p>
            </div>
          </div>

          <IALPrintFooter className="mt-8 pt-2" />
        </div>
      </div>
      
      <script dangerouslySetInnerHTML={{ __html: `
        const btn = document.getElementById('print-btn');
        if (btn) {
          btn.addEventListener('click', () => window.print());
        }
        if (window.location.search.includes('autoPrint=true')) {
          setTimeout(() => {
            window.print();
          }, 1000);
        }
      `}} />
    </div>
  );
}
