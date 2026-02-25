'use client';

import React, { useMemo } from 'react';
import { useProject } from '@/hooks/useProject';
import { Card } from '@/app/components/ui/Card';
import styles from './GanttView.module.css';
import { differenceInDays, parseISO, addDays, format, isWeekend, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

export default function GanttView() {
    const { tasks, milestones } = useProject();

    const { days, startParam } = useMemo(() => {
        const dates = [
            ...tasks.flatMap(t => [t.startDate, t.dueDate].filter(Boolean)),
            ...milestones.map(m => m.date).filter(Boolean)
        ];
        if (dates.length === 0) return { days: [], startParam: new Date(), totalDays: 0 };

        const sorted = [...dates].sort();
        const minDate = parseISO(sorted[0]);
        const maxDate = parseISO(sorted[sorted.length - 1]);

        const sp = addDays(minDate, -3);
        const ep = addDays(maxDate, 7);
        const td = differenceInDays(ep, sp) + 1;

        return {
            days: Array.from({ length: td }, (_, i) => addDays(sp, i)),
            startParam: sp,
            totalDays: td,
        };
    }, [tasks, milestones]);

    if (days.length === 0) {
        return <Card className={styles.card}><div className={styles.emptyState}>No tasks with dates to display</div></Card>;
    }

    const getBarStyle = (start: string, end: string) => {
        const startOffset = differenceInDays(parseISO(start), startParam);
        const duration = differenceInDays(parseISO(end), parseISO(start)) + 1;
        return {
            left: `${startOffset * 36}px`,
            width: `${Math.max(duration * 36 - 4, 24)}px`,
        };
    };

    const getStatusClass = (status: string) => {
        const key = status.replace(/\s+/g, '').toLowerCase();
        const map: Record<string, string> = {
            notstarted: styles.barNotstarted,
            inprogress: styles.barInprogress,
            done: styles.barDone,
            blocked: styles.barBlocked,
        };
        return map[key] || styles.barNotstarted;
    };

    const todayIndex = days.findIndex(d => isToday(d));

    // Build parent→child tree for display
    const parentTasks = tasks.filter(t => !t.parentId);
    const getChildren = (parentId: string) => tasks.filter(t => t.parentId === parentId);

    // Ordered items combining tasks and actual milestones
    type GanttItem =
        | { type: 'task', id: string, title: string, isChild: boolean, data: typeof tasks[0] }
        | { type: 'milestone', id: string, title: string, isChild: boolean, data: typeof milestones[0] };

    const orderedItems: GanttItem[] = [];

    // Add real milestones first
    milestones.forEach(m => {
        orderedItems.push({ type: 'milestone', id: `ms-${m.id}`, title: m.title, isChild: false, data: m });
    });

    parentTasks.forEach(parent => {
        orderedItems.push({ type: 'task', id: `task-${parent.id}`, title: parent.title, isChild: false, data: parent });
        getChildren(parent.id).forEach(child => {
            orderedItems.push({ type: 'task', id: `task-${child.id}`, title: child.title, isChild: true, data: child });
        });
    });

    return (
        <Card className={styles.card}>
            <div className={styles.ganttContainer}>
                <div className={styles.ganttWrapper}>
                    {/* Left Panel */}
                    <div className={styles.taskPanel}>
                        <div className={styles.taskPanelHeader}>Task</div>
                        {orderedItems.map((item) => (
                            <div
                                key={item.id}
                                className={cn(styles.taskRow, item.isChild && styles.taskRowChild)}
                                title={item.title}
                                style={item.type === 'milestone' || (item.type === 'task' && item.data.isMilestone) ? { color: '#a29bfe', fontWeight: 600 } : undefined}
                            >
                                {item.type === 'milestone' || (item.type === 'task' && item.data.isMilestone)
                                    ? `🏁 ${item.isChild ? '↳ ' : ''}${item.title}`
                                    : item.isChild ? `↳ ${item.title}` : item.title}
                            </div>
                        ))}
                    </div>

                    {/* Right Panel */}
                    <div className={styles.timelinePanel}>
                        {/* Date Headers */}
                        <div className={styles.timelineHeader}>
                            {days.map((day, i) => (
                                <div
                                    key={i}
                                    className={cn(styles.dateCell, isToday(day) && styles.todayCell)}
                                >
                                    <span className={styles.dayNum}>{format(day, 'd')}</span>
                                    <span className={styles.dayName}>{format(day, 'EEE')}</span>
                                </div>
                            ))}
                        </div>

                        {/* Task Rows */}
                        {orderedItems.map((item) => (
                            <div key={item.id} className={styles.timelineRow}>
                                {days.map((day, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            styles.gridCell,
                                            isToday(day) && styles.gridCellToday,
                                            isWeekend(day) && styles.gridCellWeekend,
                                        )}
                                    />
                                ))}
                                <div className={styles.barContainer}>
                                    {item.type === 'milestone' ? (
                                        /* Actual Milestone Entity */
                                        <>
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: `${differenceInDays(parseISO(item.data.date), startParam) * 36 + 12}px`,
                                                    top: '2px',
                                                    width: '14px',
                                                    height: '14px',
                                                    background: item.data.status === 'Completed' ? '#55efc4' :
                                                        item.data.status === 'Delayed' ? '#ff6b6b' : '#a29bfe',
                                                    transform: 'rotate(45deg)',
                                                    borderRadius: '2px',
                                                    boxShadow: '0 0 6px rgba(108,92,231,0.4)',
                                                }}
                                                title={`🏁 ${item.title}: ${item.data.date} (${item.data.status})`}
                                            />
                                        </>
                                    ) : item.type === 'task' && item.data.isMilestone ? (
                                        /* Legacy Task-based Milestone */
                                        <>
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: `${differenceInDays(parseISO(item.data.dueDate), startParam) * 36 + 12}px`,
                                                    top: '2px',
                                                    width: '14px',
                                                    height: '14px',
                                                    background: item.data.status === 'Done' ? '#55efc4' :
                                                        item.data.status === 'Blocked' ? '#ff6b6b' : '#a29bfe',
                                                    transform: 'rotate(45deg)',
                                                    borderRadius: '2px',
                                                    boxShadow: '0 0 6px rgba(108,92,231,0.4)',
                                                }}
                                                title={`🏁 ${item.title}: ${item.data.dueDate} (${item.data.status})`}
                                            />
                                            <span style={{
                                                position: 'absolute',
                                                left: `${differenceInDays(parseISO(item.data.dueDate), startParam) * 36 + 30}px`,
                                                top: '1px',
                                                fontSize: '0.625rem',
                                                color: '#a29bfe',
                                                whiteSpace: 'nowrap',
                                                fontWeight: 600,
                                            }}>{item.data.progress > 0 ? `${item.data.progress}%` : ''}</span>
                                        </>
                                    ) : (
                                        /* Normal task: bar */
                                        <div
                                            className={cn(styles.taskBar, getStatusClass(item.data.status))}
                                            style={getBarStyle(item.data.startDate, item.data.dueDate)}
                                            title={`${item.title}: ${item.data.startDate} → ${item.data.dueDate} (${item.data.progress}%)`}
                                        >
                                            <span className={styles.barLabel}>{item.data.progress > 0 ? `${item.data.progress}%` : item.data.status}</span>
                                        </div>
                                    )}
                                </div>
                                {todayIndex >= 0 && (
                                    <div className={styles.todayMarker} style={{ left: `${todayIndex * 36 + 18}px` }} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}
