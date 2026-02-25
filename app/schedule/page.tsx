'use client';

import React, { useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { Plus, Download, List, BarChart3, Target, Filter } from 'lucide-react';
import { generateId, cn } from '@/lib/utils';
import { Task, Milestone, MilestoneStatus } from '@/types';
import ListView from './ListView';
import GanttView from './GanttView';
import MilestonesView from './MilestonesView';
import styles from './page.module.css';

type ViewMode = 'list' | 'gantt' | 'milestones';

export default function SchedulePage() {
    const { tasks, addTask, updateTask, addActivity, members, milestones = [], addMilestone, updateMilestone, deleteMilestone } = useProject();
    const [view, setView] = useState<ViewMode>('list');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editTask, setEditTask] = useState<Task | null>(null);

    // Filters for list view
    const [filterOverdue, setFilterOverdue] = useState(false);
    const [filterThisWeek, setFilterThisWeek] = useState(false);
    const [filterBlocked, setFilterBlocked] = useState(false);

    const parentTasks = tasks.filter(t => !t.parentId);

    const defaultNewTask = {
        title: '',
        startDate: '',
        dueDate: '',
        priority: 'P2' as Task['priority'],
        description: '',
        parentId: '',
        dependencies: '',
        isMilestone: false,
        workstream: '',
        relatedMilestoneId: '',
        ownerId: '',
    };
    const [newTask, setNewTask] = useState(defaultNewTask);

    const [isMilestoneAddOpen, setIsMilestoneAddOpen] = useState(false);
    const [newMilestone, setNewMilestone] = useState({ title: '', description: '', date: '', status: 'Pending' as MilestoneStatus, ownerId: '' });

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
            dependencies: newTask.dependencies ? newTask.dependencies.split(',').map(s => s.trim()).filter(Boolean) : [],
            tags: [],
            description: newTask.description,
            parentId: newTask.parentId || undefined,
            isMilestone: newTask.isMilestone,
            workstream: newTask.workstream || undefined,
            relatedMilestoneId: newTask.relatedMilestoneId || undefined,
            ownerId: newTask.ownerId || undefined,
        };
        addTask(task);
        if (newTask.isMilestone) {
            addActivity({ id: generateId('act'), timestamp: new Date().toISOString(), action: 'Milestone created', detail: `"${newTask.title}"`, category: 'milestone' });
        }
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
            progress: editTask.progress,
            dependencies: editTask.dependencies,
            description: editTask.description,
            parentId: editTask.parentId || undefined,
            isMilestone: editTask.isMilestone,
            workstream: editTask.workstream || undefined,
            relatedMilestoneId: editTask.relatedMilestoneId || undefined,
            ownerId: editTask.ownerId || undefined,
        });
        // Cascade: if due date changed, shift dependent tasks
        const originalTask = tasks.find(t => t.id === editTask.id);
        if (originalTask && originalTask.dueDate !== editTask.dueDate) {
            const diffDays = Math.round((new Date(editTask.dueDate).getTime() - new Date(originalTask.dueDate).getTime()) / (86400000));
            if (diffDays !== 0) {
                tasks.forEach(t => {
                    if (t.dependencies?.includes(editTask.id)) {
                        const newStart = new Date(new Date(t.startDate).getTime() + diffDays * 86400000).toISOString().split('T')[0];
                        const newDue = new Date(new Date(t.dueDate).getTime() + diffDays * 86400000).toISOString().split('T')[0];
                        updateTask(t.id, { startDate: newStart, dueDate: newDue });
                    }
                });
            }
        }
        setEditTask(null);
    };

    const exportCSV = () => {
        const header = 'Title,Status,Priority,Start,Due,Progress,Milestone\n';
        const rows = tasks.map(t =>
            `"${t.title}",${t.status},${t.priority},${t.startDate},${t.dueDate},${t.progress}%,${t.isMilestone ? 'Yes' : 'No'}`
        ).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasks.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleAddMilestone = () => {
        if (!newMilestone.title || !newMilestone.date) return;
        addMilestone({
            id: generateId('ms'),
            title: newMilestone.title,
            description: newMilestone.description,
            date: newMilestone.date,
            status: newMilestone.status,
            ownerId: newMilestone.ownerId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        setNewMilestone({ title: '', description: '', date: '', status: 'Pending', ownerId: '' });
        setIsMilestoneAddOpen(false);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Schedule</h1>
                    <p className={styles.subtitle}>{tasks.length} tasks · {milestones.length} milestones</p>
                </div>
                <div className={styles.controls}>
                    <div className={styles.viewToggle}>
                        <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
                            <List size={14} /> List
                        </button>
                        <button className={view === 'gantt' ? 'active' : ''} onClick={() => setView('gantt')}>
                            <BarChart3 size={14} /> Gantt
                        </button>
                        <button className={view === 'milestones' ? 'active' : ''} onClick={() => setView('milestones')}>
                            <Target size={14} /> Milestones
                        </button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={exportCSV}>
                        <Download size={14} /> CSV
                    </Button>
                    <Button size="sm" onClick={() => {
                        if (view === 'milestones') setIsMilestoneAddOpen(true);
                        else setIsAddOpen(true);
                    }}>
                        <Plus size={14} /> {view === 'milestones' ? 'Add Milestone' : 'Add Task'}
                    </Button>
                </div>
            </header>

            {view === 'list' && (
                <div className={styles.filterBar} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button variant={filterOverdue ? 'default' : 'outline'} size="sm" onClick={() => setFilterOverdue(!filterOverdue)}>
                        <Filter size={12} style={{ marginRight: 4 }} /> Overdue
                    </Button>
                    <Button variant={filterThisWeek ? 'default' : 'outline'} size="sm" onClick={() => setFilterThisWeek(!filterThisWeek)}>
                        <Filter size={12} style={{ marginRight: 4 }} /> This Week
                    </Button>
                    <Button variant={filterBlocked ? 'default' : 'outline'} size="sm" onClick={() => setFilterBlocked(!filterBlocked)}>
                        <Filter size={12} style={{ marginRight: 4 }} /> Blocked
                    </Button>
                </div>
            )}

            {view === 'list' && <ListView onEditTask={(task) => setEditTask(task)} filters={{ overdue: filterOverdue, thisWeek: filterThisWeek, blocked: filterBlocked }} />}
            {view === 'gantt' && <GanttView />}
            {view === 'milestones' && <MilestonesView />}

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
                            <label>Owner</label>
                            <select className={styles.select} value={newTask.ownerId} onChange={e => setNewTask({ ...newTask, ownerId: e.target.value })}>
                                <option value="">— Unassigned —</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Workstream</label>
                            <input className={styles.input} value={newTask.workstream} onChange={e => setNewTask({ ...newTask, workstream: e.target.value })} placeholder="e.g. Design, Backend" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Related Milestone</label>
                            <select className={styles.select} value={newTask.relatedMilestoneId} onChange={e => setNewTask({ ...newTask, relatedMilestoneId: e.target.value })}>
                                <option value="">— None —</option>
                                {milestones.map(m => (
                                    <option key={m.id} value={m.id}>{m.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Parent Task (Sub-task)</label>
                            <select className={styles.select} value={newTask.parentId} onChange={e => setNewTask({ ...newTask, parentId: e.target.value })}>
                                <option value="">— None (Top-level) —</option>
                                {parentTasks.map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Dependencies (must finish first)</label>
                            <select className={styles.select} value={newTask.dependencies || ''} onChange={e => setNewTask({ ...newTask, dependencies: e.target.value })}>
                                <option value="">— None —</option>
                                {tasks.map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={newTask.isMilestone}
                                onChange={e => setNewTask({ ...newTask, isMilestone: e.target.checked })}
                                style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                            />
                            <span>🏁 Mark as internal Task Milestone flag (Legacy)</span>
                        </label>
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
                                <label>Owner</label>
                                <select className={styles.select} value={editTask.ownerId || ''} onChange={e => setEditTask({ ...editTask, ownerId: e.target.value })}>
                                    <option value="">— Unassigned —</option>
                                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Workstream</label>
                                <input className={styles.input} value={editTask.workstream || ''} onChange={e => setEditTask({ ...editTask, workstream: e.target.value })} placeholder="e.g. Design, Backend" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Related Milestone</label>
                                <select className={styles.select} value={editTask.relatedMilestoneId || ''} onChange={e => setEditTask({ ...editTask, relatedMilestoneId: e.target.value })}>
                                    <option value="">— None —</option>
                                    {milestones.map(m => (
                                        <option key={m.id} value={m.id}>{m.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Parent Task</label>
                                <select className={styles.select} value={editTask.parentId || ''} onChange={e => setEditTask({ ...editTask, parentId: e.target.value || undefined })}>
                                    <option value="">— None —</option>
                                    {parentTasks.filter(t => t.id !== editTask.id).map(t => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Dependencies (must finish first)</label>
                                <select className={styles.select} value={editTask.dependencies?.[0] || ''} onChange={e => setEditTask({ ...editTask, dependencies: e.target.value ? [e.target.value] : [] })}>
                                    <option value="">— None —</option>
                                    {tasks.filter(t => t.id !== editTask.id).map(t => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Progress: {editTask.progress}%</label>
                            <input type="range" min="0" max="100" step="5" value={editTask.progress} onChange={e => setEditTask({ ...editTask, progress: parseInt(e.target.value) })} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                        </div>
                        <div className={styles.formGroup}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={editTask.isMilestone || false}
                                    onChange={e => setEditTask({ ...editTask, isMilestone: e.target.checked })}
                                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                                />
                                <span>🏁 Mark as internal Task Milestone flag (Legacy)</span>
                            </label>
                        </div>
                        <div className={styles.formActions}>
                            <Button variant="ghost" onClick={() => setEditTask(null)}>Cancel</Button>
                            <Button onClick={handleEditSave}>Save Changes</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add Milestone Modal */}
            <Modal isOpen={isMilestoneAddOpen} onClose={() => setIsMilestoneAddOpen(false)} title="Add Milestone">
                <div className={styles.form}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Milestone Title *</label>
                            <input className={styles.input} value={newMilestone.title} onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })} placeholder="e.g. Design Freeze" autoFocus />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Target Date *</label>
                            <input type="date" className={styles.input} value={newMilestone.date} onChange={e => setNewMilestone({ ...newMilestone, date: e.target.value })} />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea className={styles.textarea} value={newMilestone.description} onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })} rows={2} />
                    </div>
                    <div className={styles.formActions}>
                        <Button variant="ghost" onClick={() => setIsMilestoneAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddMilestone}>Create Milestone</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
