import { useEffect, useState } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { addExpense, getAllExpenses, updateExpense } from "../services/storage";
import { formatCurrency, formatDate } from "../utils/formatter";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const expenseCategories = [
  "Supplies",
  "Utilities",
  "Maintenance",
  "Staff",
  "Marketing",
  "Taxes",
  "Other",
];

type ExpenseForm = {
  category: string;
  description: string;
  amount: string;
  expenseDate: string;
};

function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${month}`;
  });
  const [form, setForm] = useState<ExpenseForm>({
    category: "",
    description: "",
    amount: "",
    expenseDate: "",
  });
  const [editModal, setEditModal] = useState<{ open: boolean; expense: any | null }>({ open: false, expense: null });

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [monthFilter, expenses]);

  async function loadExpenses() {
    setLoading(true);
    try {
      const data = await getAllExpenses();
      setExpenses(data as any[]);
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.category || !form.amount || !form.expenseDate) {
      alert("Please fill in all required fields.");
      return;
    }

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Amount must be a number greater than 0.");
      return;
    }

    setSaving(true);
    try {
      await addExpense({
        category: form.category,
        description: form.description,
        amount,
        expenseDate: form.expenseDate,
      });
      setForm({ category: "", description: "", amount: "", expenseDate: "" });
      await loadExpenses();
    } catch (err: any) {
      alert("Error: " + (err?.message ?? err?.toString() ?? "Failed to save expense"));
    } finally {
      setSaving(false);
    }
  }

  async function handleEditExpense(expense: any) {
    setEditModal({ open: true, expense });
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editModal.expense) return;
    const { id, category, description, amount, expense_date } = editModal.expense;
    if (!category || !amount || !expense_date) {
      alert("Please fill in all required fields.");
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      alert("Amount must be a number greater than 0.");
      return;
    }
    setSaving(true);
    try {
      await updateExpense({
        id,
        category,
        description,
        amount: amt,
        expenseDate: expense_date,
      });
      setEditModal({ open: false, expense: null });
      await loadExpenses();
    } catch (err: any) {
      alert("Error: " + (err?.message ?? err?.toString() ?? "Failed to update expense"));
    } finally {
      setSaving(false);
    }
  }

  const getMonthKey = (dateString: string) => dateString.slice(0, 7);
  const filteredExpenses = monthFilter
    ? expenses.filter((expense) => getMonthKey(expense.expense_date) === monthFilter)
    : expenses;

  const monthlyTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyCount = filteredExpenses.length;
  const monthLabel = monthFilter
    ? new Date(`${monthFilter}-01`).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    })
    : "All Months";

  const totalItems = filteredExpenses.length;
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filteredExpenses.slice(startIndex, startIndex + pageSize);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">Track and manage your expenses</p>
        </div>

        {/* add expense */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Add Expense</h3>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date <span className="required-field">*</span>
              </label>
              <input
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category <span className="required-field">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select category</option>
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <input
                type="text"
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Amount <span className="required-field">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
                <Plus className="h-4 w-4" />
                {saving ? "Saving..." : "Add Expense"}
              </button>
            </div>
          </form>
        </div>

        {/* monthly summary */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Monthly Summary</h3>
              <p className="text-sm text-muted-foreground">{monthLabel}</p>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="month"
                className="input-elegant"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              />
              <button
                type="button"
                className="btn-outline"
                onClick={() => setMonthFilter("")}
              >
                All Months
              </button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {formatCurrency(monthlyTotal)}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Entries</p>
              <p className="text-2xl font-bold text-foreground mt-1">{monthlyCount}</p>
            </div>
          </div>
        </div>

        {/* expenses table */}
        {loading ? (
          <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-border overflow-hidden">
              {filteredExpenses.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No expenses found.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 font-semibold text-foreground">Date</th>
                      <th className="px-4 py-3 font-semibold text-foreground">Category</th>
                      <th className="px-4 py-3 font-semibold text-foreground">Description</th>
                      <th className="px-4 py-3 font-semibold text-foreground">Amount</th>
                      <th className="px-4 py-3 font-semibold text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((expense) => (
                      <tr
                        key={expense.id}
                        className="border-b border-border last:border-b-0 bg-background hover:bg-muted/50 transition-colors group"
                      >
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(expense.expense_date)}</td>
                        <td className="px-4 py-3 text-foreground">{expense.category}</td>
                        <td className="px-4 py-3 text-muted-foreground">{expense.description || "-"}</td>
                        <td className="px-4 py-3 text-foreground font-medium">{formatCurrency(expense.amount)}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="btn-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 focus:ring-2 focus:ring-orange-400 focus:outline-none rounded px-3 py-1 transition"
                            onClick={() => handleEditExpense(expense)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* pagination */}
            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>
                  Showing {startIndex + 1}-
                  {Math.min(startIndex + pageSize, totalItems)} of {totalItems} expenses
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-outline px-2 py-1"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn-outline px-2 py-1"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Edit Expense Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              onClick={() => setEditModal({ open: false, expense: null })}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4">Edit Expense</h3>
            <form onSubmit={handleEditSave} className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date <span className="required-field">*</span></label>
                <input
                  type="date"
                  value={editModal.expense.expense_date}
                  onChange={e => setEditModal(m => ({ ...m, expense: { ...m.expense, expense_date: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category <span className="required-field">*</span></label>
                <select
                  value={editModal.expense.category}
                  onChange={e => setEditModal(m => ({ ...m, expense: { ...m.expense, category: e.target.value } }))}
                >
                  <option value="">Select category</option>
                  {expenseCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={editModal.expense.description || ""}
                  onChange={e => setEditModal(m => ({ ...m, expense: { ...m.expense, description: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount <span className="required-field">*</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editModal.expense.amount}
                  onChange={e => setEditModal(m => ({ ...m, expense: { ...m.expense, amount: e.target.value } }))}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" className="btn-outline" onClick={() => setEditModal({ open: false, expense: null })}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default Expenses;
