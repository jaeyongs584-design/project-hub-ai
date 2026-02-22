'use client';

import React, { useState, useMemo } from 'react';
import { useProject } from '@/hooks/useProject';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Mail, Copy, Calendar } from 'lucide-react';
import styles from './page.module.css';
import { cn } from '@/lib/utils';

function getWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
}

function getMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
}

export default function ReportsPage() {
    const { tasks, issues, members, projectInfo } = useProject();

    const today = new Date().toISOString().split('T')[0];
    const projectName = projectInfo?.name || 'AGS Project';

    // Date range state
    const [rangeStart, setRangeStart] = useState('');
    const [rangeEnd, setRangeEnd] = useState('');
    const [activePreset, setActivePreset] = useState<string>('all');

    const setPreset = (preset: string) => {
        setActivePreset(preset);
        switch (preset) {
            case 'today':
                setRangeStart(today);
                setRangeEnd(today);
                break;
            case 'week': {
                const w = getWeekRange();
                setRangeStart(w.start);
                setRangeEnd(w.end);
                break;
            }
            case 'month': {
                const m = getMonthRange();
                setRangeStart(m.start);
                setRangeEnd(m.end);
                break;
            }
            case 'all':
            default:
                setRangeStart('');
                setRangeEnd('');
                break;
        }
    };

    // Filter by date range
    const filteredTasks = useMemo(() => {
        if (!rangeStart && !rangeEnd) return tasks;
        return tasks.filter(t => {
            // Task overlaps with range if task.start <= rangeEnd && task.due >= rangeStart
            if (rangeEnd && t.startDate > rangeEnd) return false;
            if (rangeStart && t.dueDate < rangeStart) return false;
            return true;
        });
    }, [tasks, rangeStart, rangeEnd]);

    const filteredIssues = useMemo(() => {
        if (!rangeStart && !rangeEnd) return issues;
        return issues.filter(i => {
            const created = i.createdAt.split('T')[0];
            if (rangeStart && created < rangeStart) return false;
            if (rangeEnd && created > rangeEnd) return false;
            return true;
        });
    }, [issues, rangeStart, rangeEnd]);

    const stats = useMemo(() => {
        const total = filteredTasks.length;
        const done = filteredTasks.filter(t => t.status === 'Done').length;
        const inProgress = filteredTasks.filter(t => t.status === 'In Progress').length;
        const blocked = filteredTasks.filter(t => t.status === 'Blocked').length;
        const notStarted = filteredTasks.filter(t => t.status === 'Not Started').length;
        const progress = total ? Math.round((done / total) * 100) : 0;
        const overdue = filteredTasks.filter(t => t.dueDate < today && t.status !== 'Done').length;
        const openIssues = filteredIssues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length;
        const highIssues = filteredIssues.filter(i => (i.severity === 'S1' || i.severity === 'S2') && i.status !== 'Resolved' && i.status !== 'Closed').length;
        return { total, done, inProgress, blocked, notStarted, progress, overdue, openIssues, highIssues };
    }, [filteredTasks, filteredIssues, today]);

    const rangeLabel = rangeStart || rangeEnd
        ? `${rangeStart || '—'} ~ ${rangeEnd || '—'}`
        : 'All Time';

    const generateReportText = () => {
        let text = `=== ${projectName} — Project Progress Report ===\n`;
        text += `Date: ${today}\n`;
        text += `Report Period: ${rangeLabel}\n`;
        if (projectInfo?.manager) text += `Manager: ${projectInfo.manager}\n`;
        text += `Period: ${projectInfo?.startDate || '-'} ~ ${projectInfo?.endDate || '-'}\n\n`;

        text += `## Task Summary\n`;
        text += `Total: ${stats.total} | Done: ${stats.done} | In Progress: ${stats.inProgress} | Blocked: ${stats.blocked} | Not Started: ${stats.notStarted}\n`;
        text += `Overall Progress: ${stats.progress}%\n`;
        if (stats.overdue > 0) text += `⚠ Overdue: ${stats.overdue} task(s)\n`;
        text += `\n`;

        text += `## Task Details\n`;
        filteredTasks.forEach(t => {
            text += `- [${t.status}] ${t.title} (${t.priority}, ${t.startDate} ~ ${t.dueDate})\n`;
        });
        text += `\n`;

        if (filteredIssues.length > 0) {
            text += `## Issues (${filteredIssues.length})\n`;
            filteredIssues.forEach(i => {
                text += `- [${i.severity}] [${i.status}] ${i.title}\n`;
            });
            text += `\n`;
        }

        if (members.length > 0) {
            text += `## Team (${members.length})\n`;
            members.forEach(m => {
                text += `- ${m.name} — ${m.role} (${m.team})\n`;
            });
        }

        return text;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generateReportText());
    };

    const handleEmail = () => {
        const subject = encodeURIComponent(`${projectName} — Progress Report (${rangeLabel})`);
        const body = encodeURIComponent(generateReportText());
        window.open(`mailto:?subject=${subject}&body=${body}`);
    };

    const statusMiniClass = (s: string) => {
        switch (s) {
            case 'Not Started': return styles.stNotStarted;
            case 'In Progress': return styles.stInProgress;
            case 'Done': return styles.stDone;
            case 'Blocked': return styles.stBlocked;
            default: return '';
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Reports</h1>
                    <p className={styles.subtitle}>Project progress report</p>
                </div>
                <div className={styles.controls}>
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                        <Copy size={14} /> Copy
                    </Button>
                    <Button size="sm" onClick={handleEmail}>
                        <Mail size={14} /> Email Report
                    </Button>
                </div>
            </header>

            {/* Date Range Filter */}
            <div className={styles.dateFilter}>
                <div className={styles.dateInputs}>
                    <Calendar size={14} style={{ color: 'var(--foreground-muted)', flexShrink: 0 }} />
                    <input
                        type="date"
                        className={styles.dateInput}
                        value={rangeStart}
                        onChange={(e) => { setRangeStart(e.target.value); setActivePreset('custom'); }}
                    />
                    <span className={styles.dateSeparator}>~</span>
                    <input
                        type="date"
                        className={styles.dateInput}
                        value={rangeEnd}
                        onChange={(e) => { setRangeEnd(e.target.value); setActivePreset('custom'); }}
                    />
                </div>
                <div className={styles.datePresets}>
                    {['today', 'week', 'month', 'all'].map(p => (
                        <button
                            key={p}
                            className={cn(styles.presetBtn, activePreset === p && styles.presetActive)}
                            onClick={() => setPreset(p)}
                        >
                            {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All'}
                        </button>
                    ))}
                </div>
            </div>

            <Card className={styles.reportCard}>
                {/* Report Header */}
                <div className={styles.reportHeader}>
                    <h2 className={styles.reportTitle}>{projectName} — Progress Report</h2>
                    <p className={styles.reportDate}>Generated: {today} · Period: {rangeLabel}</p>
                    <div className={styles.reportMeta}>
                        {projectInfo?.manager && (
                            <div className={styles.reportMetaItem}>
                                <span className={styles.reportMetaLabel}>Manager</span>
                                <span className={styles.reportMetaValue}>{projectInfo.manager}</span>
                            </div>
                        )}
                        <div className={styles.reportMetaItem}>
                            <span className={styles.reportMetaLabel}>Period</span>
                            <span className={styles.reportMetaValue}>{projectInfo?.startDate || '—'} ~ {projectInfo?.endDate || '—'}</span>
                        </div>
                        <div className={styles.reportMetaItem}>
                            <span className={styles.reportMetaLabel}>Team Size</span>
                            <span className={styles.reportMetaValue}>{members.length}</span>
                        </div>
                    </div>
                </div>

                {/* Summary Grid */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Task Summary</h3>
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryItem}>
                            <div className={styles.summaryNumber}>{stats.total}</div>
                            <div className={styles.summaryLabel}>Total Tasks</div>
                        </div>
                        <div className={styles.summaryItem}>
                            <div className={styles.summaryNumber} style={{ color: 'var(--success)' }}>{stats.done}</div>
                            <div className={styles.summaryLabel}>Completed</div>
                        </div>
                        <div className={styles.summaryItem}>
                            <div className={styles.summaryNumber} style={{ color: 'var(--primary-light)' }}>{stats.inProgress}</div>
                            <div className={styles.summaryLabel}>In Progress</div>
                        </div>
                        <div className={styles.summaryItem}>
                            <div className={styles.summaryNumber} style={{ color: stats.blocked > 0 ? 'var(--danger)' : 'var(--foreground-muted)' }}>{stats.blocked}</div>
                            <div className={styles.summaryLabel}>Blocked</div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className={styles.progressBarWrapper}>
                        <div className={styles.progressBarOuter}>
                            {stats.total > 0 && (
                                <>
                                    <div className={cn(styles.progressBarSeg, styles.segDone)} style={{ width: `${(stats.done / stats.total) * 100}%` }} />
                                    <div className={cn(styles.progressBarSeg, styles.segProgress)} style={{ width: `${(stats.inProgress / stats.total) * 100}%` }} />
                                    <div className={cn(styles.progressBarSeg, styles.segBlocked)} style={{ width: `${(stats.blocked / stats.total) * 100}%` }} />
                                    <div className={cn(styles.progressBarSeg, styles.segNotStarted)} style={{ width: `${(stats.notStarted / stats.total) * 100}%` }} />
                                </>
                            )}
                        </div>
                        <div className={styles.progressLegend}>
                            <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: 'var(--success)' }} /> Done ({stats.done})</div>
                            <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: 'var(--primary)' }} /> In Progress ({stats.inProgress})</div>
                            <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: 'var(--danger)' }} /> Blocked ({stats.blocked})</div>
                            <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: 'rgba(122, 139, 181, 0.3)' }} /> Not Started ({stats.notStarted})</div>
                        </div>
                    </div>
                </div>

                {/* Task Details */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Task Details</h3>
                    {filteredTasks.length === 0 ? (
                        <p className={styles.noData}>No tasks in the selected date range.</p>
                    ) : (
                        <table className={styles.taskTable}>
                            <thead>
                                <tr>
                                    <th>Task</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Due</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.map(task => (
                                    <tr key={task.id}>
                                        <td>{task.parentId ? `  ↳ ${task.title}` : task.title}</td>
                                        <td><span className={cn(styles.statusMini, statusMiniClass(task.status))}>{task.status}</span></td>
                                        <td>{task.priority}</td>
                                        <td>{task.dueDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Issues */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Issues ({filteredIssues.length})</h3>
                    {filteredIssues.length === 0 ? (
                        <p className={styles.noData}>No issues in the selected date range.</p>
                    ) : (
                        filteredIssues.map(issue => (
                            <div key={issue.id} className={styles.issueLine}>
                                <span className={styles.issueLineTitle}>
                                    <Badge variant={issue.severity.toLowerCase() as 's1' | 's2' | 's3' | 's4'}>{issue.severity}</Badge>{' '}
                                    {issue.title}
                                </span>
                                <span className={cn(styles.statusMini, statusMiniClass(issue.status))}>{issue.status}</span>
                            </div>
                        ))
                    )}
                </div>

                {/* Team */}
                {members.length > 0 && (
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Team ({members.length})</h3>
                        <table className={styles.taskTable}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Team</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map(m => (
                                    <tr key={m.id}>
                                        <td>{m.name}</td>
                                        <td>{m.role}</td>
                                        <td>{m.team}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
