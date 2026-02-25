'use client';

import React, { useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { FileText, ExternalLink, Plus, FolderOpen, Trash2 } from 'lucide-react';
import styles from './page.module.css';
import { cn } from '@/lib/utils';
import { DocumentLink } from '@/types';
import { generateId } from '@/lib/utils';

const CATEGORY_ICONS: Record<string, string> = {
    Plan: styles.iconPlan,
    Requirements: styles.iconRequirements,
    Design: styles.iconDesign,
    Test: styles.iconTest,
    Release: styles.iconRelease,
    Other: styles.iconOther,
};

export default function DocumentsPage() {
    const { documents, addDocument, deleteDocument, tasks, milestones = [], issues } = useProject();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDoc, setNewDoc] = useState({
        title: '',
        url: '',
        category: 'Other' as DocumentLink['category'],
        description: '',
        tagsInput: '',
        relatedTaskId: '',
        relatedMilestoneId: '',
        relatedIssueId: '',
    });

    const categories = Array.from(new Set(documents.map(d => d.category)));

    const handleOpen = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleAddDocument = () => {
        if (!newDoc.title || !newDoc.url) return;
        const tags = newDoc.tagsInput.split(',').map(t => t.trim()).filter(Boolean);
        const doc: DocumentLink = {
            id: generateId('d'),
            title: newDoc.title,
            url: newDoc.url,
            category: newDoc.category,
            description: newDoc.description,
            tags: tags.length > 0 ? tags : undefined,
            relatedTaskId: newDoc.relatedTaskId || undefined,
            relatedMilestoneId: newDoc.relatedMilestoneId || undefined,
            relatedIssueId: newDoc.relatedIssueId || undefined,
            updatedAt: new Date().toISOString().split('T')[0],
        };
        addDocument(doc);
        setNewDoc({ title: '', url: '', category: 'Other', description: '', tagsInput: '', relatedTaskId: '', relatedMilestoneId: '', relatedIssueId: '' });
        setIsModalOpen(false);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Document Hub</h1>
                    <p className={styles.subtitle}>Central repository for project documentation ({documents.length} links)</p>
                </div>
                <Button size="sm" onClick={() => setIsModalOpen(true)}>
                    <Plus size={14} /> Add Link
                </Button>
            </header>

            <div className={styles.categories}>
                {categories.map(category => (
                    <div key={category} className={styles.categorySection}>
                        <h2 className={styles.categoryTitle}>
                            <span className={cn(styles.categoryIcon, category && CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ? CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] : styles.iconOther)}>
                                <FolderOpen size={14} />
                            </span>
                            {category}
                        </h2>
                        <div className={styles.cardGrid}>
                            {documents.filter(d => d.category === category).map(doc => (
                                <Card
                                    key={doc.id}
                                    className={styles.docCard}
                                    onClick={() => handleOpen(doc.url)}
                                >
                                    <div className={styles.iconWrapper}>
                                        <FileText size={20} />
                                    </div>
                                    <div className={styles.docInfo} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <h3 className={styles.docTitle}>{doc.title}</h3>
                                        {doc.description && <p className={styles.docDesc}>{doc.description}</p>}

                                        {(doc.tags && doc.tags.length > 0) && (
                                            <div className={styles.tagContainer}>
                                                {doc.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
                                            </div>
                                        )}

                                        {(doc.relatedTaskId || doc.relatedMilestoneId || doc.relatedIssueId) && (
                                            <div className={styles.relations}>
                                                {doc.relatedTaskId && <span className={styles.relationPill}>Task: {tasks.find(t => t.id === doc.relatedTaskId)?.title || doc.relatedTaskId}</span>}
                                                {doc.relatedMilestoneId && <span className={styles.relationPill}>Milestone: {milestones.find(m => m.id === doc.relatedMilestoneId)?.title || doc.relatedMilestoneId}</span>}
                                                {doc.relatedIssueId && <span className={styles.relationPill}>Issue: {issues.find(i => i.id === doc.relatedIssueId)?.title || doc.relatedIssueId}</span>}
                                            </div>
                                        )}

                                        <p className={styles.docMeta}>Updated: {doc.updatedAt}</p>
                                    </div>
                                    <div className={styles.openBtn} style={{ display: 'flex', gap: '0.25rem', top: '1rem', right: '1rem' }}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpen(doc.url);
                                            }}
                                            title="Open Document"
                                            style={{ padding: '0.25rem', height: 'auto' }}
                                        >
                                            <ExternalLink size={16} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Are you sure you want to delete this document link?')) {
                                                    deleteDocument(doc.id);
                                                }
                                            }}
                                            title="Delete Document"
                                            style={{ padding: '0.25rem', height: 'auto', color: 'var(--accent-red)' }}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Document Link">
                <div className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Title</label>
                        <input className={styles.input} value={newDoc.title} onChange={e => setNewDoc({ ...newDoc, title: e.target.value })} placeholder="Document name" />
                    </div>
                    <div className={styles.formGroup}>
                        <label>URL</label>
                        <input className={styles.input} type="url" value={newDoc.url} onChange={e => setNewDoc({ ...newDoc, url: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Category</label>
                            <select className={styles.select} value={newDoc.category} onChange={e => setNewDoc({ ...newDoc, category: e.target.value as DocumentLink['category'] })}>
                                <option value="Plan">Plan</option>
                                <option value="Requirements">Requirements</option>
                                <option value="Design">Design</option>
                                <option value="Test">Test</option>
                                <option value="Release">Release</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <input className={styles.input} value={newDoc.description} onChange={e => setNewDoc({ ...newDoc, description: e.target.value })} placeholder="Optional description" />
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Tags (Comma separated)</label>
                            <input className={styles.input} value={newDoc.tagsInput} onChange={e => setNewDoc({ ...newDoc, tagsInput: e.target.value })} placeholder="e.g. Architecture, V2" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Related Task</label>
                            <select className={styles.select} value={newDoc.relatedTaskId} onChange={e => setNewDoc({ ...newDoc, relatedTaskId: e.target.value })}>
                                <option value="">— None —</option>
                                {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Related Milestone</label>
                            <select className={styles.select} value={newDoc.relatedMilestoneId} onChange={e => setNewDoc({ ...newDoc, relatedMilestoneId: e.target.value })}>
                                <option value="">— None —</option>
                                {milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Related Issue</label>
                            <select className={styles.select} value={newDoc.relatedIssueId} onChange={e => setNewDoc({ ...newDoc, relatedIssueId: e.target.value })}>
                                <option value="">— None —</option>
                                {issues.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className={styles.formActions}>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddDocument}>Add Link</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
