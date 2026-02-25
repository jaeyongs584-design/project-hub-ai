'use client';

import React, { useState, useMemo } from 'react';
import { useProject } from '@/hooks/useProject';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { Plus, Trash2, Pencil, ChevronRight, ShieldAlert, GitPullRequest, Bot, Loader2 } from 'lucide-react';
import { generateId } from '@/lib/utils';
import { Issue, IssueStatus, Risk, RiskStatus, ChangeRequest, CRStatus } from '@/types';
import styles from './page.module.css';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TabType = 'issues' | 'risks' | 'changes';

const STATUS_CYCLE: IssueStatus[] = ['New', 'Triaged', 'In Progress', 'Resolved', 'Closed'];
const RISK_STATUS_CYCLE: RiskStatus[] = ['Open', 'Monitoring', 'Closed'];
const CR_STATUS_CYCLE: CRStatus[] = ['Pending', 'Approved', 'Rejected', 'Implemented'];
const FILTERS = ['All', 'Open', 'High Priority', 'Resolved'] as const;
const RISK_FILTERS = ['All', 'Open', 'High', 'Review Due'] as const;
const CR_FILTERS = ['All', 'Pending', 'Approved', 'Implemented'] as const;

export default function IssuesPage() {
    const {
        issues, risks, changeRequests, members, tasks,
        addIssue, updateIssue, deleteIssue,
        addRisk, updateRisk, deleteRisk,
        addChangeRequest, updateChangeRequest, deleteChangeRequest,
        addActivity,
    } = useProject();

    const [activeTab, setActiveTab] = useState<TabType>('issues');
    const [filter, setFilter] = useState<typeof FILTERS[number]>('All');
    const [riskFilter, setRiskFilter] = useState<typeof RISK_FILTERS[number]>('All');
    const [crFilter, setCrFilter] = useState<typeof CR_FILTERS[number]>('All');

    // ── Issue state ──
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editIssue, setEditIssue] = useState<Issue | null>(null);
    const defaultNew = { title: '', description: '', severity: 'S3' as Issue['severity'], ownerId: '', relatedTaskId: '', occurredDate: '' };
    const [newIssue, setNewIssue] = useState(defaultNew);

    // ── Risk state ──
    const [isRiskAddOpen, setIsRiskAddOpen] = useState(false);
    const [editRisk, setEditRisk] = useState<Risk | null>(null);
    const defaultRisk = { title: '', probability: 'Medium' as Risk['probability'], impact: 'Medium' as Risk['impact'], ownerId: '', mitigation: '', identifiedDate: '' };
    const [newRisk, setNewRisk] = useState(defaultRisk);

    // ── CR state ──
    const [isCRAddOpen, setIsCRAddOpen] = useState(false);
    const [editCR, setEditCR] = useState<ChangeRequest | null>(null);
    const defaultCR = { title: '', requester: '', changeType: 'Scope' as ChangeRequest['changeType'], impactSummary: '', requestDate: '', reference: '', status: 'Pending' as ChangeRequest['status'] };
    const [newCR, setNewCR] = useState(defaultCR);

    // ── AI State ──
    const [isAILoading, setIsAILoading] = useState(false);

    // ── Issues filtered ──
    const filteredIssues = useMemo(() => {
        switch (filter) {
            case 'Open': return issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed');
            case 'High Priority': return issues.filter(i => i.severity === 'S1' || i.severity === 'S2');
            case 'Resolved': return issues.filter(i => i.status === 'Resolved' || i.status === 'Closed');
            default: return issues;
        }
    }, [issues, filter]);

    const filteredRisks = useMemo(() => {
        const safeRisks = risks || [];
        switch (riskFilter) {
            case 'Open': return safeRisks.filter(r => r.status === 'Open');
            case 'High': return safeRisks.filter(r => r.probability === 'High' && r.impact === 'High');
            case 'Review Due': return safeRisks.filter(r => r.status === 'Open'); // Simple proxy for Review Due
            default: return safeRisks;
        }
    }, [risks, riskFilter]);

    const filteredCRs = useMemo(() => {
        const safeCRs = changeRequests || [];
        switch (crFilter) {
            case 'Pending': return safeCRs.filter(c => c.status === 'Pending');
            case 'Approved': return safeCRs.filter(c => c.status === 'Approved');
            case 'Implemented': return safeCRs.filter(c => c.status === 'Implemented');
            default: return safeCRs;
        }
    }, [changeRequests, crFilter]);

    const findMember = (id?: string) => members.find(m => m.id === id)?.name || '—';

    const cycleStatus = (issue: Issue) => {
        const idx = STATUS_CYCLE.indexOf(issue.status);
        updateIssue(issue.id, { status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] });
    };
    const cycleRiskStatus = (risk: Risk) => {
        const idx = RISK_STATUS_CYCLE.indexOf(risk.status);
        updateRisk(risk.id, { status: RISK_STATUS_CYCLE[(idx + 1) % RISK_STATUS_CYCLE.length] });
    };
    const cycleCRStatus = (cr: ChangeRequest) => {
        const idx = CR_STATUS_CYCLE.indexOf(cr.status);
        updateChangeRequest(cr.id, { status: CR_STATUS_CYCLE[(idx + 1) % CR_STATUS_CYCLE.length] });
    };

    const statusClass = (s: IssueStatus) => {
        const map: Record<IssueStatus, string> = { 'New': styles.statusNew, 'Triaged': styles.statusTriaged, 'In Progress': styles.statusInProgress, 'Resolved': styles.statusResolved, 'Closed': styles.statusClosed };
        return map[s];
    };
    const riskStatusClass = (s: RiskStatus) => {
        const map: Record<RiskStatus, string> = { 'Open': styles.riskOpen, 'Monitoring': styles.riskMonitoring, 'Closed': styles.riskClosed };
        return map[s];
    };
    const crStatusClass = (s: CRStatus) => {
        const map: Record<CRStatus, string> = { 'Pending': styles.crPending, 'Approved': styles.crApproved, 'Rejected': styles.crRejected, 'Implemented': styles.crImplemented };
        return map[s];
    };
    const probImpactClass = (v: string) => {
        const map: Record<string, string> = { 'Low': styles.probLow, 'Medium': styles.probMedium, 'High': styles.probHigh };
        return map[v];
    };

    // ── Handlers ──
    const handleAddIssue = () => {
        if (!newIssue.title) return;
        addIssue({ id: generateId('i'), title: newIssue.title, description: newIssue.description, severity: newIssue.severity, status: 'New', createdAt: newIssue.occurredDate || new Date().toISOString().split('T')[0], ownerId: newIssue.ownerId || undefined, relatedTaskId: newIssue.relatedTaskId || undefined });
        addActivity({ id: generateId('act'), timestamp: new Date().toISOString(), action: 'Issue created', detail: `"${newIssue.title}"`, category: 'issue' });
        setNewIssue(defaultNew); setIsAddOpen(false);
    };
    const handleEditSave = () => {
        if (!editIssue) return;
        updateIssue(editIssue.id, { title: editIssue.title, description: editIssue.description, severity: editIssue.severity, ownerId: editIssue.ownerId || undefined, createdAt: editIssue.createdAt });
        setEditIssue(null);
    };
    const handleAddRisk = () => {
        if (!newRisk.title) return;
        const now = new Date().toISOString();
        addRisk({ id: generateId('rsk'), title: newRisk.title, probability: newRisk.probability, impact: newRisk.impact, status: 'Open', ownerId: newRisk.ownerId || undefined, mitigation: newRisk.mitigation || undefined, createdAt: newRisk.identifiedDate || now.split('T')[0], updatedAt: now });
        addActivity({ id: generateId('act'), timestamp: now, action: 'Risk registered', detail: `"${newRisk.title}"`, category: 'risk' });
        setNewRisk(defaultRisk); setIsRiskAddOpen(false);
    };
    const handleEditRiskSave = () => {
        if (!editRisk) return;
        updateRisk(editRisk.id, { title: editRisk.title, probability: editRisk.probability, impact: editRisk.impact, ownerId: editRisk.ownerId, mitigation: editRisk.mitigation, updatedAt: new Date().toISOString() });
        setEditRisk(null);
    };
    const handleAddCR = () => {
        if (!newCR.title) return;
        const now = new Date().toISOString();
        addChangeRequest({ id: generateId('cr'), title: newCR.title, requestDate: newCR.requestDate || now.split('T')[0], requester: newCR.requester, changeType: newCR.changeType, impactSummary: newCR.impactSummary || undefined, reference: newCR.reference || undefined, status: newCR.status, createdAt: now });
        addActivity({ id: generateId('act'), timestamp: now, action: 'CR submitted', detail: `"${newCR.title}"`, category: 'cr' });
        setNewCR(defaultCR); setIsCRAddOpen(false);
    };
    const handleEditCRSave = () => {
        if (!editCR) return;
        updateChangeRequest(editCR.id, { title: editCR.title, requester: editCR.requester, changeType: editCR.changeType, impactSummary: editCR.impactSummary, status: editCR.status });
        setEditCR(null);
    };

    // ── AI Handlers ──
    const handleGenerateAI = async (type: 'issue' | 'risk', entity: { title?: string, severity?: string, probability?: string, impact?: string }, isEdit: boolean) => {
        setIsAILoading(true);
        try {
            const contextMsg = type === 'issue'
                ? `Issue: ${entity.title}, Severity: ${entity.severity}. Provide a concise 2-sentence resolution plan.`
                : `Risk: ${entity.title}, Probability: ${entity.probability}, Impact: ${entity.impact}. Provide a short mitigation strategy.`;

            const res = await fetch('/api/generate-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: 'Please recommend an action plan.', context: contextMsg })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate AI action');
            }
            if (data.text) {
                if (type === 'issue') {
                    if (isEdit && editIssue) setEditIssue({ ...editIssue, description: (editIssue.description ? editIssue.description + '\n\n' : '') + `[AI 제안]\n${data.text}` });
                    else setNewIssue({ ...newIssue, description: (newIssue.description ? newIssue.description + '\n\n' : '') + `[AI 제안]\n${data.text}` });
                } else if (type === 'risk') {
                    if (isEdit && editRisk) setEditRisk({ ...editRisk, mitigation: (editRisk.mitigation ? editRisk.mitigation + '\n\n' : '') + data.text });
                    else setNewRisk({ ...newRisk, mitigation: (newRisk.mitigation ? newRisk.mitigation + '\n\n' : '') + data.text });
                }
            }
        } catch (e: unknown) {
            console.error(e);
            toast.error((e as Error).message || 'AI 제안 생성 중 오류가 발생했습니다. API 키 크레딧을 확인하세요.');
        } finally {
            setIsAILoading(false);
        }
    };

    // ── Risk heatmap calculation ──
    const heatmap = useMemo(() => {
        const openRisks = (risks || []).filter(r => r.status !== 'Closed');
        const grid: Record<string, number> = {};
        const probs = ['High', 'Medium', 'Low'] as const;
        const impacts = ['Low', 'Medium', 'High'] as const;
        probs.forEach(p => impacts.forEach(i => { grid[`${p}-${i}`] = 0; }));
        openRisks.forEach(r => { grid[`${r.probability}-${r.impact}`]++; });
        return { grid, probs, impacts };
    }, [risks]);

    const heatColor = (prob: string, impact: string) => {
        const score = (['Low', 'Medium', 'High'].indexOf(prob)) + (['Low', 'Medium', 'High'].indexOf(impact));
        if (score >= 4) return styles.heatRed;
        if (score >= 3) return styles.heatOrange;
        if (score >= 2) return styles.heatYellow;
        return styles.heatGreen;
    };

    // ── Get add button + header by tab ──
    const tabConfig = {
        issues: { title: 'Issues', subtitle: `${issues.length} total issues`, addLabel: 'Report Issue', onAdd: () => setIsAddOpen(true) },
        risks: { title: 'Risks', subtitle: `${(risks || []).length} total risks`, addLabel: 'Add Risk', onAdd: () => setIsRiskAddOpen(true) },
        changes: { title: 'Change Requests', subtitle: `${(changeRequests || []).length} total CRs`, addLabel: 'Submit CR', onAdd: () => setIsCRAddOpen(true) },
    };
    const tc = tabConfig[activeTab];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>{tc.title}</h1>
                    <p className={styles.subtitle}>{tc.subtitle}</p>
                </div>
                <Button size="sm" onClick={tc.onAdd}><Plus size={14} /> {tc.addLabel}</Button>
            </header>

            {/* Tabs */}
            <div className={styles.tabBar}>
                <button className={cn(styles.tabBtn, activeTab === 'issues' && styles.tabActive)} onClick={() => setActiveTab('issues')}>
                    Issues <span className={styles.tabCount}>{issues.length}</span>
                </button>
                <button className={cn(styles.tabBtn, activeTab === 'risks' && styles.tabActive)} onClick={() => setActiveTab('risks')}>
                    <ShieldAlert size={14} /> Risks <span className={styles.tabCount}>{(risks || []).length}</span>
                </button>
                <button className={cn(styles.tabBtn, activeTab === 'changes' && styles.tabActive)} onClick={() => setActiveTab('changes')}>
                    <GitPullRequest size={14} /> Changes <span className={styles.tabCount}>{(changeRequests || []).length}</span>
                </button>
            </div>

            {/* ═══ ISSUES TAB ═══ */}
            {activeTab === 'issues' && (
                <>
                    <div className={styles.filterBar}>
                        {FILTERS.map(f => (
                            <button key={f} className={cn(styles.filterBtn, filter === f && styles.filterActive)} onClick={() => setFilter(f)}>
                                {f}{f === 'All' && <span className={styles.filterCount}>{issues.length}</span>}
                            </button>
                        ))}
                    </div>
                    {filteredIssues.length === 0 ? (
                        <Card><div className={styles.emptyState}>
                            No issues found. <Button variant="ghost" size="sm" onClick={() => setIsAddOpen(true)} style={{ marginTop: '0.5rem' }}>Report first issue</Button>
                        </div></Card>
                    ) : (
                        <div className={styles.issueList}>
                            {filteredIssues.map(issue => (
                                <Card key={issue.id} className={styles.issueCard}>
                                    <div className={styles.issueTop}>
                                        <div className={styles.issueLeft}>
                                            <Badge variant={issue.severity.toLowerCase() as 's1' | 's2' | 's3' | 's4'}>{issue.severity}</Badge>
                                            <h3 className={styles.issueTitle} onClick={() => setEditIssue(issue)}>{issue.title}</h3>
                                        </div>
                                        <div className={styles.issueRight}>
                                            <span className={cn(styles.statusPill, statusClass(issue.status))} onClick={() => cycleStatus(issue)} title="Click to change status">
                                                {issue.status}<ChevronRight size={10} className={styles.chevron} />
                                            </span>
                                        </div>
                                    </div>
                                    {issue.description && <p className={styles.issueDesc}>{issue.description}</p>}
                                    <div className={styles.issueMeta}>
                                        <span>Owner: {findMember(issue.ownerId)}</span>
                                        <span>Created: {issue.createdAt}</span>
                                        <div className={styles.issueActions}>
                                            <button className={styles.actionBtn} onClick={() => setEditIssue(issue)} title="Edit"><Pencil size={13} /></button>
                                            <button className={cn(styles.actionBtn, styles.deleteBtn)} onClick={() => deleteIssue(issue.id)} title="Delete"><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ═══ RISKS TAB ═══ */}
            {activeTab === 'risks' && (
                <>
                    {/* Heatmap */}
                    <Card className={styles.issueCard}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--foreground)' }}>Risk Heatmap (Probability × Impact)</h3>
                        <div className={styles.heatmapGrid}>
                            <div className={styles.heatmapLabel}></div>
                            <div className={styles.heatmapLabel}>Low</div>
                            <div className={styles.heatmapLabel}>Med</div>
                            <div className={styles.heatmapLabel}>High</div>
                            {heatmap.probs.map(p => (
                                <React.Fragment key={p}>
                                    <div className={styles.heatmapLabel}>{p}</div>
                                    {heatmap.impacts.map(i => (
                                        <div key={`${p}-${i}`} className={cn(styles.heatmapCell, heatColor(p, i))}>
                                            {heatmap.grid[`${p}-${i}`]}
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    </Card>

                    <div className={styles.filterBar} style={{ marginTop: '1rem' }}>
                        {RISK_FILTERS.map(f => (
                            <button key={f} className={cn(styles.filterBtn, riskFilter === f && styles.filterActive)} onClick={() => setRiskFilter(f)}>
                                {f}
                            </button>
                        ))}
                    </div>

                    {filteredRisks.length === 0 ? (
                        <Card><div className={styles.emptyState}>
                            No risks found. <Button variant="ghost" size="sm" onClick={() => setIsRiskAddOpen(true)} style={{ marginTop: '0.5rem' }}>Add first risk</Button>
                        </div></Card>
                    ) : (
                        <div className={styles.issueList}>
                            {filteredRisks.map(risk => (
                                <Card key={risk.id} className={styles.issueCard}>
                                    <div className={styles.issueTop}>
                                        <div className={styles.issueLeft}>
                                            <span className={cn(styles.statusPill, probImpactClass(risk.probability))} style={{ fontSize: '0.6875rem' }}>P:{risk.probability}</span>
                                            <span className={cn(styles.statusPill, probImpactClass(risk.impact))} style={{ fontSize: '0.6875rem' }}>I:{risk.impact}</span>
                                            <h3 className={styles.issueTitle} onClick={() => setEditRisk(risk)}>{risk.title}</h3>
                                        </div>
                                        <div className={styles.issueRight}>
                                            <span className={cn(styles.statusPill, riskStatusClass(risk.status))} onClick={() => cycleRiskStatus(risk)} title="Click to change status">
                                                {risk.status}<ChevronRight size={10} className={styles.chevron} />
                                            </span>
                                        </div>
                                    </div>
                                    {risk.mitigation && <p className={styles.issueDesc}>Mitigation: {risk.mitigation}</p>}
                                    <div className={styles.issueMeta}>
                                        <span>Owner: {findMember(risk.ownerId)}</span>
                                        <span>Created: {risk.createdAt?.split('T')[0]}</span>
                                        <div className={styles.issueActions}>
                                            <button className={styles.actionBtn} onClick={() => setEditRisk(risk)} title="Edit"><Pencil size={13} /></button>
                                            <button className={cn(styles.actionBtn, styles.deleteBtn)} onClick={() => deleteRisk(risk.id)} title="Delete"><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ═══ CHANGE REQUESTS TAB ═══ */}
            {activeTab === 'changes' && (
                <>
                    <div className={styles.filterBar}>
                        {CR_FILTERS.map(f => (
                            <button key={f} className={cn(styles.filterBtn, crFilter === f && styles.filterActive)} onClick={() => setCrFilter(f)}>
                                {f}
                            </button>
                        ))}
                    </div>

                    {filteredCRs.length === 0 ? (
                        <Card><div className={styles.emptyState}>
                            No change requests found. <Button variant="ghost" size="sm" onClick={() => setIsCRAddOpen(true)} style={{ marginTop: '0.5rem' }}>Create first CR</Button>
                        </div></Card>
                    ) : (
                        <div className={styles.issueList}>
                            {filteredCRs.map(cr => (
                                <Card key={cr.id} className={styles.issueCard}>
                                    <div className={styles.issueTop}>
                                        <div className={styles.issueLeft}>
                                            <span className={cn(styles.statusPill, probImpactClass(cr.changeType === 'Cost' ? 'High' : cr.changeType === 'Technical' ? 'Medium' : 'Low'))} style={{ fontSize: '0.6875rem' }}>{cr.changeType}</span>
                                            <h3 className={styles.issueTitle} onClick={() => setEditCR(cr)}>{cr.title}</h3>
                                        </div>
                                        <div className={styles.issueRight}>
                                            <span className={cn(styles.statusPill, crStatusClass(cr.status))} onClick={() => cycleCRStatus(cr)} title="Click to change status">
                                                {cr.status}<ChevronRight size={10} className={styles.chevron} />
                                            </span>
                                        </div>
                                    </div>
                                    {cr.impactSummary && <p className={styles.issueDesc}>{cr.impactSummary}</p>}
                                    <div className={styles.issueMeta}>
                                        <span>By: {cr.requester || '—'}</span>
                                        <span>Requested: {cr.requestDate}</span>
                                        <div className={styles.issueActions}>
                                            <button className={styles.actionBtn} onClick={() => setEditCR(cr)} title="Edit"><Pencil size={13} /></button>
                                            <button className={cn(styles.actionBtn, styles.deleteBtn)} onClick={() => deleteChangeRequest(cr.id)} title="Delete"><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ═══ MODALS ═══ */}
            {/* Add Issue */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Report Issue">
                <div className={styles.form}>
                    <div className={styles.formGroup}><label>Title *</label><input className={styles.input} value={newIssue.title} onChange={e => setNewIssue({ ...newIssue, title: e.target.value })} placeholder="Issue title" autoFocus /></div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}><label>Severity</label><select className={styles.select} value={newIssue.severity} onChange={e => setNewIssue({ ...newIssue, severity: e.target.value as Issue['severity'] })}><option value="S1">S1 — Critical</option><option value="S2">S2 — High</option><option value="S3">S3 — Medium</option><option value="S4">S4 — Low</option></select></div>
                        <div className={styles.formGroup}><label>Owner (optional)</label><select className={styles.select} value={newIssue.ownerId} onChange={e => setNewIssue({ ...newIssue, ownerId: e.target.value })}><option value="">— Unassigned —</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                    </div>
                    <details style={{ marginTop: '0.5rem' }}>
                        <summary style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>Advanced options...</summary>
                        <div className={styles.formGroup} style={{ marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label>Description</label>
                                <Button variant="ghost" size="sm" onClick={() => handleGenerateAI('issue', newIssue, false)} disabled={isAILoading || !newIssue.title} style={{ padding: '0 0.5rem', height: '1.5rem', fontSize: '0.75rem', color: 'var(--brand-primary)' }}>
                                    {isAILoading ? <Loader2 size={12} className={styles.spin} style={{ marginRight: '0.25rem' }} /> : <Bot size={12} style={{ marginRight: '0.25rem' }} />}
                                    AI 액션 제안
                                </Button>
                            </div>
                            <textarea className={styles.textarea} value={newIssue.description} onChange={e => setNewIssue({ ...newIssue, description: e.target.value })} placeholder="Brief description..." rows={2} />
                        </div>
                        <div className={styles.formGroup}><label>Date Occurred</label><input type="date" className={styles.input} value={newIssue.occurredDate} onChange={e => setNewIssue({ ...newIssue, occurredDate: e.target.value })} /></div>
                    </details>
                    <div className={styles.formActions}><Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button><Button onClick={handleAddIssue}>Report</Button></div>
                </div>
            </Modal>
            {/* Edit Issue */}
            <Modal isOpen={!!editIssue} onClose={() => setEditIssue(null)} title="Edit Issue">
                {editIssue && (
                    <div className={styles.form}>
                        <div className={styles.formGroup}><label>Title</label><input className={styles.input} value={editIssue.title} onChange={e => setEditIssue({ ...editIssue, title: e.target.value })} /></div>
                        <div className={styles.formGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label>Description</label>
                                <Button variant="ghost" size="sm" onClick={() => handleGenerateAI('issue', editIssue, true)} disabled={isAILoading} style={{ padding: '0 0.5rem', height: '1.5rem', fontSize: '0.75rem', color: 'var(--brand-primary)' }}>
                                    {isAILoading ? <Loader2 size={12} className={styles.spin} style={{ marginRight: '0.25rem' }} /> : <Bot size={12} style={{ marginRight: '0.25rem' }} />}
                                    AI 액션 제안
                                </Button>
                            </div>
                            <textarea className={styles.textarea} value={editIssue.description} onChange={e => setEditIssue({ ...editIssue, description: e.target.value })} rows={4} />
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}><label>Severity</label><select className={styles.select} value={editIssue.severity} onChange={e => setEditIssue({ ...editIssue, severity: e.target.value as Issue['severity'] })}><option value="S1">S1</option><option value="S2">S2</option><option value="S3">S3</option><option value="S4">S4</option></select></div>
                            <div className={styles.formGroup}><label>Owner</label><select className={styles.select} value={editIssue.ownerId || ''} onChange={e => setEditIssue({ ...editIssue, ownerId: e.target.value })}><option value="">—</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                            <div className={styles.formGroup}><label>Date Occurred</label><input type="date" className={styles.input} value={editIssue.createdAt?.split('T')[0] || ''} onChange={e => setEditIssue({ ...editIssue, createdAt: e.target.value })} /></div>
                        </div>
                        <div className={styles.formActions}><Button variant="ghost" onClick={() => setEditIssue(null)}>Cancel</Button><Button onClick={handleEditSave}>Save</Button></div>
                    </div>
                )}
            </Modal>

            {/* Add Risk */}
            <Modal isOpen={isRiskAddOpen} onClose={() => setIsRiskAddOpen(false)} title="Add Risk">
                <div className={styles.form}>
                    <div className={styles.formGroup}><label>Title *</label><input className={styles.input} value={newRisk.title} onChange={e => setNewRisk({ ...newRisk, title: e.target.value })} placeholder="Risk title" autoFocus /></div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}><label>Probability</label><select className={styles.select} value={newRisk.probability} onChange={e => setNewRisk({ ...newRisk, probability: e.target.value as Risk['probability'] })}><option>Low</option><option>Medium</option><option>High</option></select></div>
                        <div className={styles.formGroup}><label>Impact</label><select className={styles.select} value={newRisk.impact} onChange={e => setNewRisk({ ...newRisk, impact: e.target.value as Risk['impact'] })}><option>Low</option><option>Medium</option><option>High</option></select></div>
                    </div>
                    <details style={{ marginTop: '0.5rem' }}>
                        <summary style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>Advanced options...</summary>
                        <div className={styles.formRow} style={{ marginTop: '0.5rem' }}>
                            <div className={styles.formGroup}><label>Owner</label><select className={styles.select} value={newRisk.ownerId} onChange={e => setNewRisk({ ...newRisk, ownerId: e.target.value })}><option value="">— Unassigned —</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                            <div className={styles.formGroup}><label>Date Identified</label><input type="date" className={styles.input} value={newRisk.identifiedDate} onChange={e => setNewRisk({ ...newRisk, identifiedDate: e.target.value })} /></div>
                        </div>
                        <div className={styles.formGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label>Mitigation</label>
                                <Button variant="ghost" size="sm" onClick={() => handleGenerateAI('risk', newRisk, false)} disabled={isAILoading || !newRisk.title} style={{ padding: '0 0.5rem', height: '1.5rem', fontSize: '0.75rem', color: 'var(--brand-primary)' }}>
                                    {isAILoading ? <Loader2 size={12} className={styles.spin} style={{ marginRight: '0.25rem' }} /> : <Bot size={12} style={{ marginRight: '0.25rem' }} />}
                                    AI 방어 대책
                                </Button>
                            </div>
                            <input className={styles.input} value={newRisk.mitigation} onChange={e => setNewRisk({ ...newRisk, mitigation: e.target.value })} placeholder="How to mitigate..." />
                        </div>
                    </details>
                    <div className={styles.formActions}><Button variant="ghost" onClick={() => setIsRiskAddOpen(false)}>Cancel</Button><Button onClick={handleAddRisk}>Add</Button></div>
                </div>
            </Modal>
            {/* Edit Risk */}
            <Modal isOpen={!!editRisk} onClose={() => setEditRisk(null)} title="Edit Risk">
                {editRisk && (
                    <div className={styles.form}>
                        <div className={styles.formGroup}><label>Title</label><input className={styles.input} value={editRisk.title} onChange={e => setEditRisk({ ...editRisk, title: e.target.value })} /></div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}><label>Probability</label><select className={styles.select} value={editRisk.probability} onChange={e => setEditRisk({ ...editRisk, probability: e.target.value as Risk['probability'] })}><option>Low</option><option>Medium</option><option>High</option></select></div>
                            <div className={styles.formGroup}><label>Impact</label><select className={styles.select} value={editRisk.impact} onChange={e => setEditRisk({ ...editRisk, impact: e.target.value as Risk['impact'] })}><option>Low</option><option>Medium</option><option>High</option></select></div>
                        </div>
                        <div className={styles.formGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label>Mitigation</label>
                                <Button variant="ghost" size="sm" onClick={() => handleGenerateAI('risk', editRisk, true)} disabled={isAILoading} style={{ padding: '0 0.5rem', height: '1.5rem', fontSize: '0.75rem', color: 'var(--brand-primary)' }}>
                                    {isAILoading ? <Loader2 size={12} className={styles.spin} style={{ marginRight: '0.25rem' }} /> : <Bot size={12} style={{ marginRight: '0.25rem' }} />}
                                    AI 방어 대책
                                </Button>
                            </div>
                            <input className={styles.input} value={editRisk.mitigation || ''} onChange={e => setEditRisk({ ...editRisk, mitigation: e.target.value })} />
                        </div>
                        <div className={styles.formActions}><Button variant="ghost" onClick={() => setEditRisk(null)}>Cancel</Button><Button onClick={handleEditRiskSave}>Save</Button></div>
                    </div>
                )}
            </Modal>

            {/* Add CR */}
            <Modal isOpen={isCRAddOpen} onClose={() => setIsCRAddOpen(false)} title="Submit Change Request">
                <div className={styles.form}>
                    <div className={styles.formGroup}><label>Title *</label><input className={styles.input} value={newCR.title} onChange={e => setNewCR({ ...newCR, title: e.target.value })} placeholder="Change request title" autoFocus /></div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}><label>Type</label><select className={styles.select} value={newCR.changeType} onChange={e => setNewCR({ ...newCR, changeType: e.target.value as ChangeRequest['changeType'] })}><option>Scope</option><option>Schedule</option><option>Cost</option><option>Technical</option></select></div>
                        <div className={styles.formGroup}><label>Requester</label><input className={styles.input} value={newCR.requester} onChange={e => setNewCR({ ...newCR, requester: e.target.value })} placeholder="Who requested?" /></div>
                    </div>
                    <details style={{ marginTop: '0.5rem' }}>
                        <summary style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>Advanced options...</summary>
                        <div className={styles.formRow} style={{ marginTop: '0.5rem' }}>
                            <div className={styles.formGroup}><label>Request Date</label><input type="date" className={styles.input} value={newCR.requestDate} onChange={e => setNewCR({ ...newCR, requestDate: e.target.value })} /></div>
                            <div className={styles.formGroup}><label>Status</label><select className={styles.select} value={newCR.status} onChange={e => setNewCR({ ...newCR, status: e.target.value as ChangeRequest['status'] })}><option>Pending</option><option>Approved</option><option>Rejected</option><option>Implemented</option></select></div>
                        </div>
                        <div className={styles.formGroup}><label>Impact Summary</label><input className={styles.input} value={newCR.impactSummary} onChange={e => setNewCR({ ...newCR, impactSummary: e.target.value })} placeholder="Brief impact description" /></div>
                        <div className={styles.formGroup}><label>CR Reference / Related Task</label><input className={styles.input} value={newCR.reference} onChange={e => setNewCR({ ...newCR, reference: e.target.value })} placeholder="Email / Doc link / Task ID" /></div>
                    </details>
                    <div className={styles.formActions}><Button variant="ghost" onClick={() => setIsCRAddOpen(false)}>Cancel</Button><Button onClick={handleAddCR}>Submit</Button></div>
                </div>
            </Modal>
            {/* Edit CR */}
            <Modal isOpen={!!editCR} onClose={() => setEditCR(null)} title="Edit Change Request">
                {editCR && (
                    <div className={styles.form}>
                        <div className={styles.formGroup}><label>Title</label><input className={styles.input} value={editCR.title} onChange={e => setEditCR({ ...editCR, title: e.target.value })} /></div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}><label>Requester</label><input className={styles.input} value={editCR.requester} onChange={e => setEditCR({ ...editCR, requester: e.target.value })} /></div>
                            <div className={styles.formGroup}><label>Type</label><select className={styles.select} value={editCR.changeType} onChange={e => setEditCR({ ...editCR, changeType: e.target.value as ChangeRequest['changeType'] })}><option>Scope</option><option>Schedule</option><option>Cost</option><option>Technical</option></select></div>
                            <div className={styles.formGroup}><label>Status</label><select className={styles.select} value={editCR.status} onChange={e => setEditCR({ ...editCR, status: e.target.value as ChangeRequest['status'] })}><option>Pending</option><option>Approved</option><option>Rejected</option><option>Implemented</option></select></div>
                        </div>
                        <div className={styles.formGroup}><label>Impact Summary</label><input className={styles.input} value={editCR.impactSummary || ''} onChange={e => setEditCR({ ...editCR, impactSummary: e.target.value })} /></div>
                        <div className={styles.formActions}><Button variant="ghost" onClick={() => setEditCR(null)}>Cancel</Button><Button onClick={handleEditCRSave}>Save</Button></div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
