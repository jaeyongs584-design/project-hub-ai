import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, Project, Task, Issue, Member, DocumentLink, ProjectPolicy, ProjectInfo, BudgetEntry, ActivityEntry, Risk, ChangeRequest, ActionItem, Decision, Meeting, Communication, Milestone, Deployment, Vendor, Procurement, Asset, SystemRegister, SiteLog, AppNotification } from '@/types';
import { getInitialTasks, getDefaultPolicies } from '@/lib/templates';
import { supabase } from '@/lib/supabase';
import { generateId } from '@/lib/utils';


// ─── Default Project ─────────────────────────────────────────
const DEFAULT_PROJECT: Project = {
    id: 'proj-1',
    info: {
        name: 'AGS Project',
        description: '',
        client: '',
        startDate: '2026-01-20',
        endDate: '2026-03-31',
        manager: '',
    },
    tasks: getInitialTasks('2026-01-20'),
    issues: [],
    members: [],
    documents: [],
    policies: getDefaultPolicies(),
    budget: {
        contractAmount: 0,
        entries: [],
    },
    activities: [],
    // New collections
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

// ─── Helper: update active project ──────────────────────────
const updateActiveProject = (
    projects: Project[],
    activeId: string,
    updater: (p: Project) => Partial<Project>
): Project[] =>
    projects.map((p) => (p.id === activeId ? { ...p, ...updater(p) } : p));

// ─── Generic CRUD helpers ────────────────────────────────────
function addToCollection<T>(collection: T[], item: T): T[] {
    return [...collection, item];
}
function updateInCollection<T extends { id: string }>(collection: T[], id: string, updates: Partial<T>): T[] {
    return collection.map((item) => (item.id === id ? { ...item, ...updates } : item));
}
function deleteFromCollection<T extends { id: string }>(collection: T[], id: string): T[] {
    return collection.filter((item) => item.id !== id);
}

// ─── Store ───────────────────────────────────────────────────
export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            projects: [DEFAULT_PROJECT],
            activeProjectId: 'proj-1',

            // ── Supabase Sync ──
            fetchSupabaseData: async () => {
                try {
                    // Fetch all entities concurrently
                    const [resProj, resTasks, resIssues, resRisks, resSiteLogs, resChanges, resActions, resDecisions, resMeetings, resComms, resMilestones, resDeployments, resVendors, resProcurements, resAssets, resSystems, resBudgetEntries, resMembers, resDocuments, resPolicies, resActivities] = await Promise.all([
                        supabase.from('projects').select('*'),
                        supabase.from('tasks').select('*'),
                        supabase.from('issues').select('*'),
                        supabase.from('risks').select('*'),
                        supabase.from('site_logs').select('*'),
                        supabase.from('change_requests').select('*'),
                        supabase.from('action_items').select('*'),
                        supabase.from('decisions').select('*'),
                        supabase.from('meetings').select('*'),
                        supabase.from('communications').select('*'),
                        supabase.from('milestones').select('*'),
                        supabase.from('deployments').select('*'),
                        supabase.from('vendors').select('*'),
                        supabase.from('procurements').select('*'),
                        supabase.from('assets').select('*'),
                        supabase.from('systems').select('*'),
                        supabase.from('budget_entries').select('*'),
                        supabase.from('members').select('*'),
                        supabase.from('documents').select('*'),
                        supabase.from('policies').select('*'),
                        supabase.from('activities').select('*')
                    ]);

                    if (resProj.data && resProj.data.length > 0) {
                        set((state) => {
                            const newProjects = [...state.projects];
                            // Merge database projects
                            resProj.data?.forEach(dbProj => {
                                const localIndex = newProjects.findIndex(p => p.id === dbProj.id);
                                const dbTasks = resTasks.data?.filter(t => t.project_id === dbProj.id).map(t => ({
                                    id: t.id,
                                    title: t.title,
                                    description: t.description || '',
                                    ownerId: t.owner_id || '',
                                    startDate: t.start_date || '',
                                    dueDate: t.due_date || '',
                                    status: t.status,
                                    priority: t.priority,
                                    progress: t.progress || 0,
                                    dependencies: t.dependencies || [],
                                    tags: t.tags || [],
                                    parentId: t.parent_id || '',
                                    isMilestone: t.is_milestone || false,
                                    workstream: t.workstream || '',
                                    relatedMilestoneId: t.related_milestone_id || '',
                                })) as Task[] || [];

                                const dbIssues = resIssues.data?.filter(i => i.project_id === dbProj.id).map(i => ({
                                    id: i.id,
                                    title: i.title,
                                    description: i.description || '',
                                    severity: i.severity,
                                    ownerId: i.owner_id || '',
                                    dueDate: i.due_date || '',
                                    status: i.status,
                                    relatedTaskId: i.related_task_id || '',
                                    relatedReleaseId: i.related_release_id || '',
                                    createdAt: i.created_at || '',
                                })) as Issue[] || [];

                                const dbRisks = resRisks.data?.filter(r => r.project_id === dbProj.id).map(r => ({
                                    id: r.id,
                                    title: r.title,
                                    probability: r.probability,
                                    impact: r.impact,
                                    status: r.status,
                                    ownerId: r.owner_id || '',
                                    mitigation: r.mitigation_plan || '',
                                    createdAt: r.created_at,
                                    updatedAt: r.updated_at,
                                })) as Risk[] || [];

                                const dbSiteLogs = resSiteLogs.data?.filter(l => l.project_id === dbProj.id).map(l => ({
                                    id: l.id,
                                    date: l.date,
                                    loggerId: l.logger_id || '',
                                    weather: { condition: l.weather_condition || 'Clear', temperature: l.weather_temperature },
                                    personnelCount: l.personnel_count || 0,
                                    workSummary: l.work_summary || '',
                                    nextDayPlan: l.next_day_plan || '',
                                    relatedIssueIds: l.related_issue_ids || [],
                                    relatedRiskIds: l.related_risk_ids || [],
                                    createdAt: l.created_at,
                                    updatedAt: l.updated_at,
                                })) as SiteLog[] || [];

                                const dbChanges = resChanges.data?.filter(c => c.project_id === dbProj.id).map(c => ({
                                    id: c.id, title: c.title, requestDate: c.request_date, requester: c.requester,
                                    changeType: c.change_type, impactSummary: c.impact_summary, reference: c.reference,
                                    status: c.status, approver: c.approver, relatedDocumentId: c.related_document_id,
                                    relatedIssueId: c.related_issue_id, relatedMilestoneId: c.related_milestone_id,
                                    relatedDeploymentId: c.related_deployment_id, createdAt: c.created_at
                                })) as ChangeRequest[] || [];

                                const dbActions = resActions.data?.filter(a => a.project_id === dbProj.id).map(a => ({
                                    id: a.id, title: a.title, ownerId: a.owner_id, dueDate: a.due_date, status: a.status,
                                    priority: a.priority, sourceType: a.source_type, sourceId: a.source_id, sourceLink: a.source_link,
                                    description: a.description, relatedIssueId: a.related_issue_id, relatedCRId: a.related_cr_id,
                                    relatedMilestoneId: a.related_milestone_id, relatedDeploymentId: a.related_deployment_id,
                                    createdAt: a.created_at
                                })) as ActionItem[] || [];

                                const dbDecisions = resDecisions.data?.filter(d => d.project_id === dbProj.id).map(d => ({
                                    id: d.id, date: d.date, summary: d.summary, decidedBy: d.decided_by, impactAreas: d.impact_areas || [],
                                    reason: d.reason, sourceType: d.source_type, sourceId: d.source_id, sourceLink: d.source_link,
                                    relatedCRId: d.related_cr_id, relatedMilestoneId: d.related_milestone_id,
                                    relatedDeploymentId: d.related_deployment_id, createdAt: d.created_at
                                })) as Decision[] || [];

                                const dbMeetings = resMeetings.data?.filter(m => m.project_id === dbProj.id).map(m => ({
                                    id: m.id, title: m.title, meetingDate: m.meeting_date, participants: m.participants,
                                    meetingType: m.meeting_type, status: m.status, relatedMilestoneId: m.related_milestone_id,
                                    notes: m.notes, minutes: m.minutes, createdAt: m.created_at
                                })) as Meeting[] || [];

                                const dbComms = resComms.data?.filter(c => c.project_id === dbProj.id).map(c => ({
                                    id: c.id, type: c.type, subject: c.subject, date: c.date, summary: c.summary,
                                    from: c.from_person, to: c.to_person, relatedMeetingId: c.related_meeting_id,
                                    relatedIssueId: c.related_issue_id, relatedCRId: c.related_cr_id,
                                    relatedDeploymentId: c.related_deployment_id, tags: c.tags || [],
                                    linkUrl: c.link_url, createdAt: c.created_at
                                })) as Communication[] || [];

                                const dbMilestones = resMilestones.data?.filter(m => m.project_id === dbProj.id).map(m => ({
                                    id: m.id, title: m.title, description: m.description, date: m.date, status: m.status,
                                    ownerId: m.owner_id, createdAt: m.created_at, updatedAt: m.updated_at
                                })) as Milestone[] || [];

                                const dbDeployments = resDeployments.data?.filter(d => d.project_id === dbProj.id).map(d => ({
                                    id: d.id, title: d.title, site: d.site, systemModule: d.system_module,
                                    environment: d.environment, changeType: d.change_type, version: d.version,
                                    deploymentDate: d.deployment_date, status: d.status, changeSummary: d.change_summary,
                                    laneArea: d.lane_area, relatedIssueId: d.related_issue_id, relatedCRId: d.related_cr_id,
                                    relatedMilestoneId: d.related_milestone_id, releaseNoteUrl: d.release_note_url,
                                    releaseNotes: d.release_notes, plannedDate: d.planned_date, actualDate: d.actual_date,
                                    testResultUrl: d.test_result_url, validationResult: d.validation_result,
                                    downtimeMinutes: d.downtime_minutes, approvedBy: d.approved_by, createdBy: d.created_by,
                                    createdAt: d.created_at, updatedAt: d.updated_at
                                })) as Deployment[] || [];

                                const dbVendors = resVendors.data?.filter(v => v.project_id === dbProj.id).map(v => ({
                                    id: v.id, name: v.name, serviceType: v.service_type, contactName: v.contact_name,
                                    contactEmail: v.contact_email, contactPhone: v.contact_phone, status: v.status,
                                    notes: v.notes, createdAt: v.created_at, updatedAt: v.updated_at
                                })) as Vendor[] || [];

                                const dbProcurements = resProcurements.data?.filter(p => p.project_id === dbProj.id).map(p => ({
                                    id: p.id, title: p.title, vendorId: p.vendor_id, contractAmount: p.contract_amount,
                                    description: p.description, startDate: p.start_date, endDate: p.end_date,
                                    status: p.status, relatedMilestoneId: p.related_milestone_id, createdAt: p.created_at,
                                    updatedAt: p.updated_at
                                })) as Procurement[] || [];

                                const dbAssets = resAssets.data?.filter(a => a.project_id === dbProj.id).map(a => ({
                                    id: a.id, tag: a.tag, name: a.name, model: a.model, serialNumber: a.serial_number,
                                    location: a.location, ownerId: a.owner_id, status: a.status, purchaseDate: a.purchase_date,
                                    notes: a.notes, createdAt: a.created_at, updatedAt: a.updated_at
                                })) as Asset[] || [];

                                const dbSystems = resSystems.data?.filter(s => s.project_id === dbProj.id).map(s => ({
                                    id: s.id, name: s.name, version: s.version, environment: s.environment,
                                    status: s.status, vendorId: s.vendor_id, url: s.url, notes: s.notes,
                                    lastChecked: s.last_checked, createdAt: s.created_at, updatedAt: s.updated_at
                                })) as SystemRegister[] || [];

                                const dbBudgetEntries = resBudgetEntries.data?.filter(b => b.project_id === dbProj.id).map(b => ({
                                    id: b.id, date: b.date, category: b.category, description: b.description, amount: Number(b.amount)
                                })) as BudgetEntry[] || [];

                                const dbMembers = resMembers.data?.filter(m => m.project_id === dbProj.id).map(m => ({
                                    id: m.id, name: m.name, role: m.role, email: m.email, phone: m.phone, company: m.company,
                                    location: m.location, country: m.country, timezone: m.timezone, notes: m.notes
                                })) as Member[] || [];

                                const dbDocuments = resDocuments.data?.filter(d => d.project_id === dbProj.id).map(d => ({
                                    id: d.id, title: d.title, url: d.url, uploadDate: d.upload_date, uploadedBy: d.uploaded_by,
                                    type: d.type, size: d.size
                                })) as DocumentLink[] || [];

                                const dbPolicies = resPolicies.data?.filter(p => p.project_id === dbProj.id).map(p => ({
                                    id: p.id, title: p.title, content: p.content, lastUpdated: p.last_updated
                                })) as ProjectPolicy[] || [];

                                const dbActivities = resActivities.data?.filter(a => a.project_id === dbProj.id).map(a => ({
                                    id: a.id, timestamp: a.timestamp, action: a.action, detail: a.detail, category: a.category
                                })) as ActivityEntry[] || [];

                                const contractAmount = dbProj.contract_amount ? Number(dbProj.contract_amount) : newProjects[localIndex]?.budget?.contractAmount || 0;

                                if (localIndex >= 0) {
                                    newProjects[localIndex] = {
                                        ...newProjects[localIndex],
                                        info: {
                                            ...newProjects[localIndex].info,
                                            name: dbProj.name,
                                            description: dbProj.description || '',
                                            client: dbProj.client || '',
                                            startDate: dbProj.start_date || '',
                                            endDate: dbProj.end_date || '',
                                            manager: dbProj.manager || ''
                                        },
                                        budget: {
                                            contractAmount,
                                            entries: dbBudgetEntries.length > 0 ? dbBudgetEntries : newProjects[localIndex].budget.entries,
                                        },
                                        members: dbMembers.length > 0 ? dbMembers : newProjects[localIndex].members,
                                        documents: dbDocuments.length > 0 ? dbDocuments : newProjects[localIndex].documents,
                                        policies: dbPolicies.length > 0 ? dbPolicies : newProjects[localIndex].policies,
                                        activities: dbActivities.length > 0 ? dbActivities : newProjects[localIndex].activities,
                                        tasks: dbTasks.length > 0 ? dbTasks : newProjects[localIndex].tasks,
                                        issues: dbIssues.length > 0 ? dbIssues : newProjects[localIndex].issues,
                                        risks: dbRisks.length > 0 ? dbRisks : newProjects[localIndex].risks,
                                        siteLogs: dbSiteLogs.length > 0 ? dbSiteLogs : newProjects[localIndex].siteLogs,
                                        changeRequests: dbChanges.length > 0 ? dbChanges : newProjects[localIndex].changeRequests,
                                        actionItems: dbActions.length > 0 ? dbActions : newProjects[localIndex].actionItems,
                                        decisions: dbDecisions.length > 0 ? dbDecisions : newProjects[localIndex].decisions,
                                        meetings: dbMeetings.length > 0 ? dbMeetings : newProjects[localIndex].meetings,
                                        communications: dbComms.length > 0 ? dbComms : newProjects[localIndex].communications,
                                        milestones: dbMilestones.length > 0 ? dbMilestones : newProjects[localIndex].milestones,
                                        deployments: dbDeployments.length > 0 ? dbDeployments : newProjects[localIndex].deployments,
                                        vendors: dbVendors.length > 0 ? dbVendors : newProjects[localIndex].vendors,
                                        procurements: dbProcurements.length > 0 ? dbProcurements : newProjects[localIndex].procurements,
                                        assets: dbAssets.length > 0 ? dbAssets : newProjects[localIndex].assets,
                                        systems: dbSystems.length > 0 ? dbSystems : newProjects[localIndex].systems,
                                    };
                                } else {
                                    // New project from DB
                                    const newP: Project = {
                                        ...DEFAULT_PROJECT,
                                        id: dbProj.id,
                                        info: {
                                            name: dbProj.name,
                                            description: dbProj.description || '',
                                            client: dbProj.client || '',
                                            startDate: dbProj.start_date || '',
                                            endDate: dbProj.end_date || '',
                                            manager: dbProj.manager || '',
                                        },
                                        budget: {
                                            contractAmount: dbProj.contract_amount ? Number(dbProj.contract_amount) : 0,
                                            entries: dbBudgetEntries,
                                        },
                                        members: dbMembers,
                                        documents: dbDocuments,
                                        policies: dbPolicies,
                                        activities: dbActivities,
                                        tasks: dbTasks,
                                        issues: dbIssues,
                                        risks: dbRisks,
                                        siteLogs: dbSiteLogs,
                                        changeRequests: dbChanges,
                                        actionItems: dbActions,
                                        decisions: dbDecisions,
                                        meetings: dbMeetings,
                                        communications: dbComms,
                                        milestones: dbMilestones,
                                        deployments: dbDeployments,
                                        vendors: dbVendors,
                                        procurements: dbProcurements,
                                        assets: dbAssets,
                                        systems: dbSystems,
                                        notifications: [],
                                    };
                                    newProjects.push(newP);
                                }
                            });

                            // Make sure activeProjectId isn't pointing to a non-existent project
                            const activeId = newProjects.some(p => p.id === state.activeProjectId) ? state.activeProjectId : (newProjects[0]?.id || 'proj-1');

                            return { projects: newProjects, activeProjectId: activeId };
                        });
                    }
                } catch (error) {
                    console.error("Error fetching from Supabase:", error);
                }
            },

            // ── Project Management ──
            addProject: async (project) => {
                set((s) => ({ projects: [...s.projects, project], activeProjectId: project.id }));
                await supabase.from('projects').insert([{
                    id: project.id,
                    name: project.info.name,
                    description: project.info.description,
                    client: project.info.client,
                    start_date: project.info.startDate,
                    end_date: project.info.endDate,
                    manager: project.info.manager,
                }]);
            },
            switchProject: (id) => set({ activeProjectId: id }),
            deleteProject: (id) =>
                set((s) => {
                    const remaining = s.projects.filter((p) => p.id !== id);
                    if (remaining.length === 0) return s;
                    return {
                        projects: remaining,
                        activeProjectId: s.activeProjectId === id ? remaining[0].id : s.activeProjectId,
                    };
                }),
            updateProjectInfo: (updates) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        info: { ...p.info, ...updates },
                    })),
                })),

            // ── Budget ──
            setContractAmount: async (amount) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        budget: { ...p.budget, contractAmount: amount },
                    })),
                }));
                const state = get();
                await supabase.from('projects').update({ contract_amount: amount }).eq('id', state.activeProjectId);
            },
            addBudgetEntry: async (entry) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        budget: { ...p.budget, entries: [...p.budget.entries, entry] },
                    })),
                }));
                const state = get();
                await supabase.from('budget_entries').insert([{
                    id: entry.id,
                    project_id: state.activeProjectId,
                    date: entry.date,
                    category: entry.category,
                    description: entry.description,
                    amount: entry.amount
                }]);
            },
            deleteBudgetEntry: async (id) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        budget: { ...p.budget, entries: p.budget.entries.filter((e) => e.id !== id) },
                    })),
                }));
                await supabase.from('budget_entries').delete().eq('id', id);
            },

            // ── Activity ──
            addActivity: (entry) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        activities: [entry, ...p.activities].slice(0, 100),
                    })),
                })),

            // ── Task CRUD ──
            addTask: async (task) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        tasks: addToCollection(p.tasks, task),
                    })),
                }));
                const state = get();
                await supabase.from('tasks').insert([{
                    id: task.id,
                    project_id: state.activeProjectId,
                    title: task.title,
                    description: task.description,
                    owner_id: task.ownerId,
                    start_date: task.startDate,
                    due_date: task.dueDate,
                    status: task.status,
                    priority: task.priority,
                    progress: task.progress,
                    dependencies: task.dependencies,
                    tags: task.tags,
                    parent_id: task.parentId,
                    is_milestone: task.isMilestone,
                    workstream: task.workstream,
                    related_milestone_id: task.relatedMilestoneId,
                }]);
            },
            updateTask: async (id, updates) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        tasks: updateInCollection(p.tasks, id, updates),
                    })),
                }));

                // Map camelCase to snake_case for Supabase
                const dbUpdates: Record<string, unknown> = {};
                if (updates.title !== undefined) dbUpdates.title = updates.title;
                if (updates.description !== undefined) dbUpdates.description = updates.description;
                if (updates.ownerId !== undefined) dbUpdates.owner_id = updates.ownerId;
                if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
                if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
                if (updates.status !== undefined) dbUpdates.status = updates.status;
                if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
                if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
                if (updates.dependencies !== undefined) dbUpdates.dependencies = updates.dependencies;
                if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
                if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;
                if (updates.isMilestone !== undefined) dbUpdates.is_milestone = updates.isMilestone;
                if (updates.workstream !== undefined) dbUpdates.workstream = updates.workstream;
                if (updates.relatedMilestoneId !== undefined) dbUpdates.related_milestone_id = updates.relatedMilestoneId;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase.from('tasks').update(dbUpdates).eq('id', id);
                }
            },
            deleteTask: async (id) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        tasks: p.tasks.filter((t) => t.id !== id && t.parentId !== id),
                    })),
                }));
                await supabase.from('tasks').delete().eq('id', id);
            },

            // ── Issue CRUD ──
            addIssue: async (issue) => {
                set((s) => {
                    let newNotifications = s.projects.find(p => p.id === s.activeProjectId)?.notifications || [];
                    if (issue.severity === 'S1' || issue.severity === 'S2') {
                        const notif: AppNotification = {
                            id: generateId('notif'),
                            title: 'Critical Issue Reported',
                            message: `[${issue.severity}] ${issue.title}`,
                            read: false,
                            timestamp: new Date().toISOString(),
                            type: 'alert',
                            link: '/issues'
                        };
                        newNotifications = [notif, ...newNotifications];
                    }
                    return {
                        projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                            issues: addToCollection(p.issues, issue),
                            notifications: newNotifications,
                        })),
                    };
                });
                const state = get();
                await supabase.from('issues').insert([{
                    id: issue.id,
                    project_id: state.activeProjectId,
                    title: issue.title,
                    description: issue.description,
                    severity: issue.severity,
                    owner_id: issue.ownerId,
                    due_date: issue.dueDate,
                    status: issue.status,
                    related_task_id: issue.relatedTaskId,
                    related_release_id: issue.relatedReleaseId,
                    created_at: issue.createdAt,
                }]);
            },
            updateIssue: async (id, updates) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        issues: updateInCollection(p.issues, id, updates),
                    })),
                }));

                const dbUpdates: Record<string, unknown> = {};
                if (updates.title !== undefined) dbUpdates.title = updates.title;
                if (updates.description !== undefined) dbUpdates.description = updates.description;
                if (updates.severity !== undefined) dbUpdates.severity = updates.severity;
                if (updates.ownerId !== undefined) dbUpdates.owner_id = updates.ownerId;
                if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
                if (updates.status !== undefined) dbUpdates.status = updates.status;
                if (updates.relatedTaskId !== undefined) dbUpdates.related_task_id = updates.relatedTaskId;
                if (updates.relatedReleaseId !== undefined) dbUpdates.related_release_id = updates.relatedReleaseId;
                if (updates.createdAt !== undefined) dbUpdates.created_at = updates.createdAt;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase.from('issues').update(dbUpdates).eq('id', id);
                }
            },
            deleteIssue: async (id) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        issues: deleteFromCollection(p.issues, id),
                    })),
                }));
                await supabase.from('issues').delete().eq('id', id);
            },

            // ── Member CRUD ──
            addMember: async (member) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        members: addToCollection(p.members, member),
                    })),
                }));
                const state = get();
                await supabase.from('members').insert([{
                    id: member.id,
                    project_id: state.activeProjectId,
                    name: member.name,
                    role: member.role,
                    email: member.email,
                    phone: member.phone,
                    company: member.company,
                    location: member.location,
                    country: member.country,
                    notes: member.notes
                }]);
            },
            updateMember: async (id, updates) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        members: updateInCollection(p.members, id, updates),
                    })),
                }));
                const dbUpdates: Record<string, unknown> = {};
                if (updates.name !== undefined) dbUpdates.name = updates.name;
                if (updates.role !== undefined) dbUpdates.role = updates.role;
                if (updates.email !== undefined) dbUpdates.email = updates.email;
                if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
                if (updates.company !== undefined) dbUpdates.company = updates.company;
                if (updates.location !== undefined) dbUpdates.location = updates.location;
                if (updates.country !== undefined) dbUpdates.country = updates.country;
                if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
                if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase.from('members').update(dbUpdates).eq('id', id);
                }
            },
            deleteMember: async (id) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        members: deleteFromCollection(p.members, id),
                    })),
                }));
                await supabase.from('members').delete().eq('id', id);
            },

            // ── Document CRUD ──
            addDocument: async (doc) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        documents: addToCollection(p.documents, doc),
                    })),
                }));
                const state = get();
                await supabase.from('documents').insert([{
                    id: doc.id,
                    project_id: state.activeProjectId,
                    title: doc.title,
                    url: doc.url,
                    upload_date: doc.uploadDate,
                    uploaded_by: doc.uploadedBy,
                    type: doc.type,
                    size: doc.size
                }]);
            },
            deleteDocument: async (id) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        documents: deleteFromCollection(p.documents, id),
                    })),
                }));
                await supabase.from('documents').delete().eq('id', id);
            },

            // ── Policy CRUD ──
            addPolicy: async (policy) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        policies: addToCollection(p.policies, policy),
                    })),
                }));
                const state = get();
                await supabase.from('policies').insert([{
                    id: policy.id,
                    project_id: state.activeProjectId,
                    title: policy.title,
                    content: policy.content,
                    last_updated: policy.lastUpdated
                }]);
            },
            updatePolicy: async (id, updates) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        policies: updateInCollection(p.policies, id, updates),
                    })),
                }));
                const dbUpdates: Record<string, unknown> = {};
                if (updates.title !== undefined) dbUpdates.title = updates.title;
                if (updates.content !== undefined) dbUpdates.content = updates.content;
                if (updates.lastUpdated !== undefined) dbUpdates.last_updated = updates.lastUpdated;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase.from('policies').update(dbUpdates).eq('id', id);
                }
            },
            deletePolicy: async (id) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        policies: deleteFromCollection(p.policies, id),
                    })),
                }));
                await supabase.from('policies').delete().eq('id', id);
            },

            // ═══════════════════════════════════════════
            // ── NEW ENTITY CRUD ────────────────────────
            // ═══════════════════════════════════════════

            addRisk: async (risk) => {
                set((s) => {
                    let newNotifications = s.projects.find(p => p.id === s.activeProjectId)?.notifications || [];
                    if (risk.probability === 'High' && risk.impact === 'High') {
                        const notif: AppNotification = {
                            id: generateId('notif'),
                            title: 'High Risk Identified',
                            message: `Critical risk added: ${risk.title}`,
                            read: false,
                            timestamp: new Date().toISOString(),
                            type: 'warning',
                            link: '/issues'
                        };
                        newNotifications = [notif, ...newNotifications];
                    }
                    return {
                        projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                            risks: addToCollection(p.risks || [], risk),
                            notifications: newNotifications
                        })),
                    };
                });
                const state = get();
                await supabase.from('risks').insert([{
                    id: risk.id,
                    project_id: state.activeProjectId,
                    title: risk.title,
                    probability: risk.probability,
                    impact: risk.impact,
                    status: risk.status,
                    owner_id: risk.ownerId,
                    mitigation_plan: risk.mitigation,
                    created_at: risk.createdAt,
                    updated_at: risk.updatedAt
                }]);
            },
            updateRisk: async (id, updates) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        risks: updateInCollection(p.risks || [], id, updates),
                    })),
                }));
                const dbUpdates: Record<string, unknown> = {};
                if (updates.title !== undefined) dbUpdates.title = updates.title;
                if (updates.probability !== undefined) dbUpdates.probability = updates.probability;
                if (updates.impact !== undefined) dbUpdates.impact = updates.impact;
                if (updates.status !== undefined) dbUpdates.status = updates.status;
                if (updates.ownerId !== undefined) dbUpdates.owner_id = updates.ownerId;
                if (updates.mitigation !== undefined) dbUpdates.mitigation_plan = updates.mitigation;
                if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase.from('risks').update(dbUpdates).eq('id', id);
                }
            },
            deleteRisk: async (id) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        risks: deleteFromCollection(p.risks || [], id),
                    })),
                }));
                await supabase.from('risks').delete().eq('id', id);
            },

            // ── Change Request CRUD ──
            addChangeRequest: async (cr) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        changeRequests: addToCollection(p.changeRequests || [], cr),
                    })),
                }));
                const state = get();
                await supabase.from('change_requests').insert([{
                    id: cr.id,
                    project_id: state.activeProjectId,
                    title: cr.title,
                    request_date: cr.requestDate,
                    requester: cr.requester,
                    change_type: cr.changeType,
                    impact_summary: cr.impactSummary,
                    reference: cr.reference,
                    status: cr.status,
                    approver: cr.approver,
                    related_document_id: cr.relatedDocumentId,
                    related_issue_id: cr.relatedIssueId,
                    related_milestone_id: cr.relatedMilestoneId,
                    related_deployment_id: cr.relatedDeploymentId,
                    created_at: cr.createdAt
                }]);
            },
            updateChangeRequest: async (id, updates) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        changeRequests: updateInCollection(p.changeRequests || [], id, updates),
                    })),
                }));
                const dbUpdates: Record<string, unknown> = {};
                if (updates.title !== undefined) dbUpdates.title = updates.title;
                if (updates.requestDate !== undefined) dbUpdates.request_date = updates.requestDate;
                if (updates.requester !== undefined) dbUpdates.requester = updates.requester;
                if (updates.changeType !== undefined) dbUpdates.change_type = updates.changeType;
                if (updates.impactSummary !== undefined) dbUpdates.impact_summary = updates.impactSummary;
                if (updates.reference !== undefined) dbUpdates.reference = updates.reference;
                if (updates.status !== undefined) dbUpdates.status = updates.status;
                if (updates.approver !== undefined) dbUpdates.approver = updates.approver;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase.from('change_requests').update(dbUpdates).eq('id', id);
                }
            },
            deleteChangeRequest: async (id) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        changeRequests: deleteFromCollection(p.changeRequests || [], id),
                    })),
                }));
                await supabase.from('change_requests').delete().eq('id', id);
            },

            // ── Action Item CRUD ──
            addActionItem: async (item) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        actionItems: addToCollection(p.actionItems || [], item),
                    })),
                }));
                const state = get();
                await supabase.from('action_items').insert([{
                    id: item.id,
                    project_id: state.activeProjectId,
                    title: item.title,
                    owner_id: item.ownerId,
                    due_date: item.dueDate,
                    status: item.status,
                    priority: item.priority,
                    source_type: item.sourceType,
                    source_id: item.sourceId,
                    source_link: item.sourceLink,
                    description: item.description,
                    related_issue_id: item.relatedIssueId,
                    related_cr_id: item.relatedCRId,
                    related_milestone_id: item.relatedMilestoneId,
                    related_deployment_id: item.relatedDeploymentId,
                    created_at: item.createdAt
                }]);
            },
            updateActionItem: async (id, updates) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        actionItems: updateInCollection(p.actionItems || [], id, updates),
                    })),
                }));
                const dbUpdates: Record<string, unknown> = {};
                if (updates.title !== undefined) dbUpdates.title = updates.title;
                if (updates.ownerId !== undefined) dbUpdates.owner_id = updates.ownerId;
                if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
                if (updates.status !== undefined) dbUpdates.status = updates.status;
                if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
                if (updates.description !== undefined) dbUpdates.description = updates.description;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase.from('action_items').update(dbUpdates).eq('id', id);
                }
            },
            deleteActionItem: async (id) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        actionItems: deleteFromCollection(p.actionItems || [], id),
                    })),
                }));
                await supabase.from('action_items').delete().eq('id', id);
            },

            // ── Decision CRUD ──
            addDecision: async (decision) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        decisions: addToCollection(p.decisions || [], decision),
                    })),
                }));
                const state = get();
                await supabase.from('decisions').insert([{
                    id: decision.id,
                    project_id: state.activeProjectId,
                    date: decision.date,
                    summary: decision.summary,
                    decided_by: decision.decidedBy,
                    impact_areas: decision.impactAreas,
                    reason: decision.reason,
                    source_type: decision.sourceType,
                    source_id: decision.sourceId,
                    source_link: decision.sourceLink,
                    related_cr_id: decision.relatedCRId,
                    related_milestone_id: decision.relatedMilestoneId,
                    related_deployment_id: decision.relatedDeploymentId,
                    created_at: decision.createdAt
                }]);
            },
            updateDecision: async (id, updates) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        decisions: updateInCollection(p.decisions || [], id, updates),
                    })),
                }));
                const dbUpdates: Record<string, unknown> = {};
                if (updates.date !== undefined) dbUpdates.date = updates.date;
                if (updates.summary !== undefined) dbUpdates.summary = updates.summary;
                if (updates.decidedBy !== undefined) dbUpdates.decided_by = updates.decidedBy;
                if (updates.impactAreas !== undefined) dbUpdates.impact_areas = updates.impactAreas;
                if (updates.reason !== undefined) dbUpdates.reason = updates.reason;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase.from('decisions').update(dbUpdates).eq('id', id);
                }
            },
            deleteDecision: async (id) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        decisions: deleteFromCollection(p.decisions || [], id),
                    })),
                }));
                await supabase.from('decisions').delete().eq('id', id);
            },

            // ── Meeting CRUD ──
            addMeeting: (meeting) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        meetings: addToCollection(p.meetings || [], meeting),
                    })),
                })),
            updateMeeting: (id, updates) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        meetings: updateInCollection(p.meetings || [], id, updates),
                    })),
                })),
            deleteMeeting: (id) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        meetings: deleteFromCollection(p.meetings || [], id),
                    })),
                })),

            // ── Communication CRUD ──
            addCommunication: (comm) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        communications: addToCollection(p.communications || [], comm),
                    })),
                })),
            updateCommunication: (id, updates) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        communications: updateInCollection(p.communications || [], id, updates),
                    })),
                })),
            deleteCommunication: (id) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        communications: deleteFromCollection(p.communications || [], id),
                    })),
                })),

            // ── Milestone CRUD ──
            addMilestone: async (milestone) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        milestones: addToCollection(p.milestones || [], milestone),
                    })),
                }));
                const state = get();
                await supabase.from('milestones').insert([{
                    id: milestone.id,
                    project_id: state.activeProjectId,
                    title: milestone.title,
                    description: milestone.description,
                    date: milestone.date,
                    status: milestone.status,
                    owner_id: milestone.ownerId,
                    created_at: milestone.createdAt
                }]);
            },
            updateMilestone: async (id, updates) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        milestones: updateInCollection(p.milestones || [], id, updates),
                    })),
                }));
                const dbUpdates: Record<string, unknown> = {};
                if (updates.title !== undefined) dbUpdates.title = updates.title;
                if (updates.description !== undefined) dbUpdates.description = updates.description;
                if (updates.date !== undefined) dbUpdates.date = updates.date;
                if (updates.status !== undefined) dbUpdates.status = updates.status;
                if (updates.ownerId !== undefined) dbUpdates.owner_id = updates.ownerId;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase.from('milestones').update(dbUpdates).eq('id', id);
                }
            },
            deleteMilestone: async (id) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        milestones: deleteFromCollection(p.milestones || [], id),
                    })),
                }));
                await supabase.from('milestones').delete().eq('id', id);
            },

            // ── Deployment CRUD ──
            addDeployment: (deployment) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        deployments: addToCollection(p.deployments || [], deployment),
                    })),
                })),
            updateDeployment: (id, updates) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        deployments: updateInCollection(p.deployments || [], id, updates),
                    })),
                })),
            deleteDeployment: (id) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        deployments: deleteFromCollection(p.deployments || [], id),
                    })),
                })),
            // ── Vendor CRUD ──
            addVendor: async (vendor) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        vendors: addToCollection(p.vendors || [], vendor),
                    })),
                }));
                const state = get();
                await supabase.from('vendors').insert([{
                    id: vendor.id,
                    project_id: state.activeProjectId,
                    name: vendor.name,
                    service_type: vendor.serviceType,
                    contact_name: vendor.contactName,
                    contact_email: vendor.contactEmail,
                    contact_phone: vendor.contactPhone,
                    status: vendor.status,
                    notes: vendor.notes,
                    created_at: vendor.createdAt
                }]);
            },
            updateVendor: async (id, updates) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        vendors: updateInCollection(p.vendors || [], id, updates),
                    })),
                }));
                const dbUpdates: Record<string, unknown> = {};
                if (updates.name !== undefined) dbUpdates.name = updates.name;
                if (updates.serviceType !== undefined) dbUpdates.service_type = updates.serviceType;
                if (updates.contactName !== undefined) dbUpdates.contact_name = updates.contactName;
                if (updates.contactEmail !== undefined) dbUpdates.contact_email = updates.contactEmail;
                if (updates.contactPhone !== undefined) dbUpdates.contact_phone = updates.contactPhone;
                if (updates.status !== undefined) dbUpdates.status = updates.status;
                if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase.from('vendors').update(dbUpdates).eq('id', id);
                }
            },
            deleteVendor: async (id) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        vendors: deleteFromCollection(p.vendors || [], id),
                    })),
                }));
                await supabase.from('vendors').delete().eq('id', id);
            },

            // ── Procurement CRUD ──
            addProcurement: async (procurement) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        procurements: addToCollection(p.procurements || [], procurement),
                    })),
                }));
                const state = get();
                await supabase.from('procurements').insert([{
                    id: procurement.id,
                    project_id: state.activeProjectId,
                    title: procurement.title,
                    vendor_id: procurement.vendorId,
                    contract_amount: procurement.contractAmount,
                    description: procurement.description,
                    start_date: procurement.startDate,
                    end_date: procurement.endDate,
                    status: procurement.status,
                    related_milestone_id: procurement.relatedMilestoneId,
                    created_at: procurement.createdAt
                }]);
            },
            updateProcurement: async (id, updates) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        procurements: updateInCollection(p.procurements || [], id, updates),
                    })),
                }));
                const dbUpdates: Record<string, unknown> = {};
                if (updates.title !== undefined) dbUpdates.title = updates.title;
                if (updates.vendorId !== undefined) dbUpdates.vendor_id = updates.vendorId;
                if (updates.contractAmount !== undefined) dbUpdates.contract_amount = updates.contractAmount;
                if (updates.description !== undefined) dbUpdates.description = updates.description;
                if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
                if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
                if (updates.status !== undefined) dbUpdates.status = updates.status;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase.from('procurements').update(dbUpdates).eq('id', id);
                }
            },
            deleteProcurement: async (id) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        procurements: deleteFromCollection(p.procurements || [], id),
                    })),
                }));
                await supabase.from('procurements').delete().eq('id', id);
            },

            // ── Asset CRUD ──
            addAsset: async (asset) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        assets: addToCollection(p.assets || [], asset),
                    })),
                }));
                const state = get();
                await supabase.from('assets').insert([{
                    id: asset.id,
                    project_id: state.activeProjectId,
                    tag: asset.tag,
                    name: asset.name,
                    model: asset.model,
                    serial_number: asset.serialNumber,
                    location: asset.location,
                    owner_id: asset.ownerId,
                    status: asset.status,
                    purchase_date: asset.purchaseDate,
                    notes: asset.notes,
                    created_at: asset.createdAt
                }]);
            },
            updateAsset: async (id, updates) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        assets: updateInCollection(p.assets || [], id, updates),
                    })),
                }));
                const dbUpdates: Record<string, unknown> = {};
                if (updates.tag !== undefined) dbUpdates.tag = updates.tag;
                if (updates.name !== undefined) dbUpdates.name = updates.name;
                if (updates.model !== undefined) dbUpdates.model = updates.model;
                if (updates.serialNumber !== undefined) dbUpdates.serial_number = updates.serialNumber;
                if (updates.location !== undefined) dbUpdates.location = updates.location;
                if (updates.ownerId !== undefined) dbUpdates.owner_id = updates.ownerId;
                if (updates.status !== undefined) dbUpdates.status = updates.status;
                if (updates.purchaseDate !== undefined) dbUpdates.purchase_date = updates.purchaseDate;
                if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase.from('assets').update(dbUpdates).eq('id', id);
                }
            },
            deleteAsset: async (id) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        assets: deleteFromCollection(p.assets || [], id),
                    })),
                }));
                await supabase.from('assets').delete().eq('id', id);
            },

            // ── System Integration CRUD ──
            addSystem: async (system) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        systems: addToCollection(p.systems || [], system),
                    })),
                }));
                const state = get();
                await supabase.from('systems').insert([{
                    id: system.id,
                    project_id: state.activeProjectId,
                    name: system.name,
                    version: system.version,
                    environment: system.environment,
                    status: system.status,
                    vendor_id: system.vendorId,
                    url: system.url,
                    notes: system.notes,
                    last_checked: system.lastChecked,
                    created_at: system.createdAt
                }]);
            },
            updateSystem: async (id, updates) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        systems: updateInCollection(p.systems || [], id, updates),
                    })),
                }));
                const dbUpdates: Record<string, unknown> = {};
                if (updates.name !== undefined) dbUpdates.name = updates.name;
                if (updates.version !== undefined) dbUpdates.version = updates.version;
                if (updates.environment !== undefined) dbUpdates.environment = updates.environment;
                if (updates.status !== undefined) dbUpdates.status = updates.status;
                if (updates.vendorId !== undefined) dbUpdates.vendor_id = updates.vendorId;
                if (updates.url !== undefined) dbUpdates.url = updates.url;
                if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
                if (updates.lastChecked !== undefined) dbUpdates.last_checked = updates.lastChecked;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase.from('systems').update(dbUpdates).eq('id', id);
                }
            },
            deleteSystem: async (id) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        systems: deleteFromCollection(p.systems || [], id),
                    })),
                }));
                await supabase.from('systems').delete().eq('id', id);
            },

            // ── Site Log CRUD ──
            addSiteLog: async (log) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        siteLogs: addToCollection(p.siteLogs || [], log),
                    })),
                }));
                const state = get();
                await supabase.from('site_logs').insert([{
                    id: log.id,
                    project_id: state.activeProjectId,
                    date: log.date,
                    logger_id: log.loggerId,
                    weather_condition: log.weather?.condition,
                    weather_temperature: log.weather?.temperature,
                    personnel_count: log.personnelCount,
                    work_summary: log.workSummary,
                    next_day_plan: log.nextDayPlan,
                    related_issue_ids: log.relatedIssueIds || [],
                    related_risk_ids: log.relatedRiskIds || [],
                    created_at: log.createdAt,
                    updated_at: log.updatedAt
                }]);
            },
            updateSiteLog: async (id, updates) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        siteLogs: updateInCollection(p.siteLogs || [], id, updates),
                    })),
                }));
                const dbUpdates: Record<string, unknown> = {};
                if (updates.date !== undefined) dbUpdates.date = updates.date;
                if (updates.loggerId !== undefined) dbUpdates.logger_id = updates.loggerId;
                if (updates.weather !== undefined) {
                    dbUpdates.weather_condition = updates.weather.condition;
                    dbUpdates.weather_temperature = updates.weather.temperature;
                }
                if (updates.personnelCount !== undefined) dbUpdates.personnel_count = updates.personnelCount;
                if (updates.workSummary !== undefined) dbUpdates.work_summary = updates.workSummary;
                if (updates.nextDayPlan !== undefined) dbUpdates.next_day_plan = updates.nextDayPlan;
                if (updates.relatedIssueIds !== undefined) dbUpdates.related_issue_ids = updates.relatedIssueIds;
                if (updates.relatedRiskIds !== undefined) dbUpdates.related_risk_ids = updates.relatedRiskIds;
                if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt;

                if (Object.keys(dbUpdates).length > 0) {
                    await supabase.from('site_logs').update(dbUpdates).eq('id', id);
                }
            },
            deleteSiteLog: async (id) => {
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        siteLogs: deleteFromCollection(p.siteLogs || [], id),
                    })),
                }));
                await supabase.from('site_logs').delete().eq('id', id);
            },

            // ── Notifications CRUD ──
            addNotification: (notification) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        notifications: [notification, ...(p.notifications || [])],
                    })),
                })),
            markNotificationAsRead: (id) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        notifications: (p.notifications || []).map(n => n.id === id ? { ...n, read: true } : n),
                    })),
                })),
            markAllNotificationsAsRead: () =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        notifications: (p.notifications || []).map(n => ({ ...n, read: true })),
                    })),
                })),
            deleteNotification: (id) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        notifications: deleteFromCollection(p.notifications || [], id),
                    })),
                })),
        }),
        {
            name: 'ags-project-hub-v5',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// ─── Convenience Selectors (hook-safe) ──────────────────────
export const useActiveProject = () =>
    useStore((s) => s.projects.find((p) => p.id === s.activeProjectId));
