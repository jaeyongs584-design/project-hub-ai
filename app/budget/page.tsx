'use client';

import React, { useState, useMemo } from 'react';
import { useProject } from '@/hooks/useProject';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { Plus, Trash2, DollarSign, TrendingDown, Wallet, PieChart } from 'lucide-react';
import { generateId } from '@/lib/utils';
import { BudgetEntry } from '@/types';
import styles from './page.module.css';

const CATEGORIES: BudgetEntry['category'][] = ['Labor', 'Hardware', 'Software', 'Travel', 'Training', 'Consulting', 'Other'];

const CATEGORY_COLORS: Record<string, string> = {
    Labor: '#6c5ce7',
    Hardware: '#0984e3',
    Software: '#00cec9',
    Travel: '#e17055',
    Training: '#fdcb6e',
    Consulting: '#e84393',
    Other: '#636e72',
};

export default function BudgetPage() {
    const { budget, setContractAmount, addBudgetEntry, deleteBudgetEntry, addActivity } = useProject();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [localContract, setLocalContract] = useState('');
    const [editingContract, setEditingContract] = useState(false);

    // Form state
    const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [formCategory, setFormCategory] = useState<BudgetEntry['category']>('Labor');
    const [formDesc, setFormDesc] = useState('');
    const [formAmount, setFormAmount] = useState('');

    // Computed
    const spent = useMemo(() => budget.entries.reduce((s, e) => s + e.amount, 0), [budget.entries]);
    const remaining = budget.contractAmount - spent;
    const usedPercent = budget.contractAmount > 0 ? Math.round((spent / budget.contractAmount) * 100) : 0;

    const categoryBreakdown = useMemo(() => {
        const map: Record<string, number> = {};
        budget.entries.forEach(e => {
            map[e.category] = (map[e.category] || 0) + e.amount;
        });
        return CATEGORIES.map(cat => ({
            name: cat,
            amount: map[cat] || 0,
            percent: spent > 0 ? Math.round(((map[cat] || 0) / spent) * 100) : 0,
        })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);
    }, [budget.entries, spent]);

    const handleSaveContract = () => {
        const val = parseFloat(localContract);
        if (!isNaN(val) && val >= 0) {
            setContractAmount(val);
            addActivity({
                id: generateId('act'),
                timestamp: new Date().toISOString(),
                action: 'Budget updated',
                detail: `Contract amount set to $${val.toLocaleString()}`,
                category: 'budget',
            });
        }
        setEditingContract(false);
    };

    const handleAddEntry = () => {
        const amount = parseFloat(formAmount);
        if (!formDesc.trim() || isNaN(amount) || amount <= 0) return;
        const entry: BudgetEntry = {
            id: generateId('bud'),
            date: formDate,
            category: formCategory,
            description: formDesc.trim(),
            amount,
        };
        addBudgetEntry(entry);
        addActivity({
            id: generateId('act'),
            timestamp: new Date().toISOString(),
            action: 'Expense added',
            detail: `$${amount.toLocaleString()} — ${formDesc.trim()} (${formCategory})`,
            category: 'budget',
        });
        // Reset
        setFormDesc('');
        setFormAmount('');
        setIsAddOpen(false);
    };

    const handleDelete = (entry: BudgetEntry) => {
        deleteBudgetEntry(entry.id);
        addActivity({
            id: generateId('act'),
            timestamp: new Date().toISOString(),
            action: 'Expense removed',
            detail: `$${entry.amount.toLocaleString()} — ${entry.description}`,
            category: 'budget',
        });
    };

    const sortedEntries = useMemo(() =>
        [...budget.entries].sort((a, b) => b.date.localeCompare(a.date)),
        [budget.entries]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Budget</h1>
                    <p className={styles.subtitle}>Track project spending & cost breakdown</p>
                </div>
                <Button size="sm" onClick={() => setIsAddOpen(true)}>
                    <Plus size={14} /> Add Expense
                </Button>
            </header>

            {/* Contract Amount */}
            <div className={styles.contractSection}>
                <span className={styles.contractLabel}>Contract Amount ($)</span>
                {editingContract ? (
                    <>
                        <input
                            className={styles.contractInput}
                            type="number"
                            min={0}
                            value={localContract}
                            onChange={(e) => setLocalContract(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveContract()}
                            autoFocus
                        />
                        <Button size="sm" onClick={handleSaveContract}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingContract(false)}>Cancel</Button>
                    </>
                ) : (
                    <>
                        <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                            {budget.contractAmount > 0 ? `$${budget.contractAmount.toLocaleString()}` : 'Not set'}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => { setLocalContract(String(budget.contractAmount)); setEditingContract(true); }}>
                            Edit
                        </Button>
                    </>
                )}
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
                <Card glass glow className={styles.summaryCard}>
                    <CardContent>
                        <div className={styles.summaryLabel}>Total Budget</div>
                        <div className={styles.summaryValue}>
                            ${budget.contractAmount.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>

                <Card glass glow className={styles.summaryCard}>
                    <CardContent>
                        <div className={styles.summaryLabel}>Spent</div>
                        <div className={`${styles.summaryValue} ${usedPercent > 90 ? styles.textRed : usedPercent > 70 ? styles.textYellow : ''}`}>
                            ${spent.toLocaleString()}
                        </div>
                        <div className={styles.usageBar}>
                            <div
                                className={styles.usageFill}
                                style={{
                                    width: `${Math.min(usedPercent, 100)}%`,
                                    background: usedPercent > 90 ? 'var(--danger)' : usedPercent > 70 ? 'var(--warning)' : 'var(--primary)',
                                }}
                            />
                        </div>
                        <div className={styles.summaryMeta}>{usedPercent}% of budget</div>
                    </CardContent>
                </Card>

                <Card glass glow className={styles.summaryCard}>
                    <CardContent>
                        <div className={styles.summaryLabel}>Remaining</div>
                        <div className={`${styles.summaryValue} ${remaining < 0 ? styles.textRed : styles.textGreen}`}>
                            ${Math.abs(remaining).toLocaleString()}
                            {remaining < 0 && <span className={styles.summaryUnit}> over</span>}
                        </div>
                    </CardContent>
                </Card>

                <Card glass glow className={styles.summaryCard}>
                    <CardContent>
                        <div className={styles.summaryLabel}>Expenses</div>
                        <div className={styles.summaryValue}>{budget.entries.length}</div>
                        <div className={styles.summaryMeta}>{categoryBreakdown.length} categories</div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Breakdown */}
            {categoryBreakdown.length > 0 && (
                <Card>
                    <CardHeader><CardTitle><PieChart size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />Category Breakdown</CardTitle></CardHeader>
                    <CardContent>
                        <div className={styles.breakdownSection}>
                            {categoryBreakdown.map(cat => (
                                <div key={cat.name} className={styles.categoryRow}>
                                    <span className={styles.categoryName}>{cat.name}</span>
                                    <div className={styles.categoryBarWrap}>
                                        <div
                                            className={styles.categoryBarFill}
                                            style={{
                                                width: `${cat.percent}%`,
                                                background: CATEGORY_COLORS[cat.name] || '#636e72',
                                            }}
                                        />
                                    </div>
                                    <span className={styles.categoryAmount}>${cat.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Expense Ledger */}
            <Card>
                <CardHeader>
                    <div className={styles.sectionHeader}>
                        <CardTitle><Wallet size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />Expense Ledger</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {sortedEntries.length === 0 ? (
                        <div className={styles.emptyState}>
                            <DollarSign size={20} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                            <p>No expenses recorded yet. Click &quot;Add Expense&quot; to start tracking.</p>
                        </div>
                    ) : (
                        <table className={styles.ledgerTable}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th style={{ textAlign: 'right' }}>Amount</th>
                                    <th style={{ width: 40 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedEntries.map(entry => (
                                    <tr key={entry.id}>
                                        <td>{entry.date}</td>
                                        <td><span className={styles.categoryBadge}>{entry.category}</span></td>
                                        <td>{entry.description}</td>
                                        <td className={styles.amountCell} style={{ textAlign: 'right' }}>${entry.amount.toLocaleString()}</td>
                                        <td>
                                            <button className={styles.deleteBtn} onClick={() => handleDelete(entry)} title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                                    <td colSpan={3} style={{ textAlign: 'right', color: 'var(--foreground-muted)' }}>Total</td>
                                    <td className={styles.amountCell} style={{ textAlign: 'right' }}>${spent.toLocaleString()}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>

            {/* Add Expense Modal */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Expense">
                <div className={styles.formGrid}>
                    <div className={styles.formRow}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Date</label>
                            <input
                                type="date"
                                className={styles.formInput}
                                value={formDate}
                                onChange={(e) => setFormDate(e.target.value)}
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Category</label>
                            <select
                                className={styles.formSelect}
                                value={formCategory}
                                onChange={(e) => setFormCategory(e.target.value as BudgetEntry['category'])}
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Description</label>
                        <input
                            className={styles.formInput}
                            value={formDesc}
                            onChange={(e) => setFormDesc(e.target.value)}
                            placeholder="What was this expense for?"
                        />
                    </div>
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Amount ($)</label>
                        <input
                            type="number"
                            min={0}
                            step={0.01}
                            className={styles.formInput}
                            value={formAmount}
                            onChange={(e) => setFormAmount(e.target.value)}
                            placeholder="0.00"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddEntry()}
                        />
                    </div>
                    <div className={styles.formActions}>
                        <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddEntry}>Add Expense</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
