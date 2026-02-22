'use client';

import React from 'react';
import { useProject } from '@/hooks/useProject';
import { Task, TaskStatus } from '@/types';
import { Pencil, Trash2, CornerDownRight, ChevronRight } from 'lucide-react';
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

interface Props {
    onEditTask: (task: Task) => void;
}

export default function ListView({ onEditTask }: Props) {
    const { tasks, updateTask, deleteTask } = useProject();

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

    if (orderedTasks.length === 0) {
        return <div className={styles.emptyState}>No tasks yet. Click &quot;Add Task&quot; to get started.</div>;
    }

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Task</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Start</th>
                        <th>Due</th>
                        <th style={{ width: 80 }}></th>
                    </tr>
                </thead>
                <tbody>
                    {orderedTasks.map(({ task, isChild }) => (
                        <tr key={task.id}>
                            <td>
                                <div className={cn(styles.taskName, isChild && styles.subIndent)}>
                                    {isChild && <CornerDownRight size={14} className={styles.subIcon} />}
                                    <span
                                        className={styles.taskTitle}
                                        onClick={() => onEditTask(task)}
                                    >
                                        {task.title}
                                    </span>
                                </div>
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
                                <span className={cn(styles.priority, priorityClass(task.priority))}>
                                    {task.priority}
                                </span>
                            </td>
                            <td><span className={styles.dateText}>{task.startDate}</span></td>
                            <td><span className={styles.dateText}>{task.dueDate}</span></td>
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
                    ))}
                </tbody>
            </table>
        </div>
    );
}
