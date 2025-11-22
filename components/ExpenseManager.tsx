'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Trash2, Edit2, DollarSign, Users, ArrowRight } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  splitBetween: string[];
  date: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ExpenseSummary {
  totalExpenses: Record<string, number>;
  userTotals: Array<{
    userId: string;
    paid: number;
    owes: number;
    net: number;
    currency: string;
  }>;
  settlements: Array<{
    from: string;
    to: string;
    amount: number;
    currency: string;
  }>;
}

interface ExpenseManagerProps {
  tripId: string;
  tripMembers: Array<{ id: string; name: string; email: string; isOwner: boolean }>;
}

export default function ExpenseManager({ tripId, tripMembers }: ExpenseManagerProps) {
  const { firebaseUser } = useAppStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [paidBy, setPaidBy] = useState('');
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('other');

  const expenseCategories = [
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'food', label: 'Food & Dining' },
    { value: 'transport', label: 'Transportation' },
    { value: 'activities', label: 'Activities' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'other', label: 'Other' },
  ];

  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

  const fetchExpenses = async () => {
    if (!firebaseUser || !tripId) return;
    
    try {
      setLoading(true);
      const token = await firebaseUser.getIdToken();
      const [expensesRes, summaryRes] = await Promise.all([
        fetch(`/api/trips/${tripId}/expenses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/trips/${tripId}/expenses/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData.expenses || []);
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary || null);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [tripId, firebaseUser]);

  useEffect(() => {
    if (tripMembers.length > 0 && !paidBy) {
      setPaidBy(tripMembers[0].id);
      setSplitBetween(tripMembers.map((m) => m.id));
    }
  }, [tripMembers]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCurrency('INR');
    setPaidBy(tripMembers[0]?.id || '');
    setSplitBetween(tripMembers.map((m) => m.id));
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('other');
    setEditingExpense(null);
  };

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setCurrency(expense.currency);
      setPaidBy(expense.paidBy);
      setSplitBetween(expense.splitBetween);
      setDate(expense.date.split('T')[0]);
      setCategory(expense.category);
    } else {
      resetForm();
    }
    setExpenseDialogOpen(true);
  };

  const handleSaveExpense = async () => {
    if (!firebaseUser || !description || !amount || !paidBy || splitBetween.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = await firebaseUser.getIdToken();
      const expenseData = {
        description,
        amount: parseFloat(amount),
        currency,
        paidBy,
        splitBetween,
        date,
        category,
      };

      const url = editingExpense
        ? `/api/trips/${tripId}/expenses/${editingExpense.id}`
        : `/api/trips/${tripId}/expenses`;
      const method = editingExpense ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save expense');
      }

      toast.success(editingExpense ? 'Expense updated successfully' : 'Expense added successfully');
      setExpenseDialogOpen(false);
      resetForm();
      fetchExpenses();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save expense';
      toast.error(errorMessage);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!firebaseUser || !confirm('Are you sure you want to delete this expense?')) return;

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/trips/${tripId}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete expense');
      }

      toast.success('Expense deleted successfully');
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const toggleSplitMember = (userId: string) => {
    setSplitBetween((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const getUserName = (userId: string) => {
    return tripMembers.find((m) => m.id === userId)?.name || 'Unknown';
  };

  const formatCurrency = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card id="expenses" className="border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-500" />
            <CardTitle>Expenses</CardTitle>
          </div>
          <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
                <DialogDescription>
                  Record an expense and split it between trip members
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Hotel booking"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((curr) => (
                          <SelectItem key={curr} value={curr}>
                            {curr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paidBy">Paid By *</Label>
                    <Select value={paidBy} onValueChange={setPaidBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tripMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Split Between *</Label>
                  <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                    {tripMembers.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`split-${member.id}`}
                          checked={splitBetween.includes(member.id)}
                          onCheckedChange={() => toggleSplitMember(member.id)}
                        />
                        <label
                          htmlFor={`split-${member.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {member.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  {splitBetween.length > 0 && amount && (
                    <p className="text-sm text-muted-foreground">
                      Each person pays: {formatCurrency(parseFloat(amount) / splitBetween.length, currency)}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setExpenseDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveExpense} disabled={!description || !amount || splitBetween.length === 0}>
                  {editingExpense ? 'Update' : 'Add'} Expense
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Track and split expenses between trip members
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Expense Summary */}
            {summary && (
              <div className="p-4 rounded-lg border bg-muted/50">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Expense Summary
                </h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(summary.totalExpenses).map(([curr, total]) => (
                    <div key={curr} className="flex justify-between">
                      <span>Total Expenses:</span>
                      <span className="font-medium">{formatCurrency(total, curr)}</span>
                    </div>
                  ))}
                </div>
                {summary.settlements.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2 text-sm">Settlements:</h4>
                    <div className="space-y-1 text-sm">
                      {summary.settlements.map((settlement, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                          <span>{getUserName(settlement.from)}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span className="font-medium">{getUserName(settlement.to)}</span>
                          <span className="ml-auto font-semibold text-foreground">
                            {formatCurrency(settlement.amount, settlement.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Expenses List */}
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No expenses recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="p-4 rounded-lg border bg-background/50 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{expense.description}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {expenseCategories.find((c) => c.value === expense.category)?.label || expense.category}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {formatCurrency(expense.amount, expense.currency)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Paid by {getUserName(expense.paidBy)}
                            </span>
                            <span>
                              Split: {expense.splitBetween.map(getUserName).join(', ')}
                            </span>
                          </div>
                          <div className="text-xs">
                            {formatCurrency(expense.amount / expense.splitBetween.length, expense.currency)} per person
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(expense)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

