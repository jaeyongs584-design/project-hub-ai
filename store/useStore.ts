import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, Project, Task, Issue, Member, DocumentLink, ProjectPolicy, ProjectInfo, BudgetEntry, ActivityEntry } from '@/types';

import { getInitialTasks, getDefaultPolicies } from '@/lib/templates';


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
};

// ─── Helper: update active project ──────────────────────────
const updateActiveProject = (
    projects: Project[],
    activeId: string,
    updater: (p: Project) => Partial<Project>
): Project[] =>
    projects.map((p) => (p.id === activeId ? { ...p, ...updater(p) } : p));

// ─── Store ───────────────────────────────────────────────────
export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            projects: [DEFAULT_PROJECT],
            activeProjectId: 'proj-1',

            // ── Project Management ──
            addProject: (project) =>
                set((s) => ({ projects: [...s.projects, project], activeProjectId: project.id })),
            switchProject: (id) => set({ activeProjectId: id }),
            deleteProject: (id) =>
                set((s) => {
                    const remaining = s.projects.filter((p) => p.id !== id);
                    if (remaining.length === 0) return s; // prevent deleting last project
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
            setContractAmount: (amount) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        budget: { ...p.budget, contractAmount: amount },
                    })),
                })),
            addBudgetEntry: (entry) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        budget: { ...p.budget, entries: [...p.budget.entries, entry] },
                    })),
                })),
            deleteBudgetEntry: (id) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        budget: { ...p.budget, entries: p.budget.entries.filter((e) => e.id !== id) },
                    })),
                })),

            // ── Activity ──
            addActivity: (entry) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        activities: [entry, ...p.activities].slice(0, 100), // keep last 100
                    })),
                })),

            // ── Task CRUD ──
            addTask: (task) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        tasks: [...p.tasks, task],
                    })),
                })),
            updateTask: (id, updates) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        tasks: p.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
                    })),
                })),
            deleteTask: (id) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        tasks: p.tasks.filter((t) => t.id !== id && t.parentId !== id),
                    })),
                })),

            // ── Issue CRUD ──
            addIssue: (issue) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        issues: [...p.issues, issue],
                    })),
                })),
            updateIssue: (id, updates) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        issues: p.issues.map((i) => (i.id === id ? { ...i, ...updates } : i)),
                    })),
                })),
            deleteIssue: (id) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        issues: p.issues.filter((i) => i.id !== id),
                    })),
                })),

            // ── Member CRUD ──
            addMember: (member) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        members: [...p.members, member],
                    })),
                })),
            updateMember: (id, updates) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        members: p.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
                    })),
                })),
            deleteMember: (id) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        members: p.members.filter((m) => m.id !== id),
                    })),
                })),

            // ── Document CRUD ──
            addDocument: (doc) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        documents: [...p.documents, doc],
                    })),
                })),
            deleteDocument: (id) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        documents: p.documents.filter((d) => d.id !== id),
                    })),
                })),

            // ── Policy CRUD ──
            addPolicy: (policy) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        policies: [...p.policies, policy],
                    })),
                })),
            updatePolicy: (id, updates) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        policies: p.policies.map((pol) => (pol.id === id ? { ...pol, ...updates } : pol)),
                    })),
                })),
            deletePolicy: (id) =>
                set((s) => ({
                    projects: updateActiveProject(s.projects, s.activeProjectId, (p) => ({
                        policies: p.policies.filter((pol) => pol.id !== id),
                    })),
                })),
        }),
        {
            name: 'ags-project-hub-v4',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// ─── Convenience Selectors (hook-safe) ──────────────────────
// Used everywhere: useActiveProject() returns the active project or undefined
export const useActiveProject = () =>
    useStore((s) => s.projects.find((p) => p.id === s.activeProjectId));
