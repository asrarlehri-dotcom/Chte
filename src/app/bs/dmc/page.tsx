"use client";

import { useState, useEffect } from "react";
import { getGPValue } from "@/lib/cgpa";
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

export default function DMCGeneratorPage() {
  const { collegeName, collegeLogo, collegeTagline } = useSettings();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
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

  const getDMCData = () => {
    if (!selectedStudent) return [];
    return selectedStudent.marks?.filter((m) => m.semester === selectedSemester) || [];
  };

  const currentDMCData = getDMCData();

  // Compute GPA
  let totalGP = 0;
  let totalCredits = 0;
  currentDMCData.forEach((m) => {
    const gp = getGPValue(m.obtainedMarks, m.totalMarks);
    const cr = m.course?.creditHours || 3;
    totalGP += gp * cr;
    totalCredits += cr;
  });
  const sgpa = totalCredits > 0 ? (totalGP / totalCredits).toFixed(2) : "0.00";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detailed Marks Certificate (DMC)</h1>
          <p className="text-gray-500 mt-1">Generate semester-wise transcripts/DMCs for BS students.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 print:hidden transition-all"
        >
          🖨️ Print DMC
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Student</label>
          <select
            value={selectedStudent?.id || ""}
            onChange={(e) => {
              const s = students.find((item) => item.id === e.target.value);
              setSelectedStudent(s || null);
            }}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 bg-white"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.user?.name} ({s.rollNumber})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 bg-white"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedStudent && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200 space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Header of DMC */}
          <div className="text-center border-b pb-4 space-y-1">
            {collegeLogo ? (
              <img src={collegeLogo} alt="College Logo" className="w-16 h-16 object-contain mx-auto mb-2" />
            ) : (
              <div className="text-3xl mb-1">🏛️</div>
            )}
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">{collegeName}</h2>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{collegeTagline}</p>
            <p className="text-sm font-bold text-gray-700 uppercase pt-1">Detailed Marks Certificate</p>
          </div>

          {/* Student Info Info */}
          <div className="grid grid-cols-2 gap-y-2 text-sm border-b pb-4">
            <div>
              <span className="text-gray-500">Student Name:</span> <strong>{selectedStudent.user?.name}</strong>
            </div>
            <div>
              <span className="text-gray-500">Roll Number:</span> <strong className="font-mono">{selectedStudent.rollNumber}</strong>
            </div>
            <div>
              <span className="text-gray-500">Semester:</span> <strong>{selectedSemester}</strong>
            </div>
            <div>
              <span className="text-gray-500">Program:</span> <strong>{selectedStudent.program?.name || "BS Degree Program"}</strong>
            </div>
          </div>

          {/* DMC Table */}
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 font-bold text-gray-700">Course Code</th>
                <th className="p-3 font-bold text-gray-700">Course Title</th>
                <th className="p-3 font-bold text-gray-700 text-center">Credit Hours</th>
                <th className="p-3 font-bold text-gray-700 text-center">Obtained</th>
                <th className="p-3 font-bold text-gray-700 text-center">Total</th>
                <th className="p-3 font-bold text-blue-700 text-center">GP</th>
              </tr>
            </thead>
            <tbody>
              {currentDMCData.map((m, idx) => {
                const isAbsent = (m as any).status === "ABSENT" || (m as any).status === "A";
                const gp = isAbsent ? 0.0 : getGPValue(m.obtainedMarks, m.totalMarks);
                return (
                  <tr key={idx} className={`border-b ${isAbsent ? "bg-red-50/30" : ""}`}>
                    <td className="p-3 font-mono text-xs">{m.course?.code || "CS-101"}</td>
                    <td className="p-3 font-semibold text-gray-800">{m.course?.title}</td>
                    <td className="p-3 text-center">{m.course?.creditHours || 3}</td>
                    <td className="p-3 text-center">
                      {isAbsent ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 font-black rounded text-xs border border-red-200">
                          A (ABSENT)
                        </span>
                      ) : (
                        m.obtainedMarks
                      )}
                    </td>
                    <td className="p-3 text-center">{m.totalMarks}</td>
                    <td className={`p-3 text-center font-bold ${isAbsent ? "text-red-600" : "text-blue-700"}`}>
                      {gp.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {currentDMCData.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400 italic">
                    No results compiled for this semester yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Summary Row */}
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase">Total Credits Enrolled</span>
              <div className="text-lg font-black text-gray-900">{totalCredits} CH</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-blue-600 uppercase">Semester GPA (SGPA)</span>
              <div className="text-2xl font-black text-blue-800">{sgpa}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
