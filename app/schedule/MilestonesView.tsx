import React from 'react';
import { useProject } from '@/hooks/useProject';
import styles from './page.module.css';
import { cn } from '@/lib/utils';
import { Target, Flag } from 'lucide-react';

export default function MilestonesView() {
    const { milestones = [], tasks } = useProject();

    return (
        <div className={styles.viewContainer}>
            {milestones.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--foreground-muted)' }}>
                    <Target size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                    <p>No milestones created yet.</p>
                </div>
            ) : (
                <div className={styles.timelineList}>
                    {milestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(m => {
                        const related = tasks.filter(t => t.relatedMilestoneId === m.id);
                        const doneCount = related.filter(t => t.status === 'Done').length;
                        const progress = related.length > 0 ? Math.round((doneCount / related.length) * 100) : 0;
                        return (
                            <div key={m.id} className={styles.timelineItem} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Flag size={16} style={{ color: 'var(--primary-light)' }} /> {m.title}
                                    </h3>
                                    <span className={cn(styles.badge, styles[`badge${m.status.replace(/\s+/g, '')}`])} style={{ fontSize: '0.75rem' }}>
                                        {m.status}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--foreground-muted)', margin: '0 0 0.5rem 0' }}>
                                    Target Date: {m.date}
                                </p>
                                {m.description && <p style={{ fontSize: '0.8125rem', margin: '0 0 0.5rem 0' }}>{m.description}</p>}
                                <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                                    <span style={{ minWidth: '120px' }}>Tasks: {doneCount} / {related.length} completed</span>
                                    <div style={{ flex: 1, height: '6px', background: 'var(--secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? 'var(--accent-green)' : 'var(--primary)', transition: 'width 0.5s' }} />
                                    </div>
                                    <span style={{ minWidth: '30px', textAlign: 'right' }}>{progress}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
