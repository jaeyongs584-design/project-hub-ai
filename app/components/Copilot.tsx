'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import styles from './Copilot.module.css';
import { toast } from 'sonner';

export function Copilot() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const {
        projectInfo, tasks, issues, members, budget, risks, actionItems,
        vendors, procurements, deployments, milestones, systems, assets,
        decisions, changeRequests, communications, meetings, siteLogs
    } = useProject();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Calculate budget summary
    const spent = budget.entries.reduce((sum, e) => sum + e.amount, 0);
    const remaining = budget.contractAmount - spent;

    // Build context string dynamically
    const projectContext = `
    Project Name: ${projectInfo.name || 'Unset'}
    Description: ${projectInfo.description || 'Unset'}
    Total Tasks: ${tasks.length}
    Open Tasks: ${tasks.filter(t => t.status !== 'Done').length}
    Total Issues: ${issues.length}
    Critical Issues: ${issues.filter(i => i.severity === 'S1').length}
    Open Risks: ${risks.filter(r => r.status !== 'Closed').length}
    Open Action Items: ${actionItems.filter(a => a.status !== 'Done' && a.status !== 'Blocked').length}
    Total Vendors: ${vendors.length}
    Open Procurements: ${procurements.filter(p => p.status !== 'Closed' && p.status !== 'Cancelled').length}
    Deployments: ${deployments.length}
    Milestones: ${milestones.length} (Delayed: ${milestones.filter(m => m.status === 'Delayed').length})
    Active Systems: ${systems.filter(s => s.status === 'Online').length}
    Total Assets: ${assets.length}
    Pending Change Requests: ${changeRequests.filter(c => c.status === 'Pending').length}
    Recent Meetings: ${meetings.length}
    Recent Communications: ${communications.length}
    Recent Site Logs: ${siteLogs.length}
    Team Members: ${members.map(m => m.name).join(', ') || 'None'}
    Total Budget: $${budget.contractAmount.toLocaleString()}
    Spent Budget: $${spent.toLocaleString()}
    Remaining Budget: $${remaining.toLocaleString()}
    
    --- Vendor Overview ---
    ${vendors.length ? vendors.map(v => `- [${v.status}] ${v.name} (${v.serviceType})`).join('\n    ') : 'No vendors registered.'}
    
    --- Pending Change Requests Details ---
    ${changeRequests.length ? changeRequests.filter(c => c.status === 'Pending').map(c => `- ${c.title} (Type: ${c.changeType})`).join('\n    ') : 'No pending CRs.'}
    
    --- Task Details ---
    ${tasks.length ? tasks.map(t => `- [${t.status}] ${t.title} (Priority: ${t.priority} | Progress: ${t.progress}%)`).join('\n    ') : 'No tasks.'}
    
    --- Issue Details ---
    ${issues.length ? issues.map(i => `- [${i.status}] ${i.title} (Severity: ${i.severity})`).join('\n    ') : 'No issues.'}
    `;

    const [messages, setMessages] = useState<Array<{ id: string, role: string, content: string }>>([]);
    const [localInput, setLocalInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Early return only after ALL hooks
    if (pathname === '/login' || pathname === '/signup') return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!localInput.trim() || isLoading) return;

        const userMsg = { id: Date.now().toString(), role: 'user', content: localInput };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setLocalInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages, context: projectContext })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || 'API 에러가 발생했습니다.');
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error('스트림을 읽을 수 없습니다.');

            const decoder = new TextDecoder();
            let assistantContent = '';

            // Add an empty assistant message to update
            const tempAssistantId = Date.now().toString() + '-ai';
            setMessages(prev => [...prev, { id: tempAssistantId, role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantContent += chunk;

                setMessages(prev => {
                    const latest = [...prev];
                    const lastIdx = latest.length - 1;
                    if (latest[lastIdx].id === tempAssistantId) {
                        latest[lastIdx] = { ...latest[lastIdx], content: assistantContent };
                    }
                    return latest;
                });
            }
        } catch (err: unknown) {
            console.error('Copilot Chat API Error:', err);
            toast.error((err as Error).message || '채팅 응답을 받아오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // Simple markdown-ish rendering for the assistant
    const formatMessage = (content: string) => {
        // Very basic bold and line break parsing
        return content.split('\n').map((line, i) => (
            <p key={i}>
                {line.split(/\\*\\*(.*?)\\*\\*/g).map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                )}
            </p>
        ));
    };

    return (
        <>
            <button
                className={styles.fab}
                onClick={toggleOpen}
                aria-label="Open AI Copilot"
            >
                {isOpen ? <X size={24} /> : <Sparkles size={24} />}
            </button>

            {isOpen && (
                <div className={styles.panel}>
                    <div className={styles.header}>
                        <div className={styles.headerTitle}>
                            <Bot size={20} color="var(--brand-primary)" />
                            <span>ProjectHub Copilot</span>
                        </div>
                        <button className={styles.closeBtn} onClick={toggleOpen}>
                            <X size={18} />
                        </button>
                    </div>

                    <div className={styles.chatArea}>
                        {messages.length === 0 && (
                            <div className={styles.messageAssistant} style={{ opacity: 0.8, backgroundColor: 'transparent', border: 'none', fontStyle: 'italic' }}>
                                안녕하세요! <b>{projectInfo.name}</b> 프로젝트의 AI 어시스턴트입니다.
                                프로젝트 일정, 남은 이슈, 위험 사항이나 요약이 필요하시면 무엇이든 물어보세요!
                            </div>
                        )}
                        {messages.map(m => (
                            <div key={m.id} className={m.role === 'user' ? styles.messageUser : styles.messageAssistant}>
                                {m.role === 'user' ? m.content : formatMessage(m.content)}
                            </div>
                        ))}
                        {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
                            <div className={styles.messageAssistant}>
                                <div className={styles.loadingDot} />
                                <div className={styles.loadingDot} />
                                <div className={styles.loadingDot} />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className={styles.inputArea}>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <input
                                className={styles.input}
                                value={localInput}
                                onChange={(e) => setLocalInput(e.target.value)}
                                placeholder="프로젝트에 대해 질문하세요..."
                                disabled={isLoading}
                            />
                            <button type="submit" className={styles.sendBtn} disabled={isLoading || !localInput.trim()}>
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
