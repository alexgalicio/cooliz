export interface Expense {
  id?: number;
  category: string;
  description?: string;
  amount: number;
  expenseDate: string;
  created_at?: string;
}
