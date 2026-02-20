export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Severity = 'S1' | 'S2' | 'S3' | 'S4';
export type Status = 'Not Started' | 'In Progress' | 'Done' | 'Blocked';
export type IssueStatus = 'New' | 'Triaged' | 'In Progress' | 'Resolved' | 'Closed';

export interface Task {
    id: string;
    title: string;
    description?: string;
    ownerId?: string;
    startDate: string; // ISO Date
    dueDate: string;   // ISO Date
    status: Status;
    priority: Priority;
    progress: number; // 0-100
    dependencies: string[]; // Task IDs
    tags: string[];
    parentId?: string; // For WBS hierarchy
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
}

export interface DocumentLink {
    id: string;
    title: string;
    url: string;
    category: 'Plan' | 'Requirements' | 'Design' | 'Test' | 'Release' | 'Other';
    ownerId?: string;
    updatedAt: string;
}

export interface ProjectPolicy {
    id: string;
    title: string;
    content: string; // Markdown supported
    lastUpdated: string;
}

// Store State Interface
export interface AppState {
    tasks: Task[];
    issues: Issue[];
    members: Member[];
    documents: DocumentLink[];
    policies: ProjectPolicy[];

    // Actions
    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;

    addIssue: (issue: Issue) => void;
    updateIssue: (id: string, updates: Partial<Issue>) => void;

    // ... other actions
}
