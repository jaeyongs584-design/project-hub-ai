'use client';

import React, { useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { FileText, ExternalLink, Plus, FolderOpen } from 'lucide-react';
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
    const { documents, addDocument } = useProject();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDoc, setNewDoc] = useState({
        title: '',
        url: '',
        category: 'Other' as DocumentLink['category'],
        description: '',
    });

    const categories = Array.from(new Set(documents.map(d => d.category)));

    const handleOpen = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleAddDocument = () => {
        if (!newDoc.title || !newDoc.url) return;
        const doc: DocumentLink = {
            id: generateId('d'),
            title: newDoc.title,
            url: newDoc.url,
            category: newDoc.category,
            description: newDoc.description,
            updatedAt: new Date().toISOString().split('T')[0],
        };
        addDocument(doc);
        setNewDoc({ title: '', url: '', category: 'Other', description: '' });
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
                            <span className={cn(styles.categoryIcon, CATEGORY_ICONS[category] || styles.iconOther)}>
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
                                    <div className={styles.docInfo}>
                                        <h3 className={styles.docTitle}>{doc.title}</h3>
                                        {doc.description && <p className={styles.docDesc}>{doc.description}</p>}
                                        <p className={styles.docMeta}>Updated: {doc.updatedAt}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={styles.openBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpen(doc.url);
                                        }}
                                    >
                                        <ExternalLink size={16} />
                                    </Button>
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
                    <div className={styles.formActions}>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddDocument}>Add Link</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
