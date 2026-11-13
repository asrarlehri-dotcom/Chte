"use client";

import { useState, useEffect } from "react";
import { sortStudentsByRoll } from "@/lib/domainParsers";

type StudentData = {
  id: string;
  rollNumber: string;
  user: { name: string };
  currentSemester: number | null;
  bsAdmissionType: string | null;
};

export default function PromotionsPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStudents(sortStudentsByRoll(data.filter((s: any) => s.educationLevel === "BS")));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePromote = async (studentId: string, currentSem: number) => {
    const nextSem = currentSem + 1;
    if (nextSem > 8) {
      alert("Student is already in the final 8th semester!");
      return;
    }

    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentSemester: nextSem }),
      });
      if (res.ok) {
        setSuccess(`Student successfully promoted to Semester ${nextSem}!`);
        // Refresh list
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, currentSemester: nextSem } : s))
        );
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      alert("Promotion failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Semester Promotions</h1>
          <p className="text-gray-500 mt-1">
            Promote eligible BS students to their next academic semesters.
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-sm font-semibold">
          {success}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-gray-400">Loading student profiles...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-5 py-3 font-semibold text-gray-600">Student Name</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Roll Number</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Admission Mode</th>
                  <th className="px-5 py-3 font-semibold text-center">Current Semester</th>
                  <th className="px-5 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-bold text-gray-900">{s.user?.name}</td>
                    <td className="px-5 py-4 font-semibold text-gray-600">{s.rollNumber}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                        s.bsAdmissionType === "BRIDGING_5TH"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {s.bsAdmissionType === "BRIDGING_5TH" ? "Bridging" : "Regular"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center font-extrabold text-blue-700">
                      Semester {s.currentSemester || 1}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handlePromote(s.id, s.currentSemester || 1)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                      >
                        🚀 Promote
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">
                      No BS students enrolled.
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
