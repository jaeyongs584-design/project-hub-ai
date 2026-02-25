export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Severity = 'S1' | 'S2' | 'S3' | 'S4';
export type TaskStatus = 'Not Started' | 'In Progress' | 'Done' | 'Blocked';
export type IssueStatus = 'New' | 'Triaged' | 'In Progress' | 'Resolved' | 'Closed';

// ─── New: User & Auth ──────────────────────────────────────────
export type UserRole = 'Admin' | 'PM' | 'Member' | 'Client';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    lastLogin?: string;
}

// ─── New entity types ────────────────────────────────────────
export type RiskProbability = 'Low' | 'Medium' | 'High';
export type RiskImpact = 'Low' | 'Medium' | 'High';
export type RiskStatus = 'Open' | 'Monitoring' | 'Closed';

export type CRChangeType = 'Scope' | 'Schedule' | 'Cost' | 'Technical';
export type CRStatus = 'Pending' | 'Approved' | 'Rejected' | 'Implemented';

export type ActionStatus = 'Open' | 'In Progress' | 'Done' | 'Blocked';
export type SourceType = 'Manual' | 'Meeting' | 'Communication' | 'Issue' | 'Deployment';
export type ImpactArea = 'Schedule' | 'Budget' | 'Technical';

export type MeetingType = 'Internal' | 'Vendor' | 'Terminal' | 'Technical' | 'Weekly';
export type MeetingStatus = 'Planned' | 'Completed' | 'Cancelled';
export type CommType = 'Email' | 'Call Note' | 'Chat Summary' | 'Vendor Update';

export type MilestoneStatus = 'Pending' | 'On Track' | 'Delayed' | 'Completed';

export type DeployEnv = 'UAT' | 'PROD' | 'TEST' | 'Staging' | 'Production';
export type DeployChangeType = 'Release' | 'Patch' | 'Hotfix' | 'Config' | 'Rewiring';
export type DeployStatus = 'Planned' | 'In Progress' | 'Deployed' | 'Completed' | 'Failed' | 'Rolled Back';
export type DeploymentStatus = DeployStatus;
export type ValidationResult = 'Pass' | 'Partial' | 'Failed';

// ─── Core interfaces ─────────────────────────────────────────
export interface ProjectInfo {
    name: string;
    description: string;
    client: string;
    startDate: string;
    endDate: string;
    manager: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    ownerId?: string;
    startDate: string;
    dueDate: string;
    status: TaskStatus;
    priority: Priority;
    progress: number;
    dependencies: string[];
    tags: string[];
    parentId?: string;
    isMilestone?: boolean;
    workstream?: string;
    relatedMilestoneId?: string;
}

export interface Issue {
    id: string;
    title: string;
    description: string;
    severity: Severity;
    ownerId?: string;
    dueDate?: string;
    status: IssueStatus;
    relatedTaskId?: string;
    relatedReleaseId?: string;
    createdAt: string;
}

export interface Member {
    id: string;
    name: string;
    role: string;
    email: string;
    phone?: string;
    company?: string;
    location?: string;
    country?: string;
    timezone?: string;
    notes?: string;
    avatarUrl?: string;
    status?: 'online' | 'away' | 'offline';
}

export interface DocumentLink {
    id: string;
    title: string;
    url: string;
    uploadDate?: string;
    uploadedBy?: string;
    type?: string;
    size?: string;
    category?: 'Plan' | 'Requirements' | 'Design' | 'Test' | 'Release' | 'Other';
    ownerId?: string;
    updatedAt?: string;
    description?: string;
    tags?: string[];
    relatedTaskId?: string;
    relatedMilestoneId?: string;
    relatedIssueId?: string;
}

export interface ProjectPolicy {
    id: string;
    title: string;
    content: string;
    lastUpdated: string;
}

export interface BudgetEntry {
    id: string;
    date: string;
    category: 'Labor' | 'Hardware' | 'Software' | 'Travel' | 'Training' | 'Consulting' | 'Other';
    description: string;
    amount: number;
}

export interface ActivityEntry {
    id: string;
    timestamp: string;
    action: string;
    detail: string;
    category: 'task' | 'issue' | 'member' | 'budget' | 'project' | 'risk' | 'cr' | 'action' | 'decision' | 'meeting' | 'communication' | 'milestone' | 'deployment';
}

// ─── New: Notification ──────────────────────────────────────────
export interface AppNotification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    timestamp: string;
    type: 'alert' | 'info' | 'success' | 'warning';
    link?: string;
    targetRole?: string; // Optional: specify if only Admin/PM should see this
}

// ─── New: Risk ───────────────────────────────────────────────
export interface Risk {
    id: string;
    title: string;
    ownerId?: string;
    probability: RiskProbability;
    impact: RiskImpact;
    status: RiskStatus;
    mitigation?: string;
    relatedMilestoneId?: string;
    createdAt: string;
    updatedAt: string;
}

// ─── New: Change Request ─────────────────────────────────────
export interface ChangeRequest {
    id: string;
    title: string;
    requestDate: string;
    requester: string;
    changeType: CRChangeType;
    impactSummary?: string;
    reference?: string;
    status: CRStatus;
    approver?: string;
    relatedDocumentId?: string;
    relatedIssueId?: string;
    relatedMilestoneId?: string;
    relatedDeploymentId?: string;
    createdAt: string;
}

// ─── New: Action Item ────────────────────────────────────────
export interface ActionItem {
    id: string;
    title: string;
    ownerId?: string;
    dueDate?: string;
    status: ActionStatus;
    priority: 'Low' | 'Medium' | 'High';
    sourceType?: SourceType;
    sourceId?: string;
    sourceLink?: string;
    description?: string;
    relatedIssueId?: string;
    relatedCRId?: string;
    relatedMilestoneId?: string;
    relatedDeploymentId?: string;
    createdAt: string;
}

// ─── New: Decision ───────────────────────────────────────────
export interface Decision {
    id: string;
    date: string;
    summary: string;
    decidedBy: string;
    impactAreas: ImpactArea[];
    reason?: string;
    sourceType?: SourceType;
    sourceId?: string;
    sourceLink?: string;
    relatedCRId?: string;
    relatedMilestoneId?: string;
    relatedDeploymentId?: string;
    createdAt: string;
}

// ─── New: Meeting ────────────────────────────────────────────
export interface Meeting {
    id: string;
    title: string;
    meetingDate: string;
    participants: string;
    meetingType: MeetingType;
    status: MeetingStatus;
    relatedMilestoneId?: string;
    notes?: string;
    minutes?: string;
    createdAt: string;
}

// ─── New: Communication ──────────────────────────────────────
export interface Communication {
    id: string;
    type: CommType;
    subject: string;
    date: string;
    summary: string;
    from?: string;
    to?: string;
    relatedMeetingId?: string;
    relatedIssueId?: string;
    relatedCRId?: string;
    relatedDeploymentId?: string;
    tags?: string[];
    linkUrl?: string;
    createdAt: string;
}// (Old duplicated Milestone removed)// ─── New: Deployment ─────────────────────────────────────────
export interface Deployment {
    id: string;
    title: string;
    site?: string;
    systemModule: string;
    environment: DeployEnv;
    changeType: DeployChangeType;
    version: string;
    deploymentDate: string;
    status: DeployStatus;
    changeSummary?: string;
    laneArea?: string;
    relatedIssueId?: string;
    relatedCRId?: string;
    relatedMilestoneId?: string;
    releaseNoteUrl?: string;
    releaseNotes?: string;
    plannedDate?: string;
    actualDate?: string;
    testResultUrl?: string;
    validationResult?: ValidationResult;
    downtimeMinutes?: number;
    approvedBy?: string;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}

// ─── New: Milestone ──────────────────────────────────────────
export interface Milestone {
    id: string;
    title: string;
    description?: string;
    date: string;
    status: MilestoneStatus;
    ownerId?: string;
    createdAt: string;
    updatedAt: string;
}

// ─── New: Vendor & Procurement ───────────────────────────────
export type VendorStatus = 'Active' | 'Inactive' | 'Pending';
export type ProcurementStatus = 'Planned' | 'In Progress' | 'Awarded' | 'Closed' | 'Cancelled';

export interface Vendor {
    id: string;
    name: string;
    serviceType: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    status: VendorStatus;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Procurement {
    id: string;
    title: string;
    vendorId?: string;
    contractAmount: number;
    description?: string;
    startDate?: string;
    endDate?: string;
    status: ProcurementStatus;
    relatedMilestoneId?: string;
    createdAt: string;
    updatedAt: string;
}

// ─── New: Asset & System Register ────────────────────────────
export type AssetStatus = 'Active' | 'Under Maintenance' | 'Retired' | 'Lost';
export type SystemStatus = 'Online' | 'Degraded' | 'Offline' | 'Maintenance';

export interface Asset {
    id: string;
    tag: string; // e.g., "AST-001"
    name: string;
    model?: string;
    serialNumber?: string;
    location: string;
    ownerId?: string;
    status: AssetStatus;
    purchaseDate?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SystemRegister {
    id: string;
    name: string;
    version?: string;
    environment: 'Production' | 'Staging' | 'Test' | 'Development';
    status: SystemStatus;
    vendorId?: string;
    url?: string;
    notes?: string;
    lastChecked: string;
    createdAt: string;
    updatedAt: string;
}

// ─── New: Site Log & Field Log ───────────────────────────────
export interface WeatherCondition {
    temperature?: number;
    condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Snow' | 'Windy' | 'Clear' | 'Other';
}

export interface SiteLog {
    id: string;
    date: string;
    loggerId: string;
    weather?: WeatherCondition;
    personnelCount?: number;
    workSummary: string;
    nextDayPlan?: string;
    relatedIssueIds?: string[];
    relatedRiskIds?: string[];
    attachments?: string[]; // e.g., alt text or image names
    createdAt: string;
    updatedAt: string;
}

// ─── Project (expanded) ──────────────────────────────────────
export interface Project {
    id: string;
    info: ProjectInfo;
    tasks: Task[];
    issues: Issue[];
    members: Member[];
    documents: DocumentLink[];
    policies: ProjectPolicy[];
    budget: {
        contractAmount: number;
        entries: BudgetEntry[];
    };
    activities: ActivityEntry[];
    // New collections
    risks: Risk[];
    changeRequests: ChangeRequest[];
    actionItems: ActionItem[];
    decisions: Decision[];
    meetings: Meeting[];
    communications: Communication[];
    milestones: Milestone[];
    deployments: Deployment[];
    vendors: Vendor[];
    procurements: Procurement[];
    assets: Asset[];
    systems: SystemRegister[];
    siteLogs: SiteLog[];
    notifications: AppNotification[];
}

// ─── App State ───────────────────────────────────────────────
export interface AppState {
    projects: Project[];
    activeProjectId: string;

    // Database Sync
    fetchSupabaseData: () => Promise<void>;

    // Project management
    addProject: (project: Project) => void;
    switchProject: (id: string) => void;
    deleteProject: (id: string) => void;
    updateProjectInfo: (updates: Partial<ProjectInfo>) => void;

    // Budget
    setContractAmount: (amount: number) => void;
    addBudgetEntry: (entry: BudgetEntry) => void;
    deleteBudgetEntry: (id: string) => void;

    // Activity
    addActivity: (entry: ActivityEntry) => void;

    // Task CRUD
    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;

    // Issue CRUD
    addIssue: (issue: Issue) => void;
    updateIssue: (id: string, updates: Partial<Issue>) => void;
    deleteIssue: (id: string) => void;

    // Member CRUD
    addMember: (member: Member) => void;
    updateMember: (id: string, updates: Partial<Member>) => void;
    deleteMember: (id: string) => void;

    // Document CRUD
    addDocument: (doc: DocumentLink) => void;
    deleteDocument: (id: string) => void;

    // Policy CRUD
    addPolicy: (policy: ProjectPolicy) => void;
    updatePolicy: (id: string, updates: Partial<ProjectPolicy>) => void;
    deletePolicy: (id: string) => void;

    // ── New CRUD ──
    // Risk
    addRisk: (risk: Risk) => void;
    updateRisk: (id: string, updates: Partial<Risk>) => void;
    deleteRisk: (id: string) => void;

    // Change Request
    addChangeRequest: (cr: ChangeRequest) => void;
    updateChangeRequest: (id: string, updates: Partial<ChangeRequest>) => void;
    deleteChangeRequest: (id: string) => void;

    // Action Item
    addActionItem: (item: ActionItem) => void;
    updateActionItem: (id: string, updates: Partial<ActionItem>) => void;
    deleteActionItem: (id: string) => void;

    // Decision
    addDecision: (decision: Decision) => void;
    updateDecision: (id: string, updates: Partial<Decision>) => void;
    deleteDecision: (id: string) => void;

    // Meeting
    addMeeting: (meeting: Meeting) => void;
    updateMeeting: (id: string, updates: Partial<Meeting>) => void;
    deleteMeeting: (id: string) => void;

    // Communication
    addCommunication: (comm: Communication) => void;
    updateCommunication: (id: string, updates: Partial<Communication>) => void;
    deleteCommunication: (id: string) => void;

    // Milestone
    addMilestone: (milestone: Milestone) => void;
    updateMilestone: (id: string, updates: Partial<Milestone>) => void;
    deleteMilestone: (id: string) => void;

    // Deployment
    addDeployment: (deployment: Deployment) => void;
    updateDeployment: (id: string, updates: Partial<Deployment>) => void;
    deleteDeployment: (id: string) => void;

    // Vendor
    addVendor: (vendor: Vendor) => void;
    updateVendor: (id: string, updates: Partial<Vendor>) => void;
    deleteVendor: (id: string) => void;

    // Procurement
    addProcurement: (procurement: Procurement) => void;
    updateProcurement: (id: string, updates: Partial<Procurement>) => void;
    deleteProcurement: (id: string) => void;

    // Asset
    addAsset: (asset: Asset) => void;
    updateAsset: (id: string, updates: Partial<Asset>) => void;
    deleteAsset: (id: string) => void;

    // System Register
    addSystem: (system: SystemRegister) => void;
    updateSystem: (id: string, updates: Partial<SystemRegister>) => void;
    deleteSystem: (id: string) => void;

    // Site Log
    addSiteLog: (log: SiteLog) => void;
    updateSiteLog: (id: string, updates: Partial<SiteLog>) => void;
    deleteSiteLog: (id: string) => void;

    // Notifications
    addNotification: (notification: AppNotification) => void;
    markNotificationAsRead: (id: string) => void;
    markAllNotificationsAsRead: () => void;
    deleteNotification: (id: string) => void;
}
