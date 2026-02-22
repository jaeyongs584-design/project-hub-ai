'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, AlertCircle, Users, FileText, Shield, Menu, X, BarChart3, DollarSign, ChevronDown, Plus, Settings, Trash2 } from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import { useProject } from '@/hooks/useProject';
import { Modal } from '@/app/components/ui/Modal';
import { Button } from '@/app/components/ui/Button';
import { Project } from '@/types';
import styles from './Sidebar.module.css';
import { getInitialTasks, getDefaultPolicies } from '@/lib/templates';

const NAV_ITEMS = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/schedule', label: 'Schedule', icon: Calendar },
    { href: '/issues', label: 'Issues', icon: AlertCircle },
    { href: '/team', label: 'Team', icon: Users },
    { href: '/budget', label: 'Budget', icon: DollarSign },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    { href: '/policies', label: 'Policies', icon: Shield },
    { href: '/documents', label: 'Documents', icon: FileText },
];

const inputStyle: React.CSSProperties = {
    background: 'var(--input-bg)', border: '1px solid var(--input-border)',
    borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem',
    color: 'var(--foreground)', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', width: '100%',
};

const labelStyle: React.CSSProperties = {
    fontSize: '0.8125rem', fontWeight: 500, color: 'var(--foreground-muted)',
};

export const Sidebar = () => {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [projDropdown, setProjDropdown] = useState(false);
    const [isNewProjOpen, setIsNewProjOpen] = useState(false);
    const [newProjName, setNewProjName] = useState('');
    const [newProjStart, setNewProjStart] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const { projects, activeProjectId, switchProject, addProject, deleteProject, projectInfo, updateProjectInfo, addActivity } = useProject();

    // Settings form state
    const [sName, setSName] = useState('');
    const [sDesc, setSDesc] = useState('');
    const [sClient, setSClient] = useState('');
    const [sManager, setSManager] = useState('');
    const [sStart, setSStart] = useState('');
    const [sEnd, setSEnd] = useState('');

    const openSettings = () => {
        setSName(projectInfo.name);
        setSDesc(projectInfo.description);
        setSClient(projectInfo.client);
        setSManager(projectInfo.manager);
        setSStart(projectInfo.startDate);
        setSEnd(projectInfo.endDate);
        setIsSettingsOpen(true);
    };

    const handleSaveSettings = () => {
        updateProjectInfo({
            name: sName.trim(),
            description: sDesc.trim(),
            client: sClient.trim(),
            manager: sManager.trim(),
            startDate: sStart,
            endDate: sEnd,
        });
        addActivity({
            id: generateId('act'),
            timestamp: new Date().toISOString(),
            action: 'Project info updated',
            detail: `"${sName.trim()}"`,
            category: 'project',
        });
        setIsSettingsOpen(false);
    };

    const handleNewProject = () => {
        if (!newProjName.trim()) return;
        const startDate = newProjStart || new Date().toISOString().split('T')[0];

        const proj: Project = {
            id: generateId('proj'),
            info: { name: newProjName.trim(), description: '', client: '', startDate: startDate, endDate: '', manager: '' },
            tasks: getInitialTasks(startDate),
            issues: [],
            members: [],
            documents: [],
            policies: getDefaultPolicies(),
            budget: { contractAmount: 0, entries: [] },
            activities: [],
        };
        addProject(proj);
        setNewProjName('');
        setNewProjStart('');
        setIsNewProjOpen(false);
        setProjDropdown(false);
    };

    return (
        <>
            <button
                className={styles.mobileToggle}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
            >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {isOpen && <div className={styles.mobileOverlay} onClick={() => setIsOpen(false)} />}

            <aside className={cn(styles.sidebar, isOpen && styles.open)}>
                <div className={styles.logoContainer}>
                    <div className={styles.logoIcon}>AG</div>
                    <h1 className={styles.logoText}>AGS ProjectHub</h1>
                </div>

                {/* Project Selector */}
                <div className={styles.projectSelector}>
                    <div
                        className={styles.projectBtn}
                        onClick={() => setProjDropdown(!projDropdown)}
                        role="button"
                        tabIndex={0}
                    >
                        <span className={styles.projectName}>{projectInfo.name || 'Select Project'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <button
                                className={styles.settingsBtn}
                                onClick={(e) => { e.stopPropagation(); openSettings(); }}
                                title="Project Settings"
                            >
                                <Settings size={13} />
                            </button>
                            <ChevronDown size={14} className={cn(styles.projChevron, projDropdown && styles.projChevronOpen)} />
                        </div>
                    </div>
                    {projDropdown && (
                        <div className={styles.projectDropdown}>
                            {projects.map((proj) => (
                                <div
                                    key={proj.id}
                                    className={cn(styles.projectOption, proj.id === activeProjectId && styles.projectOptionActive)}
                                    onClick={() => { switchProject(proj.id); setProjDropdown(false); }}
                                >
                                    <span>{proj.info.name}</span>
                                    {projects.length > 1 && proj.id !== activeProjectId && (
                                        <button
                                            className={styles.projDeleteBtn}
                                            onClick={(e) => { e.stopPropagation(); deleteProject(proj.id); }}
                                            title="Delete project"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                className={styles.newProjectBtn}
                                onClick={() => { setIsNewProjOpen(true); setProjDropdown(false); }}
                            >
                                <Plus size={14} /> New Project
                            </button>
                        </div>
                    )}
                </div>

                <nav className={styles.nav}>
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(styles.navItem, isActive && styles.active)}
                                onClick={() => setIsOpen(false)}
                            >
                                {isActive && <div className={styles.activeIndicator} />}
                                <Icon size={18} className={styles.icon} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.footer}>
                    <div className={styles.userProfile}>
                        <div className={styles.avatar}>PM</div>
                        <div className={styles.userInfo}>
                            <p className={styles.userName}>Project Manager</p>
                            <p className={styles.userRole}>AGS</p>
                        </div>
                        <div className={styles.onlineDot} />
                    </div>
                </div>
            </aside>

            {/* New Project Modal */}
            <Modal isOpen={isNewProjOpen} onClose={() => setIsNewProjOpen(false)} title="Create New Project">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label style={labelStyle}>Project Name *</label>
                        <input
                            style={inputStyle}
                            value={newProjName}
                            onChange={(e) => setNewProjName(e.target.value)}
                            placeholder="Enter project name"
                            onKeyDown={(e) => e.key === 'Enter' && handleNewProject()}
                            autoFocus
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label style={labelStyle}>Start Date</label>
                        <input
                            type="date"
                            style={inputStyle}
                            value={newProjStart}
                            onChange={(e) => setNewProjStart(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <Button variant="ghost" onClick={() => setIsNewProjOpen(false)}>Cancel</Button>
                        <Button onClick={handleNewProject}>Create</Button>
                    </div>
                </div>
            </Modal>

            {/* Project Settings Modal */}
            <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Project Settings">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={labelStyle}>Project Name</label>
                        <input style={inputStyle} value={sName} onChange={(e) => setSName(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={labelStyle}>Description</label>
                        <input style={inputStyle} value={sDesc} onChange={(e) => setSDesc(e.target.value)} placeholder="Short project description" />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={labelStyle}>Client</label>
                            <input style={inputStyle} value={sClient} onChange={(e) => setSClient(e.target.value)} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={labelStyle}>Manager</label>
                            <input style={inputStyle} value={sManager} onChange={(e) => setSManager(e.target.value)} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={labelStyle}>Start Date</label>
                            <input type="date" style={inputStyle} value={sStart} onChange={(e) => setSStart(e.target.value)} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={labelStyle}>End Date</label>
                            <input type="date" style={inputStyle} value={sEnd} onChange={(e) => setSEnd(e.target.value)} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <Button variant="ghost" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSettings}>Save Changes</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
