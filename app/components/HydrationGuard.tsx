'use client';

import { useEffect, useState } from 'react';

/**
 * Defer rendering children until the client has mounted.
 * This prevents Zustand persist hydration mismatches where
 * the server renders with default state but the client loads
 * from localStorage.
 */
export default function HydrationGuard({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'var(--background)',
                color: 'var(--foreground-muted)',
                fontSize: '0.875rem',
            }}>
                Loading...
            </div>
        );
    }

    return <>{children}</>;
}
