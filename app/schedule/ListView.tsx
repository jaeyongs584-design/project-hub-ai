'use client';

import React from 'react';
import { useProject } from '@/hooks/useProject';
import { Task, TaskStatus } from '@/types';
import { Pencil, Trash2, CornerDownRight, ChevronRight, Flag } from 'lucide-react';
import styles from './ListView.module.css';
import { cn } from '@/lib/utils';

const STATUS_CYCLE: TaskStatus[] = ['Not Started', 'In Progress', 'Done', 'Blocked'];

const statusClass = (s: TaskStatus) => {
    switch (s) {
        case 'Not Started': return styles.statusNotStarted;
        case 'In Progress': return styles.statusInProgress;
        case 'Done': return styles.statusDone;
        case 'Blocked': return styles.statusBlocked;
    }
};

const priorityClass = (p: string) => {
    switch (p) {
        case 'P0': return styles.p0;
        case 'P1': return styles.p1;
        case 'P2': return styles.p2;
        case 'P3': return styles.p3;
        default: return styles.p2;
    }
};

const progressColor = (p: number) => {
    if (p >= 80) return '#55efc4';
    if (p >= 50) return '#6c5ce7';
    if (p >= 20) return '#ffeaa7';
    return '#636e72';
};

interface Props {
    onEditTask: (task: Task) => void;
    filters?: { overdue: boolean; thisWeek: boolean; blocked: boolean; };
}

export default function ListView({ onEditTask, filters }: Props) {
    const { tasks, updateTask, deleteTask, members } = useProject();

    const cycleStatus = (task: Task) => {
        const idx = STATUS_CYCLE.indexOf(task.status);
        const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
        updateTask(task.id, { status: next });
    };

    // Build parent → children tree
    const parentTasks = tasks.filter(t => !t.parentId);
    const getChildren = (parentId: string) => tasks.filter(t => t.parentId === parentId);

    // Flatten in order: parent, then its children
    const orderedTasks: { task: Task; isChild: boolean }[] = [];
    parentTasks.forEach(parent => {
        orderedTasks.push({ task: parent, isChild: false });
        getChildren(parent.id).forEach(child => {
            orderedTasks.push({ task: child, isChild: true });
        });
    });

    let displayTasks = orderedTasks;
    if (filters) {
        if (filters.blocked) {
            displayTasks = displayTasks.filter(t => t.task.status === 'Blocked');
        }
        if (filters.overdue) {
            const today = new Date().toISOString().split('T')[0];
            displayTasks = displayTasks.filter(t => t.task.dueDate < today && t.task.status !== 'Done');
        }
        if (filters.thisWeek) {
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            const todayStr = today.toISOString().split('T')[0];
            const nextWeekStr = nextWeek.toISOString().split('T')[0];
            displayTasks = displayTasks.filter(t => t.task.dueDate >= todayStr && t.task.dueDate <= nextWeekStr);
        }
    }

    if (displayTasks.length === 0) {
        return <div className={styles.emptyState}>No tasks found. Adjust filters or add a new task.</div>;
    }

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th style={{ minWidth: '200px' }}>Task</th>
                        <th>Owner</th>
                        <th>Workstream</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Priority</th>
                        <th>Start</th>
                        <th>Due</th>
                        <th>Dependencies</th>
                        <th style={{ width: 80 }}></th>
                    </tr>
                </thead>
                <tbody>
                    {displayTasks.map(({ task, isChild }) => {
                        const owner = members.find(m => m.id === task.ownerId);
                        const depTask = task.dependencies && task.dependencies.length > 0 ? tasks.find(t => t.id === task.dependencies![0]) : null;
                        return (
                            <tr key={task.id} style={task.isMilestone ? { background: 'rgba(108,92,231,0.04)' } : undefined}>
                                <td>
                                    <div className={cn(styles.taskName, isChild && styles.subIndent)}>
                                        {isChild && <CornerDownRight size={14} className={styles.subIcon} />}
                                        {task.isMilestone && <Flag size={13} style={{ color: '#a29bfe', flexShrink: 0 }} />}
                                        <span
                                            className={styles.taskTitle}
                                            onClick={() => onEditTask(task)}
                                            style={task.isMilestone ? { fontWeight: 600 } : undefined}
                                        >
                                            {task.title}
                                        </span>
                                        {task.isMilestone && (
                                            <span style={{
                                                fontSize: '0.5625rem',
                                                background: 'rgba(108,92,231,0.15)',
                                                color: '#a29bfe',
                                                padding: '0.0625rem 0.375rem',
                                                borderRadius: '9999px',
                                                fontWeight: 600,
                                                letterSpacing: '0.03em',
                                                textTransform: 'uppercase' as const,
                                            }}>
                                                Milestone
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        {owner?.avatarUrl ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={owner.avatarUrl} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                                        ) : owner ? (
                                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>{owner.name.charAt(0)}</div>
                                        ) : null}
                                        <span style={{ fontSize: '0.8125rem' }}>{owner ? owner.name : <span style={{ color: 'var(--foreground-muted)' }}>-</span>}</span>
                                    </div>
                                </td>
                                <td>
                                    <span style={{ fontSize: '0.75rem', background: task.workstream ? 'var(--secondary)' : 'transparent', padding: task.workstream ? '0.2rem 0.5rem' : '0', borderRadius: '12px', color: task.workstream ? 'var(--foreground)' : 'var(--foreground-muted)' }}>
                                        {task.workstream || '-'}
                                    </span>
                                </td>
                                <td>
                                    <span
                                        className={cn(styles.statusPill, statusClass(task.status))}
                                        onClick={() => cycleStatus(task)}
                                        title="Click to change status"
                                    >
                                        {task.status}
                                        <ChevronRight className={styles.chevron} />
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: '80px' }}>
                                        <div style={{
                                            flex: 1,
                                            height: '6px',
                                            background: 'rgba(122,139,181,0.12)',
                                            borderRadius: '3px',
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                width: `${task.progress}%`,
                                                height: '100%',
                                                background: progressColor(task.progress),
                                                borderRadius: '3px',
                                                transition: 'width 0.3s',
                                            }} />
                                        </div>
                                        <span style={{
                                            fontSize: '0.6875rem',
                                            color: progressColor(task.progress),
                                            fontWeight: 600,
                                            minWidth: '28px',
                                            textAlign: 'right',
                                        }}>{task.progress}%</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={cn(styles.priority, priorityClass(task.priority))}>
                                        {task.priority}
                                    </span>
                                </td>
                                <td><span className={styles.dateText}>{task.startDate}</span></td>
                                <td><span className={styles.dateText}>{task.dueDate}</span></td>
                                <td>
                                    {depTask ? (
                                        <div style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <span style={{ background: 'var(--secondary)', padding: '0.1rem 0.3rem', borderRadius: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={depTask.title}>
                                                {depTask.title}
                                            </span>
                                            <span style={{ color: 'var(--foreground-muted)' }}>→</span>
                                        </div>
                                    ) : <span style={{ color: 'var(--foreground-muted)' }}>-</span>}
                                </td>
                                <td>
                                    <div className={styles.actions}>
                                        <button className={styles.actionBtn} onClick={() => onEditTask(task)} title="Edit">
                                            <Pencil size={14} />
                                        </button>
                                        <button className={cn(styles.actionBtn, styles.delete)} onClick={() => deleteTask(task.id)} title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
