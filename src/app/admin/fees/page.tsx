"use client";

import { useState, useEffect } from "react";
import { CreditCard } from "lucide-react";
import { PortalPageHeader } from "@/components/common/PortalPageHeader";

type Fee = {
  id: string;
  student: {
    rollNumber: string;
    educationLevel: string;
    user: {
      name: string;
    };
  };
  amount: number;
  dueDate: string;
  status: string;
  challanNumber: string;
};

export default function FeeManagementPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const res = await fetch("/api/fees");
      if (res.ok) {
        const data = await res.json();
        setFees(data);
      }
    } catch (error) {
      console.error("Failed to fetch fees", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/fees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchFees();
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  if (loading) return <div className="p-8">Loading fees...</div>;

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Fee Management"
        subtitle="Manage student fee challans and payments."
        icon={<CreditCard className="w-6 h-6" />}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challan No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No fee records found.</td>
              </tr>
            ) : (
              fees.map((fee) => (
                <tr key={fee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {fee.challanNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{fee.student.user.name}</div>
                    <div className="text-sm text-gray-500">{fee.student.rollNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                    Rs. {fee.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(fee.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      fee.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {fee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {fee.status === "UNPAID" && (
                      <button 
                        onClick={() => handleStatusChange(fee.id, "PAID")}
                        className="text-blue-600 hover:text-blue-900 font-bold"
                      >
                        Mark as Paid
                      </button>
                    )}
                    {fee.status === "PAID" && (
                      <span className="text-gray-400">Completed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
