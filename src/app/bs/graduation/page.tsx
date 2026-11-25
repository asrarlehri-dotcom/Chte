"use client";

import { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { PortalPageHeader } from "@/components/common/PortalPageHeader";

type StudentData = {
  id: string;
  rollNumber: string;
  user: { name: string };
  currentSemester: number | null;
  bsAdmissionType: string | null;
  isActive: boolean;
};

export default function GraduationTrackerPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStudents(data.filter((s: any) => s.educationLevel === "BS"));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const checkEligibility = (s: StudentData) => {
    if (s.bsAdmissionType === "BRIDGING_5TH") {
      // Bridging graduation threshold is 8 semesters (they start at 5th, so they complete 4 semesters)
      return (s.currentSemester || 5) >= 8;
    }
    return (s.currentSemester || 1) >= 8;
  };

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Graduation Audit Tool"
        subtitle="Audit and approve graduation status for BS students."
        icon={<GraduationCap className="w-6 h-6" />}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-gray-400">Loading records...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-5 py-3 font-semibold text-gray-600">Student Info</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Admission Mode</th>
                  <th className="px-5 py-3 font-semibold text-center">Semesters Done</th>
                  <th className="px-5 py-3 font-semibold text-center">Audit Status</th>
                  <th className="px-5 py-3 font-semibold text-center">Graduation Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const eligible = checkEligibility(s);
                  return (
                    <tr key={s.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900">{s.user?.name}</div>
                        <div className="text-xs font-mono text-gray-500">{s.rollNumber}</div>
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
                      <td className="px-5 py-4 text-center font-bold">
                        {s.bsAdmissionType === "BRIDGING_5TH"
                          ? `${(s.currentSemester || 5) - 4}/4 Semesters Completed`
                          : `${s.currentSemester || 1}/8 Semesters Completed`}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {eligible ? (
                          <span className="px-2.5 py-1 text-xs rounded-full font-extrabold bg-green-100 text-green-700 border border-green-200">
                            🎓 ELIGIBLE FOR GRADUATION
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs rounded-full font-extrabold bg-yellow-100 text-yellow-700 border border-yellow-200">
                            IN PROGRESS
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          disabled={!eligible}
                          onClick={() => alert(`Official graduation award approved for ${s.user?.name}!`)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Approve Degree Award
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
