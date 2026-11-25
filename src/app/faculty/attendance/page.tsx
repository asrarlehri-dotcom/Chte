"use client";

import { ClipboardCheck } from "lucide-react";
import { PortalPageHeader } from "@/components/common/PortalPageHeader";

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Attendance Management"
        subtitle="Mark daily attendance for classes (Intermediate) and courses (BS)."
        icon={<ClipboardCheck className="w-6 h-6" />}
      />

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Select Class/Section to Mark Attendance</h2>
        <div className="max-w-md mx-auto space-y-4">
          <select className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700">
            <option value="">-- Choose Class / Section --</option>
            <option value="1">F.Sc Pre-Medical - Section A</option>
            <option value="2">I.C.S - Section 1</option>
            <option value="3">BS Computer Science - Semester 3</option>
          </select>
          <input type="date" className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" defaultValue={new Date().toISOString().split('T')[0]} />
          
          <button className="w-full px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Load Students
          </button>
        </div>
      </div>
      
      {/* List of students for marking attendance would appear here */}
    </div>
  );
}
