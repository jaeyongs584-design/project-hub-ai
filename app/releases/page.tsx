'use client';

import React, { useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { Plus, Trash2, Pencil, ChevronRight, Rocket, Copy } from 'lucide-react';
import { generateId, cn } from '@/lib/utils';
import { Deployment, DeploymentStatus, DeployChangeType } from '@/types';
import styles from './page.module.css';

const DEP_STATUS_CYCLE: DeploymentStatus[] = ['Planned', 'In Progress', 'Deployed', 'Rolled Back'];

export default function ReleasesPage() {
    const {
        deployments,
        addDeployment, updateDeployment, deleteDeployment,
        addActivity,
    } = useProject();

    const safeDeployments = deployments || [];

    // ── Deployment state ──
    const [isDepAddOpen, setIsDepAddOpen] = useState(false);
    const [editDep, setEditDep] = useState<Deployment | null>(null);
    const [newDep, setNewDep] = useState({
        title: '', version: '', systemModule: 'General', environment: 'Staging' as Deployment['environment'],
        changeType: 'Release' as DeployChangeType, deploymentDate: '', releaseNotes: '',
        laneArea: '', relatedCRId: '', testResultUrl: ''
    });

    const [filterEnv, setFilterEnv] = useState<'All' | Deployment['environment']>('All');
    const [filterStatus, setFilterStatus] = useState<'All' | DeploymentStatus>('All');

    const today = new Date().toISOString().split('T')[0];

    const depStatusClass = (s: DeploymentStatus) => {
        const map: Record<DeploymentStatus, string> = { 'Planned': styles.statusPlanned, 'In Progress': styles.statusInProgress, 'Deployed': styles.statusDeployed, 'Completed': styles.statusDeployed, 'Failed': styles.statusRolledBack, 'Rolled Back': styles.statusRolledBack };
        return map[s];
    };

    // ── Handlers ──
    const handleAddDeployment = () => {
        if (!newDep.version) return;
        const now = new Date().toISOString();
        addDeployment({
            id: generateId('dep'),
            title: newDep.title || `Release v${newDep.version}`,
            version: newDep.version,
            systemModule: newDep.systemModule,
            changeType: newDep.changeType,
            deploymentDate: newDep.deploymentDate || today,
            plannedDate: newDep.deploymentDate || today,
            environment: newDep.environment,
            releaseNotes: newDep.releaseNotes || undefined,
            laneArea: newDep.laneArea,
            relatedCRId: newDep.relatedCRId,
            testResultUrl: newDep.testResultUrl,
            status: 'Planned',
            createdAt: now,
            updatedAt: now,
        });
        addActivity({ id: generateId('act'), timestamp: now, action: 'Deployment planned', detail: `v${newDep.version} → ${newDep.environment}`, category: 'deployment' });
        setNewDep({ title: '', version: '', systemModule: 'General', environment: 'Staging', changeType: 'Release', deploymentDate: '', releaseNotes: '', laneArea: '', relatedCRId: '', testResultUrl: '' }); setIsDepAddOpen(false);
    };

    const handleDuplicate = (dep: Deployment) => {
        setNewDep({
            title: dep.title, version: dep.version, systemModule: dep.systemModule, environment: dep.environment,
            changeType: dep.changeType, deploymentDate: dep.deploymentDate, releaseNotes: dep.releaseNotes || '',
            laneArea: dep.laneArea || '', relatedCRId: dep.relatedCRId || '', testResultUrl: dep.testResultUrl || ''
        });
        setIsDepAddOpen(true);
    };

    const handleEditDepSave = () => {
        if (!editDep) return;
        updateDeployment(editDep.id, { title: editDep.title, version: editDep.version, systemModule: editDep.systemModule, changeType: editDep.changeType, deploymentDate: editDep.deploymentDate, plannedDate: editDep.plannedDate, actualDate: editDep.actualDate, environment: editDep.environment, releaseNotes: editDep.releaseNotes, laneArea: editDep.laneArea, relatedCRId: editDep.relatedCRId, testResultUrl: editDep.testResultUrl }); setEditDep(null);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div><h1 className={styles.title}>Releases & Deployments</h1><p className={styles.subtitle}>{safeDeployments.length} deployments</p></div>
                <Button size="sm" onClick={() => setIsDepAddOpen(true)}><Plus size={14} /> Quick Release Log</Button>
            </header>

            <div className={styles.filterBar} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select className={styles.select} style={{ width: 'auto', padding: '0.25rem 0.5rem' }} value={filterEnv} onChange={e => setFilterEnv(e.target.value as 'All' | Deployment['environment'])}>
                    <option value="All">All Environments</option>
                    <option value="Staging">Staging</option>
                    <option value="Production">Production</option>
                    <option value="UAT">UAT</option>
                </select>
                <select className={styles.select} style={{ width: 'auto', padding: '0.25rem 0.5rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value as 'All' | DeploymentStatus)}>
                    <option value="All">All Statuses</option>
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Deployed">Deployed</option>
                    <option value="Rolled Back">Rolled Back</option>
                </select>
            </div>

            {/* ═══ DEPLOYMENTS ═══ */}
            {safeDeployments.filter(d => (filterEnv === 'All' || d.environment === filterEnv) && (filterStatus === 'All' || d.status === filterStatus)).length === 0 ? (
                <Card><div className={styles.emptyState}>No deployments match the criteria.</div></Card>
            ) : (
                <div className={styles.itemList}>
                    {safeDeployments.filter(d => (filterEnv === 'All' || d.environment === filterEnv) && (filterStatus === 'All' || d.status === filterStatus)).sort((a, b) => (b.deploymentDate || b.plannedDate || '').localeCompare(a.deploymentDate || a.plannedDate || '')).map(dep => (
                        <Card key={dep.id} className={styles.itemCard}>
                            <div className={styles.itemTop}>
                                <div className={styles.itemLeft}>
                                    <Rocket size={16} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
                                    <span className={styles.envBadge}>{dep.environment}</span>
                                    {dep.changeType !== 'Release' && <span className={styles.typeBadge} style={{ fontSize: '0.625rem', padding: '0.1rem 0.3rem', background: 'rgba(255,159,67,0.1)', color: '#ff9f43' }}>{dep.changeType}</span>}
                                    <h3 className={styles.itemTitle} onClick={() => setEditDep(dep)}>v{dep.version} {dep.title ? ` - ${dep.title}` : ''}</h3>
                                </div>
                                <div className={styles.itemRight}>
                                    <span className={cn(styles.statusPill, depStatusClass(dep.status))} onClick={() => { const idx = DEP_STATUS_CYCLE.indexOf(dep.status); updateDeployment(dep.id, { status: DEP_STATUS_CYCLE[(idx + 1) % DEP_STATUS_CYCLE.length] }); }} title="Click to change">
                                        {dep.status}<ChevronRight size={10} className={styles.chevron} />
                                    </span>
                                </div>
                            </div>
                            {dep.releaseNotes && <p className={styles.itemDesc}>{dep.releaseNotes}</p>}
                            <div className={styles.itemMeta}>
                                <span>Date: {dep.deploymentDate || dep.plannedDate}</span>
                                <span>Module: {dep.systemModule}</span>
                                {dep.laneArea && <span>Lane: {dep.laneArea}</span>}
                                {dep.relatedCRId && <span style={{ color: 'var(--brand-blue)' }}>CR: {dep.relatedCRId}</span>}
                                <div className={styles.itemActions}>
                                    <button className={styles.actionBtn} onClick={() => handleDuplicate(dep)} title="Duplicate"><Copy size={13} /></button>
                                    <button className={styles.actionBtn} onClick={() => setEditDep(dep)}><Pencil size={13} /></button>
                                    <button className={cn(styles.actionBtn, styles.deleteBtn)} onClick={() => deleteDeployment(dep.id)}><Trash2 size={13} /></button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* ═══ MODALS ═══ */}
            <Modal isOpen={isDepAddOpen} onClose={() => setIsDepAddOpen(false)} title="Quick Release Log">
                <div className={styles.form}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}><label>Title *</label><input className={styles.input} value={newDep.title} onChange={e => setNewDep({ ...newDep, title: e.target.value })} placeholder="Release Name" autoFocus /></div>
                        <div className={styles.formGroup}><label>Version *</label><input className={styles.input} value={newDep.version} onChange={e => setNewDep({ ...newDep, version: e.target.value })} placeholder="e.g. 1.2.0" /></div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}><label>Change Type</label><select className={styles.select} value={newDep.changeType} onChange={e => setNewDep({ ...newDep, changeType: e.target.value as DeployChangeType })}><option>Release</option><option>Patch</option><option>Hotfix</option><option>Config</option></select></div>
                        <div className={styles.formGroup}><label>Environment</label><select className={styles.select} value={newDep.environment} onChange={e => setNewDep({ ...newDep, environment: e.target.value as Deployment['environment'] })}><option>Staging</option><option>Production</option><option>UAT</option></select></div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}><label>System / Module</label><input className={styles.input} value={newDep.systemModule} onChange={e => setNewDep({ ...newDep, systemModule: e.target.value })} placeholder="Core, API, etc." /></div>
                        <div className={styles.formGroup}><label>Date</label><input type="date" className={styles.input} value={newDep.deploymentDate} onChange={e => setNewDep({ ...newDep, deploymentDate: e.target.value })} /></div>
                    </div>
                    <div className={styles.formGroup}><label>Release Notes</label><textarea className={styles.textarea} value={newDep.releaseNotes} onChange={e => setNewDep({ ...newDep, releaseNotes: e.target.value })} placeholder="Summary of changes..." rows={3} /></div>

                    <details style={{ marginTop: '0.5rem' }}>
                        <summary style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>Advanced options...</summary>
                        <div className={styles.formRow} style={{ marginTop: '0.5rem' }}>
                            <div className={styles.formGroup}><label>Lane / Area</label><input className={styles.input} value={newDep.laneArea} onChange={e => setNewDep({ ...newDep, laneArea: e.target.value })} placeholder="e.g. Gate 1, Yard B" /></div>
                            <div className={styles.formGroup}><label>Related CR / Issue</label><input className={styles.input} value={newDep.relatedCRId} onChange={e => setNewDep({ ...newDep, relatedCRId: e.target.value })} placeholder="CR-001" /></div>
                        </div>
                        <div className={styles.formGroup}><label>Test Result Link</label><input className={styles.input} value={newDep.testResultUrl} onChange={e => setNewDep({ ...newDep, testResultUrl: e.target.value })} placeholder="URL to test execution..." /></div>
                    </details>

                    <div className={styles.formActions}><Button variant="ghost" onClick={() => setIsDepAddOpen(false)}>Cancel</Button><Button onClick={handleAddDeployment}>Log Release</Button></div>
                </div>
            </Modal>

            <Modal isOpen={!!editDep} onClose={() => setEditDep(null)} title="Edit Release Log">
                {editDep && (
                    <div className={styles.form}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}><label>Title *</label><input className={styles.input} value={editDep.title} onChange={e => setEditDep({ ...editDep, title: e.target.value })} /></div>
                            <div className={styles.formGroup}><label>Version *</label><input className={styles.input} value={editDep.version} onChange={e => setEditDep({ ...editDep, version: e.target.value })} /></div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}><label>Change Type</label><select className={styles.select} value={editDep.changeType} onChange={e => setEditDep({ ...editDep, changeType: e.target.value as DeployChangeType })}><option>Release</option><option>Patch</option><option>Hotfix</option><option>Config</option></select></div>
                            <div className={styles.formGroup}><label>Environment</label><select className={styles.select} value={editDep.environment} onChange={e => setEditDep({ ...editDep, environment: e.target.value as Deployment['environment'] })}><option>Staging</option><option>Production</option><option>UAT</option></select></div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}><label>System / Module</label><input className={styles.input} value={editDep.systemModule} onChange={e => setEditDep({ ...editDep, systemModule: e.target.value })} /></div>
                            <div className={styles.formGroup}><label>Date</label><input type="date" className={styles.input} value={editDep.deploymentDate} onChange={e => setEditDep({ ...editDep, deploymentDate: e.target.value })} /></div>
                        </div>
                        <div className={styles.formGroup}><label>Release Notes</label><textarea className={styles.textarea} value={editDep.releaseNotes || ''} onChange={e => setEditDep({ ...editDep, releaseNotes: e.target.value })} rows={3} /></div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}><label>Lane / Area</label><input className={styles.input} value={editDep.laneArea || ''} onChange={e => setEditDep({ ...editDep, laneArea: e.target.value })} /></div>
                            <div className={styles.formGroup}><label>Related CR / Issue</label><input className={styles.input} value={editDep.relatedCRId || ''} onChange={e => setEditDep({ ...editDep, relatedCRId: e.target.value })} /></div>
                        </div>
                        <div className={styles.formGroup}><label>Test Result Link</label><input className={styles.input} value={editDep.testResultUrl || ''} onChange={e => setEditDep({ ...editDep, testResultUrl: e.target.value })} /></div>

                        <div className={styles.formActions}><Button variant="ghost" onClick={() => setEditDep(null)}>Cancel</Button><Button onClick={handleEditDepSave}>Save</Button></div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
