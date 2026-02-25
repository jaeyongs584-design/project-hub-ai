'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useProject } from '@/hooks/useProject';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { TrendingUp, Clock, AlertTriangle, Activity, DollarSign, ShieldAlert, Rocket, Lightbulb, RefreshCw, CheckCircle, Bot, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import styles from './page.module.css';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { tasks, issues, risks, members, projectInfo, budget, activities, changeRequests, actionItems, deployments, decisions } = useProject();
  const router = useRouter();

  const [aiSummary, setAiSummary] = React.useState<string | null>(null);
  const [isAILoading, setIsAILoading] = React.useState(false);

  const today = new Date().toISOString().split('T')[0];

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

    const pendingCRs = (changeRequests || []).filter(cr => cr.status === 'Pending').length;
    const overdueActions = (actionItems || []).filter(a => a.dueDate && a.dueDate < today && a.status !== 'Done').length;

    return { total, completed, inProgress, blocked, notStarted, progress, overdue, highIssues, openIssues, pendingCRs, overdueActions };
  }, [tasks, issues, changeRequests, actionItems, today]);

  // Project Health
  const health = useMemo(() => {
    const { overdue, blocked, highIssues, overdueActions, pendingCRs } = metrics;
    const reasons = [];
    if (overdue.length > 0) reasons.push(`${overdue.length} overdue tasks`);
    if (overdueActions > 0) reasons.push(`${overdueActions} overdue actions`);
    if (highIssues.length > 0) reasons.push(`${highIssues.length} critical issues`);
    if (pendingCRs > 3) reasons.push(`${pendingCRs} pending CRs`);
    if (blocked > 0) reasons.push(`${blocked} blocked tasks`);

    const reasonText = reasons.length > 0 ? `Why at risk: ${reasons.join(', ')}` : 'All good';

    if (overdue.length >= 3 || highIssues.length >= 3 || blocked >= 3 || overdueActions >= 3) return { label: 'At Risk', color: '#ff6b6b', emoji: '🔴', reasonText };
    if (overdue.length >= 1 || highIssues.length >= 1 || blocked >= 1 || overdueActions >= 1 || pendingCRs > 0) return { label: 'Caution', color: '#ffeaa7', emoji: '🟡', reasonText };
    return { label: 'On Track', color: '#55efc4', emoji: '🟢', reasonText };
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
    const items: { icon: string; text: string; severity: number; link: string }[] = [];
    metrics.overdue.forEach(t => items.push({ icon: '🔥', text: `Overdue Task: "${t.title}" (due ${t.dueDate})`, severity: 1, link: '/schedule' }));
    metrics.highIssues.forEach(i => items.push({ icon: '⚠️', text: `${i.severity} Issue: "${i.title}"`, severity: 2, link: '/issues' }));
    if (metrics.overdueActions > 0) items.push({ icon: '⚡', text: `${metrics.overdueActions} Action Items are overdue`, severity: 2, link: '/actions' });
    if (metrics.pendingCRs > 0) items.push({ icon: '🔄', text: `${metrics.pendingCRs} Change Requests pending approval`, severity: 3, link: '/issues' });
    if (metrics.blocked > 0) items.push({ icon: '🚫', text: `${metrics.blocked} task(s) are blocked — investigate dependencies`, severity: 3, link: '/schedule' });
    if (budgetSummary.percent > 80 && budgetSummary.contract > 0) items.push({ icon: '💰', text: `Budget usage at ${budgetSummary.percent}% — review spending`, severity: 4, link: '/budget' });
    if (timelineProgress.elapsed > timelineProgress.taskProgress + 15) items.push({ icon: '⏰', text: `Timeline: ${timelineProgress.elapsed}% elapsed but only ${timelineProgress.taskProgress}% completed`, severity: 5, link: '/schedule' });
    if (items.length === 0) items.push({ icon: '✅', text: 'All clear! Project is on track.', severity: 99, link: '/' });
    return items.sort((a, b) => a.severity - b.severity).slice(0, 6);
  }, [metrics, budgetSummary, timelineProgress]);

  // Risk matrix counts (based on actual Risk entities)
  const riskMatrix = useMemo(() => {
    const safeRisks = risks || [];
    const openRisks = safeRisks.filter(r => r.status !== 'Closed');
    const matrix = { high: 0, medium: 0, low: 0 };
    openRisks.forEach(r => {
      // Use combined score: prob+impact
      const probScore = r.probability === 'High' ? 2 : r.probability === 'Medium' ? 1 : 0;
      const impScore = r.impact === 'High' ? 2 : r.impact === 'Medium' ? 1 : 0;
      const combined = probScore + impScore;
      if (combined >= 3) matrix.high++;
      else if (combined >= 2) matrix.medium++;
      else matrix.low++;
    });
    return matrix;
  }, [risks]);

  const upcomingDeploys = useMemo(() => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return (deployments || []).filter(d =>
      d.status !== 'Deployed' && d.status !== 'Completed' && d.status !== 'Failed' && d.status !== 'Rolled Back'
      && (d.deploymentDate || d.plannedDate || '') >= today
      && (d.deploymentDate || d.plannedDate || '') <= nextWeek
    ).sort((a, b) => (a.deploymentDate || a.plannedDate || '').localeCompare(b.deploymentDate || b.plannedDate || ''));
  }, [deployments, today]);

  const recentDecisions = useMemo(() => {
    return [...(decisions || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  }, [decisions]);

  const projectName = projectInfo?.name || 'AGS Project';

  // Format currency
  const fmtCurrency = (n: number) => `$${n.toLocaleString()}`;

  const handleGenerateSummary = async () => {
    setIsAILoading(true);
    try {
      const summaryContext = `
        Project: ${projectName}
        Health: ${health.label} (${health.reasonText})
        Tasks: ${metrics.progress}%
        Open Issues: ${metrics.openIssues.length} (High Severity: ${metrics.highIssues.length})
        Overdue Items: ${metrics.overdue.length} tasks, ${metrics.overdueActions} actions
        Budget Spent: ${budgetSummary.percent}%
        Recent Activities: ${activities.slice(0, 5).map(a => a.action).join(', ')}
      `;

      const res = await fetch('/api/generate-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Write a comprehensive but concise executive summary of the project status, highlighting key risks and next steps. Do not use more than 3 bullet points.',
          context: summaryContext
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }
      if (data.text) setAiSummary(data.text);
    } catch (e: unknown) {
      console.error(e);
      toast.error((e as Error).message || 'AI 요약 생성 중 오류가 발생했습니다. API 키 크레딧을 확인해주세요.');
    } finally {
      setIsAILoading(false);
    }
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
        <div className={styles.healthBadge} style={{ borderColor: health.color }} title={health.reasonText}>
          <span>{health.emoji}</span>
          <span style={{ color: health.color }}>{health.label}</span>
        </div>
      </header>

      {/* Unified AI Executive Summary Card */}
      <Card style={{ marginBottom: '1.5rem', backgroundColor: 'var(--surface-2)', border: '1px solid var(--brand-primary)' }}>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className={styles.aiTitleGroup}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
                <Bot size={20} /> AI Executive Summary
              </h3>
              <p className={styles.aiSubtitle} style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>Automated Insights & Real-time Analysis</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleGenerateSummary} disabled={isAILoading}>
              {isAILoading ? <Loader2 size={14} className={styles.spin} style={{ marginRight: '0.5rem' }} /> : <Lightbulb size={14} style={{ marginRight: '0.5rem' }} />}
              {aiSummary ? 'Regenerate Analysis' : 'Generate Analysis'}
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>🚀 <strong>Progress:</strong> {projectName} is {metrics.progress}% complete ({metrics.completed}/{metrics.total} tasks). {metrics.inProgress > 0 ? `${metrics.inProgress} in progress.` : ''}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>⚠️ <strong>Risks:</strong> {metrics.overdue.length} overdue, {metrics.blocked} blocked. {metrics.highIssues.length > 0 ? `${metrics.highIssues.length} high-severity issues.` : 'No critical issues.'}</div>
            {budgetSummary.contract > 0 && (
              <div style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>💰 <strong>Budget:</strong> {budgetSummary.percent}% spent. {budgetSummary.remaining > 0 ? `$${budgetSummary.remaining.toLocaleString()} remaining.` : 'Budget fully consumed!'}</div>
            )}
            <div style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>🎯 <strong>Team:</strong> {members.length > 0 ? `${members.length} members across ${new Set(members.map(m => m.role)).size} roles.` : 'Register team members to track allocation.'}</div>
          </div>

          {aiSummary ? (
            <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--foreground)', whiteSpace: 'pre-wrap', backgroundColor: 'var(--surface-3)', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
                <Sparkles size={16} /> AI Assessment
              </div>
              {aiSummary}
            </div>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
              Click &quot;Generate Analysis&quot; to get a deep-dive AI assessment of the current project state.
            </p>
          )}
        </div>
      </Card>

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
        <Card glass glow className={cn(styles.kpiCard, styles.kpiClickable)} onClick={() => router.push('/schedule')}>
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

        <Card glass glow className={cn(styles.kpiCard, styles.kpiClickable)} onClick={() => router.push('/schedule')}>
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

        <Card glass glow className={cn(styles.kpiCard, styles.kpiClickable)} onClick={() => router.push('/issues')}>
          <CardContent>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Open Issues</span>
              <div className={cn(styles.kpiIconBox, styles.kpiIconOrange)}><AlertTriangle size={18} /></div>
            </div>
            <div className={styles.bigNumber}>{metrics.openIssues.length}</div>
            <div className={styles.metaText}>{metrics.highIssues.length} high priority</div>
          </CardContent>
        </Card>

        <Card glass glow className={cn(styles.kpiCard, styles.kpiClickable)} onClick={() => router.push('/issues')}>
          <CardContent>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Pending CRs</span>
              <div className={cn(styles.kpiIconBox, styles.kpiIconBlue)}><RefreshCw size={18} /></div>
            </div>
            <div className={styles.bigNumber}>{metrics.pendingCRs}</div>
            <div className={styles.metaText}>{metrics.pendingCRs > 0 ? "Awaiting approvals" : "All clear"}</div>
          </CardContent>
        </Card>

        <Card glass glow className={cn(styles.kpiCard, styles.kpiClickable)} onClick={() => router.push('/actions')}>
          <CardContent>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Overdue Actions</span>
              <div className={cn(styles.kpiIconBox, styles.kpiIconRed)}><CheckCircle size={18} /></div>
            </div>
            <div className={cn(styles.bigNumber, metrics.overdueActions > 0 ? styles.textRed : styles.textGreen)}>{metrics.overdueActions}</div>
            <div className={styles.metaText}>{metrics.overdueActions > 0 ? "Requires follow-up" : "All actions on time"}</div>
          </CardContent>
        </Card>

        <Card glass glow className={cn(styles.kpiCard, styles.kpiClickable)} onClick={() => router.push('/budget')}>
          <CardContent>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Remaining Budget</span>
              <div className={cn(styles.kpiIconBox, styles.kpiIconGreen)}><DollarSign size={18} /></div>
            </div>
            {budgetSummary.contract > 0 ? (
              <>
                <div className={styles.bigNumber}>
                  {fmtCurrency(budgetSummary.remaining)}
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${budgetSummary.percent}%`, background: budgetSummary.percent > 80 ? 'linear-gradient(90deg, #ff6b6b, #e17055)' : undefined }} />
                </div>
                <div className={styles.metaText}>
                  {budgetSummary.percent}% spent of {fmtCurrency(budgetSummary.contract)}
                </div>
              </>
            ) : (
              <>
                <div className={styles.bigNumber} style={{ fontSize: '1.125rem', color: 'var(--foreground-muted)' }}>Not Set</div>
                <div className={styles.metaText}>Go to Budget page to set contract amount</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: Attention + Risk + AI */}
      <div className={styles.bottomGrid}>
        {/* LEFT COLUMN: Attention & Decisions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  <div key={i} className={cn(styles.actionItem, styles.kpiClickable)} onClick={() => router.push(item.link)} style={{ cursor: 'pointer' }}>
                    <span className={styles.actionIcon}>{item.icon}</span>
                    <span className={styles.actionText}>{item.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Decisions */}
          <Card className={styles.listCard}>
            <CardHeader>
              <CardTitle>
                <Lightbulb size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom', color: 'var(--primary-light)' }} />
                Recent Decisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentDecisions.length === 0 ? (
                <div className={styles.emptyState}>No recent decisions</div>
              ) : (
                <div className={styles.actionsList}>
                  {recentDecisions.map(d => (
                    <div key={d.id} className={styles.actionItem} onClick={() => router.push('/actions')} style={{ cursor: 'pointer' }}>
                      <span className={styles.actionIcon}>💡</span>
                      <span className={styles.actionText}><strong>{d.summary}</strong> <span style={{ color: 'var(--foreground-muted)' }}>(by {d.decidedBy || 'Team'})</span></span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Risk + Deployments + Activity */}
        <div className={styles.rightColumn}>
          {/* Risk Matrix */}
          <Card className={cn(styles.riskCard, styles.kpiClickable)} onClick={() => router.push('/issues')} style={{ cursor: 'pointer' }}>
            <CardHeader><CardTitle>Risk Matrix</CardTitle></CardHeader>
            <CardContent>
              <div className={styles.riskGrid}>
                <div className={cn(styles.riskCell, styles.riskS1)}>
                  <span className={styles.riskCount}>{riskMatrix.high}</span>
                  <span className={styles.riskLabel}>High</span>
                </div>
                <div className={cn(styles.riskCell, styles.riskS3)}>
                  <span className={styles.riskCount}>{riskMatrix.medium}</span>
                  <span className={styles.riskLabel}>Medium</span>
                </div>
                <div className={cn(styles.riskCell, styles.riskS4)}>
                  <span className={styles.riskCount}>{riskMatrix.low}</span>
                  <span className={styles.riskLabel}>Low</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deployments */}
          <Card className={styles.listCard}>
            <CardHeader>
              <CardTitle>
                <Rocket size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom', color: 'var(--accent-cyan)' }} />
                Upcoming Deployments (7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingDeploys.length === 0 ? (
                <div className={styles.emptyState}>No deployments planned</div>
              ) : (
                <div className={styles.actionsList}>
                  {upcomingDeploys.map(d => (
                    <div key={d.id} className={styles.actionItem} onClick={() => router.push('/releases')} style={{ cursor: 'pointer', padding: '0.375rem 0' }}>
                      <span className={cn(styles.envBadge, styles.actionIcon)} style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>{d.environment}</span>
                      <span className={styles.actionText}><strong>v{d.version}</strong> <span style={{ color: 'var(--foreground-muted)' }}>({d.deploymentDate || d.plannedDate})</span></span>
                    </div>
                  ))}
                </div>
              )}
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

      {/* End of content */}
    </div>
  );
}
