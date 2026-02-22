'use client';

import React, { useState, useMemo } from 'react';
import { useProject } from '@/hooks/useProject';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { Plus, Trash2, Pencil, ChevronRight } from 'lucide-react';
import { generateId } from '@/lib/utils';
import { Issue, IssueStatus } from '@/types';
import styles from './page.module.css';
import { cn } from '@/lib/utils';

const STATUS_CYCLE: IssueStatus[] = ['New', 'Triaged', 'In Progress', 'Resolved', 'Closed'];
const FILTERS = ['All', 'Open', 'High Priority', 'Resolved'] as const;

export default function IssuesPage() {
    const { issues, members, tasks, addIssue, updateIssue, deleteIssue } = useProject();
    const [filter, setFilter] = useState<typeof FILTERS[number]>('All');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editIssue, setEditIssue] = useState<Issue | null>(null);

    const defaultNew = {
        title: '',
        description: '',
        severity: 'S3' as Issue['severity'],
        ownerId: '',
        relatedTaskId: '',
    };
    const [newIssue, setNewIssue] = useState(defaultNew);

    const filtered = useMemo(() => {
        switch (filter) {
            case 'Open': return issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed');
            case 'High Priority': return issues.filter(i => i.severity === 'S1' || i.severity === 'S2');
            case 'Resolved': return issues.filter(i => i.status === 'Resolved' || i.status === 'Closed');
            default: return issues;
        }
    }, [issues, filter]);

    const cycleStatus = (issue: Issue) => {
        const idx = STATUS_CYCLE.indexOf(issue.status);
        const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
        updateIssue(issue.id, { status: next });
    };

    const findMember = (id?: string) => members.find(m => m.id === id)?.name || '—';

    const handleAdd = () => {
        if (!newIssue.title || !newIssue.description) return;
        addIssue({
            id: generateId('i'),
            title: newIssue.title,
            description: newIssue.description,
            severity: newIssue.severity,
            status: 'New',
            createdAt: new Date().toISOString().split('T')[0],
            ownerId: newIssue.ownerId || undefined,
            relatedTaskId: newIssue.relatedTaskId || undefined,
        });
        setNewIssue(defaultNew);
        setIsAddOpen(false);
    };

    const handleEditSave = () => {
        if (!editIssue) return;
        updateIssue(editIssue.id, {
            title: editIssue.title,
            description: editIssue.description,
            severity: editIssue.severity,
            ownerId: editIssue.ownerId || undefined,
            relatedTaskId: editIssue.relatedTaskId || undefined,
        });
        setEditIssue(null);
    };

    const statusClass = (s: IssueStatus) => {
        switch (s) {
            case 'New': return styles.statusNew;
            case 'Triaged': return styles.statusTriaged;
            case 'In Progress': return styles.statusInProgress;
            case 'Resolved': return styles.statusResolved;
            case 'Closed': return styles.statusClosed;
        }
    };

    const renderForm = (data: typeof newIssue | Issue, onChange: (d: typeof newIssue) => void, onSave: () => void, onCancel: () => void, saveLabel: string) => (
        <div className={styles.form}>
            <div className={styles.formGroup}>
                <label>Title *</label>
                <input className={styles.input} value={data.title} onChange={e => onChange({ ...data as typeof newIssue, title: e.target.value })} placeholder="Issue title" />
            </div>
            <div className={styles.formGroup}>
                <label>Description *</label>
                <textarea className={styles.textarea} value={data.description} onChange={e => onChange({ ...data as typeof newIssue, description: e.target.value })} placeholder="Describe the issue" />
            </div>
            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label>Severity</label>
                    <select className={styles.select} value={data.severity} onChange={e => onChange({ ...data as typeof newIssue, severity: e.target.value as Issue['severity'] })}>
                        <option value="S1">S1 — Critical</option>
                        <option value="S2">S2 — High</option>
                        <option value="S3">S3 — Medium</option>
                        <option value="S4">S4 — Low</option>
                    </select>
                </div>
                <div className={styles.formGroup}>
                    <label>Owner</label>
                    <select className={styles.select} value={data.ownerId || ''} onChange={e => onChange({ ...data as typeof newIssue, ownerId: e.target.value })}>
                        <option value="">— Unassigned —</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
            </div>
            <div className={styles.formGroup}>
                <label>Related Task</label>
                <select className={styles.select} value={data.relatedTaskId || ''} onChange={e => onChange({ ...data as typeof newIssue, relatedTaskId: e.target.value })}>
                    <option value="">— None —</option>
                    {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
            </div>
            <div className={styles.formActions}>
                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button onClick={onSave}>{saveLabel}</Button>
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Issues</h1>
                    <p className={styles.subtitle}>{issues.length} total issues</p>
                </div>
                <Button size="sm" onClick={() => setIsAddOpen(true)}>
                    <Plus size={14} /> Report Issue
                </Button>
            </header>

            {/* Filters */}
            <div className={styles.filterBar}>
                {FILTERS.map(f => (
                    <button
                        key={f}
                        className={cn(styles.filterBtn, filter === f && styles.filterActive)}
                        onClick={() => setFilter(f)}
                    >
                        {f}
                        {f === 'All' && <span className={styles.filterCount}>{issues.length}</span>}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <Card>
                    <div className={styles.emptyState}>No issues found. Click &quot;Report Issue&quot; to create one.</div>
                </Card>
            ) : (
                <div className={styles.issueList}>
                    {filtered.map(issue => (
                        <Card key={issue.id} className={styles.issueCard}>
                            <div className={styles.issueTop}>
                                <div className={styles.issueLeft}>
                                    <Badge variant={issue.severity.toLowerCase() as 's1' | 's2' | 's3' | 's4'}>{issue.severity}</Badge>
                                    <h3 className={styles.issueTitle} onClick={() => setEditIssue(issue)}>
                                        {issue.title}
                                    </h3>
                                </div>
                                <div className={styles.issueRight}>
                                    <span
                                        className={cn(styles.statusPill, statusClass(issue.status))}
                                        onClick={() => cycleStatus(issue)}
                                        title="Click to change status"
                                    >
                                        {issue.status}
                                        <ChevronRight size={10} className={styles.chevron} />
                                    </span>
                                </div>
                            </div>
                            <p className={styles.issueDesc}>{issue.description}</p>
                            <div className={styles.issueMeta}>
                                <span>Owner: {findMember(issue.ownerId)}</span>
                                <span>Created: {issue.createdAt}</span>
                                <div className={styles.issueActions}>
                                    <button className={styles.actionBtn} onClick={() => setEditIssue(issue)} title="Edit">
                                        <Pencil size={13} />
                                    </button>
                                    <button className={cn(styles.actionBtn, styles.deleteBtn)} onClick={() => deleteIssue(issue.id)} title="Delete">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Issue Modal */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Report Issue">
                {renderForm(newIssue, setNewIssue as (d: typeof newIssue) => void, handleAdd, () => setIsAddOpen(false), 'Report Issue')}
            </Modal>

            {/* Edit Issue Modal */}
            <Modal isOpen={!!editIssue} onClose={() => setEditIssue(null)} title="Edit Issue">
                {editIssue && renderForm(
                    editIssue,
                    (d) => setEditIssue({ ...editIssue, ...d }),
                    handleEditSave,
                    () => setEditIssue(null),
                    'Save Changes'
                )}
            </Modal>
        </div>
    );
}
