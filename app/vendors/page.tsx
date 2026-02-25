'use client';

import React, { useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { Briefcase, FileText, Plus, ExternalLink, Calendar as CalendarIcon, Edit2, Trash2, Mail, Phone, DollarSign } from 'lucide-react';
import styles from './page.module.css';
import { cn, generateId } from '@/lib/utils';
import { Vendor, Procurement, VendorStatus, ProcurementStatus } from '@/types';

type TabView = 'vendors' | 'procurement';

export default function VendorsPage() {
    const {
        vendors = [],
        procurements = [],
        addVendor,
        updateVendor,
        deleteVendor,
        addProcurement,
        updateProcurement,
        deleteProcurement,
        milestones = []
    } = useProject();

    const [activeTab, setActiveTab] = useState<TabView>('vendors');

    // Vendor Modal
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [editVendorId, setEditVendorId] = useState<string | null>(null);
    const [vendorForm, setVendorForm] = useState<Partial<Vendor>>({
        name: '', serviceType: '', contactName: '', contactEmail: '', contactPhone: '', status: 'Active', notes: ''
    });

    // Procurement Modal
    const [isProcModalOpen, setIsProcModalOpen] = useState(false);
    const [editProcId, setEditProcId] = useState<string | null>(null);
    const [procForm, setProcForm] = useState<Partial<Procurement>>({
        title: '', vendorId: '', contractAmount: 0, description: '', startDate: '', endDate: '', status: 'Planned', relatedMilestoneId: ''
    });

    const today = new Date().toISOString().split('T')[0];

    // --- Vendor Handlers ---
    const openVendorModal = (vendor?: Vendor) => {
        if (vendor) {
            setEditVendorId(vendor.id);
            setVendorForm(vendor);
        } else {
            setEditVendorId(null);
            setVendorForm({ name: '', serviceType: '', contactName: '', contactEmail: '', contactPhone: '', status: 'Active', notes: '' });
        }
        setIsVendorModalOpen(true);
    };

    const handleSaveVendor = () => {
        if (!vendorForm.name || !vendorForm.serviceType) return;
        if (editVendorId) {
            updateVendor(editVendorId, { ...vendorForm, updatedAt: today });
        } else {
            addVendor({
                id: generateId('ven'),
                name: vendorForm.name,
                serviceType: vendorForm.serviceType,
                contactName: vendorForm.contactName,
                contactEmail: vendorForm.contactEmail,
                contactPhone: vendorForm.contactPhone,
                status: vendorForm.status as VendorStatus || 'Active',
                notes: vendorForm.notes,
                createdAt: today,
                updatedAt: today
            });
        }
        setIsVendorModalOpen(false);
    };

    // --- Procurement Handlers ---
    const openProcModal = (proc?: Procurement) => {
        if (proc) {
            setEditProcId(proc.id);
            setProcForm(proc);
        } else {
            setEditProcId(null);
            setProcForm({ title: '', vendorId: '', contractAmount: 0, description: '', startDate: '', endDate: '', status: 'Planned', relatedMilestoneId: '' });
        }
        setIsProcModalOpen(true);
    };

    const handleSaveProcurement = () => {
        if (!procForm.title || !procForm.vendorId) return;
        if (editProcId) {
            updateProcurement(editProcId, { ...procForm, updatedAt: today });
        } else {
            addProcurement({
                id: generateId('proc'),
                title: procForm.title,
                vendorId: procForm.vendorId,
                contractAmount: Number(procForm.contractAmount) || 0,
                description: procForm.description,
                startDate: procForm.startDate,
                endDate: procForm.endDate,
                status: procForm.status as ProcurementStatus || 'Planned',
                relatedMilestoneId: procForm.relatedMilestoneId,
                createdAt: today,
                updatedAt: today
            });
        }
        setIsProcModalOpen(false);
    };


    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Vendors & Procurement</h1>
                    <p className={styles.subtitle}>Manage external vendors and related contracts</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button onClick={() => openVendorModal()}>
                        <Plus size={16} /> Add Vendor
                    </Button>
                    <Button variant="outline" onClick={() => openProcModal()}>
                        <Plus size={16} /> New Contract
                    </Button>
                </div>
            </header>

            <div className={styles.tabs}>
                <button
                    className={cn(styles.tabBtn, activeTab === 'vendors' && styles.tabActive)}
                    onClick={() => setActiveTab('vendors')}
                >
                    <Briefcase size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Vendors ({vendors.length})
                </button>
                <button
                    className={cn(styles.tabBtn, activeTab === 'procurement' && styles.tabActive)}
                    onClick={() => setActiveTab('procurement')}
                >
                    <FileText size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Procurements ({procurements.length})
                </button>
            </div>

            {/* Vendors View */}
            {activeTab === 'vendors' && (
                <div className={styles.list}>
                    {vendors.length === 0 ? (
                        <div className={styles.emptyState}>
                            No vendors registered yet. Click &quot;Add Vendor&quot; to start.
                        </div>
                    ) : (
                        vendors.map(v => (
                            <Card key={v.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h3 className={styles.cardTitle}>
                                            {v.name}
                                            <span style={{ marginLeft: '0.5rem' }}>
                                                <Badge variant={v.status === 'Active' ? 'success' : 'neutral'}>{v.status}</Badge>
                                            </span>
                                        </h3>
                                        <div className={styles.cardMeta}>
                                            <span><Briefcase size={14} /> {v.serviceType}</span>
                                            {v.contactEmail && <span><Mail size={14} /> {v.contactEmail}</span>}
                                            {v.contactPhone && <span><Phone size={14} /> {v.contactPhone}</span>}
                                        </div>
                                    </div>
                                    <div className={styles.actions}>
                                        <button className={styles.iconBtn} onClick={() => openVendorModal(v)} title="Edit Vendor">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className={cn(styles.iconBtn, styles.deleteBtn)} onClick={() => deleteVendor(v.id)} title="Delete Vendor">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                {v.notes && <p style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)', margin: 0, marginTop: '0.5rem' }}>{v.notes}</p>}
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Procurements View */}
            {activeTab === 'procurement' && (
                <div className={styles.list}>
                    {procurements.length === 0 ? (
                        <div className={styles.emptyState}>
                            No procurements or contracts registered.
                        </div>
                    ) : (
                        procurements.map(p => {
                            const relatedVendor = vendors.find(v => v.id === p.vendorId);
                            return (
                                <Card key={p.id} className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <div>
                                            <h3 className={styles.cardTitle}>
                                                {p.title}
                                                <span style={{ marginLeft: '0.5rem' }}>
                                                    <Badge variant={p.status === 'Awarded' || p.status === 'Closed' ? 'success' : 'neutral'}>{p.status}</Badge>
                                                </span>
                                            </h3>
                                            <div className={styles.cardMeta}>
                                                <span><Briefcase size={14} /> Vendor: {relatedVendor?.name || 'Unknown'}</span>
                                                <span><DollarSign size={14} /> ${p.contractAmount.toLocaleString()}</span>
                                                {(p.startDate || p.endDate) && <span><CalendarIcon size={14} /> {p.startDate || '?'} ~ {p.endDate || '?'}</span>}
                                            </div>
                                        </div>
                                        <div className={styles.actions}>
                                            <button className={styles.iconBtn} onClick={() => openProcModal(p)} title="Edit Procurement">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className={cn(styles.iconBtn, styles.deleteBtn)} onClick={() => deleteProcurement(p.id)} title="Delete Procurement">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {p.description && <p style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)', margin: 0, marginTop: '0.5rem' }}>{p.description}</p>}
                                </Card>
                            )
                        })
                    )}
                </div>
            )}

            {/* Vendor Modal */}
            <Modal isOpen={isVendorModalOpen} onClose={() => setIsVendorModalOpen(false)} title={editVendorId ? "Edit Vendor" : "Add Vendor"}>
                <div className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Vendor Name *</label>
                        <input className={styles.input} value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} placeholder="e.g. Acme Corp" />
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Service Type *</label>
                            <input className={styles.input} value={vendorForm.serviceType} onChange={e => setVendorForm({ ...vendorForm, serviceType: e.target.value })} placeholder="e.g. Cloud Hosting" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Status</label>
                            <select className={styles.select} value={vendorForm.status} onChange={e => setVendorForm({ ...vendorForm, status: e.target.value as VendorStatus })}>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Contact Name</label>
                            <input className={styles.input} value={vendorForm.contactName} onChange={e => setVendorForm({ ...vendorForm, contactName: e.target.value })} placeholder="Primary contact" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Contact Email</label>
                            <input className={styles.input} type="email" value={vendorForm.contactEmail} onChange={e => setVendorForm({ ...vendorForm, contactEmail: e.target.value })} placeholder="email@example.com" />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Notes</label>
                        <textarea className={styles.textarea} value={vendorForm.notes} onChange={e => setVendorForm({ ...vendorForm, notes: e.target.value })} placeholder="Additional information..." />
                    </div>
                    <div className={styles.formActions}>
                        <Button variant="ghost" onClick={() => setIsVendorModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveVendor}>Save Vendor</Button>
                    </div>
                </div>
            </Modal>

            {/* Procurement Modal */}
            <Modal isOpen={isProcModalOpen} onClose={() => setIsProcModalOpen(false)} title={editProcId ? "Edit Procurement" : "New Contract"}>
                <div className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Contract Title *</label>
                        <input className={styles.input} value={procForm.title} onChange={e => setProcForm({ ...procForm, title: e.target.value })} placeholder="e.g. Server Licensing 2026" />
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Vendor *</label>
                            <select className={styles.select} value={procForm.vendorId} onChange={e => setProcForm({ ...procForm, vendorId: e.target.value })}>
                                <option value="">— Select Vendor —</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Contract Amount ($)</label>
                            <input className={styles.input} type="number" value={procForm.contractAmount} onChange={e => setProcForm({ ...procForm, contractAmount: Number(e.target.value) })} placeholder="0" />
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Status</label>
                            <select className={styles.select} value={procForm.status} onChange={e => setProcForm({ ...procForm, status: e.target.value as ProcurementStatus })}>
                                <option value="Planned">Planned</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Awarded">Awarded</option>
                                <option value="Closed">Closed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Related Milestone</label>
                            <select className={styles.select} value={procForm.relatedMilestoneId} onChange={e => setProcForm({ ...procForm, relatedMilestoneId: e.target.value })}>
                                <option value="">— None —</option>
                                {milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Start Date</label>
                            <input className={styles.input} type="date" value={procForm.startDate} onChange={e => setProcForm({ ...procForm, startDate: e.target.value })} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>End Date</label>
                            <input className={styles.input} type="date" value={procForm.endDate} onChange={e => setProcForm({ ...procForm, endDate: e.target.value })} />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea className={styles.textarea} value={procForm.description} onChange={e => setProcForm({ ...procForm, description: e.target.value })} placeholder="Scope details..." />
                    </div>
                    <div className={styles.formActions}>
                        <Button variant="ghost" onClick={() => setIsProcModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveProcurement}>Save Contract</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
