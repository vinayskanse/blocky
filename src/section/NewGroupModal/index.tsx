import React, { useState } from 'react';
import { useBlockyContext } from '../../context/BlockyContext';

type Props = {
    onClose: () => void;
};

const NewGroupModal = ({ onClose }: Props) => {
    const { addGroup } = useBlockyContext();
    const [name, setName] = useState('');
    const [domains, setDomains] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const handleDayToggle = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Split domains by new line and filter empty strings
            const domainList = domains.split('\n').map(d => d.trim()).filter(d => d.length > 0);

            await addGroup({
                name,
                domains: domainList,
                days: selectedDays,
                startTime: startTime,
                endTime: endTime,
            });
            onClose();
        } catch (error) {
            console.error('Failed to create group:', error);
            alert('Failed to create group: ' + error);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="card modal-content">
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-text-light)',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        lineHeight: 1
                    }}
                >
                    &times;
                </button>

                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Create New Group</h2>

                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Group Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Work Focus"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Domains to Block</label>
                        <textarea
                            value={domains}
                            onChange={(e) => setDomains(e.target.value)}
                            placeholder="facebook.com&#10;twitter.com"
                            rows={4}
                            style={{ fontFamily: 'monospace' }}
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>One domain per line</span>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Active Days</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {daysOfWeek.map(day => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleDayToggle(day)}
                                    className={`btn ${selectedDays.includes(day) ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Start Time</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>End Time</label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        style={{
                            marginTop: '1rem',
                            padding: '0.8rem',
                            fontWeight: 'bold'
                        }}
                    >
                        Create Group
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NewGroupModal;
