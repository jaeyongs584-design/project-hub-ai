'use client';

import React, { useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { Server, Package, Plus, MapPin, Hash, ExternalLink, Edit2, Trash2, Clock, Wrench, Download, Upload } from 'lucide-react';
import styles from './page.module.css';
import { cn, generateId } from '@/lib/utils';
import { Asset, SystemRegister, AssetStatus, SystemStatus } from '@/types';
import { toast } from 'sonner';

type TabView = 'assets' | 'systems';

export default function AssetsPage() {
    const {
        assets = [],
        systems = [],
        members = [],
        vendors = [],
        addAsset,
        updateAsset,
        deleteAsset,
        addSystem,
        updateSystem,
        deleteSystem
    } = useProject();

    const [activeTab, setActiveTab] = useState<TabView>('assets');

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('All');

    // Asset Modal
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [editAssetId, setEditAssetId] = useState<string | null>(null);
    const [assetForm, setAssetForm] = useState<Partial<Asset>>({
        tag: '', name: '', model: '', serialNumber: '', location: '', ownerId: '', status: 'Active', purchaseDate: '', notes: ''
    });

    // System Modal
    const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
    const [editSystemId, setEditSystemId] = useState<string | null>(null);
    const [systemForm, setSystemForm] = useState<Partial<SystemRegister>>({
        name: '', version: '', environment: 'Production', status: 'Online', vendorId: '', url: '', notes: ''
    });

    const today = new Date().toISOString().split('T')[0];

    // --- Asset Handlers ---
    const openAssetModal = (asset?: Asset) => {
        if (asset) {
            setEditAssetId(asset.id);
            setAssetForm(asset);
        } else {
            setEditAssetId(null);
            setAssetForm({ tag: '', name: '', model: '', serialNumber: '', location: '', ownerId: '', status: 'Active', purchaseDate: '', notes: '' });
        }
        setIsAssetModalOpen(true);
    };

    const handleSaveAsset = () => {
        if (!assetForm.tag || !assetForm.name || !assetForm.location) return;
        if (editAssetId) {
            updateAsset(editAssetId, { ...assetForm, updatedAt: today });
        } else {
            addAsset({
                id: generateId('ast'),
                tag: assetForm.tag,
                name: assetForm.name,
                model: assetForm.model,
                serialNumber: assetForm.serialNumber,
                location: assetForm.location,
                ownerId: assetForm.ownerId,
                status: assetForm.status as AssetStatus || 'Active',
                purchaseDate: assetForm.purchaseDate,
                notes: assetForm.notes,
                createdAt: today,
                updatedAt: today
            });
        }
        setIsAssetModalOpen(false);
    };

    // --- System Handlers ---
    const openSystemModal = (system?: SystemRegister) => {
        if (system) {
            setEditSystemId(system.id);
            setSystemForm(system);
        } else {
            setEditSystemId(null);
            setSystemForm({ name: '', version: '', environment: 'Production', status: 'Online', vendorId: '', url: '', notes: '' });
        }
        setIsSystemModalOpen(true);
    };

    const handleSaveSystem = () => {
        if (!systemForm.name || !systemForm.environment) return;
        if (editSystemId) {
            updateSystem(editSystemId, { ...systemForm, updatedAt: today, lastChecked: today });
        } else {
            addSystem({
                id: generateId('sys'),
                name: systemForm.name,
                version: systemForm.version,
                environment: systemForm.environment as 'Production' | 'Staging' | 'Test' | 'Development',
                status: systemForm.status as SystemStatus || 'Online',
                vendorId: systemForm.vendorId,
                url: systemForm.url,
                notes: systemForm.notes,
                lastChecked: today,
                createdAt: today,
                updatedAt: today
            });
        }
        setIsSystemModalOpen(false);
    };

    // --- Import / Export ---
    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const rows = [];
                let row = [];
                let inQuotes = false;
                let val = '';
                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        row.push(val);
                        val = '';
                    } else if (char === '\n' && !inQuotes) {
                        row.push(val);
                        rows.push(row);
                        row = [];
                        val = '';
                    } else if (char !== '\r') {
                        val += char;
                    }
                }
                if (val || row.length > 0) {
                    row.push(val);
                    rows.push(row);
                }

                const hasHeader = rows[0] && rows[0].join(',').toLowerCase().includes('tag');
                const dataLines = hasHeader ? rows.slice(1) : rows;

                let count = 0;
                dataLines.forEach(line => {
                    if (line.length < 3) return; // Need at least tag, name, location
                    const [tag, name, model, serialNumber, location, status, purchaseDate, notes] = line;
                    if (tag?.trim() && name?.trim() && location?.trim()) {
                        addAsset({
                            id: generateId('ast'),
                            tag: tag.trim(),
                            name: name.trim(),
                            model: model?.trim() || '',
                            serialNumber: serialNumber?.trim() || '',
                            location: location.trim(),
                            ownerId: '',
                            status: (status?.trim() as AssetStatus) || 'Active',
                            purchaseDate: purchaseDate?.trim() || '',
                            notes: notes?.trim() || '',
                            createdAt: today,
                            updatedAt: today
                        });
                        count++;
                    }
                });
                toast.success(`Imported ${count} assets from CSV`);
            } catch (err) {
                console.error(err);
                toast.error('Failed to parse CSV file');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleExportCSV = () => {
        const headers = ['Tag', 'Name', 'Model', 'Serial Number', 'Location', 'Status', 'Purchase Date', 'Notes'];
        const escapeCSV = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
        const rows = assets.map(a => [
            escapeCSV(a.tag), escapeCSV(a.name), escapeCSV(a.model || ''), escapeCSV(a.serialNumber || ''),
            escapeCSV(a.location), escapeCSV(a.status), escapeCSV(a.purchaseDate || ''), escapeCSV(a.notes || '')
        ]);
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "assets_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Filtering ---
    const filteredAssets = assets.filter(a => statusFilter === 'All' || a.status === statusFilter);
    const filteredSystems = systems.filter(s => statusFilter === 'All' || s.status === statusFilter);

    // --- Render Helpers ---
    const getBadgeVariant = (status: string) => {
        switch (status) {
            case 'Active':
            case 'Online':
                return 'success';
            case 'Under Maintenance':
            case 'Maintenance':
            case 'Degraded':
                return 'warning';
            case 'Lost':
            case 'Offline':
            case 'Retired':
                return 'neutral';
            default:
                return 'primary';
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Asset & System Register</h1>
                    <p className={styles.subtitle}>Track physical hardware and software system environments</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {activeTab === 'assets' && (
                        <>
                            <input type="file" id="csv-upload" accept=".csv" style={{ display: 'none' }} onChange={handleImportCSV} />
                            <Button variant="outline" onClick={() => document.getElementById('csv-upload')?.click()} title="Import Assets from CSV">
                                <Upload size={16} /> Import
                            </Button>
                            <Button variant="outline" onClick={handleExportCSV} title="Export Assets to CSV">
                                <Download size={16} /> Export
                            </Button>
                        </>
                    )}
                    <Button onClick={() => openAssetModal()}>
                        <Plus size={16} /> Add Asset
                    </Button>
                    <Button variant="outline" onClick={() => openSystemModal()}>
                        <Plus size={16} /> New System
                    </Button>
                </div>
            </header>

            <div className={styles.tabs} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={cn(styles.tabBtn, activeTab === 'assets' && styles.tabActive)}
                        onClick={() => { setActiveTab('assets'); setStatusFilter('All'); }}
                    >
                        <Package size={14} style={{ display: 'inline', marginRight: '6px' }} />
                        Physical Assets ({assets.length})
                    </button>
                    <button
                        className={cn(styles.tabBtn, activeTab === 'systems' && styles.tabActive)}
                        onClick={() => { setActiveTab('systems'); setStatusFilter('All'); }}
                    >
                        <Server size={14} style={{ display: 'inline', marginRight: '6px' }} />
                        System Environments ({systems.length})
                    </button>
                </div>
                <div>
                    <select
                        className={styles.select}
                        style={{ padding: '0.25rem 0.5rem', width: '150px' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        {activeTab === 'assets' ? (
                            <>
                                <option value="Active">Active</option>
                                <option value="Under Maintenance">Under Maintenance</option>
                                <option value="Retired">Retired</option>
                                <option value="Lost">Lost</option>
                            </>
                        ) : (
                            <>
                                <option value="Online">Online</option>
                                <option value="Degraded">Degraded</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Offline">Offline</option>
                            </>
                        )}
                    </select>
                </div>
            </div>

            {/* Constraints Display */}
            <div className={styles.list}>
                {activeTab === 'assets' && (
                    filteredAssets.length === 0 ? (
                        <div className={styles.emptyState}>
                            No physical assets found matching the criteria. Click &quot;Add Asset&quot; to start.
                        </div>
                    ) : (
                        filteredAssets.map(a => {
                            const owner = members.find(m => m.id === a.ownerId);
                            return (
                                <Card key={a.id} className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <div>
                                            <h3 className={styles.cardTitle}>
                                                <span className={styles.tagBadge}>{a.tag}</span>
                                                {a.name}
                                                <span style={{ marginLeft: '0.5rem' }}>
                                                    <Badge variant={getBadgeVariant(a.status)}>{a.status}</Badge>
                                                </span>
                                            </h3>
                                            <div className={styles.cardMeta}>
                                                <div className={styles.cardMetaRow}>
                                                    <MapPin size={14} /> <span>{a.location}</span>
                                                </div>
                                                {(a.model || a.serialNumber) && (
                                                    <div className={styles.cardMetaRow}>
                                                        {a.model && <span><Package size={14} /> {a.model}</span>}
                                                        {a.serialNumber && <span><Hash size={14} /> SN: {a.serialNumber}</span>}
                                                    </div>
                                                )}
                                                {owner && (
                                                    <div className={styles.cardMetaRow}>
                                                        <Wrench size={14} /> <span>Custodian: {owner.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.actions}>
                                            <button className={styles.iconBtn} onClick={() => openAssetModal(a)} title="Edit Asset">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className={cn(styles.iconBtn, styles.deleteBtn)} onClick={() => deleteAsset(a.id)} title="Delete Asset">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {a.notes && <p style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)', margin: 0, marginTop: '0.25rem' }}>{a.notes}</p>}
                                </Card>
                            )
                        })
                    )
                )}

                {activeTab === 'systems' && (
                    filteredSystems.length === 0 ? (
                        <div className={styles.emptyState}>
                            No systems registered. Click &quot;New System&quot; to define one.
                        </div>
                    ) : (
                        filteredSystems.map(s => {
                            const vendor = vendors.find(v => v.id === s.vendorId);
                            return (
                                <Card key={s.id} className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <div>
                                            <h3 className={styles.cardTitle}>
                                                {s.name}
                                                <span style={{ marginLeft: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                                                    <Badge variant={s.environment === 'Production' ? 'primary' : 'neutral'}>{s.environment}</Badge>
                                                    <Badge variant={getBadgeVariant(s.status)}>{s.status}</Badge>
                                                </span>
                                            </h3>
                                            <div className={styles.cardMeta}>
                                                {s.version && (
                                                    <div className={styles.cardMetaRow}>
                                                        <Hash size={14} /> <span>v{s.version}</span>
                                                    </div>
                                                )}
                                                {vendor && (
                                                    <div className={styles.cardMetaRow}>
                                                        <Server size={14} /> <span>Provided by: {vendor.name}</span>
                                                    </div>
                                                )}
                                                {s.url && (
                                                    <div className={styles.cardMetaRow}>
                                                        <ExternalLink size={14} /> <a href={s.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>{s.url}</a>
                                                    </div>
                                                )}
                                                <div className={styles.cardMetaRow}>
                                                    <Clock size={14} /> <span>Last Check: {s.lastChecked}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.actions}>
                                            <button className={styles.iconBtn} onClick={() => {
                                                updateSystem(s.id, { lastChecked: today });
                                            }} title="Update Last Check Time">
                                                <Clock size={16} />
                                            </button>
                                            <button className={styles.iconBtn} onClick={() => openSystemModal(s)} title="Edit System">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className={cn(styles.iconBtn, styles.deleteBtn)} onClick={() => deleteSystem(s.id)} title="Delete System">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {s.notes && <p style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)', margin: 0, marginTop: '0.25rem' }}>{s.notes}</p>}
                                </Card>
                            )
                        })
                    )
                )}
            </div>

            {/* Asset Modal */}
            <Modal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} title={editAssetId ? "Edit Asset" : "Add Physical Asset"}>
                <div className={styles.form}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Asset Tag *</label>
                            <input className={styles.input} value={assetForm.tag} onChange={e => setAssetForm({ ...assetForm, tag: e.target.value })} placeholder="AST-1001" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Name / Title *</label>
                            <input className={styles.input} value={assetForm.name} onChange={e => setAssetForm({ ...assetForm, name: e.target.value })} placeholder="Surveying Station" />
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Location *</label>
                            <input className={styles.input} value={assetForm.location} onChange={e => setAssetForm({ ...assetForm, location: e.target.value })} placeholder="Zone A Storage" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Assigned To</label>
                            <select className={styles.select} value={assetForm.ownerId || ''} onChange={e => setAssetForm({ ...assetForm, ownerId: e.target.value })}>
                                <option value="">— Unassigned —</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Status</label>
                            <select className={styles.select} value={assetForm.status} onChange={e => setAssetForm({ ...assetForm, status: e.target.value as AssetStatus })}>
                                <option value="Active">Active</option>
                                <option value="Under Maintenance">Under Maintenance</option>
                                <option value="Retired">Retired</option>
                                <option value="Lost">Lost</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Purchase Date</label>
                            <input className={styles.input} type="date" value={assetForm.purchaseDate} onChange={e => setAssetForm({ ...assetForm, purchaseDate: e.target.value })} />
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Hardware Model</label>
                            <input className={styles.input} value={assetForm.model} onChange={e => setAssetForm({ ...assetForm, model: e.target.value })} placeholder="e.g. Leica TS16" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Serial Number</label>
                            <input className={styles.input} value={assetForm.serialNumber} onChange={e => setAssetForm({ ...assetForm, serialNumber: e.target.value })} placeholder="SN..." />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Notes</label>
                        <textarea className={styles.textarea} value={assetForm.notes} onChange={e => setAssetForm({ ...assetForm, notes: e.target.value })} placeholder="Condition reports, warranty info..." />
                    </div>
                    <div className={styles.formActions}>
                        <Button variant="ghost" onClick={() => setIsAssetModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveAsset}>Save Asset</Button>
                    </div>
                </div>
            </Modal>

            {/* System Modal */}
            <Modal isOpen={isSystemModalOpen} onClose={() => setIsSystemModalOpen(false)} title={editSystemId ? "Edit System" : "Register System"}>
                <div className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>System Name *</label>
                        <input className={styles.input} value={systemForm.name} onChange={e => setSystemForm({ ...systemForm, name: e.target.value })} placeholder="Access Control API" />
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Environment *</label>
                            <select className={styles.select} value={systemForm.environment} onChange={e => setSystemForm({ ...systemForm, environment: e.target.value as 'Production' | 'Staging' | 'Test' | 'Development' })}>
                                <option value="Production">Production</option>
                                <option value="Staging">Staging</option>
                                <option value="Test">Test</option>
                                <option value="Development">Development</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Status</label>
                            <select className={styles.select} value={systemForm.status} onChange={e => setSystemForm({ ...systemForm, status: e.target.value as SystemStatus })}>
                                <option value="Online">Online</option>
                                <option value="Degraded">Degraded</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Offline">Offline</option>
                            </select>
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Version</label>
                            <input className={styles.input} value={systemForm.version} onChange={e => setSystemForm({ ...systemForm, version: e.target.value })} placeholder="e.g. 2.4.1" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Associated Vendor</label>
                            <select className={styles.select} value={systemForm.vendorId || ''} onChange={e => setSystemForm({ ...systemForm, vendorId: e.target.value })}>
                                <option value="">— None (Internal) —</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label>URL / Access Endpoint</label>
                        <input className={styles.input} type="url" value={systemForm.url} onChange={e => setSystemForm({ ...systemForm, url: e.target.value })} placeholder="https://" />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Notes</label>
                        <textarea className={styles.textarea} value={systemForm.notes} onChange={e => setSystemForm({ ...systemForm, notes: e.target.value })} placeholder="Credentials hint, architecture notes..." />
                    </div>
                    <div className={styles.formActions}>
                        <Button variant="ghost" onClick={() => setIsSystemModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSystem}>Register</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
