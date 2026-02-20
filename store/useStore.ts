import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, Task, Issue, Member, DocumentLink, ProjectPolicy } from '@/types';

// Mock Data
const INITIAL_TASKS: Task[] = [
    { id: 't-1', title: 'Project Initiation', status: 'Done', priority: 'P0', startDate: '2026-02-01', dueDate: '2026-02-05', progress: 100, dependencies: [], tags: ['Management'] },
    { id: 't-2', title: 'Requirement Gathering', status: 'Done', priority: 'P1', startDate: '2026-02-06', dueDate: '2026-02-10', progress: 100, dependencies: ['t-1'], tags: ['Product'] },
    { id: 't-3', title: 'Design System Implementation', status: 'In Progress', priority: 'P1', startDate: '2026-02-11', dueDate: '2026-02-20', progress: 60, dependencies: ['t-2'], tags: ['Dev', 'UI'] },
    { id: 't-4', title: 'Backend API Setup', status: 'Not Started', priority: 'P2', startDate: '2026-02-21', dueDate: '2026-03-01', progress: 0, dependencies: ['t-2'], tags: ['Dev', 'Backend'] },
    { id: 't-5', title: 'User Acceptance Testing (UAT)', status: 'Not Started', priority: 'P0', startDate: '2026-03-15', dueDate: '2026-03-20', progress: 0, dependencies: ['t-3', 't-4'], tags: ['QA'] },
];

const INITIAL_ISSUES: Issue[] = [
    { id: 'i-1', title: 'Login API Timeout', description: 'Authentication endpoint times out intermittently.', severity: 'S2', status: 'In Progress', createdAt: '2026-02-15', relatedTaskId: 't-4' },
    { id: 'i-2', title: 'Missing Mobile Layout', description: 'Dashboard is not responsive on mobile devices.', severity: 'S3', status: 'New', createdAt: '2026-02-18', relatedTaskId: 't-3' },
];

const INITIAL_MEMBERS: Member[] = [
    { id: 'm-1', name: 'Alex Johnson', role: 'Project Manager', email: 'alex.j@example.com', team: 'PMO', timezone: 'UTC+9' },
    { id: 'm-2', name: 'Sarah Lee', role: 'Lead Developer', email: 'sarah.l@example.com', team: 'Engineering', timezone: 'UTC+9' },
    { id: 'm-3', name: 'Mike Chen', role: 'QA Engineer', email: 'mike.c@example.com', team: 'QA', timezone: 'UTC+8' },
];

const INITIAL_DOCS: DocumentLink[] = [
    { id: 'd-1', title: 'Project Plan v1.0', url: 'https://sharepoint.com/project-plan', category: 'Plan', updatedAt: '2026-02-01' },
    { id: 'd-2', title: 'UI Design Figma', url: 'https://figma.com/file/xyz', category: 'Design', updatedAt: '2026-02-10' },
];

const INITIAL_POLICIES: ProjectPolicy[] = [
    { id: 'p-1', title: 'Escalation Process', content: '## Severity Levels\n- **S1 (Critical)**: Immediate escalation to PM & Director. SLA < 2 hrs.\n- **S2 (High)**: Escalate to PM. SLA < 8 hrs.\n- **S3 (Medium)**: Weekly review.\n- **S4 (Low)**: Backlog.', lastUpdated: '2026-02-01' },
    { id: 'p-2', title: 'Definition of Done', content: '- Code reviewed\n- Unit tests passed\n- QA verified on staging\n- Docs updated', lastUpdated: '2026-02-01' },
];

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            tasks: INITIAL_TASKS,
            issues: INITIAL_ISSUES,
            members: INITIAL_MEMBERS,
            documents: INITIAL_DOCS,
            policies: INITIAL_POLICIES,

            addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
            updateTask: (id, updates) =>
                set((state) => ({
                    tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
                })),
            deleteTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

            addIssue: (issue) => set((state) => ({ issues: [...state.issues, issue] })),
            updateIssue: (id, updates) =>
                set((state) => ({
                    issues: state.issues.map((i) => (i.id === id ? { ...i, ...updates } : i)),
                })),
        }),
        {
            name: 'project-hub-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
