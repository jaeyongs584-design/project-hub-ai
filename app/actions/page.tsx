'use client';

import React, { useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { Plus, Trash2, Pencil, ChevronRight, CheckSquare, Lightbulb, Calendar } from 'lucide-react';
import { generateId, cn } from '@/lib/utils';
import { ActionItem, ActionStatus, Decision, Meeting, MeetingStatus, Communication, CommType } from '@/types';
import styles from './page.module.css';

type TabType = 'actions' | 'decisions' | 'meetings';

const ACTION_STATUS_CYCLE: ActionStatus[] = ['Open', 'In Progress', 'Done', 'Blocked'];
const MEETING_STATUS_CYCLE: MeetingStatus[] = ['Planned', 'Completed', 'Cancelled'];

export default function ActionsPage() {
    const {
        actionItems, decisions, meetings, communications, members,
        addActionItem, updateActionItem, deleteActionItem,
        addDecision, updateDecision, deleteDecision,
        addMeeting, updateMeeting, deleteMeeting,
        addCommunication, updateCommunication,
        addActivity,
    } = useProject();

    const [activeTab, setActiveTab] = useState<TabType>('actions');

    // ── Action Item state ──
    const [isActionAddOpen, setIsActionAddOpen] = useState(false);
    const [editAction, setEditAction] = useState<ActionItem | null>(null);
    const [newAction, setNewAction] = useState({ title: '', ownerId: '', dueDate: '', priority: 'Medium' as ActionItem['priority'], sourceType: 'Manual' as ActionItem['sourceType'], sourceLink: '' });

    // ── Decision state ──
    const [isDecisionAddOpen, setIsDecisionAddOpen] = useState(false);
    const [editDecisionItem, setEditDecisionItem] = useState<Decision | null>(null);
    const [newDecision, setNewDecision] = useState({ summary: '', decidedBy: '', impactAreas: [] as Decision['impactAreas'], date: '', sourceLink: '' });

    // ── Meeting state ──
    const [isMeetingAddOpen, setIsMeetingAddOpen] = useState(false);
    const [editMeetingItem, setEditMeetingItem] = useState<Meeting | null>(null);
    const [newMeeting, setNewMeeting] = useState({ title: '', meetingDate: '', participants: '', meetingType: 'Internal' as Meeting['meetingType'] });

    // ── Communication state ──
    const [isCommAddOpen, setIsCommAddOpen] = useState(false);
    const [editCommItem, setEditCommItem] = useState<Communication | null>(null);
    const [newComm, setNewComm] = useState({ type: 'Email' as CommType, subject: '', date: '', summary: '', linkUrl: '' });

    const [actionFilter, setActionFilter] = useState<'All' | 'Overdue'>('All');


    const findMember = (id?: string) => members.find(m => m.id === id)?.name || '—';
    const today = new Date().toISOString().split('T')[0];

    const actionStatusClass = (s: ActionStatus) => {
        const map: Record<ActionStatus, string> = { 'Open': styles.statusOpen, 'In Progress': styles.statusInProgress, 'Done': styles.statusDone, 'Blocked': styles.statusBlocked };
        return map[s];
    };
    const meetingStatusClass = (s: MeetingStatus) => {
        const map: Record<MeetingStatus, string> = { 'Planned': styles.statusPlanned, 'Completed': styles.statusCompleted, 'Cancelled': styles.statusCancelled };
        return map[s];
    };
    const priorityClass = (p: string) => {
        const map: Record<string, string> = { 'Low': styles.priorityLow, 'Medium': styles.priorityMedium, 'High': styles.priorityHigh };
        return map[p];
    };

    // ── Handlers ──
    const handleAddAction = () => {
        if (!newAction.title) return;
        const now = new Date().toISOString();
        addActionItem({ id: generateId('act-i'), title: newAction.title, ownerId: newAction.ownerId || undefined, dueDate: newAction.dueDate || undefined, status: 'Open', priority: newAction.priority, sourceType: newAction.sourceType, createdAt: now });
        addActivity({ id: generateId('act'), timestamp: now, action: 'Action created', detail: `"${newAction.title}"`, category: 'action' });
        setNewAction({ title: '', ownerId: '', dueDate: '', priority: 'Medium', sourceType: 'Manual', sourceLink: '' }); setIsActionAddOpen(false);
    };
    const handleEditActionSave = () => {
        if (!editAction) return;
        updateActionItem(editAction.id, { title: editAction.title, ownerId: editAction.ownerId, dueDate: editAction.dueDate, priority: editAction.priority, sourceType: editAction.sourceType, description: editAction.description }); setEditAction(null);
    };

    const handleAddDecision = () => {
        if (!newDecision.summary) return;
        const now = new Date().toISOString();
        addDecision({ id: generateId('dec'), date: newDecision.date || today, summary: newDecision.summary, decidedBy: newDecision.decidedBy, impactAreas: newDecision.impactAreas.length > 0 ? newDecision.impactAreas : ['Technical'], sourceLink: newDecision.sourceLink, createdAt: now });
        addActivity({ id: generateId('act'), timestamp: now, action: 'Decision recorded', detail: `"${newDecision.summary.slice(0, 50)}..."`, category: 'decision' });
        setNewDecision({ summary: '', decidedBy: '', impactAreas: [], date: '', sourceLink: '' }); setIsDecisionAddOpen(false);
    };
    const handleEditDecisionSave = () => {
        if (!editDecisionItem) return;
        updateDecision(editDecisionItem.id, { summary: editDecisionItem.summary, decidedBy: editDecisionItem.decidedBy, impactAreas: editDecisionItem.impactAreas, sourceLink: editDecisionItem.sourceLink }); setEditDecisionItem(null);
    };

    const handleAddMeeting = () => {
        if (!newMeeting.title) return;
        const now = new Date().toISOString();
        addMeeting({ id: generateId('mtg'), title: newMeeting.title, meetingDate: newMeeting.meetingDate || today, participants: newMeeting.participants, meetingType: newMeeting.meetingType, status: 'Planned', createdAt: now });
        addActivity({ id: generateId('act'), timestamp: now, action: 'Meeting planned', detail: `"${newMeeting.title}"`, category: 'meeting' });
        setNewMeeting({ title: '', meetingDate: '', participants: '', meetingType: 'Internal' }); setIsMeetingAddOpen(false);
    };
    const handleEditMeetingSave = () => {
        if (!editMeetingItem) return;
        updateMeeting(editMeetingItem.id, { title: editMeetingItem.title, meetingDate: editMeetingItem.meetingDate, participants: editMeetingItem.participants, meetingType: editMeetingItem.meetingType, notes: editMeetingItem.notes, minutes: editMeetingItem.minutes }); setEditMeetingItem(null);
    };

    const handleAddComm = () => {
        if (!newComm.subject) return;
        const now = new Date().toISOString();
        addCommunication({ id: generateId('com'), type: newComm.type, subject: newComm.subject, date: newComm.date || today, summary: newComm.summary, linkUrl: newComm.linkUrl, createdAt: now });
        addActivity({ id: generateId('act'), timestamp: now, action: 'Comm logged', detail: `"${newComm.subject}"`, category: 'communication' });
        setNewComm({ type: 'Email', subject: '', date: '', summary: '', linkUrl: '' }); setIsCommAddOpen(false);
    };
    const handleEditCommSave = () => {
        if (!editCommItem) return;
        updateCommunication(editCommItem.id, { type: editCommItem.type, subject: editCommItem.subject, date: editCommItem.date, summary: editCommItem.summary, linkUrl: editCommItem.linkUrl }); setEditCommItem(null);
    };


    const safeActions = actionItems || [];
    const safeDecisions = decisions || [];
    const safeMeetings = meetings || [];

    const tabConfig = {
        actions: { title: 'Action Items', subtitle: `${safeActions.length} items`, addLabel: 'Add Action', onAdd: () => setIsActionAddOpen(true) },
        decisions: { title: 'Decisions', subtitle: `${safeDecisions.length} decisions`, addLabel: 'Record Decision', onAdd: () => setIsDecisionAddOpen(true) },
        meetings: { title: 'Meetings', subtitle: `${safeMeetings.length} meetings`, addLabel: 'Add Meeting', onAdd: () => setIsMeetingAddOpen(true) },
    };
    const tc = tabConfig[activeTab];

    // Overdue count
    const overdueCount = safeActions.filter(a => a.dueDate && a.dueDate < today && a.status !== 'Done').length;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div><h1 className={styles.title}>{tc.title}</h1><p className={styles.subtitle}>{tc.subtitle}</p></div>
                <Button size="sm" onClick={tc.onAdd}><Plus size={14} /> {tc.addLabel}</Button>
            </header>

            {/* Tabs */}
            <div className={styles.tabBar}>
                <button className={cn(styles.tabBtn, activeTab === 'actions' && styles.tabActive)} onClick={() => setActiveTab('actions')}>
                    <CheckSquare size={14} /> Actions <span className={styles.tabCount}>{safeActions.length}</span>
                    {overdueCount > 0 && <span style={{ fontSize: '0.625rem', background: 'rgba(214,48,49,0.2)', color: '#ff6b6b', padding: '0 0.3rem', borderRadius: '9999px' }}>{overdueCount} overdue</span>}
                </button>
                <button className={cn(styles.tabBtn, activeTab === 'decisions' && styles.tabActive)} onClick={() => setActiveTab('decisions')}>
                    <Lightbulb size={14} /> Decisions <span className={styles.tabCount}>{safeDecisions.length}</span>
                </button>
                <button className={cn(styles.tabBtn, activeTab === 'meetings' && styles.tabActive)} onClick={() => setActiveTab('meetings')}>
                    <Calendar size={14} /> Meetings <span className={styles.tabCount}>{safeMeetings.length}</span>
                </button>
            </div>

            {/* ═══ ACTION ITEMS TAB ═══ */}
            {activeTab === 'actions' && (
                <>
                    <div className={styles.filterBar} style={{ marginBottom: '1rem' }}>
                        <button className={cn(styles.filterBtn, actionFilter === 'All' && styles.filterActive)} onClick={() => setActionFilter('All')}>All actions</button>
                        <button className={cn(styles.filterBtn, actionFilter === 'Overdue' && styles.filterActive)} onClick={() => setActionFilter('Overdue')}>Overdue</button>
                    </div>
                    {safeActions.filter(a => actionFilter === 'All' ? true : (a.dueDate && a.dueDate < today && a.status !== 'Done')).length === 0 ? (
                        <Card><div className={styles.emptyState}>No action items found. <Button variant="ghost" size="sm" onClick={() => setIsActionAddOpen(true)} style={{ marginTop: '0.5rem' }}>Add first action</Button></div></Card>
                    ) : (
                        <div className={styles.itemList}>
                            {safeActions.filter(a => actionFilter === 'All' ? true : (a.dueDate && a.dueDate < today && a.status !== 'Done')).map(item => (
                                <Card key={item.id} className={styles.itemCard}>
                                    <div className={styles.itemTop}>
                                        <div className={styles.itemLeft}>
                                            <span className={cn(styles.statusPill, priorityClass(item.priority))} style={{ fontSize: '0.6875rem' }}>{item.priority}</span>
                                            <h3 className={styles.itemTitle} onClick={() => setEditAction(item)}>{item.title}</h3>
                                        </div>
                                        <div className={styles.itemRight}>
                                            <span className={cn(styles.statusPill, actionStatusClass(item.status))} onClick={() => { const idx = ACTION_STATUS_CYCLE.indexOf(item.status); updateActionItem(item.id, { status: ACTION_STATUS_CYCLE[(idx + 1) % ACTION_STATUS_CYCLE.length] }); }} title="Click to change">
                                                {item.status}<ChevronRight size={10} className={styles.chevron} />
                                            </span>
                                        </div>
                                    </div>
                                    {item.description && <p className={styles.itemDesc}>{item.description}</p>}
                                    <div className={styles.itemMeta}>
                                        <span>Owner: {findMember(item.ownerId)}</span>
                                        {item.dueDate && <span style={{ color: item.dueDate < today && item.status !== 'Done' ? '#ff6b6b' : undefined }}>Due: {item.dueDate}</span>}
                                        {item.sourceType && item.sourceType !== 'Manual' && <span className={styles.sourceBadge}>{item.sourceType}</span>}
                                        <div className={styles.itemActions}>
                                            <button className={styles.actionBtn} onClick={() => setEditAction(item)}><Pencil size={13} /></button>
                                            <button className={cn(styles.actionBtn, styles.deleteBtn)} onClick={() => deleteActionItem(item.id)}><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ═══ DECISIONS TAB ═══ */}
            {activeTab === 'decisions' && (
                safeDecisions.length === 0 ? (
                    <Card><div className={styles.emptyState}>No decisions recorded yet.</div></Card>
                ) : (
                    <div className={styles.itemList}>
                        {safeDecisions.map(d => (
                            <Card key={d.id} className={styles.itemCard}>
                                <div className={styles.itemTop}>
                                    <div className={styles.itemLeft}>
                                        {d.impactAreas?.map(a => <span key={a} className={styles.impactBadge}>{a}</span>)}
                                        <h3 className={styles.itemTitle} onClick={() => setEditDecisionItem(d)}>{d.summary}</h3>
                                    </div>
                                </div>
                                <div className={styles.itemMeta}>
                                    <span>By: {d.decidedBy || '—'}</span>
                                    <span>Date: {d.date}</span>
                                    {d.reason && <span>Reason: {d.reason}</span>}
                                    <div className={styles.itemActions}>
                                        <button className={styles.actionBtn} onClick={() => setEditDecisionItem(d)}><Pencil size={13} /></button>
                                        <button className={cn(styles.actionBtn, styles.deleteBtn)} onClick={() => deleteDecision(d.id)}><Trash2 size={13} /></button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )
            )}

            {/* ═══ MEETINGS TAB ═══ */}
            {activeTab === 'meetings' && (
                safeMeetings.length === 0 ? (
                    <Card><div className={styles.emptyState}>No meetings yet.</div></Card>
                ) : (
                    <div className={styles.itemList}>
                        {safeMeetings.map(m => (
                            <Card key={m.id} className={styles.itemCard}>
                                <div className={styles.itemTop}>
                                    <div className={styles.itemLeft}>
                                        <span className={styles.typeBadge}>{m.meetingType}</span>
                                        <h3 className={styles.itemTitle} onClick={() => setEditMeetingItem(m)}>{m.title}</h3>
                                    </div>
                                    <div className={styles.itemRight}>
                                        <span className={cn(styles.statusPill, meetingStatusClass(m.status))} onClick={() => { const idx = MEETING_STATUS_CYCLE.indexOf(m.status); updateMeeting(m.id, { status: MEETING_STATUS_CYCLE[(idx + 1) % MEETING_STATUS_CYCLE.length] }); }} title="Click to change">
                                            {m.status}<ChevronRight size={10} className={styles.chevron} />
                                        </span>
                                    </div>
                                </div>
                                {m.notes && <p className={styles.itemDesc}>{m.notes}</p>}
                                {m.minutes && <p className={styles.itemDesc} style={{ borderLeft: '2px solid var(--primary)', paddingLeft: '0.5rem', marginTop: '0.25rem' }}>📋 Minutes: {m.minutes.slice(0, 100)}{m.minutes.length > 100 ? '...' : ''}</p>}
                                <div className={styles.itemMeta}>
                                    <span>Date: {m.meetingDate}</span>
                                    <span>Participants: {m.participants || '—'}</span>
                                    <div className={styles.itemActions}>
                                        <button className={styles.actionBtn} onClick={() => setEditMeetingItem(m)}><Pencil size={13} /></button>
                                        <button className={cn(styles.actionBtn, styles.deleteBtn)} onClick={() => deleteMeeting(m.id)}><Trash2 size={13} /></button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )
            )}

            {/* ═══ MODALS ═══ */}
            {/* Add Action */}
            <Modal isOpen={isActionAddOpen} onClose={() => setIsActionAddOpen(false)} title="Quick Add Action Item">
                <div className={styles.form}>
                    <div className={styles.formGroup}><label>Title *</label><input className={styles.input} value={newAction.title} onChange={e => setNewAction({ ...newAction, title: e.target.value })} placeholder="Action item title" autoFocus /></div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}><label>Owner</label><select className={styles.select} value={newAction.ownerId} onChange={e => setNewAction({ ...newAction, ownerId: e.target.value })}><option value="">—</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                        <div className={styles.formGroup}><label>Due Date</label><input type="date" className={styles.input} value={newAction.dueDate} onChange={e => setNewAction({ ...newAction, dueDate: e.target.value })} /></div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}><label>Priority</label><select className={styles.select} value={newAction.priority} onChange={e => setNewAction({ ...newAction, priority: e.target.value as ActionItem['priority'] })}><option>Low</option><option>Medium</option><option>High</option></select></div>
                        <div className={styles.formGroup}><label>Source Type</label><select className={styles.select} value={newAction.sourceType} onChange={e => setNewAction({ ...newAction, sourceType: e.target.value as ActionItem['sourceType'] })}><option>Manual</option><option>Meeting</option><option>Communication</option><option>Issue</option><option>Deployment</option></select></div>
                    </div>
                    <details style={{ marginTop: '0.5rem' }}>
                        <summary style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>Advanced options...</summary>
                        <div className={styles.formGroup} style={{ marginTop: '0.5rem' }}><label>Source Link / ID</label><input className={styles.input} value={newAction.sourceLink} onChange={e => setNewAction({ ...newAction, sourceLink: e.target.value })} placeholder="URL or Reference" /></div>
                    </details>
                    <div className={styles.formActions}><Button variant="ghost" onClick={() => setIsActionAddOpen(false)}>Cancel</Button><Button onClick={handleAddAction}>Add Action</Button></div>
                </div>
            </Modal>
            {/* Edit Action */}
            <Modal isOpen={!!editAction} onClose={() => setEditAction(null)} title="Edit Action Item">
                {editAction && (
                    <div className={styles.form}>
                        <div className={styles.formGroup}><label>Title</label><input className={styles.input} value={editAction.title} onChange={e => setEditAction({ ...editAction, title: e.target.value })} /></div>
                        <div className={styles.formGroup}><label>Description</label><textarea className={styles.textarea} value={editAction.description || ''} onChange={e => setEditAction({ ...editAction, description: e.target.value })} placeholder="Optional details..." /></div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}><label>Priority</label><select className={styles.select} value={editAction.priority} onChange={e => setEditAction({ ...editAction, priority: e.target.value as ActionItem['priority'] })}><option>Low</option><option>Medium</option><option>High</option></select></div>
                            <div className={styles.formGroup}><label>Due Date</label><input type="date" className={styles.input} value={editAction.dueDate || ''} onChange={e => setEditAction({ ...editAction, dueDate: e.target.value })} /></div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}><label>Source Type</label><select className={styles.select} value={editAction.sourceType} onChange={e => setEditAction({ ...editAction, sourceType: e.target.value as ActionItem['sourceType'] })}><option>Manual</option><option>Meeting</option><option>Communication</option><option>Issue</option><option>Deployment</option></select></div>
                            <div className={styles.formGroup}><label>Source Link</label><input className={styles.input} value={editAction.sourceLink || ''} onChange={e => setEditAction({ ...editAction, sourceLink: e.target.value })} placeholder="URL or ID..." /></div>
                        </div>
                        <div className={styles.formActions}><Button variant="ghost" onClick={() => setEditAction(null)}>Cancel</Button><Button onClick={handleEditActionSave}>Save</Button></div>
                    </div>
                )}
            </Modal>

            {/* Add Decision */}
            <Modal isOpen={isDecisionAddOpen} onClose={() => setIsDecisionAddOpen(false)} title="Record Decision">
                <div className={styles.form}>
                    <div className={styles.formGroup}><label>Decision Summary *</label><textarea className={styles.textarea} value={newDecision.summary} onChange={e => setNewDecision({ ...newDecision, summary: e.target.value })} placeholder="What was decided?" autoFocus /></div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}><label>Decided By</label><input className={styles.input} value={newDecision.decidedBy} onChange={e => setNewDecision({ ...newDecision, decidedBy: e.target.value })} placeholder="Who decided?" /></div>
                        <div className={styles.formGroup}><label>Date</label><input type="date" className={styles.input} value={newDecision.date} onChange={e => setNewDecision({ ...newDecision, date: e.target.value })} /></div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}><label>Impact Area</label><select className={styles.select} onChange={e => { const v = e.target.value as Decision['impactAreas'][number]; setNewDecision({ ...newDecision, impactAreas: [v] }); }}><option>Technical</option><option>Schedule</option><option>Budget</option></select></div>
                        <div className={styles.formGroup}><label>Source Link</label><input className={styles.input} value={newDecision.sourceLink} onChange={e => setNewDecision({ ...newDecision, sourceLink: e.target.value })} placeholder="URL or Document ID" /></div>
                    </div>
                    <div className={styles.formActions}><Button variant="ghost" onClick={() => setIsDecisionAddOpen(false)}>Cancel</Button><Button onClick={handleAddDecision}>Record</Button></div>
                </div>
            </Modal>
            <Modal isOpen={!!editDecisionItem} onClose={() => setEditDecisionItem(null)} title="Edit Decision">
                {editDecisionItem && (
                    <div className={styles.form}>
                        <div className={styles.formGroup}><label>Summary</label><textarea className={styles.textarea} value={editDecisionItem.summary} onChange={e => setEditDecisionItem({ ...editDecisionItem, summary: e.target.value })} /></div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}><label>Decided By</label><input className={styles.input} value={editDecisionItem.decidedBy} onChange={e => setEditDecisionItem({ ...editDecisionItem, decidedBy: e.target.value })} /></div>
                            <div className={styles.formGroup}><label>Source Link</label><input className={styles.input} value={editDecisionItem.sourceLink || ''} onChange={e => setEditDecisionItem({ ...editDecisionItem, sourceLink: e.target.value })} placeholder="URL" /></div>
                        </div>
                        <div className={styles.formActions}><Button variant="ghost" onClick={() => setEditDecisionItem(null)}>Cancel</Button><Button onClick={handleEditDecisionSave}>Save</Button></div>
                    </div>
                )}
            </Modal>

            {/* Add Meeting */}
            <Modal isOpen={isMeetingAddOpen} onClose={() => setIsMeetingAddOpen(false)} title="Add Meeting">
                <div className={styles.form}>
                    <div className={styles.formGroup}><label>Title *</label><input className={styles.input} value={newMeeting.title} onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })} placeholder="Meeting title" autoFocus /></div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}><label>Date</label><input type="date" className={styles.input} value={newMeeting.meetingDate} onChange={e => setNewMeeting({ ...newMeeting, meetingDate: e.target.value })} /></div>
                        <div className={styles.formGroup}><label>Type</label><select className={styles.select} value={newMeeting.meetingType} onChange={e => setNewMeeting({ ...newMeeting, meetingType: e.target.value as Meeting['meetingType'] })}><option>Internal</option><option>Vendor</option><option>Terminal</option><option>Technical</option><option>Weekly</option></select></div>
                    </div>
                    <div className={styles.formGroup}><label>Participants</label><input className={styles.input} value={newMeeting.participants} onChange={e => setNewMeeting({ ...newMeeting, participants: e.target.value })} placeholder="e.g. John, Alice, Bob" /></div>
                    <div className={styles.formActions}><Button variant="ghost" onClick={() => setIsMeetingAddOpen(false)}>Cancel</Button><Button onClick={handleAddMeeting}>Add Meeting</Button></div>
                </div>
            </Modal>
            <Modal isOpen={!!editMeetingItem} onClose={() => setEditMeetingItem(null)} title="Edit Meeting">
                {editMeetingItem && (
                    <div className={styles.form}>
                        <div className={styles.formGroup}><label>Title</label><input className={styles.input} value={editMeetingItem.title} onChange={e => setEditMeetingItem({ ...editMeetingItem, title: e.target.value })} /></div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}><label>Date</label><input type="date" className={styles.input} value={editMeetingItem.meetingDate} onChange={e => setEditMeetingItem({ ...editMeetingItem, meetingDate: e.target.value })} /></div>
                            <div className={styles.formGroup}><label>Type</label><select className={styles.select} value={editMeetingItem.meetingType} onChange={e => setEditMeetingItem({ ...editMeetingItem, meetingType: e.target.value as Meeting['meetingType'] })}><option>Internal</option><option>Vendor</option><option>Terminal</option><option>Technical</option><option>Weekly</option></select></div>
                        </div>
                        <div className={styles.formGroup}><label>Participants</label><input className={styles.input} value={editMeetingItem.participants} onChange={e => setEditMeetingItem({ ...editMeetingItem, participants: e.target.value })} /></div>
                        <div className={styles.formGroup}><label>Notes</label><textarea className={styles.textarea} value={editMeetingItem.notes || ''} onChange={e => setEditMeetingItem({ ...editMeetingItem, notes: e.target.value })} placeholder="Meeting notes..." rows={2} /></div>
                        <div className={styles.formGroup}><label>📋 Meeting Minutes</label><textarea className={styles.textarea} value={editMeetingItem.minutes || ''} onChange={e => setEditMeetingItem({ ...editMeetingItem, minutes: e.target.value })} placeholder="Detailed meeting minutes, decisions, action items..." rows={6} style={{ borderColor: 'rgba(108,92,231,0.3)' }} /></div>
                        <div className={styles.formActions}><Button variant="ghost" onClick={() => setEditMeetingItem(null)}>Cancel</Button><Button onClick={handleEditMeetingSave}>Save</Button></div>
                    </div>
                )}
            </Modal>

            {/* Add Communication */}
            <Modal isOpen={isCommAddOpen} onClose={() => setIsCommAddOpen(false)} title="Log Communication">
                <div className={styles.form}>
                    <div className={styles.formGroup}><label>Subject *</label><input className={styles.input} value={newComm.subject} onChange={e => setNewComm({ ...newComm, subject: e.target.value })} placeholder="Email subject, call topic..." autoFocus /></div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}><label>Type</label><select className={styles.select} value={newComm.type} onChange={e => setNewComm({ ...newComm, type: e.target.value as CommType })}><option>Email</option><option>Call Note</option><option>Chat Summary</option><option>Vendor Update</option></select></div>
                        <div className={styles.formGroup}><label>Date</label><input type="date" className={styles.input} value={newComm.date} onChange={e => setNewComm({ ...newComm, date: e.target.value })} /></div>
                    </div>
                    <div className={styles.formGroup}><label>Summary</label><textarea className={styles.textarea} value={newComm.summary} onChange={e => setNewComm({ ...newComm, summary: e.target.value })} placeholder="Brief summary..." rows={3} /></div>
                    <div className={styles.formGroup}><label>Link / Reference (Optional)</label><input className={styles.input} value={newComm.linkUrl} onChange={e => setNewComm({ ...newComm, linkUrl: e.target.value })} placeholder="URL to thread, doc, etc." /></div>
                    <div className={styles.formActions}><Button variant="ghost" onClick={() => setIsCommAddOpen(false)}>Cancel</Button><Button onClick={handleAddComm}>Log Comm</Button></div>
                </div>
            </Modal>

            {/* Edit Communication */}
            <Modal isOpen={!!editCommItem} onClose={() => setEditCommItem(null)} title="Edit Communication">
                {editCommItem && (
                    <div className={styles.form}>
                        <div className={styles.formGroup}><label>Subject</label><input className={styles.input} value={editCommItem.subject} onChange={e => setEditCommItem({ ...editCommItem, subject: e.target.value })} /></div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}><label>Type</label><select className={styles.select} value={editCommItem.type} onChange={e => setEditCommItem({ ...editCommItem, type: e.target.value as CommType })}><option>Email</option><option>Call Note</option><option>Chat Summary</option><option>Vendor Update</option></select></div>
                            <div className={styles.formGroup}><label>Date</label><input type="date" className={styles.input} value={editCommItem.date} onChange={e => setEditCommItem({ ...editCommItem, date: e.target.value })} /></div>
                        </div>
                        <div className={styles.formGroup}><label>Summary</label><textarea className={styles.textarea} value={editCommItem.summary} onChange={e => setEditCommItem({ ...editCommItem, summary: e.target.value })} rows={3} /></div>
                        <div className={styles.formGroup}><label>Link / Reference</label><input className={styles.input} value={editCommItem.linkUrl || ''} onChange={e => setEditCommItem({ ...editCommItem, linkUrl: e.target.value })} /></div>
                        <div className={styles.formActions}><Button variant="ghost" onClick={() => setEditCommItem(null)}>Cancel</Button><Button onClick={handleEditCommSave}>Save</Button></div>
                    </div>
                )}
            </Modal>

        </div>
    );
}
