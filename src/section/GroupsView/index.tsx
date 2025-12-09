import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

type Props = {
    onBack: () => void;
}

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

const GroupsView = ({ onBack }: Props) => {
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

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const handleScheduleDayToggle = (day: string) => {
        setEditSchedule(prev => ({
            ...prev,
            days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
        }));
    };

    const handleDeleteGroup = async (id: string) => {
        if (!confirm('Are you sure you want to delete this group?')) return;
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
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={onBack} style={{ marginRight: '20px', background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>&larr;</button>
                <h1>Groups</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {groups.map(group => (
                    <div key={group.id} style={{
                        background: '#2f2f2f',
                        padding: '15px',
                        borderRadius: '8px',
                        border: '1px solid #444'
                    }}>
                        {editingId === group.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {/* Edit Mode */}
                                <input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    style={{ padding: '5px' }}
                                />
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <span>Domains:</span>
                                    <textarea
                                        value={editDomains}
                                        onChange={e => setEditDomains(e.target.value)}
                                        rows={3}
                                        style={{ width: '100%', fontFamily: 'monospace' }}
                                    />
                                </div>
                                <div>
                                    <span>Schedule:</span>
                                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', margin: '5px 0' }}>
                                        {daysOfWeek.map(day => (
                                            <label key={day} style={{ cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={editSchedule.days.includes(day)}
                                                    onChange={() => handleScheduleDayToggle(day)}
                                                /> {day}
                                            </label>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input type="time" value={editSchedule.start} onChange={e => setEditSchedule({ ...editSchedule, start: e.target.value })} />
                                        <span>to</span>
                                        <input type="time" value={editSchedule.end} onChange={e => setEditSchedule({ ...editSchedule, end: e.target.value })} />
                                    </div>
                                    <button
                                        onClick={() => setEditSchedule({ days: [], start: '', end: '' })}
                                        style={{ marginTop: '5px', fontSize: '0.8rem', background: '#442222' }}
                                    >
                                        Clear Schedule
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button onClick={() => saveGroup(group.id)}>Save</button>
                                    <button onClick={cancelEditing}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {/* View Mode */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, opacity: group.enabled ? 1 : 0.5 }}>{group.name} {group.enabled ? '(Active)' : '(Inactive)'}</h3>
                                    <div>
                                        <button onClick={() => toggleGroup(group)} style={{ marginRight: '10px' }}>
                                            {group.enabled ? 'Disable' : 'Enable'}
                                        </button>
                                        <button onClick={() => startEditing(group)} style={{ marginRight: '10px' }}>Edit</button>
                                        <button onClick={() => handleDeleteGroup(group.id)} style={{ background: '#ff4444' }}>Delete</button>
                                    </div>
                                </div>
                                <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#ccc' }}>
                                    <strong>Domains:</strong> {group.domains.join(', ')}
                                </div>
                                <div style={{ marginTop: '5px', fontSize: '0.9rem', color: '#ccc' }}>
                                    <strong>Schedule:</strong> {group.schedule ? `${group.schedule.days.join(', ')} (${group.schedule.start} - ${group.schedule.end})` : 'None'}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {groups.length === 0 && <p>No groups found.</p>}
            </div>
        </div>
    )
}

export default GroupsView