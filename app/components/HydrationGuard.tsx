'use client';

import { useEffect, useState } from 'react';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';

/**
 * Defer rendering children until the client has mounted.
 * This prevents Zustand persist hydration mismatches where
 * the server renders with default state but the client loads
 * from localStorage.
 */
export default function HydrationGuard({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    // Enable real-time syncing and fetch initial DB data on load
    useSupabaseSync();

    useEffect(() => {
        // eslint-disable-next-line
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
