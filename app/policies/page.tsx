'use client';

import React, { useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { FileText, ChevronRight, Plus, Pencil, Trash2, Save } from 'lucide-react';
import styles from './page.module.css';
import { cn, generateId } from '@/lib/utils';
import { ProjectPolicy } from '@/types';

export default function PoliciesPage() {
    const { policies, addPolicy, updatePolicy, deletePolicy } = useProject();
    const [selectedPolicyId, setSelectedPolicyId] = useState(policies[0]?.id);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [editTitle, setEditTitle] = useState('');

    const [newPolicy, setNewPolicy] = useState({ title: '', content: '' });

    const selectedPolicy = policies.find(p => p.id === selectedPolicyId);

    const handleAdd = () => {
        if (!newPolicy.title || !newPolicy.content) return;
        const policy: ProjectPolicy = {
            id: generateId('p'),
            title: newPolicy.title,
            content: newPolicy.content,
            lastUpdated: new Date().toISOString().split('T')[0],
        };
        addPolicy(policy);
        setSelectedPolicyId(policy.id);
        setNewPolicy({ title: '', content: '' });
        setIsAddOpen(false);
    };

    const startEdit = () => {
        if (!selectedPolicy) return;
        setEditTitle(selectedPolicy.title);
        setEditContent(selectedPolicy.content);
        setIsEditing(true);
    };

    const saveEdit = () => {
        if (!selectedPolicy) return;
        updatePolicy(selectedPolicy.id, {
            title: editTitle,
            content: editContent,
            lastUpdated: new Date().toISOString().split('T')[0],
        });
        setIsEditing(false);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deletePolicy(id);
        if (selectedPolicyId === id) {
            const remaining = policies.filter(p => p.id !== id);
            setSelectedPolicyId(remaining[0]?.id);
        }
    };

    const renderMarkdown = (content: string) => {
        return content.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('## ')) return <h2 key={i}>{trimmed.replace('## ', '')}</h2>;
            if (trimmed.startsWith('### ')) return <h3 key={i}>{trimmed.replace('### ', '')}</h3>;
            if (trimmed.startsWith('- ')) {
                const text = trimmed.replace('- ', '');
                const boldMatch = text.match(/\*\*(.+?)\*\*(.+)/);
                if (boldMatch) return <li key={i}><strong>{boldMatch[1]}</strong>{boldMatch[2]}</li>;
                if (text.startsWith('[ ] ')) return <li key={i} style={{ listStyleType: 'none', marginLeft: '-1rem' }}>☐ {text.replace('[ ] ', '')}</li>;
                if (text.startsWith('[x] ')) return <li key={i} style={{ listStyleType: 'none', marginLeft: '-1rem', color: 'var(--success)' }}>☑ {text.replace('[x] ', '')}</li>;
                return <li key={i}>{text}</li>;
            }
            if (trimmed === '') return <br key={i} />;
            const parts = trimmed.split(/\*\*(.+?)\*\*/g);
            if (parts.length > 1) return <p key={i}>{parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}</p>;
            return <p key={i}>{trimmed}</p>;
        });
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Project Policies</h1>
                <p className={styles.subtitle}>Standard operating procedures and guidelines</p>
            </header>

            <div className={styles.content}>
                <div className={styles.sidebar}>
                    {policies.map(policy => (
                        <div
                            key={policy.id}
                            className={cn(styles.navItem, selectedPolicyId === policy.id && styles.active)}
                            onClick={() => { setSelectedPolicyId(policy.id); setIsEditing(false); }}
                        >
                            <FileText size={16} className={styles.navIcon} />
                            <span className={styles.navLabel}>{policy.title}</span>
                            <button
                                className={styles.navDeleteBtn}
                                onClick={(e) => handleDelete(policy.id, e)}
                                title="Delete"
                            >
                                <Trash2 size={12} />
                            </button>
                            <ChevronRight size={14} className={styles.chevron} />
                        </div>
                    ))}
                    <button className={styles.addBtn} onClick={() => setIsAddOpen(true)}>
                        <Plus size={14} /> Add Policy
                    </button>
                </div>

                <Card className={styles.viewer}>
                    {selectedPolicy ? (
                        <div style={{ padding: '1.5rem' }}>
                            <div className={styles.viewerHeader}>
                                {isEditing ? (
                                    <input
                                        className={styles.editTitleInput}
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                    />
                                ) : (
                                    <h2 className={styles.viewerTitle}>{selectedPolicy.title}</h2>
                                )}
                                <div className={styles.viewerActions}>
                                    <span className={styles.date}>Updated: {selectedPolicy.lastUpdated}</span>
                                    {isEditing ? (
                                        <Button size="sm" onClick={saveEdit}>
                                            <Save size={14} /> Save
                                        </Button>
                                    ) : (
                                        <Button variant="ghost" size="sm" onClick={startEdit}>
                                            <Pencil size={14} /> Edit
                                        </Button>
                                    )}
                                </div>
                            </div>
                            {isEditing ? (
                                <textarea
                                    className={styles.editTextarea}
                                    value={editContent}
                                    onChange={e => setEditContent(e.target.value)}
                                />
                            ) : (
                                <div className={styles.body}>
                                    {renderMarkdown(selectedPolicy.content)}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.empty}>
                            {policies.length === 0
                                ? 'No policies yet. Click "Add Policy" to create one.'
                                : 'Select a policy to view guidelines'}
                        </div>
                    )}
                </Card>
            </div>

            {/* Add Policy Modal */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Policy">
                <div className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Title *</label>
                        <input className={styles.input} value={newPolicy.title} onChange={e => setNewPolicy({ ...newPolicy, title: e.target.value })} placeholder="Policy title" />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Content * (Markdown supported)</label>
                        <textarea className={styles.editTextarea} value={newPolicy.content} onChange={e => setNewPolicy({ ...newPolicy, content: e.target.value })} placeholder="## Section Title&#10;- Item one&#10;- Item two" />
                    </div>
                    <div className={styles.formActions}>
                        <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdd}>Add Policy</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
