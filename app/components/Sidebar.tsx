'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, Calendar, AlertCircle, Users, FileText, Shield, Menu, X, BarChart3, DollarSign, ChevronDown, Plus, Settings, Trash2, CheckSquare, Rocket, Briefcase, Server, ClipboardList, LogOut, Bell, Globe } from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import { useProject } from '@/hooks/useProject';
import { Modal } from '@/app/components/ui/Modal';
import { Button } from '@/app/components/ui/Button';
import { Project } from '@/types';
import styles from './Sidebar.module.css';
import { getInitialTasks, getDefaultPolicies } from '@/lib/templates';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { toast } from 'sonner';

const getNavGroups = (role: string) => {
    const isAdminOrPM = role !== 'Client';

    if (role === 'Client') {
        return [
            {
                label: 'Core',
                items: [
                    { href: '/', label: 'Overview', icon: LayoutDashboard },
                    { href: '/schedule', label: 'Schedule', icon: Calendar },
                ],
            },
            {
                label: 'Resources',
                items: [
                    { href: '/documents', label: 'Documents', icon: FileText },
                ],
            },
            {
                label: 'Analytics',
                items: [
                    { href: '/reports', label: 'Reports', icon: BarChart3 },
                ],
            },
        ];
    }

    return [
        {
            label: 'Core',
            items: [
                { href: '/', label: 'Overview', icon: LayoutDashboard },
                { href: '/schedule', label: 'Schedule', icon: Calendar },
                { href: '/issues', label: 'Issues', icon: AlertCircle },
            ],
        },
        {
            label: 'Operations',
            items: [
                { href: '/actions', label: 'Actions & Decisions', icon: CheckSquare },
                { href: '/releases', label: 'Releases', icon: Rocket },
                ...(isAdminOrPM ? [{ href: '/assets', label: 'Assets & Systems', icon: Server }] : []),
                { href: '/field-logs', label: 'Field Logs', icon: ClipboardList },
            ],
        },
        {
            label: 'Resources',
            items: [
                { href: '/team', label: 'Team', icon: Users },
                ...(isAdminOrPM ? [
                    { href: '/budget', label: 'Budget', icon: DollarSign },
                    { href: '/vendors', label: 'Vendors', icon: Briefcase },
                ] : []),
                { href: '/documents', label: 'Documents', icon: FileText },
                ...(isAdminOrPM ? [{ href: '/policies', label: 'Policies', icon: Shield }] : []),
            ],
        },
        {
            label: 'Analytics',
            items: [
                { href: '/reports', label: 'Reports', icon: BarChart3 },
            ],
        },
    ];
};

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
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [projDropdown, setProjDropdown] = useState(false);
    const [isNewProjOpen, setIsNewProjOpen] = useState(false);
    const [newProjName, setNewProjName] = useState('');
    const [newProjStart, setNewProjStart] = useState('');
    const [newProjLocation, setNewProjLocation] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const { projects, activeProjectId, switchProject, addProject, deleteProject, projectInfo, updateProjectInfo, addActivity, fetchSupabaseData, notifications, markNotificationAsRead, markAllNotificationsAsRead } = useProject();

    // Fetch initial data from Supabase once on mount
    React.useEffect(() => {
        if (session) {
            fetchSupabaseData();
        }
    }, [session, fetchSupabaseData]);

    // Setup real-time subscriptions
    useSupabaseSync();

    // Settings form state
    const [sName, setSName] = useState('');
    const [sDesc, setSDesc] = useState('');
    const [sClient, setSClient] = useState('');
    const [sManager, setSManager] = useState('');
    const [sStart, setSStart] = useState('');
    const [sEnd, setSEnd] = useState('');
    const [sLocation, setSLocation] = useState('');

    const openSettings = () => {
        setSName(projectInfo.name);
        setSDesc(projectInfo.description);
        setSClient(projectInfo.client);
        setSManager(projectInfo.manager);
        setSStart(projectInfo.startDate);
        setSEnd(projectInfo.endDate);
        setSLocation(projectInfo.location || '');
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
            location: sLocation.trim(),
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
            info: { name: newProjName.trim(), description: '', client: '', startDate: startDate, endDate: '', manager: '', location: newProjLocation.trim() },
            tasks: getInitialTasks(startDate),
            issues: [],
            members: [],
            documents: [],
            policies: getDefaultPolicies(),
            budget: { contractAmount: 0, entries: [] },
            activities: [],
            risks: [],
            changeRequests: [],
            actionItems: [],
            decisions: [],
            meetings: [],
            communications: [],
            milestones: [],
            deployments: [],
            vendors: [],
            procurements: [],
            assets: [],
            systems: [],
            siteLogs: [],
            notifications: [],
        };
        addProject(proj);
        setNewProjName('');
        setNewProjStart('');
        setNewProjLocation('');
        setIsNewProjOpen(false);
        setProjDropdown(false);
    };

    const userRole = (session?.user as { role?: string })?.role || 'Admin';
    const navGroups = getNavGroups(userRole);
    const canEditProject = userRole === 'Admin' || userRole === 'PM';

    const unreadCount = notifications.filter(n => !n.read).length;

    const prevNotifCount = React.useRef(notifications.length);
    React.useEffect(() => {
        if (notifications.length > prevNotifCount.current) {
            const newNotif = notifications[0];
            if (newNotif && !newNotif.read) {
                toast(newNotif.title, { description: newNotif.message });
            }
        }
        prevNotifCount.current = notifications.length;
    }, [notifications]);

    // Early return ONLY after all hooks are absolutely finished!
    if (pathname === '/login' || pathname === '/signup') return null;

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

                <div style={{ padding: '0 1rem', marginBottom: '1rem' }}>
                    <Link
                        href="/portfolio"
                        className={cn(styles.navItem, pathname === '/portfolio' && styles.active)}
                        onClick={() => setIsOpen(false)}
                        style={{ border: '1px solid var(--border)', background: pathname === '/portfolio' ? 'var(--background-secondary)' : 'transparent' }}
                    >
                        {pathname === '/portfolio' && <div className={styles.activeIndicator} />}
                        <Globe size={18} className={styles.icon} />
                        <span style={{ fontWeight: 600 }}>Global Portfolio</span>
                    </Link>
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
                            {canEditProject && (
                                <button
                                    className={styles.settingsBtn}
                                    onClick={(e) => { e.stopPropagation(); openSettings(); }}
                                    title="Project Settings"
                                >
                                    <Settings size={13} />
                                </button>
                            )}
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
                                    {canEditProject && projects.length > 1 && proj.id !== activeProjectId && (
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
                            {canEditProject && (
                                <button
                                    className={styles.newProjectBtn}
                                    onClick={() => { setIsNewProjOpen(true); setProjDropdown(false); }}
                                >
                                    <Plus size={14} /> New Project
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <nav className={styles.nav}>
                    {navGroups.map((group) => (
                        <div key={group.label} className={styles.navGroup}>
                            <span className={styles.navGroupLabel}>{group.label}</span>
                            {group.items.map((item) => {
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
                        </div>
                    ))}
                </nav>

                <div className={styles.footer}>
                    <div style={{ padding: '0 1rem', marginBottom: '0.5rem' }}>
                        <button
                            className={styles.navItem}
                            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', border: 'none', background: 'transparent' }}
                            onClick={() => setIsNotifOpen(true)}
                        >
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <Bell size={18} className={styles.icon} />
                                <span>Notifications</span>
                            </div>
                            {unreadCount > 0 && (
                                <span style={{ background: 'var(--brand-primary)', color: 'white', fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '1rem' }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                    <div className={styles.userProfile}>
                        <div className={styles.avatar}>{session?.user?.name?.charAt(0) || 'U'}</div>
                        <div className={styles.userInfo}>
                            <p className={styles.userName}>{session?.user?.name || 'User'}</p>
                            <p className={styles.userRole}>{(session?.user as { role?: string })?.role || 'AGS'}</p>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            style={{ background: 'none', border: 'none', color: 'var(--foreground-muted)', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}
                            title="Sign Out"
                        >
                            <LogOut size={16} />
                        </button>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label style={labelStyle}>Location / Region</label>
                        <input
                            style={inputStyle}
                            value={newProjLocation}
                            onChange={(e) => setNewProjLocation(e.target.value)}
                            placeholder="e.g. San Francisco, US"
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={labelStyle}>Location / Region</label>
                        <input style={inputStyle} value={sLocation} onChange={(e) => setSLocation(e.target.value)} placeholder="e.g. London, UK" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <Button variant="ghost" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSettings}>Save Changes</Button>
                    </div>
                </div>
            </Modal>

            {/* Notifications Modal */}
            <Modal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} title="Notifications">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <Button variant="ghost" size="sm" onClick={() => markAllNotificationsAsRead()}>
                        Mark all as read
                    </Button>
                </div>
                {notifications.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No notifications yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                        {notifications.map(n => (
                            <div key={n.id} style={{ padding: '0.75rem', background: n.read ? 'transparent' : 'var(--surface-2)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: n.read ? 500 : 700, color: 'var(--foreground)' }}>{n.title}</h4>
                                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{n.message}</p>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>{new Date(n.timestamp).toLocaleString()}</span>
                                </div>
                                {!n.read && (
                                    <button onClick={() => markNotificationAsRead(n.id)} style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontSize: '0.75rem', padding: '0.25rem' }}>Mark read</button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </>
    );
};
