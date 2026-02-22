import { ProjectPolicy, Task } from '@/types';
import { generateId } from './utils';
import { addDays, format, parseISO } from 'date-fns';

export function getDefaultPolicies(): ProjectPolicy[] {
    const today = new Date().toISOString().split('T')[0];
    return [
        {
            id: generateId('pol'),
            title: 'Communication Policy',
            lastUpdated: today,
            content: `## Communication Policy

### Meeting Cadence
- **Daily Standup**: 09:00 AM (15 min) — Yesterday, Today, Blockers
- **Weekly Status Meeting**: Monday 10:00 AM (1 hour) — Progress review, risk discussion
- **Sprint Review**: Bi-weekly Friday 3:00 PM — Demo and retrospective
- **Stakeholder Update**: Monthly — Project health and milestone summary

### Communication Channels
- **Urgent Issues (S1/S2)**: Phone call → Messaging → Email
- **General Updates**: Email or project management tool
- **Documentation**: Shared drive / Wiki
- **Quick Questions**: Team messaging channel

### Response Time Expectations
- **S1 (Critical)**: Within 30 minutes
- **S2 (High)**: Within 2 hours
- **S3 (Medium)**: Within 1 business day
- **S4 (Low)**: Within 3 business days

### Reporting
- **Weekly Report**: Due by Friday 5:00 PM (Progress, Risks, Next Steps)`,
        },
        {
            id: generateId('pol'),
            title: 'Escalation Policy',
            lastUpdated: today,
            content: `## Escalation Policy

### Escalation Levels

#### Level 1 — Team Lead
- **When**: Issue unresolved > 4 hours, or task blocked > 1 day
- **Action**: Reallocate resources, remove blockers

#### Level 2 — Project Manager
- **When**: Issue unresolved > 1 day, or schedule at risk
- **Action**: Adjust timeline, communicate with stakeholders

#### Level 3 — Steering Committee
- **When**: Budget impact > 10%, timeline delay > 1 week
- **Action**: Scope change approval, additional funding

### Auto-Escalation Rules
- **S1 Issues**: Auto-escalate to Level 2 if unresolved in 4 hours
- **Blocked Tasks**: Auto-escalate to Level 1 if blocked > 1 business day`,
        },
        {
            id: generateId('pol'),
            title: 'Change Management',
            lastUpdated: today,
            content: `## Change Management Policy

### Process
1. **Submit**: Fill out change request form
2. **Review**: PM evaluates impact (scope, time, cost, risk)
3. **Approve/Reject**: Based on impact level
4. **Implement & Verify**: Execute and test changes

### Approval Authority
- **Minor (< 5% budget)**: Project Manager
- **Major (5-15% budget)**: PM + Sponsor
- **Critical (> 15% budget)**: Steering Committee`,
        },
        {
            id: generateId('pol'),
            title: 'Quality Assurance',
            lastUpdated: today,
            content: `## Quality Assurance Policy

### Testing Requirements
- **Unit Tests**: Required for core functions
- **Integration Tests**: Required before merge
- **UAT**: Required before production

### Release Criteria
- [ ] All S1/S2 defects resolved
- [ ] UAT sign-off received
- [ ] Security scan passed
- [ ] Release notes prepared`,
        },
    ];
}

export function getInitialTasks(startDateStr: string): Task[] {
    const start = parseISO(startDateStr);

    const tasks = [
        { title: 'Project Kickoff & Charter', daysOffset: 0, duration: 4, priority: 'P0', tags: ['Management'] },
        { title: 'Stakeholder Analysis', daysOffset: 5, duration: 6, priority: 'P1', tags: ['Management'], deps: [0] }, // dep on index 0
        { title: 'Requirements Specification', daysOffset: 12, duration: 6, priority: 'P0', tags: ['Product'], deps: [1] },
        { title: 'System Architecture Design', daysOffset: 19, duration: 4, priority: 'P1', tags: ['Dev', 'Architecture'], deps: [2] },
        { title: 'UI/UX Design System', daysOffset: 21, duration: 12, priority: 'P1', tags: ['Design', 'UI'], deps: [2] },
        { title: 'Frontend Development Sprint 1', daysOffset: 24, duration: 12, priority: 'P0', tags: ['Dev', 'Frontend'], deps: [3] },
        { title: 'Backend API Development', daysOffset: 31, duration: 13, priority: 'P1', tags: ['Dev', 'Backend'], deps: [3] },
        { title: 'Database Schema & Migration', daysOffset: 33, duration: 7, priority: 'P2', tags: ['Dev', 'Database'], deps: [3] },
        { title: 'Integration Testing', daysOffset: 45, duration: 6, priority: 'P0', tags: ['QA'], deps: [5, 6] },
        { title: 'User Acceptance Testing', daysOffset: 52, duration: 5, priority: 'P0', tags: ['QA'], deps: [8] },
        { title: 'Security Audit', daysOffset: 49, duration: 4, priority: 'P1', tags: ['Security'], deps: [6] },
        { title: 'Production Deployment', daysOffset: 58, duration: 2, priority: 'P0', tags: ['DevOps'], deps: [9, 10] },
        { title: 'Hardware Installation', daysOffset: 40, duration: 7, priority: 'P1', tags: ['Infrastructure'], deps: [3] },
        { title: 'Go-live', daysOffset: 61, duration: 3, priority: 'P0', tags: ['Release'], deps: [11, 12] },
        { title: 'Training', daysOffset: 54, duration: 6, priority: 'P1', tags: ['Training'], deps: [9] },
    ];

    // First generate IDs for all
    const taskIds = tasks.map(() => generateId('t'));

    return tasks.map((t, i) => {
        const sDate = addDays(start, t.daysOffset);
        const eDate = addDays(sDate, t.duration);
        return {
            id: taskIds[i],
            title: t.title,
            status: 'Not Started',
            priority: t.priority as Task['priority'],
            startDate: format(sDate, 'yyyy-MM-dd'),
            dueDate: format(eDate, 'yyyy-MM-dd'),
            progress: 0,
            dependencies: t.deps ? t.deps.map(dIndex => taskIds[dIndex]) : [],
            tags: t.tags,
        };
    });
}
