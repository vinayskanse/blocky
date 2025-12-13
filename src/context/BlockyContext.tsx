import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

// Types
export type Schedule = {
    days: string[];
    start: string;
    end: string;
}

export type Group = {
    id: string;
    name: string;
    enabled: boolean;
    domains: string[];
    schedule?: Schedule;
}

interface BlockyContextType {
    groups: Group[];
    loading: boolean;
    error: string | null;
    fetchGroups: () => Promise<void>;
    addGroup: (data: { name: string; domains: string[]; days: string[]; startTime: string; endTime: string }) => Promise<void>;
    updateGroup: (id: string, name: string, enabled: boolean) => Promise<void>;
    updateDomains: (id: string, domains: string[]) => Promise<void>;
    updateSchedule: (id: string, schedule: { days: string[]; startTime: string; endTime: string }) => Promise<void>;
    deleteGroup: (id: string) => Promise<void>;
}

const BlockyContext = createContext<BlockyContextType | undefined>(undefined);

export const BlockyProvider = ({ children }: { children: ReactNode }) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        try {
            // fake time
            await new Promise((resolve) => setTimeout(resolve, 3000));
            const res = await invoke<Group[]>('get_all_groups');
            setGroups(res);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const addGroup = async (data: { name: string; domains: string[]; days: string[]; startTime: string; endTime: string }) => {
        try {
            await invoke('create_group', data);
            await fetchGroups();
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const updateGroup = async (id: string, name: string, enabled: boolean) => {
        try {
            await invoke('update_group', { id, name, enabled });
            await fetchGroups();
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const updateDomains = async (id: string, domains: string[]) => {
        try {
            await invoke('update_domains', { id, domains });
            await fetchGroups();
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const updateSchedule = async (id: string, schedule: { days: string[]; startTime: string; endTime: string }) => {
        try {
            await invoke('update_schedule', {
                id,
                days: schedule.days,
                startTime: schedule.startTime,
                endTime: schedule.endTime
            });
            await fetchGroups();
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const deleteGroup = async (id: string) => {
        try {
            await invoke('delete_group', { id });
            await fetchGroups();
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    return (
        <BlockyContext.Provider value={{
            groups,
            loading,
            error,
            fetchGroups,
            addGroup,
            updateGroup,
            updateDomains,
            updateSchedule,
            deleteGroup
        }}>
            {children}
        </BlockyContext.Provider>
    );
};

export const useBlockyContext = () => {
    const context = useContext(BlockyContext);
    if (context === undefined) {
        throw new Error('useBlockyContext must be used within a BlockyProvider');
    }
    return context;
};
