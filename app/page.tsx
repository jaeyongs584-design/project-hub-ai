'use client';

import React, { useMemo, useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Modal } from '@/app/components/ui/Modal';
import { Button } from '@/app/components/ui/Button';
import { Brain, TrendingUp, Clock, AlertTriangle, CheckCircle2, Zap, Target, Activity, DollarSign, ShieldAlert, Plus } from 'lucide-react';
import styles from './page.module.css';
import { cn, generateId } from '@/lib/utils';
import { Task, Issue } from '@/types';

export default function Dashboard() {
  const { tasks, issues, members, projectInfo, budget, activities, addTask, addIssue, addActivity } = useProject();

  const today = new Date().toISOString().split('T')[0];

  // Quick-add state
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addIssueOpen, setAddIssueOpen] = useState(false);
  const [qTaskTitle, setQTaskTitle] = useState('');
  const [qTaskDue, setQTaskDue] = useState('');
  const [qIssueTitle, setQIssueTitle] = useState('');
  const [qIssueSev, setQIssueSev] = useState<'S1' | 'S2' | 'S3' | 'S4'>('S3');

  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Done').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const blocked = tasks.filter(t => t.status === 'Blocked').length;
    const notStarted = tasks.filter(t => t.status === 'Not Started').length;
    const progress = total ? Math.round((completed / total) * 100) : 0;
    const overdue = tasks.filter(t => t.dueDate < today && t.status !== 'Done');
    const highIssues = issues.filter(i => (i.severity === 'S1' || i.severity === 'S2') && i.status !== 'Resolved' && i.status !== 'Closed');
    const openIssues = issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed');

    return { total, completed, inProgress, blocked, notStarted, progress, overdue, highIssues, openIssues };
  }, [tasks, issues, today]);

  // Project Health
  const health = useMemo(() => {
    const { overdue, blocked, highIssues } = metrics;
    if (overdue.length >= 3 || highIssues.length >= 3 || blocked >= 3) return { label: 'Critical', color: '#ff6b6b', emoji: '🔴' };
    if (overdue.length >= 1 || highIssues.length >= 1 || blocked >= 1) return { label: 'At Risk', color: '#ffeaa7', emoji: '🟡' };
    return { label: 'On Track', color: '#55efc4', emoji: '🟢' };
  }, [metrics]);

  // Timeline progress
  const timelineProgress = useMemo(() => {
    if (!projectInfo.startDate || !projectInfo.endDate) return { elapsed: 0, taskProgress: metrics.progress };
    const start = new Date(projectInfo.startDate).getTime();
    const end = new Date(projectInfo.endDate).getTime();
    const now = Date.now();
    const total = end - start;
    if (total <= 0) return { elapsed: 0, taskProgress: metrics.progress };
    const elapsed = Math.min(100, Math.max(0, Math.round(((now - start) / total) * 100)));
    return { elapsed, taskProgress: metrics.progress };
  }, [projectInfo, metrics.progress]);

  // Budget summary
  const budgetSummary = useMemo(() => {
    const spent = budget.entries.reduce((sum, e) => sum + e.amount, 0);
    const remaining = budget.contractAmount - spent;
    const percent = budget.contractAmount > 0 ? Math.round((spent / budget.contractAmount) * 100) : 0;
    return { contract: budget.contractAmount, spent, remaining, percent };
  }, [budget]);

  // What needs attention (prioritized)
  const attentionItems = useMemo(() => {
    const items: { icon: string; text: string; severity: number }[] = [];
    metrics.overdue.forEach(t => items.push({ icon: '🔥', text: `Overdue: "${t.title}" (due ${t.dueDate})`, severity: 1 }));
    metrics.highIssues.forEach(i => items.push({ icon: '⚠️', text: `${i.severity} Issue: "${i.title}"`, severity: 2 }));
    if (metrics.blocked > 0) items.push({ icon: '🚫', text: `${metrics.blocked} task(s) are blocked — investigate dependencies`, severity: 3 });
    if (budgetSummary.percent > 80 && budgetSummary.contract > 0) items.push({ icon: '💰', text: `Budget usage at ${budgetSummary.percent}% — review spending`, severity: 4 });
    if (timelineProgress.elapsed > timelineProgress.taskProgress + 15) items.push({ icon: '⏰', text: `Timeline: ${timelineProgress.elapsed}% elapsed but only ${timelineProgress.taskProgress}% completed`, severity: 5 });
    if (items.length === 0) items.push({ icon: '✅', text: 'All clear! Project is on track.', severity: 99 });
    return items.sort((a, b) => a.severity - b.severity).slice(0, 6);
  }, [metrics, budgetSummary, timelineProgress]);

  // Risk matrix counts
  const riskMatrix = useMemo(() => {
    const matrix = { s1: 0, s2: 0, s3: 0, s4: 0 };
    issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').forEach(i => {
      matrix[i.severity.toLowerCase() as keyof typeof matrix]++;
    });
    return matrix;
  }, [issues]);

  const projectName = projectInfo?.name || 'AGS Project';

  // Quick-add handlers
  const handleQuickTask = () => {
    if (!qTaskTitle.trim()) return;
    const task: Task = {
      id: generateId('t'),
      title: qTaskTitle.trim(),
      status: 'Not Started',
      priority: 'P2',
      startDate: today,
      dueDate: qTaskDue || today,
      progress: 0,
      dependencies: [],
      tags: [],
    };
    addTask(task);
    addActivity({ id: generateId('act'), timestamp: new Date().toISOString(), action: 'Task created', detail: `"${task.title}"`, category: 'task' });
    setQTaskTitle('');
    setQTaskDue('');
    setAddTaskOpen(false);
  };

  const handleQuickIssue = () => {
    if (!qIssueTitle.trim()) return;
    const issue: Issue = {
      id: generateId('i'),
      title: qIssueTitle.trim(),
      description: '',
      severity: qIssueSev,
      status: 'New',
      createdAt: new Date().toISOString(),
    };
    addIssue(issue);
    addActivity({ id: generateId('act'), timestamp: new Date().toISOString(), action: 'Issue created', detail: `[${qIssueSev}] "${issue.title}"`, category: 'issue' });
    setQIssueTitle('');
    setQIssueSev('S3');
    setAddIssueOpen(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>{projectName}</h1>
          <p className={styles.pageSubtitle}>
            {projectInfo.client && <span>{projectInfo.client} · </span>}
            {projectInfo.startDate} ~ {projectInfo.endDate}
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.quickActions}>
            <button className={styles.quickAddBtn} onClick={() => setAddTaskOpen(true)} title="Quick add task">
              <Plus size={14} /> Task
            </button>
            <button className={styles.quickAddBtn} onClick={() => setAddIssueOpen(true)} title="Quick add issue">
              <Plus size={14} /> Issue
            </button>
          </div>
          <div className={styles.healthBadge} style={{ borderColor: health.color }}>
            <span>{health.emoji}</span>
            <span style={{ color: health.color }}>{health.label}</span>
          </div>
        </div>
      </header>

      {/* Timeline Bar */}
      <div className={styles.timelineSection}>
        <div className={styles.timelineLabels}>
          <span>Time Elapsed: {timelineProgress.elapsed}%</span>
          <span>Task Progress: {timelineProgress.taskProgress}%</span>
        </div>
        <div className={styles.timelineBar}>
          <div className={styles.timelineElapsed} style={{ width: `${timelineProgress.elapsed}%` }} />
          <div className={styles.timelineCompleted} style={{ width: `${timelineProgress.taskProgress}%` }} />
        </div>
        <div className={styles.timelineLegend}>
          <span><span className={styles.dot} style={{ background: 'rgba(255,255,255,0.15)' }} /> Time</span>
          <span><span className={styles.dot} style={{ background: 'var(--primary)' }} /> Progress</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <Card glass glow className={styles.kpiCard}>
          <CardContent>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Overall Progress</span>
              <div className={cn(styles.kpiIconBox, styles.kpiIconBlue)}><TrendingUp size={18} /></div>
            </div>
            <div className={styles.bigNumber}>{metrics.progress}<span className={styles.numberUnit}>%</span></div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${metrics.progress}%` }} />
            </div>
            <div className={styles.metaText}>{metrics.completed} / {metrics.total} tasks</div>
          </CardContent>
        </Card>

        <Card glass glow className={styles.kpiCard}>
          <CardContent>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Overdue</span>
              <div className={cn(styles.kpiIconBox, styles.kpiIconRed)}><Clock size={18} /></div>
            </div>
            <div className={cn(styles.bigNumber, metrics.overdue.length > 0 ? styles.textRed : styles.textGreen)}>
              {metrics.overdue.length}
            </div>
            <div className={styles.metaText}>{metrics.overdue.length > 0 ? 'Needs immediate action' : 'All on track ✓'}</div>
          </CardContent>
        </Card>

        <Card glass glow className={styles.kpiCard}>
          <CardContent>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Open Issues</span>
              <div className={cn(styles.kpiIconBox, styles.kpiIconOrange)}><AlertTriangle size={18} /></div>
            </div>
            <div className={styles.bigNumber}>{metrics.openIssues.length}</div>
            <div className={styles.metaText}>{metrics.highIssues.length} high priority</div>
          </CardContent>
        </Card>

        <Card glass glow className={styles.kpiCard}>
          <CardContent>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Budget</span>
              <div className={cn(styles.kpiIconBox, styles.kpiIconGreen)}><DollarSign size={18} /></div>
            </div>
            <div className={styles.bigNumber}>
              {budgetSummary.percent}<span className={styles.numberUnit}>%</span>
            </div>
            {budgetSummary.contract > 0 ? (
              <div className={styles.metaText}>
                ${budgetSummary.spent.toLocaleString()} / ${budgetSummary.contract.toLocaleString()}
              </div>
            ) : (
              <div className={styles.metaText}>Set budget in Budget page</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: Attention + Risk + AI */}
      <div className={styles.bottomGrid}>
        {/* What Needs Attention */}
        <Card className={styles.listCard}>
          <CardHeader>
            <CardTitle>
              <ShieldAlert size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
              What Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.actionsList}>
              {attentionItems.map((item, i) => (
                <div key={i} className={styles.actionItem}>
                  <span className={styles.actionIcon}>{item.icon}</span>
                  <span className={styles.actionText}>{item.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Matrix + Activity */}
        <div className={styles.rightColumn}>
          {/* Risk Matrix */}
          <Card className={styles.riskCard}>
            <CardHeader><CardTitle>Risk Matrix</CardTitle></CardHeader>
            <CardContent>
              <div className={styles.riskGrid}>
                <div className={cn(styles.riskCell, styles.riskS1)}>
                  <span className={styles.riskCount}>{riskMatrix.s1}</span>
                  <span className={styles.riskLabel}>Critical</span>
                </div>
                <div className={cn(styles.riskCell, styles.riskS2)}>
                  <span className={styles.riskCount}>{riskMatrix.s2}</span>
                  <span className={styles.riskLabel}>High</span>
                </div>
                <div className={cn(styles.riskCell, styles.riskS3)}>
                  <span className={styles.riskCount}>{riskMatrix.s3}</span>
                  <span className={styles.riskLabel}>Medium</span>
                </div>
                <div className={cn(styles.riskCell, styles.riskS4)}>
                  <span className={styles.riskCount}>{riskMatrix.s4}</span>
                  <span className={styles.riskLabel}>Low</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className={styles.activityCard}>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className={styles.emptyState}>
                  <Activity size={20} style={{ color: 'var(--foreground-muted)', opacity: 0.5 }} />
                  <span>No activity yet</span>
                </div>
              ) : (
                <div className={styles.activityList}>
                  {activities.slice(0, 5).map((a) => (
                    <div key={a.id} className={styles.activityItem}>
                      <div className={styles.activityDot} />
                      <div>
                        <p className={styles.activityAction}>{a.action}</p>
                        <p className={styles.activityDetail}>{a.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Summary */}
      <Card className={styles.aiWidget}>
        <CardHeader className={styles.aiHeader}>
          <div className={styles.aiIconWrapper}><Brain size={22} style={{ color: 'white' }} /></div>
          <div className={styles.aiTitleGroup}>
            <h3>AGS AI Weekly Summary</h3>
            <p className={styles.aiSubtitle}>Auto-generated based on project data</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className={styles.aiContent}>
            <p>🚀 <strong>Progress:</strong> {projectName} is {metrics.progress}% complete ({metrics.completed}/{metrics.total} tasks). {metrics.inProgress > 0 ? `${metrics.inProgress} in progress.` : ''}</p>
            <p>⚠️ <strong>Risks:</strong> {metrics.overdue.length} overdue, {metrics.blocked} blocked. {metrics.highIssues.length > 0 ? `${metrics.highIssues.length} high-severity issues.` : 'No critical issues.'}</p>
            {budgetSummary.contract > 0 && (
              <p>💰 <strong>Budget:</strong> ${budgetSummary.spent.toLocaleString()} of ${budgetSummary.contract.toLocaleString()} spent ({budgetSummary.percent}%). {budgetSummary.remaining > 0 ? `$${budgetSummary.remaining.toLocaleString()} remaining.` : 'Budget fully consumed!'}</p>
            )}
            <p>🎯 <strong>Team:</strong> {members.length > 0 ? `${members.length} members across ${new Set(members.map(m => m.team)).size} teams.` : 'Register team members to track allocation.'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Task Modal */}
      <Modal isOpen={addTaskOpen} onClose={() => setAddTaskOpen(false)} title="Quick Add Task" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className={styles.formLabel}>Task Title *</label>
            <input
              className={styles.formInput}
              value={qTaskTitle}
              onChange={(e) => setQTaskTitle(e.target.value)}
              placeholder="Enter task title"
              onKeyDown={(e) => e.key === 'Enter' && handleQuickTask()}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className={styles.formLabel}>Due Date</label>
            <input
              type="date"
              className={styles.formInput}
              value={qTaskDue}
              onChange={(e) => setQTaskDue(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="ghost" onClick={() => setAddTaskOpen(false)}>Cancel</Button>
            <Button onClick={handleQuickTask}>Add Task</Button>
          </div>
        </div>
      </Modal>

      {/* Quick Add Issue Modal */}
      <Modal isOpen={addIssueOpen} onClose={() => setAddIssueOpen(false)} title="Quick Add Issue" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className={styles.formLabel}>Issue Title *</label>
            <input
              className={styles.formInput}
              value={qIssueTitle}
              onChange={(e) => setQIssueTitle(e.target.value)}
              placeholder="Describe the issue"
              onKeyDown={(e) => e.key === 'Enter' && handleQuickIssue()}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className={styles.formLabel}>Severity</label>
            <select
              className={styles.formInput}
              value={qIssueSev}
              onChange={(e) => setQIssueSev(e.target.value as 'S1' | 'S2' | 'S3' | 'S4')}
            >
              <option value="S1">S1 — Critical</option>
              <option value="S2">S2 — High</option>
              <option value="S3">S3 — Medium</option>
              <option value="S4">S4 — Low</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="ghost" onClick={() => setAddIssueOpen(false)}>Cancel</Button>
            <Button onClick={handleQuickIssue}>Report Issue</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
