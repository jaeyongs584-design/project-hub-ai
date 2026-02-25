import { useStore } from '@/store/useStore';
import { Project } from '@/types';

/**
 * Returns the active project data. All pages should use this instead of
 * destructuring from useStore directly for entity data.
 */
export function useProject() {
    const store = useStore();
    const project = store.projects.find((p) => p.id === store.activeProjectId);

    // Fallback to empty project shape if no project found
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
        // New data
        risks: p.risks || [],
        changeRequests: p.changeRequests || [],
        actionItems: p.actionItems || [],
        decisions: p.decisions || [],
        vendors: p.vendors || [],
        procurements: p.procurements || [],
        meetings: p.meetings || [],
        communications: p.communications || [],
        milestones: p.milestones || [],
        deployments: p.deployments || [],
        assets: p.assets || [],
        systems: p.systems || [],
        siteLogs: p.siteLogs || [],
        notifications: p.notifications || [],

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
        // New actions
        addRisk: store.addRisk,
        updateRisk: store.updateRisk,
        deleteRisk: store.deleteRisk,
        addChangeRequest: store.addChangeRequest,
        updateChangeRequest: store.updateChangeRequest,
        deleteChangeRequest: store.deleteChangeRequest,
        addActionItem: store.addActionItem,
        updateActionItem: store.updateActionItem,
        deleteActionItem: store.deleteActionItem,
        addDecision: store.addDecision,
        updateDecision: store.updateDecision,
        deleteDecision: store.deleteDecision,
        addMeeting: store.addMeeting,
        updateMeeting: store.updateMeeting,
        deleteMeeting: store.deleteMeeting,
        addCommunication: store.addCommunication,
        updateCommunication: store.updateCommunication,
        deleteCommunication: store.deleteCommunication,
        addMilestone: store.addMilestone,
        updateMilestone: store.updateMilestone,
        deleteMilestone: store.deleteMilestone,
        addDeployment: store.addDeployment,
        updateDeployment: store.updateDeployment,
        deleteDeployment: store.deleteDeployment,

        // Vendor
        addVendor: store.addVendor,
        updateVendor: store.updateVendor,
        deleteVendor: store.deleteVendor,

        // Procurement
        addProcurement: store.addProcurement,
        updateProcurement: store.updateProcurement,
        deleteProcurement: store.deleteProcurement,

        // Assets
        addAsset: store.addAsset,
        updateAsset: store.updateAsset,
        deleteAsset: store.deleteAsset,

        // System Register
        addSystem: store.addSystem,
        updateSystem: store.updateSystem,
        deleteSystem: store.deleteSystem,

        // Site Log
        addSiteLog: store.addSiteLog,
        updateSiteLog: store.updateSiteLog,
        deleteSiteLog: store.deleteSiteLog,

        // Multi-project
        projects: store.projects,
        activeProjectId: store.activeProjectId,
        addProject: store.addProject,
        switchProject: store.switchProject,
        deleteProject: store.deleteProject,

        // Notifications
        addNotification: store.addNotification,
        markNotificationAsRead: store.markNotificationAsRead,
        markAllNotificationsAsRead: store.markAllNotificationsAsRead,
        deleteNotification: store.deleteNotification,

        fetchSupabaseData: store.fetchSupabaseData,
    };
}
