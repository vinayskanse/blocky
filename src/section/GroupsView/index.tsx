import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

type Schedule = {
    days: string[];
    start: string;
    end: string;
}

type Group = {
    id: string;
    name: string;
    enabled: boolean;
    domains: string[];
    schedule?: Schedule;
}

const GroupsView = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Edit State
    const [editName, setEditName] = useState('');
    const [editDomains, setEditDomains] = useState('');
    const [editSchedule, setEditSchedule] = useState<Schedule>({ days: [], start: '09:00', end: '17:00' });

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await invoke<Group[]>('get_all_groups');
            setGroups(res);
        } catch (error) {
            console.error(error);
            alert('Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (group: Group) => {
        setEditingId(group.id);
        setEditName(group.name);
        setEditDomains(group.domains.join('\n'));
        setEditSchedule(group.schedule || { days: [], start: '09:00', end: '17:00' });
    };

    const cancelEditing = () => {
        setEditingId(null);
    };

    const saveGroup = async (id: string) => {
        try {
            // Update name/enabled
            await invoke('update_group', { id, name: editName, enabled: true }); // Keep enabled true for now or add toggle

            // Update domains
            const domainList = editDomains.split('\n').map(d => d.trim()).filter(d => d.length > 0);
            await invoke('update_domains', { id, domains: domainList });

            // Update schedule
            await invoke('update_schedule', {
                id,
                days: editSchedule.days,
                startTime: editSchedule.start,
                endTime: editSchedule.end
            });

            await fetchGroups();
            setEditingId(null);
        } catch (error) {
            console.error(error);
            alert('Failed to update group: ' + error);
        }
    };

    const toggleGroup = async (group: Group) => {
        try {
            await invoke('update_group', { id: group.id, name: group.name, enabled: !group.enabled });
            fetchGroups();
        } catch (error) {
            console.error(error);
        }
    }


    const handleScheduleDayToggle = (day: string) => {
        setEditSchedule(prev => ({
            ...prev,
            days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
        }));
    };

    const handleDeleteGroup = async (id: string) => {
        try {
            await invoke('delete_group', { id });
            fetchGroups();

        } catch (error) {
            console.error('Failed to delete group:', error);
            alert('Failed to delete group: ' + error);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--color-text-main)' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {groups.map(group => (
                    <div key={group.id} className="card" style={{
                        borderLeft: group.enabled ? '4px solid var(--color-success)' : '4px solid transparent',
                        opacity: group.enabled ? 1 : 0.8
                    }}>
                        {editingId === group.id ? (
                            // Edit Mode
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Group Name</label>
                                    <input
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        placeholder="E.g. Social Media"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Domains (one per line)</label>
                                    <textarea
                                        value={editDomains}
                                        onChange={e => setEditDomains(e.target.value)}
                                        rows={4}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-xs)', border: '2px solid #E2E8F0', fontFamily: 'monospace' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Schedule</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                            <button
                                                key={day}
                                                onClick={() => handleScheduleDayToggle(day)}
                                                className={`btn ${editSchedule.days.includes(day) ? 'btn-primary' : 'btn-secondary'}`}
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <input
                                            type="time"
                                            value={editSchedule.start}
                                            onChange={e => setEditSchedule({ ...editSchedule, start: e.target.value })}
                                            style={{ width: 'auto' }}
                                        />
                                        <span style={{ fontWeight: 600, color: 'var(--color-text-light)' }}>to</span>
                                        <input
                                            type="time"
                                            value={editSchedule.end}
                                            onChange={e => setEditSchedule({ ...editSchedule, end: e.target.value })}
                                            style={{ width: 'auto' }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setEditSchedule({ days: [], start: '', end: '' })}
                                        className="btn btn-ghost"
                                        style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}
                                    >
                                        Clear Schedule
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                                    <button onClick={() => saveGroup(group.id)} className="btn btn-primary">Save Changes</button>
                                    <button onClick={cancelEditing} className="btn btn-secondary">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{group.name}</h3>
                                        <span style={{
                                            backgroundColor: group.enabled ? 'var(--color-success-bg)' : 'rgba(255, 255, 255, 0.05)',
                                            color: group.enabled ? 'var(--color-success)' : 'var(--color-text-muted)',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            letterSpacing: '0.05em',
                                            textTransform: 'uppercase',
                                            border: group.enabled ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)'
                                        }}>
                                            {group.enabled ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => toggleGroup(group)}
                                            className={`btn ${group.enabled ? 'btn-secondary' : 'btn-primary'}`}
                                            title={group.enabled ? 'Disable Group' : 'Enable Group'}
                                        >
                                            {group.enabled ? 'Disable' : 'Enable'}
                                        </button>
                                        <button onClick={() => startEditing(group)} className="btn btn-secondary">Edit</button>
                                        <button onClick={() => handleDeleteGroup(group.id)} className="btn btn-danger">Delete</button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <strong style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Blocked Domains</strong>
                                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                            {group.domains.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    {group.domains.slice(0, 5).map(d => (
                                                        <span key={d} style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{d}</span>
                                                    ))}
                                                    {group.domains.length > 5 && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>+{group.domains.length - 5} more</span>}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No domains added yet.</span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <strong style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Active Schedule</strong>
                                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                                            {group.schedule ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{group.schedule.days.join(', ')}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                                                        <span style={{ fontSize: '1.1rem' }}>⏰</span>
                                                        <span>{group.schedule.start} - {group.schedule.end}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span>📅</span> No schedule set (Always active)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {groups.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-light)' }}>
                        <p>No groups created yet. Click "Create new group" to start blocking!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupsView