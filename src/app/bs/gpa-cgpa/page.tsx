"use client";

import { useState, useEffect } from "react";
import { calculateStudentCGPA, getGPValue } from "@/lib/cgpa";

type StudentData = {
  id: string;
  rollNumber: string;
  user: { name: string };
  bsAdmissionType: string | null;
  currentSemester: number | null;
  marks: Array<{
    semester?: number;
    obtainedMarks: number;
    totalMarks: number;
    status?: string;
    course?: { creditHours: number; title: string; semester?: number };
  }>;
};

export default function GPACGPATrackerPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Fetch student marks details to compute GPA/CGPA dynamically
          const bsStudents = data.filter((s: any) => s.educationLevel === "BS");
          setStudents(bsStudents);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getStudentGPAData = (s: StudentData) => {
    // Group marks by semester
    const semestersMap: Record<number, { gpPoints: number; credits: number }> = {};
    
    s.marks?.forEach((m) => {
      const sem = m.course?.semester ?? (m as any).semester ?? 1;
      const credit = m.course?.creditHours || 3;
      const isAbsent = (m as any).status === "ABSENT" || (m as any).status === "A";
      const gp = isAbsent ? 0.0 : getGPValue(m.obtainedMarks, m.totalMarks);
      
      if (!semestersMap[sem]) {
        semestersMap[sem] = { gpPoints: 0, credits: 0 };
      }
      semestersMap[sem].gpPoints += gp * credit;
      semestersMap[sem].credits += credit;
    });

    const semestersData = Object.entries(semestersMap)
      .map(([semStr, d]) => ({
        semester: parseInt(semStr),
        gpa: d.credits > 0 ? parseFloat((d.gpPoints / d.credits).toFixed(2)) : 0,
        creditHours: d.credits,
        qualityPoints: d.gpPoints,
      }))
      .sort((a, b) => a.semester - b.semester);

    const semestersWithProgCGPA = semestersData.map((sd) => {
      const upToHere = semestersData.filter((x) => x.semester <= sd.semester);
      const prog = calculateStudentCGPA({ bsAdmissionType: s.bsAdmissionType }, upToHere);
      return {
        ...sd,
        progressiveCGPA: prog.cgpa,
      };
    });

    const cgpaResult = calculateStudentCGPA(
      { bsAdmissionType: s.bsAdmissionType },
      semestersData
    );

    return { semestersData: semestersWithProgCGPA, ...cgpaResult };
  };

  const filtered = students.filter(
    (s) =>
      s.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">BS GPA & CGPA Tracker</h1>
          <p className="text-gray-500 mt-1">
            Dynamic Cumulative Grade Point Average calculation based on HEC standards.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-3">
        <input
          type="text"
          placeholder="🔍 Search student name or roll number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-gray-400">Loading student grades...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-5 py-3 font-semibold text-gray-600">Student Info</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Admission Mode</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Semester Wise GPA</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-center">Total Credits</th>
                  <th className="px-5 py-3 font-bold text-blue-700 bg-blue-50 text-center">CGPA</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const { semestersData, cgpa, totalCredits } = getStudentGPAData(s);
                  return (
                    <tr key={s.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900">{s.user?.name}</div>
                        <div className="text-xs font-semibold text-gray-500">{s.rollNumber}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                          s.bsAdmissionType === "BRIDGING_5TH"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {s.bsAdmissionType === "BRIDGING_5TH" ? "Bridging (5th Sem)" : "Regular"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {semestersData.map((sd) => (
                            <span key={sd.semester} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                              <span className="font-semibold text-gray-600">Sem {sd.semester}:</span>
                              <span className="font-black text-gray-900">GPA {sd.gpa.toFixed(2)}</span>
                              <span className="text-[10px] text-blue-700 font-bold bg-blue-100/60 px-1 py-0.5 rounded">
                                CGPA {sd.progressiveCGPA.toFixed(2)}
                              </span>
                            </span>
                          ))}
                          {semestersData.length === 0 && (
                            <span className="text-gray-400 text-xs italic">No results compiled yet</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center font-medium text-gray-700">
                        {totalCredits}
                      </td>
                      <td className="px-5 py-4 text-center font-extrabold text-blue-800 bg-blue-50/50 text-base">
                        {cgpa.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">
                      No BS students with grade records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
