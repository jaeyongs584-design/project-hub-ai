'use client';

import React, { useMemo } from 'react';
import { useProject } from '@/hooks/useProject';
import { Card } from '@/app/components/ui/Card';
import styles from './GanttView.module.css';
import { differenceInDays, parseISO, addDays, format, isWeekend, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

export default function GanttView() {
    const { tasks } = useProject();

    const { days, startParam, totalDays } = useMemo(() => {
        const dates = tasks.flatMap(t => [t.startDate, t.dueDate].filter(Boolean));
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
    }, [tasks]);

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
    const orderedTasks: { task: typeof tasks[0]; isChild: boolean }[] = [];
    parentTasks.forEach(parent => {
        orderedTasks.push({ task: parent, isChild: false });
        getChildren(parent.id).forEach(child => {
            orderedTasks.push({ task: child, isChild: true });
        });
    });

    return (
        <Card className={styles.card}>
            <div className={styles.ganttContainer}>
                <div className={styles.ganttWrapper}>
                    {/* Left Panel */}
                    <div className={styles.taskPanel}>
                        <div className={styles.taskPanelHeader}>Task</div>
                        {orderedTasks.map(({ task, isChild }) => (
                            <div
                                key={task.id}
                                className={cn(styles.taskRow, isChild && styles.taskRowChild)}
                                title={task.title}
                            >
                                {isChild ? `↳ ${task.title}` : task.title}
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
                        {orderedTasks.map(({ task }) => (
                            <div key={task.id} className={styles.timelineRow}>
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
                                    <div
                                        className={cn(styles.taskBar, getStatusClass(task.status))}
                                        style={getBarStyle(task.startDate, task.dueDate)}
                                        title={`${task.title}: ${task.startDate} → ${task.dueDate}`}
                                    >
                                        <span className={styles.barLabel}>{task.status}</span>
                                    </div>
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
