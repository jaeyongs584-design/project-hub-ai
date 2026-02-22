'use client';

import React, { useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { Plus, Download, List, BarChart3 } from 'lucide-react';
import { generateId } from '@/lib/utils';
import { Task } from '@/types';
import ListView from './ListView';
import GanttView from './GanttView';
import styles from './page.module.css';

type ViewMode = 'list' | 'gantt';

export default function SchedulePage() {
    const { tasks, addTask, updateTask } = useProject();
    const [view, setView] = useState<ViewMode>('list');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editTask, setEditTask] = useState<Task | null>(null);

    const parentTasks = tasks.filter(t => !t.parentId);

    const defaultNewTask = {
        title: '',
        startDate: '',
        dueDate: '',
        priority: 'P2' as Task['priority'],
        description: '',
        parentId: '',
    };
    const [newTask, setNewTask] = useState(defaultNewTask);

    const handleAdd = () => {
        if (!newTask.title || !newTask.startDate || !newTask.dueDate) return;
        const task: Task = {
            id: generateId('t'),
            title: newTask.title,
            startDate: newTask.startDate,
            dueDate: newTask.dueDate,
            status: 'Not Started',
            priority: newTask.priority,
            progress: 0,
            dependencies: [],
            tags: [],
            description: newTask.description,
            parentId: newTask.parentId || undefined,
        };
        addTask(task);
        setNewTask(defaultNewTask);
        setIsAddOpen(false);
    };

    const handleEditSave = () => {
        if (!editTask) return;
        updateTask(editTask.id, {
            title: editTask.title,
            startDate: editTask.startDate,
            dueDate: editTask.dueDate,
            priority: editTask.priority,
            description: editTask.description,
            parentId: editTask.parentId || undefined,
        });
        setEditTask(null);
    };

    const exportCSV = () => {
        const header = 'Title,Status,Priority,Start,Due,Progress\n';
        const rows = tasks.map(t =>
            `"${t.title}",${t.status},${t.priority},${t.startDate},${t.dueDate},${t.progress}%`
        ).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasks.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Schedule</h1>
                    <p className={styles.subtitle}>{tasks.length} tasks total</p>
                </div>
                <div className={styles.controls}>
                    <div className={styles.viewToggle}>
                        <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
                            <List size={14} /> List
                        </button>
                        <button className={view === 'gantt' ? 'active' : ''} onClick={() => setView('gantt')}>
                            <BarChart3 size={14} /> Gantt
                        </button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={exportCSV}>
                        <Download size={14} /> CSV
                    </Button>
                    <Button size="sm" onClick={() => setIsAddOpen(true)}>
                        <Plus size={14} /> Add Task
                    </Button>
                </div>
            </header>

            {view === 'list'
                ? <ListView onEditTask={(task) => setEditTask(task)} />
                : <GanttView />
            }

            {/* Add Task Modal */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Task">
                <div className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Task Name *</label>
                        <input className={styles.input} value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="Enter task name" />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea className={styles.textarea} value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Optional description" />
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Start Date *</label>
                            <input className={styles.input} type="date" value={newTask.startDate} onChange={e => setNewTask({ ...newTask, startDate: e.target.value })} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Due Date *</label>
                            <input className={styles.input} type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Priority</label>
                            <select className={styles.select} value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}>
                                <option value="P0">P0 — Critical</option>
                                <option value="P1">P1 — High</option>
                                <option value="P2">P2 — Medium</option>
                                <option value="P3">P3 — Low</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Parent Task (Sub-task)</label>
                            <select className={styles.select} value={newTask.parentId} onChange={e => setNewTask({ ...newTask, parentId: e.target.value })}>
                                <option value="">— None (Top-level) —</option>
                                {parentTasks.map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className={styles.formActions}>
                        <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdd}>Create Task</Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Task Modal */}
            <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit Task">
                {editTask && (
                    <div className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Task Name</label>
                            <input className={styles.input} value={editTask.title} onChange={e => setEditTask({ ...editTask, title: e.target.value })} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea className={styles.textarea} value={editTask.description || ''} onChange={e => setEditTask({ ...editTask, description: e.target.value })} />
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Start Date</label>
                                <input className={styles.input} type="date" value={editTask.startDate} onChange={e => setEditTask({ ...editTask, startDate: e.target.value })} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Due Date</label>
                                <input className={styles.input} type="date" value={editTask.dueDate} onChange={e => setEditTask({ ...editTask, dueDate: e.target.value })} />
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Priority</label>
                                <select className={styles.select} value={editTask.priority} onChange={e => setEditTask({ ...editTask, priority: e.target.value as Task['priority'] })}>
                                    <option value="P0">P0 — Critical</option>
                                    <option value="P1">P1 — High</option>
                                    <option value="P2">P2 — Medium</option>
                                    <option value="P3">P3 — Low</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Parent Task</label>
                                <select className={styles.select} value={editTask.parentId || ''} onChange={e => setEditTask({ ...editTask, parentId: e.target.value || undefined })}>
                                    <option value="">— None —</option>
                                    {parentTasks.filter(t => t.id !== editTask.id).map(t => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles.formActions}>
                            <Button variant="ghost" onClick={() => setEditTask(null)}>Cancel</Button>
                            <Button onClick={handleEditSave}>Save Changes</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
