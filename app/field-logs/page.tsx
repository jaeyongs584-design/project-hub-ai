'use client';

import React, { useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { ClipboardList, Plus, Calendar, Cloud, Users, AlertCircle, ShieldAlert, Trash2, Mail } from 'lucide-react';
import styles from './page.module.css';
import { cn, generateId } from '@/lib/utils';
import { SiteLog, WeatherCondition } from '@/types';

export default function FieldLogsPage() {
    const {
        siteLogs = [],
        issues = [],
        risks = [],
        members = [],
        addSiteLog,
        updateSiteLog,
        deleteSiteLog,
    } = useProject();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const today = new Date().toISOString().split('T')[0];

    const [form, setForm] = useState<Partial<SiteLog>>({
        date: today,
        loggerId: '',
        weather: { condition: 'Clear', temperature: undefined },
        personnelCount: 0,
        workSummary: '',
        nextDayPlan: '',
        relatedIssueIds: [],
        relatedRiskIds: []
    });

    const openModal = (log?: SiteLog) => {
        if (log) {
            setEditId(log.id);
            setForm(log);
        } else {
            setEditId(null);
            setForm({
                date: today,
                loggerId: '',
                weather: { condition: 'Clear', temperature: undefined },
                personnelCount: 0,
                workSummary: '',
                nextDayPlan: '',
                relatedIssueIds: [],
                relatedRiskIds: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!form.date || !form.workSummary) return;

        if (editId) {
            updateSiteLog(editId, { ...form, updatedAt: new Date().toISOString() });
        } else {
            addSiteLog({
                id: generateId('log'),
                date: form.date,
                loggerId: form.loggerId || 'unassigned',
                weather: form.weather,
                personnelCount: form.personnelCount,
                workSummary: form.workSummary,
                nextDayPlan: form.nextDayPlan,
                relatedIssueIds: form.relatedIssueIds,
                relatedRiskIds: form.relatedRiskIds,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        setIsModalOpen(false);
    };

    // Sort logs descending by date
    const sortedLogs = [...siteLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Field & Site Logs</h1>
                    <p className={styles.subtitle}>Daily tracking of site conditions, personnel, and work progress</p>
                </div>
                <Button onClick={() => openModal()}>
                    <Plus size={16} /> New Daily Log
                </Button>
            </header>

            <div className={styles.list}>
                {sortedLogs.length === 0 ? (
                    <div className={styles.emptyState}>
                        No field logs recorded yet. Click &quot;New Daily Log&quot; to create your first entry.
                    </div>
                ) : (
                    sortedLogs.map(log => {
                        const logger = members.find(m => m.id === log.loggerId);
                        const linkedIssues = issues.filter(i => log.relatedIssueIds?.includes(i.id));
                        const linkedRisks = risks.filter(r => log.relatedRiskIds?.includes(r.id));

                        return (
                            <Card key={log.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h3 className={styles.cardTitle}>
                                            <Calendar size={16} /> {log.date}
                                        </h3>
                                        <div className={styles.cardMeta}>
                                            {logger && (
                                                <span><Users size={14} /> Logged by: {logger.name}</span>
                                            )}
                                            {log.personnelCount !== undefined && log.personnelCount > 0 && (
                                                <span><Users size={14} /> Workers on site: {log.personnelCount}</span>
                                            )}
                                            {log.weather && (
                                                <span className={styles.weatherBadge}>
                                                    <Cloud size={12} />
                                                    {log.weather.condition} {log.weather.temperature !== undefined ? `(${log.weather.temperature}°C)` : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.actions}>
                                        <button className={styles.iconBtn} onClick={() => {
                                            const subject = `Daily Site Log: ${log.date}`;
                                            const bodyOuter = `Date: ${log.date}\nLogger: ${logger?.name || 'Unknown'}\nWorkers: ${log.personnelCount || 0}\nWeather: ${log.weather?.condition || 'Clear'} ${log.weather?.temperature ? `(${log.weather.temperature}C)` : ''}\n\n--- Work Summary ---\n${log.workSummary}\n${log.nextDayPlan ? `\n--- Planned for Tomorrow ---\n${log.nextDayPlan}\n` : ''}`;
                                            window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyOuter)}`;
                                        }} title="Share via Email">
                                            <Mail size={16} />
                                        </button>
                                        <button className={styles.iconBtn} onClick={() => openModal(log)} title="Edit Log">
                                            <ClipboardList size={16} />
                                        </button>
                                        <button className={cn(styles.iconBtn, styles.deleteBtn)} onClick={() => deleteSiteLog(log.id)} title="Delete Log">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.workSummary} style={{ whiteSpace: 'pre-wrap' }}>
                                    <strong>Work Summary:</strong>
                                    <div>{log.workSummary}</div>
                                    {log.nextDayPlan && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <strong>Planned for Tomorrow:</strong>
                                            <div>{log.nextDayPlan}</div>
                                        </div>
                                    )}
                                </div>

                                {(linkedIssues.length > 0 || linkedRisks.length > 0) && (
                                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {linkedIssues.map(i => (
                                            <span key={i.id} title={i.title}>
                                                <Badge variant="danger">
                                                    <AlertCircle size={12} style={{ marginRight: '4px', display: 'inline' }} />
                                                    Issue: {i.id}
                                                </Badge>
                                            </span>
                                        ))}
                                        {linkedRisks.map(r => (
                                            <span key={r.id} title={r.title}>
                                                <Badge variant="warning">
                                                    <ShieldAlert size={12} style={{ marginRight: '4px', display: 'inline' }} />
                                                    Risk: {r.id}
                                                </Badge>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        )
                    })
                )}
            </div>

            {/* Modal Form */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Edit Daily Log" : "New Daily Site Log"}>
                <div className={styles.form}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Date *</label>
                            <input className={styles.input} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Logger (Author)</label>
                            <select className={styles.select} value={form.loggerId || ''} onChange={e => setForm({ ...form, loggerId: e.target.value })}>
                                <option value="">— Select Member —</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup} style={{ flex: 2 }}>
                            <label>Weather Condition</label>
                            <select
                                className={styles.select}
                                value={form.weather?.condition || 'Clear'}
                                onChange={e => setForm({ ...form, weather: { ...form.weather, condition: e.target.value as WeatherCondition['condition'] } })}
                            >
                                <option value="Clear">Clear</option>
                                <option value="Sunny">Sunny</option>
                                <option value="Cloudy">Cloudy</option>
                                <option value="Rain">Rain</option>
                                <option value="Snow">Snow</option>
                                <option value="Windy">Windy</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className={styles.formGroup} style={{ flex: 1 }}>
                            <label>Temp (°C)</label>
                            <input
                                className={styles.input}
                                type="number"
                                value={form.weather?.temperature ?? ''}
                                onChange={e => setForm({ ...form, weather: { ...form.weather, temperature: e.target.value ? Number(e.target.value) : undefined } as WeatherCondition })}
                                placeholder="e.g. 24"
                            />
                        </div>
                        <div className={styles.formGroup} style={{ flex: 1 }}>
                            <label>Personnel</label>
                            <input
                                className={styles.input}
                                type="number"
                                min="0"
                                value={form.personnelCount ?? 0}
                                onChange={e => setForm({ ...form, personnelCount: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Work Summary *</label>
                        <textarea
                            className={styles.textarea}
                            value={form.workSummary}
                            onChange={e => setForm({ ...form, workSummary: e.target.value })}
                            placeholder="Describe the tasks completed, visitors, deliveries, and overall progress..."
                            rows={3}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Next Day Expected Work</label>
                        <textarea
                            className={styles.textarea}
                            value={form.nextDayPlan || ''}
                            onChange={e => setForm({ ...form, nextDayPlan: e.target.value })}
                            placeholder="Tasks planned for tomorrow..."
                            rows={2}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Related Issues</label>
                        <div className={styles.checkboxListContainer}>
                            {issues.length === 0 ? (
                                <div className={styles.emptyOption}>No issues found</div>
                            ) : (
                                issues.map(i => (
                                    <label key={i.id} className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={(form.relatedIssueIds || []).includes(i.id)}
                                            onChange={(e) => {
                                                const newIds = e.target.checked
                                                    ? [...(form.relatedIssueIds || []), i.id]
                                                    : (form.relatedIssueIds || []).filter(id => id !== i.id);
                                                setForm({ ...form, relatedIssueIds: newIds });
                                            }}
                                        />
                                        <span title={i.title}>{i.title}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Related Risks</label>
                        <div className={styles.checkboxListContainer}>
                            {risks.length === 0 ? (
                                <div className={styles.emptyOption}>No risks found</div>
                            ) : (
                                risks.map(r => (
                                    <label key={r.id} className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={(form.relatedRiskIds || []).includes(r.id)}
                                            onChange={(e) => {
                                                const newIds = e.target.checked
                                                    ? [...(form.relatedRiskIds || []), r.id]
                                                    : (form.relatedRiskIds || []).filter(id => id !== r.id);
                                                setForm({ ...form, relatedRiskIds: newIds });
                                            }}
                                        />
                                        <span title={r.title}>{r.title}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Log</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
