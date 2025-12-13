import { useState } from 'react';
import { useBlockyContext, Group, Schedule } from '../../context/BlockyContext';

const GroupsView = () => {
    const { groups, loading, updateGroup, updateDomains, updateSchedule, deleteGroup } = useBlockyContext();
    const [editingId, setEditingId] = useState<string | null>(null);

    // Edit State
    const [editName, setEditName] = useState('');
    const [editDomains, setEditDomains] = useState('');
    const [editSchedule, setEditSchedule] = useState<Schedule>({ days: [], start: '09:00', end: '17:00' });


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
            await updateGroup(id, editName, true); // Keep enabled true for now or add toggle

            // Update domains
            const domainList = editDomains.split('\n').map(d => d.trim()).filter(d => d.length > 0);
            await updateDomains(id, domainList);

            // Update schedule
            await updateSchedule(id, {
                days: editSchedule.days,
                startTime: editSchedule.start,
                endTime: editSchedule.end
            });

            setEditingId(null);
        } catch (error) {
            console.error(error);
            alert('Failed to update group: ' + error);
        }
    };

    const toggleGroup = async (group: Group) => {
        try {
            await updateGroup(group.id, group.name, !group.enabled);
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
            await deleteGroup(id);
        } catch (error) {
            console.error('Failed to delete group:', error);
            alert('Failed to delete group: ' + error);
        }
    };

    if (loading) return <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "60vh"
    }}>Loading...</div>;

    return (
        <div className="w-full">
            <div className="groups-grid">
                {groups.map(group => (
                    <div key={group.id} className="card" style={{
                        opacity: group.enabled ? 1 : 0.8,
                        padding: '1.25rem' // Override default padding for tighter feel
                    }}>
                        {editingId === group.id ? (
                            // Edit Mode
                            <div className="flex-col gap-4">
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
                                        style={{ fontFamily: 'monospace' }}
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
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
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
                                        style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.5rem' }}
                                    >
                                        Clear Schedule
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                                    <button onClick={() => saveGroup(group.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Save Changes</button>
                                    <button onClick={cancelEditing} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <div>
                                <div className="justify-between items-center" style={{ display: 'flex', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{group.name}</h3>
                                        <span style={{
                                            backgroundColor: group.enabled ? 'var(--color-success-bg)' : 'rgba(255, 255, 255, 0.05)',
                                            color: group.enabled ? 'var(--color-success)' : 'var(--color-text-muted)',
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '999px',
                                            fontSize: '0.65rem',
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
                                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', minWidth: 'auto' }}
                                        >
                                            {group.enabled ? 'Disable' : 'Enable'}
                                        </button>
                                        <button
                                            onClick={() => startEditing(group)}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', minWidth: 'auto' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteGroup(group.id)}
                                            className="btn btn-danger"
                                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', minWidth: 'auto' }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <strong style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Blocked Domains</strong>
                                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
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
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <strong style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Active Schedule</strong>
                                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
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


                {
                    groups.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-light)' }}>
                            <p>No groups created yet. Click "Create new group" to start blocking!</p>
                        </div>
                    )
                }
            </div>
        </div >
    );
};

export default GroupsView