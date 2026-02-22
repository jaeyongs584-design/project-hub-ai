import { useStore } from '@/store/useStore';
import { Project } from '@/types';

/**
 * Returns the active project data. All pages should use this instead of
 * destructuring from useStore directly for entity data.
 */
export function useProject() {
    const store = useStore();
    const project = store.projects.find((p) => p.id === store.activeProjectId);

    // Fallback to empty project shape if no project found (should not happen)
    const fallback: Project = {
        id: '',
        info: { name: '', description: '', client: '', startDate: '', endDate: '', manager: '' },
        tasks: [],
        issues: [],
        members: [],
        documents: [],
        policies: [],
        budget: { contractAmount: 0, entries: [] },
        activities: [],
    };

    const p = project || fallback;

    return {
        // Data
        projectInfo: p.info,
        tasks: p.tasks,
        issues: p.issues,
        members: p.members,
        documents: p.documents,
        policies: p.policies,
        budget: p.budget,
        activities: p.activities,
        projectId: p.id,

        // Actions (from store)
        updateProjectInfo: store.updateProjectInfo,
        addTask: store.addTask,
        updateTask: store.updateTask,
        deleteTask: store.deleteTask,
        addIssue: store.addIssue,
        updateIssue: store.updateIssue,
        deleteIssue: store.deleteIssue,
        addMember: store.addMember,
        updateMember: store.updateMember,
        deleteMember: store.deleteMember,
        addDocument: store.addDocument,
        deleteDocument: store.deleteDocument,
        addPolicy: store.addPolicy,
        updatePolicy: store.updatePolicy,
        deletePolicy: store.deletePolicy,
        setContractAmount: store.setContractAmount,
        addBudgetEntry: store.addBudgetEntry,
        deleteBudgetEntry: store.deleteBudgetEntry,
        addActivity: store.addActivity,

        // Multi-project
        projects: store.projects,
        activeProjectId: store.activeProjectId,
        addProject: store.addProject,
        switchProject: store.switchProject,
        deleteProject: store.deleteProject,
    };
}
