export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Severity = 'S1' | 'S2' | 'S3' | 'S4';
export type TaskStatus = 'Not Started' | 'In Progress' | 'Done' | 'Blocked';
export type IssueStatus = 'New' | 'Triaged' | 'In Progress' | 'Resolved' | 'Closed';

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
    createdAt: string;
}

export interface Member {
    id: string;
    name: string;
    role: string;
    email: string;
    team: string;
    timezone: string;
    avatarUrl?: string;
    status?: 'online' | 'away' | 'offline';
}

export interface DocumentLink {
    id: string;
    title: string;
    url: string;
    category: 'Plan' | 'Requirements' | 'Design' | 'Test' | 'Release' | 'Other';
    ownerId?: string;
    updatedAt: string;
    description?: string;
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
    action: string;        // e.g. "Task status changed", "Issue created"
    detail: string;        // e.g. "'Deploy API' → In Progress"
    category: 'task' | 'issue' | 'member' | 'budget' | 'project';
}

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
}

export interface AppState {
    projects: Project[];
    activeProjectId: string;

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

    // Task Actions
    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;

    // Issue Actions
    addIssue: (issue: Issue) => void;
    updateIssue: (id: string, updates: Partial<Issue>) => void;
    deleteIssue: (id: string) => void;

    // Member Actions
    addMember: (member: Member) => void;
    updateMember: (id: string, updates: Partial<Member>) => void;
    deleteMember: (id: string) => void;

    // Document Actions
    addDocument: (doc: DocumentLink) => void;
    deleteDocument: (id: string) => void;

    // Policy Actions
    addPolicy: (policy: ProjectPolicy) => void;
    updatePolicy: (id: string, updates: Partial<ProjectPolicy>) => void;
    deletePolicy: (id: string) => void;
}
