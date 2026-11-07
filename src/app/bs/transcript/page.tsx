"use client";

import { useState, useEffect } from "react";
import { getGPValue, calculateStudentCGPA } from "@/lib/cgpa";
import { useSettings } from "@/lib/useSettings";

type StudentData = {
  id: string;
  rollNumber: string;
  fatherName?: string | null;
  session?: string | null;
  user: { name: string };
  currentSemester: number | null;
  bsAdmissionType: string | null;
  program?: { name: string } | null;
  marks: Array<{
    semester: number;
    obtainedMarks: number;
    totalMarks: number;
    course: { creditHours: number; title: string; code: string };
  }>;
};

export default function TranscriptGeneratorPage() {
  const { collegeName, collegeLogo, collegeTagline } = useSettings();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [transcriptSpan, setTranscriptSpan] = useState<"1-2" | "1-4" | "1-6" | "1-8">("1-8");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const bsOnly = data.filter((s: any) => s.educationLevel === "BS");
          setStudents(bsOnly);
          if (bsOnly.length > 0) setSelectedStudent(bsOnly[0]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const getTranscriptData = () => {
    if (!selectedStudent) return { semesters: [], cgpa: 0, totalCredits: 0 };

    const maxSem =
      transcriptSpan === "1-2" ? 2 :
      transcriptSpan === "1-4" ? 4 :
      transcriptSpan === "1-6" ? 6 : 8;

    // Group marks by semester within scope
    const semestersMap: Record<number, typeof selectedStudent.marks> = {};
    selectedStudent.marks?.forEach((m) => {
      const sem = m.semester || (m as any).course?.semester || 1;
      if (sem >= 1 && sem <= maxSem) {
        if (!semestersMap[sem]) {
          semestersMap[sem] = [];
        }
        semestersMap[sem].push(m);
      }
    });

    const relevantSemesters = Object.entries(semestersMap).map(([semStr, marks]) => {
      const sem = parseInt(semStr);
      let gpPoints = 0;
      let credits = 0;

      marks.forEach((m) => {
        const gp = getGPValue(m.obtainedMarks, m.totalMarks);
        const cr = m.course?.creditHours || 3;
        gpPoints += gp * cr;
        credits += cr;
      });

      return {
        semester: sem,
        gpa: credits > 0 ? parseFloat((gpPoints / credits).toFixed(2)) : 0,
        creditHours: credits,
        marks,
      };
    });

    // Compute CGPA
    const { cgpa, totalCredits } = calculateStudentCGPA(
      { bsAdmissionType: selectedStudent.bsAdmissionType },
      relevantSemesters
    );

    // Sort semesters ascending
    relevantSemesters.sort((a, b) => a.semester - b.semester);

    return { semesters: relevantSemesters, cgpa, totalCredits };
  };

  const { semesters, cgpa, totalCredits } = getTranscriptData();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Official BS Academic Transcript</h1>
          <p className="text-gray-500 mt-1">
            Generate full 4-year cumulative degree transcripts for BS students.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 print:hidden transition-all"
        >
          🖨️ Print Transcript
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Student</label>
          <select
            value={selectedStudent?.id || ""}
            onChange={(e) => {
              const s = students.find((item) => item.id === e.target.value);
              setSelectedStudent(s || null);
            }}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 bg-white font-bold"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.user?.name} ({s.rollNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Quick Transcript Span Buttons: 1-2, 1-4, 1-6, 1-8 */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>📑</span>
            <span>Transcript Semesters Scope (ایک ساتھ سمسٹرز):</span>
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: "1 – 2", sub: "1st Year", val: "1-2" },
              { label: "1 – 4", sub: "2nd Year / AD", val: "1-4" },
              { label: "1 – 6", sub: "3rd Year", val: "1-6" },
              { label: "1 – 8", sub: "Final Degree", val: "1-8" },
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                onClick={() => setTranscriptSpan(item.val as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5 ${
                  transcriptSpan === item.val
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <span>📑 {item.label}</span>
                <span className="opacity-75 font-normal text-[10px]">({item.sub})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedStudent && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200 space-y-6 print:border-none print:shadow-none print:p-0">
          <div className="text-center border-b-2 pb-4 space-y-1">
            {collegeLogo ? (
              <img src={collegeLogo} alt="College Logo" className="w-16 h-16 object-contain mx-auto mb-2" />
            ) : (
              <div className="text-3xl mb-1">🏛️</div>
            )}
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wide">{collegeName}</h2>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{collegeTagline}</p>
            <p className="text-sm font-black text-gray-800 uppercase pt-1">
              Official Transcript of Record ({transcriptSpan === "1-2" ? "Semesters 1 – 2 (1st Year)" : transcriptSpan === "1-4" ? "Semesters 1 – 4 (Associate Degree)" : transcriptSpan === "1-6" ? "Semesters 1 – 6 (3rd Year)" : "Semesters 1 – 8 (BS 4-Year Full Degree)"})
            </p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-y-2 text-sm border-b pb-4">
            <div>
              <span className="text-gray-500">Student Name:</span> <strong>{selectedStudent.user?.name}</strong>
            </div>
            <div>
              <span className="text-gray-500">Roll Number:</span> <strong className="font-mono">{selectedStudent.rollNumber}</strong>
            </div>
            <div>
              <span className="text-gray-500">Program:</span> <strong>{selectedStudent.program?.name || "BS Degree Program"}</strong>
            </div>
            <div>
              <span className="text-gray-500">Admission Mode:</span>{" "}
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                selectedStudent.bsAdmissionType === "BRIDGING_5TH"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {selectedStudent.bsAdmissionType === "BRIDGING_5TH" ? "Bridging / 5th Sem" : "Regular Admission"}
              </span>
            </div>
          </div>

          {/* Transcript Semesters Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {semesters.map((semData) => (
              <div key={semData.semester} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50">
                <div className="flex justify-between items-center border-b pb-2 mb-2">
                  <h3 className="font-bold text-gray-900 text-sm">Semester {semData.semester}</h3>
                  <span className="text-xs font-bold text-blue-600">GPA: {semData.gpa.toFixed(2)}</span>
                </div>
                <div className="space-y-1 text-xs">
                  {semData.marks.map((m, i) => {
                    const isAbsent = (m as any).status === "ABSENT" || (m as any).status === "A";
                    return (
                      <div key={i} className={`flex justify-between ${isAbsent ? "text-red-700 font-bold" : "text-gray-700"}`}>
                        <span className="truncate max-w-[180px]">
                          {m.course?.title} {isAbsent && <span className="text-[10px] text-red-600 font-extrabold">(Absent)</span>}
                        </span>
                        <span className={`font-mono ${isAbsent ? "text-red-600 font-bold" : "text-gray-400"}`}>
                          {isAbsent ? "A / " + m.totalMarks + " (GP: 0.00)" : `${m.obtainedMarks}/${m.totalMarks} (GP: ${getGPValue(m.obtainedMarks, m.totalMarks).toFixed(2)})`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Cumulative Footer Summary */}
          <div className="flex justify-between items-center bg-blue-900 text-white p-6 rounded-2xl">
            <div>
              <span className="text-xs uppercase font-bold text-blue-200">Degree Status</span>
              <div className="text-lg font-black uppercase">
                {selectedStudent.bsAdmissionType === "BRIDGING_5TH"
                  ? semesters.length >= 4
                    ? "GRADUATED (Bridging Program)"
                    : "IN PROGRESS"
                  : semesters.length >= 8
                  ? "GRADUATED"
                  : "IN PROGRESS"}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-xs uppercase font-bold text-blue-200">Total Credits</span>
                <div className="text-xl font-bold">{totalCredits} CH</div>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase font-bold text-blue-200">Final CGPA</span>
                <div className="text-3xl font-black text-amber-400">{cgpa.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
