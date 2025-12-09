
import { invoke } from '@tauri-apps/api/core';
import React, { useState } from 'react';

type Props = {
    onClose: () => void;
}

const NewGroupModal = ({ onClose }: Props) => {
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

            await invoke('create_group', {
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
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            color: 'white' // Ensure text is visible on dark background if parent styles don't set it
        }}>
            <div style={{
                backgroundColor: '#2f2f2f',
                padding: '20px',
                borderRadius: '8px',
                minWidth: '400px', // Increased width a bit
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        border: 'none',
                        background: 'transparent',
                        color: 'white',
                        fontSize: '1.2rem',
                        cursor: 'pointer'
                    }}
                >
                    &times;
                </button>
                <h2 style={{ marginTop: 0 }}>Create New Group</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label>Group Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Work Focus"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: 'white' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label>Domains (one per line)</label>
                        <textarea
                            placeholder="example.com&#10;social.media"
                            value={domains}
                            onChange={(e) => setDomains(e.target.value)}
                            rows={5}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: 'white', fontFamily: 'monospace' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Schedule Days</label>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {daysOfWeek.map(day => (
                                <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedDays.includes(day)}
                                        onChange={() => handleDayToggle(day)}
                                    />
                                    {day}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label>Start Time</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: 'white' }}
                            />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label>End Time</label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: 'white' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            padding: '10px',
                            backgroundColor: '#646cff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            marginTop: '10px'
                        }}
                    >
                        Create Group
                    </button>
                </form>
            </div>
        </div>
    )
}

export default NewGroupModal