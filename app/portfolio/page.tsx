'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProject } from '@/hooks/useProject';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { LayoutDashboard, CheckCircle, AlertCircle, Clock, Navigation } from 'lucide-react';
import styles from './portfolio.module.css';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function PortfolioPage() {
    const { projects, switchProject } = useProject();
    const router = useRouter();
    const [tooltipContent, setTooltipContent] = useState("");
    const [projectCoords, setProjectCoords] = useState<Record<string, { lat: number, lng: number }>>({});

    // Geocode locations on the fly (basic caching)
    useEffect(() => {
        const fetchCoords = async () => {
            const newCoords = { ...projectCoords };
            let hasChanges = false;

            for (const p of projects) {
                if (p.info.location && !newCoords[p.id]) {
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(p.info.location)}`);
                        const data = await res.json();
                        if (data && data.length > 0) {
                            newCoords[p.id] = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                            hasChanges = true;
                        } else {
                            // Default to center if not found 
                            newCoords[p.id] = { lat: 0, lng: 0 };
                            hasChanges = true;
                        }
                    } catch (err) {
                        console.error("Geocoding failed for", p.info.location);
                    }
                    // Rate limit protection
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            if (hasChanges) {
                setProjectCoords(newCoords);
            }
        };
        fetchCoords();
    }, [projects]);

    const stats = useMemo(() => {
        let totalTasks = 0;
        let completedTasks = 0;
        let totalIssues = 0;
        let overdueTasks = 0;

        projects.forEach(p => {
            totalTasks += p.tasks.length;
            completedTasks += p.tasks.filter(t => t.status === 'Done').length;
            totalIssues += p.issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length;
            const now = new Date().toISOString();
            overdueTasks += p.tasks.filter(t => t.status !== 'Done' && t.dueDate && t.dueDate < now).length;
        });

        const overallProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
            totalProjects: projects.length,
            overallProgress,
            totalTasks,
            completedTasks,
            totalIssues,
            overdueTasks
        };
    }, [projects]);

    const handleNavigate = (projectId: string) => {
        switchProject(projectId);
        router.push('/');
    };

    return (
        <div className={styles.commandRoom}>
            <header className={styles.header}>
                <h1 className={styles.title}>PROJECT COMMAND ROOM</h1>
                <div className={styles.timeDisplay}>{new Date().toISOString().split('T')[0]}</div>
            </header>

            <div className={styles.grid}>
                {/* Left Panel - KPIs */}
                <div className={styles.sidePanel}>
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}><LayoutDashboard size={24} /></div>
                        <div className={styles.kpiData}>
                            <span className={styles.kpiValue}>{stats.totalProjects}</span>
                            <span className={styles.kpiLabel}>ACTIVE DEPLOYMENTS</span>
                        </div>
                    </div>

                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}><CheckCircle size={24} color="var(--success)" /></div>
                        <div className={styles.kpiData}>
                            <span className={styles.kpiValue} style={{ color: 'var(--success)' }}>{stats.overallProgress}%</span>
                            <span className={styles.kpiLabel}>GLOBAL PROGRESS</span>
                        </div>
                    </div>

                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}><Clock size={24} color="var(--warning)" /></div>
                        <div className={styles.kpiData}>
                            <span className={styles.kpiValue} style={{ color: 'var(--warning)' }}>{stats.overdueTasks}</span>
                            <span className={styles.kpiLabel}>CRITICAL DELAYS</span>
                        </div>
                    </div>

                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}><AlertCircle size={24} color="var(--destructive)" /></div>
                        <div className={styles.kpiData}>
                            <span className={styles.kpiValue} style={{ color: 'var(--destructive)' }}>{stats.totalIssues}</span>
                            <span className={styles.kpiLabel}>SYSTEM ALERTS</span>
                        </div>
                    </div>
                </div>

                {/* Center Map */}
                <div className={styles.mapContainer}>
                    <div className={styles.mapOverlay}>
                        <h2>GLOBAL DISTRIBUTION NETWORK</h2>
                        {tooltipContent && <div className={styles.tooltip}>{tooltipContent}</div>}
                    </div>
                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{ scale: 140 }}
                        style={{ width: "100%", height: "100%", outline: 'none' }}
                    >
                        <ZoomableGroup center={[0, 20]} zoom={1}>
                            <Geographies geography={geoUrl}>
                                {({ geographies }) =>
                                    geographies.map((geo) => (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill="#0f1b29"
                                            stroke="#1e3a5f"
                                            strokeWidth={0.5}
                                            style={{
                                                default: { outline: "none" },
                                                hover: { fill: "#132842", outline: "none" },
                                                pressed: { fill: "#0f1b29", outline: "none" },
                                            }}
                                        />
                                    ))
                                }
                            </Geographies>
                            {projects.map(p => {
                                const coords = projectCoords[p.id];
                                if (!coords) return null;

                                const completed = p.tasks.filter(t => t.status === 'Done').length;
                                const total = p.tasks.length;
                                const prg = total ? Math.round((completed / total) * 100) : 0;
                                const issues = p.issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length;
                                const color = issues > 0 ? "#ff4d4f" : "#00f0ff";

                                return (
                                    <Marker
                                        key={p.id}
                                        coordinates={[coords.lng, coords.lat]}
                                        onMouseEnter={() => {
                                            setTooltipContent(`${p.info.name} | Progress: ${prg}% | Issues: ${issues}`);
                                        }}
                                        onMouseLeave={() => {
                                            setTooltipContent("");
                                        }}
                                        onClick={() => handleNavigate(p.id)}
                                    >
                                        <g style={{ cursor: 'pointer' }}>
                                            <circle r={6} fill={color} stroke="#fff" strokeWidth={1.5} />
                                            <circle r={14} fill={color} opacity={0.3} className={styles.pulse} />
                                        </g>
                                    </Marker>
                                );
                            })}
                        </ZoomableGroup>
                    </ComposableMap>
                </div>

                {/* Right Panel - Roster */}
                <div className={styles.sidePanel}>
                    <h3 className={styles.panelTitle}><Navigation size={16} /> ACTIVE NODES</h3>
                    <div className={styles.rosterList}>
                        {projects.map(p => {
                            const completed = p.tasks.filter(t => t.status === 'Done').length;
                            const total = p.tasks.length;
                            const prg = total ? Math.round((completed / total) * 100) : 0;
                            const issues = p.issues.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length;

                            return (
                                <div key={p.id} className={styles.rosterCard} onClick={() => handleNavigate(p.id)}>
                                    <div className={styles.rosterHeader}>
                                        <div className={styles.rosterName}>{p.info.name}</div>
                                        <div className={styles.rosterStatus} style={{ color: issues > 0 ? 'var(--destructive)' : 'var(--success)' }}>
                                            {issues > 0 ? 'ALERT' : 'STABLE'}
                                        </div>
                                    </div>
                                    <div className={styles.rosterDetail}>
                                        <span>{p.info.location || 'Unknown Location'}</span>
                                    </div>
                                    <div className={styles.progressBarBg}>
                                        <div className={styles.progressBarFill} style={{ width: `${prg}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                        {projects.length === 0 && (
                            <div style={{ color: 'var(--foreground-muted)', fontSize: '0.875rem', textAlign: 'center', marginTop: '2rem' }}>
                                NO ACTIVE NODES DETECTED
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
