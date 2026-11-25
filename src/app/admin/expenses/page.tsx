"use client";

import React, { useState, useEffect } from "react";
import { usePermissions } from "@/lib/usePermissions";
import { MODULES, ACTIONS } from "@/lib/permissions";
import { Receipt } from "lucide-react";
import { PortalPageHeader } from "@/components/common/PortalPageHeader";

type Expense = {
  id: string;
  category: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  vendorPayee?: string | null;
  paymentMethod: string;
  departmentId?: string | null;
  department?: { name: string } | null;
  session?: string | null;
};

type Department = { id: string; name: string };

const CATEGORIES = ["SALARY", "UTILITIES", "MAINTENANCE", "STATIONERY", "EQUIPMENT", "TRAVEL", "FOOD", "REPAIR", "OTHER"];
const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE"];
const STATUSES = ["PAID", "PENDING", "CANCELLED"];

const INPUT = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";
const LABEL = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

const blankForm = {
  category: "SALARY", date: new Date().toISOString().split("T")[0],
  description: "", amount: "", vendorPayee: "", paymentMethod: "CASH",
  departmentId: "", session: "", status: "PAID",
};

export default function ExpensesPage() {
  const { can } = usePermissions();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [deleteConfirm, setDeleteConfirm] = useState<Expense | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = (ids: string[]) =>
    setSelectedIds(prev => prev.length === ids.length ? [] : ids);

  const canAdd = can(MODULES.ADMIN_EXPENSES, ACTIONS.ADD);
  const canEdit = can(MODULES.ADMIN_EXPENSES, ACTIONS.EDIT);
  const canDelete = can(MODULES.ADMIN_EXPENSES, ACTIONS.DELETE);

  useEffect(() => {
    fetchExpenses();
    fetch("/api/departments").then(r => r.json()).then(d => setDepartments(Array.isArray(d) ? d : []));
  }, []);

  const showToast = (type: string, text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: "", text: "" }), 3500);
  };

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/expenses");
      if (res.ok) setExpenses(await res.json());
    } catch {}
    finally { setIsLoading(false); }
  };

  const openAdd = () => {
    setEditItem(null);
    setForm(blankForm);
    setShowModal(true);
  };

  const openEdit = (e: Expense) => {
    setEditItem(e);
    setForm({
      category: e.category, date: e.date?.split("T")[0] || "",
      description: e.description, amount: String(e.amount),
      vendorPayee: e.vendorPayee || "", paymentMethod: e.paymentMethod,
      departmentId: e.departmentId || "", session: e.session || "",
      status: e.status,
    });
    setShowModal(true);
  };

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    try {
      const url = editItem ? `/api/expenses/${editItem.id}` : "/api/expenses";
      const method = editItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", editItem ? "Expense updated!" : "Expense added!");
        setShowModal(false);
        fetchExpenses();
      } else {
        showToast("error", data.error || "Failed to save.");
      }
    } catch { showToast("error", "Network error."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (e: Expense) => {
    try {
      const res = await fetch(`/api/expenses/${e.id}`, { method: "DELETE" });
      if (res.ok) { showToast("success", "Expense deleted."); fetchExpenses(); }
      else { const d = await res.json(); showToast("error", d.error || "Delete failed."); }
    } catch { showToast("error", "Network error."); }
    finally { setDeleteConfirm(null); }
  };

  const totalAmount = expenses.reduce((s, e) => s + (e.status !== "CANCELLED" ? e.amount : 0), 0);
  const paidAmount = expenses.filter(e => e.status === "PAID").reduce((s, e) => s + e.amount, 0);
  const pendingAmount = expenses.filter(e => e.status === "PENDING").reduce((s, e) => s + e.amount, 0);

  const filtered = expenses.filter(e => {
    const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.vendorPayee?.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "ALL" || e.category === filterCategory;
    const matchStatus = filterStatus === "ALL" || e.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const statusColor: Record<string, string> = {
    PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast.text && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`}>
          {toast.text}
        </div>
      )}

      {/* Header */}
      <PortalPageHeader
        title="Expense Management"
        subtitle="Track and manage all institutional expenses."
        icon={<Receipt className="w-6 h-6" />}
      >
        {canAdd && (
          <button onClick={openAdd} className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer">
            + Add Expense
          </button>
        )}
      </PortalPageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Expenditure", amount: totalAmount, color: "text-slate-800", bg: "bg-slate-50 border-slate-200" },
          { label: "Paid", amount: paidAmount, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Pending", amount: pendingAmount, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
        ].map(s => (
          <div key={s.label} className={`p-5 rounded-2xl border ${s.bg}`}>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>Rs {s.amount.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-3 items-center">
        <input
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="🔍 Search description, vendor, category..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-white focus:outline-none">
          <option value="ALL">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-white focus:outline-none">
          <option value="ALL">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-slate-400 font-semibold ml-auto">{filtered.length} record(s)</span>
        {selectedIds.length > 0 && (
          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 font-semibold">Loading expenses...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input type="checkbox" className="w-4 h-4 rounded accent-blue-400 cursor-pointer"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={() => toggleAll(filtered.map(e => e.id))} />
                  </th>
                  {["#", "Date", "Category", "Description", "Vendor/Payee", "Department", "Method", "Amount", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 font-black whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e, i) => (
                  <tr key={e.id} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"} hover:bg-blue-50/30 transition-colors ${selectedIds.includes(e.id) ? "!bg-blue-50" : ""}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        checked={selectedIds.includes(e.id)}
                        onChange={() => toggleSelect(e.id)} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-bold text-xs">{i + 1}</td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap text-xs">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-black uppercase tracking-wider">{e.category}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium max-w-[180px] truncate">{e.description}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{e.vendorPayee || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{e.department?.name || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{e.paymentMethod}</td>
                    <td className="px-4 py-3 font-black text-slate-800 whitespace-nowrap">Rs {e.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${statusColor[e.status] || "bg-slate-100 text-slate-600"}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <button onClick={() => openEdit(e)} className="px-2 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-100 transition-all">
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeleteConfirm(e)} className="px-2 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-100 transition-all">
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-12 text-slate-400 font-semibold text-xs uppercase tracking-widest">No expenses found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-slate-900">{editItem ? "Edit Expense" : "Add New Expense"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Category *</label>
                  <select required className={INPUT} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Date *</label>
                  <input required type="date" className={INPUT} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className={LABEL}>Description *</label>
                  <input required className={INPUT} placeholder="Enter description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className={LABEL}>Amount (Rs) *</label>
                  <input required type="number" min="0" step="0.01" className={INPUT} placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className={LABEL}>Payment Method *</label>
                  <select required className={INPUT} value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Vendor / Payee</label>
                  <input className={INPUT} placeholder="Name or company..." value={form.vendorPayee} onChange={e => setForm(f => ({ ...f, vendorPayee: e.target.value }))} />
                </div>
                <div>
                  <label className={LABEL}>Department</label>
                  <select className={INPUT} value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}>
                    <option value="">— None —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Session / Year</label>
                  <input className={INPUT} placeholder="e.g. 2026" value={form.session} onChange={e => setForm(f => ({ ...f, session: e.target.value }))} />
                </div>
                <div>
                  <label className={LABEL}>Status</label>
                  <select className={INPUT} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                  {saving ? "Saving..." : editItem ? "Update Expense" : "Add Expense"}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm space-y-4">
            <div className="text-3xl text-center">🗑️</div>
            <h2 className="text-lg font-black text-slate-900 text-center">Delete Expense?</h2>
            <p className="text-sm text-slate-500 text-center">
              <span className="font-bold text-slate-800">{deleteConfirm.category}</span> — Rs {deleteConfirm.amount.toLocaleString()}<br />
              <span className="text-xs">{deleteConfirm.description}</span>
            </p>
            <p className="text-xs text-slate-400 text-center">This will soft-delete the record (recoverable by admin).</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all">
                Delete
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
