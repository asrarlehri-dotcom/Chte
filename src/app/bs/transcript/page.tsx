"use client";

import { useState, useEffect, useMemo } from "react";
import { useSettings } from "@/lib/useSettings";
import OfficialTranscriptDocument, { TranscriptStudentData } from "@/components/OfficialTranscriptDocument";

export default function TranscriptGeneratorPage() {
  const { collegeName, collegeAddress } = useSettings();
  const [students, setStudents] = useState<TranscriptStudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<TranscriptStudentData | null>(null);
  const [transcriptSpan, setTranscriptSpan] = useState<"1-2" | "1-4" | "1-6" | "1-8">("1-8");
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.rollNumber.toLowerCase().includes(q) ||
        (s.user?.name || "").toLowerCase().includes(q) ||
        (s.program?.name || "").toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const maxSem =
    transcriptSpan === "1-2" ? 2 :
    transcriptSpan === "1-4" ? 4 :
    transcriptSpan === "1-6" ? 6 : 8;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* ─── Control Header ─── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between flex-wrap gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Official Student Transcript Generator</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            University of Balochistan Standard 4-Year Academic Degree Transcript (Semesters 1 to 8).
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow flex items-center gap-2 transition-all cursor-pointer"
        >
          <span>🖨️</span>
          <span>Print Official Transcript</span>
        </button>
      </div>

      {/* ─── Filter & Selection Panel ─── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
              Search by Roll No / Name
            </label>
            <input
              type="text"
              placeholder="e.g. 2022-GPGCQ-018 or Maryam"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
              Select Student ({filteredStudents.length} Found)
            </label>
            <select
              value={selectedStudent?.id || ""}
              onChange={(e) => {
                const s = students.find((item) => item.id === e.target.value);
                setSelectedStudent(s || null);
              }}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white font-bold text-gray-800"
            >
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.rollNumber} — {s.user?.name} ({s.program?.name || "BS Degree"}) [Sem {s.currentSemester || 8}]
                </option>
              ))}
            </select>
          </div>
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
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5 cursor-pointer ${
                  transcriptSpan === item.val
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
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

      {/* ─── Live Official Transcript Document ─── */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 font-bold bg-white rounded-2xl border border-gray-100">
          Loading student transcripts...
        </div>
      ) : selectedStudent ? (
        <div className="overflow-x-auto pb-6">
          <OfficialTranscriptDocument
            student={selectedStudent}
            fromSemester={1}
            toSemester={maxSem}
            collegeName={collegeName}
            collegeAddress={collegeAddress}
            universityName="University of Balochistan, Quetta"
          />
        </div>
      ) : (
        <div className="p-12 text-center text-gray-400 font-bold bg-white rounded-2xl border border-gray-100">
          No BS student records found to generate transcript.
        </div>
      )}
    </div>
  );
}
