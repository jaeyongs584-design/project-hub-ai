'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

export function useSupabaseSync() {
    const fetchSupabaseData = useStore(state => state.fetchSupabaseData);

    useEffect(() => {
        // Fetch initial data on mount
        fetchSupabaseData();

        // Subscribe to changes on tasks, issues, and projects tables
        const channels = supabase.channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'projects' },
                () => { fetchSupabaseData(); }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => { fetchSupabaseData(); }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'issues' },
                () => { fetchSupabaseData(); }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channels);
        };
    }, [fetchSupabaseData]);
}
