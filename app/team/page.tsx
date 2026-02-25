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

const COUNTRIES: { name: string; tz: string; offset: string }[] = [
    { name: 'South Korea', tz: 'Asia/Seoul', offset: 'UTC+9' },
    { name: 'Japan', tz: 'Asia/Tokyo', offset: 'UTC+9' },
    { name: 'China', tz: 'Asia/Shanghai', offset: 'UTC+8' },
    { name: 'Singapore', tz: 'Asia/Singapore', offset: 'UTC+8' },
    { name: 'India', tz: 'Asia/Kolkata', offset: 'UTC+5:30' },
    { name: 'UAE', tz: 'Asia/Dubai', offset: 'UTC+4' },
    { name: 'Saudi Arabia', tz: 'Asia/Riyadh', offset: 'UTC+3' },
    { name: 'Germany', tz: 'Europe/Berlin', offset: 'UTC+1' },
    { name: 'UK', tz: 'Europe/London', offset: 'UTC+0' },
    { name: 'France', tz: 'Europe/Paris', offset: 'UTC+1' },
    { name: 'Netherlands', tz: 'Europe/Amsterdam', offset: 'UTC+1' },
    { name: 'Italy', tz: 'Europe/Rome', offset: 'UTC+1' },
    { name: 'US (East)', tz: 'America/New_York', offset: 'UTC-5' },
    { name: 'US (Pacific)', tz: 'America/Los_Angeles', offset: 'UTC-8' },
    { name: 'Australia', tz: 'Australia/Sydney', offset: 'UTC+11' },
    { name: 'Brazil', tz: 'America/Sao_Paulo', offset: 'UTC-3' },
    { name: 'Canada', tz: 'America/Toronto', offset: 'UTC-5' },
    { name: 'Mexico', tz: 'America/Mexico_City', offset: 'UTC-6' },
];

const getLocalTime = (tz: string) => {
    try {
        return new Date().toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
        return '';
    }
};

export default function TeamPage() {
    const { members, addMember, updateMember, deleteMember } = useProject();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editMember, setEditMember] = useState<Member | null>(null);

    const defaultNew: { name: string; role: string; email: string; company?: string; country: string; timezone?: string } = {
        name: '',
        role: ROLES[0],
        email: '',
        company: TEAMS[0],
        country: 'South Korea',
    };
    const [newMember, setNewMember] = useState(defaultNew);

    const getCountryInfo = (countryName: string) => COUNTRIES.find(c => c.name === countryName) || COUNTRIES[0];

    const handleAdd = () => {
        if (!newMember.name || !newMember.email) return;
        let tz: string;
        if (newMember.country === 'Other') {
            tz = (newMember as typeof newMember & { timezone?: string }).timezone || 'UTC';
        } else {
            const ci = getCountryInfo(newMember.country);
            tz = `${ci.name} (${ci.offset})`;
        }
        addMember({
            id: generateId('m'),
            name: newMember.name,
            role: newMember.role,
            email: newMember.email,
            company: newMember.company,
            timezone: tz,
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
            company: editMember.company,
            timezone: editMember.timezone,
        });
        setEditMember(null);
    };

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    // Extract country from timezone string like "South Korea (UTC+9)"
    const extractCountry = (tz: string) => {
        if (!tz) return 'South Korea';
        const match = tz.match(/^(.+?)\s*\(/);
        if (match && COUNTRIES.find(c => c.name === match[1])) {
            return match[1];
        }
        // If it doesn't match a known country list format, treat it as 'Other'
        if (COUNTRIES.find(c => c.name === tz)) return tz;
        return 'Other';
    };

    const renderForm = (
        data: { name: string; role: string; email: string; company?: string; country: string; timezone?: string },
        onChange: (d: { name: string; role: string; email: string; company?: string; country: string; timezone?: string }) => void,
        onSave: () => void,
        onCancel: () => void,
        saveLabel: string,
        isEdit = false,
    ) => {
        const selectedCountry = data.country || 'South Korea';
        const isOther = selectedCountry === 'Other';
        const countryInfo = isOther ? { tz: 'UTC', offset: '' } : getCountryInfo(selectedCountry);
        const localTime = getLocalTime(countryInfo.tz);

        return (
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
                        <label className={styles.label}>Company/Team</label>
                        <select className={styles.select} value={data.company || ''} onChange={e => onChange({ ...data, company: e.target.value })}>
                            {TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
                        </select>
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label>Country / Timezone</label>
                    <select className={styles.select} value={selectedCountry} onChange={e => {
                        const val = e.target.value;
                        onChange({ ...data, country: val, timezone: val === 'Other' ? data.timezone : `${getCountryInfo(val).name} (${getCountryInfo(val).offset})` });
                    }}>
                        {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name} ({c.offset})</option>)}
                        <option value="Other">Other (manual input)</option>
                    </select>
                    {isOther ? (
                        <input className={styles.input} value={data.timezone || ''} onChange={e => onChange({ ...data, timezone: e.target.value })} placeholder="e.g. UTC+5:30 or Asia/Kolkata" style={{ marginTop: '0.375rem' }} />
                    ) : localTime ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', marginTop: '0.25rem', display: 'block' }}>
                            🕐 Current local time: {localTime}
                        </span>
                    ) : null}
                </div>
                <div className={styles.formActions}>
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button onClick={onSave}>{saveLabel}</Button>
                </div>
            </div>
        );
    };

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
                    {members.map((member, i) => {
                        const country = extractCountry(member.timezone || '');
                        const ci = getCountryInfo(country);
                        const localTime = getLocalTime(ci.tz);
                        return (
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
                                        <button className={styles.actionBtn} onClick={() => setEditMember({ ...member, timezone: member.timezone })} title="Edit">
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
                                    <span className={styles.teamBadge}>{member.company || 'N/A'}</span>
                                    <span className={styles.tz}>{member.timezone}</span>
                                </div>
                                {localTime && (
                                    <div style={{ fontSize: '0.6875rem', color: 'var(--foreground-muted)', marginTop: '0.25rem' }}>
                                        🕐 {localTime}
                                    </div>
                                )}
                                <a className={styles.emailBtn} href={`mailto:${member.email}`}>
                                    <Mail size={14} /> {member.email}
                                </a>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Add Modal */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Team Member">
                {renderForm(newMember, setNewMember, handleAdd, () => setIsAddOpen(false), 'Add Member')}
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={!!editMember} onClose={() => setEditMember(null)} title="Edit Team Member">
                {editMember && renderForm(
                    { name: editMember.name, role: editMember.role, email: editMember.email, company: editMember.company, country: extractCountry(editMember.timezone || ''), timezone: editMember.timezone || '' },
                    (d) => {
                        let tz = d.timezone || '';
                        if (d.country !== 'Other') {
                            const ci = getCountryInfo(d.country || 'South Korea');
                            tz = `${ci.name} (${ci.offset})`;
                        }
                        setEditMember({ ...editMember, ...d, timezone: tz });
                    },
                    handleEditSave,
                    () => setEditMember(null),
                    'Save Changes',
                    true
                )}
            </Modal>
        </div>
    );
}
