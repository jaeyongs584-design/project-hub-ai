'use client';

import React, { useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { Plus, Mail, Pencil, Trash2 } from 'lucide-react';
import { generateId } from '@/lib/utils';
import { Member } from '@/types';
import styles from './page.module.css';
import { cn } from '@/lib/utils';

const ROLES = ['Project Manager', 'Lead Developer', 'Backend Engineer', 'Frontend Engineer', 'UI/UX Designer', 'QA Engineer', 'DevOps Engineer', 'Data Engineer', 'Business Analyst'];
const TEAMS = ['PMO', 'Engineering', 'Design', 'QA', 'Infrastructure', 'Data', 'Management'];

export default function TeamPage() {
    const { members, addMember, updateMember, deleteMember } = useProject();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editMember, setEditMember] = useState<Member | null>(null);

    const defaultNew = {
        name: '',
        role: ROLES[0],
        email: '',
        team: TEAMS[0],
        timezone: 'UTC+9',
    };
    const [newMember, setNewMember] = useState(defaultNew);

    const handleAdd = () => {
        if (!newMember.name || !newMember.email) return;
        addMember({
            id: generateId('m'),
            name: newMember.name,
            role: newMember.role,
            email: newMember.email,
            team: newMember.team,
            timezone: newMember.timezone,
            status: 'online',
        });
        setNewMember(defaultNew);
        setIsAddOpen(false);
    };

    const handleEditSave = () => {
        if (!editMember) return;
        updateMember(editMember.id, {
            name: editMember.name,
            role: editMember.role,
            email: editMember.email,
            team: editMember.team,
            timezone: editMember.timezone,
        });
        setEditMember(null);
    };

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const renderForm = (data: { name: string; role: string; email: string; team: string; timezone: string }, onChange: (d: typeof data) => void, onSave: () => void, onCancel: () => void, saveLabel: string) => (
        <div className={styles.form}>
            <div className={styles.formGroup}>
                <label>Name *</label>
                <input className={styles.input} value={data.name} onChange={e => onChange({ ...data, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className={styles.formGroup}>
                <label>Email *</label>
                <input className={styles.input} type="email" value={data.email} onChange={e => onChange({ ...data, email: e.target.value })} placeholder="email@company.com" />
            </div>
            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label>Role</label>
                    <select className={styles.select} value={data.role} onChange={e => onChange({ ...data, role: e.target.value })}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className={styles.formGroup}>
                    <label>Team</label>
                    <select className={styles.select} value={data.team} onChange={e => onChange({ ...data, team: e.target.value })}>
                        {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            <div className={styles.formGroup}>
                <label>Timezone</label>
                <input className={styles.input} value={data.timezone} onChange={e => onChange({ ...data, timezone: e.target.value })} placeholder="UTC+9" />
            </div>
            <div className={styles.formActions}>
                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button onClick={onSave}>{saveLabel}</Button>
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Team Directory</h1>
                    <p className={styles.subtitle}>{members.length} members</p>
                </div>
                <Button size="sm" onClick={() => setIsAddOpen(true)}>
                    <Plus size={14} /> Add Member
                </Button>
            </header>

            {members.length === 0 ? (
                <Card>
                    <div className={styles.emptyState}>No team members yet. Click &quot;Add Member&quot; to register your team.</div>
                </Card>
            ) : (
                <div className={styles.grid}>
                    {members.map((member, i) => (
                        <Card key={member.id} className={styles.memberCard} style={{ animationDelay: `${i * 0.05}s` }}>
                            <div className={styles.cardHeader}>
                                <div className={styles.avatarWrapper}>
                                    <div className={styles.avatar}>{getInitials(member.name)}</div>
                                    <div className={cn(
                                        styles.statusDot,
                                        member.status === 'online' && styles.online,
                                        member.status === 'away' && styles.away,
                                        member.status === 'offline' && styles.offline,
                                    )} />
                                </div>
                                <div className={styles.cardActions}>
                                    <button className={styles.actionBtn} onClick={() => setEditMember(member)} title="Edit">
                                        <Pencil size={13} />
                                    </button>
                                    <button className={cn(styles.actionBtn, styles.deleteBtn)} onClick={() => deleteMember(member.id)} title="Delete">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                            <h3 className={styles.name}>{member.name}</h3>
                            <p className={styles.role}>{member.role}</p>
                            <div className={styles.info}>
                                <span className={styles.teamBadge}>{member.team}</span>
                                <span className={styles.tz}>{member.timezone}</span>
                            </div>
                            <a className={styles.emailBtn} href={`mailto:${member.email}`}>
                                <Mail size={14} /> {member.email}
                            </a>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Team Member">
                {renderForm(newMember, setNewMember, handleAdd, () => setIsAddOpen(false), 'Add Member')}
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={!!editMember} onClose={() => setEditMember(null)} title="Edit Team Member">
                {editMember && renderForm(
                    editMember,
                    (d) => setEditMember({ ...editMember, ...d }),
                    handleEditSave,
                    () => setEditMember(null),
                    'Save Changes'
                )}
            </Modal>
        </div>
    );
}
