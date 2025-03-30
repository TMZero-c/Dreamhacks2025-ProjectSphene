import React, { useState, useEffect } from 'react';
import { Lecture } from '../types/types';
import { fetchUserLectures, createLecture, joinLecture } from '../services/api';
import './LectureSelector.css';

interface LectureSelectorProps {
    selectedLecture?: Lecture | null;
    onLectureSelect: (lecture: Lecture) => void;
}

const LectureSelector: React.FC<LectureSelectorProps> = ({
    selectedLecture,
    onLectureSelect
}) => {
    const [lectures, setLectures] = useState<Lecture[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    // UI state
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showJoinForm, setShowJoinForm] = useState(false);

    // Form states
    const [newLectureTitle, setNewLectureTitle] = useState('');
    const [newLectureDescription, setNewLectureDescription] = useState('');
    const [joinCode, setJoinCode] = useState('');

    // Load lectures when component mounts
    useEffect(() => {
        const loadLectures = async () => {
            if (loading) return; // Prevent multiple simultaneous requests

            setLoading(true);
            try {
                const data = await fetchUserLectures();
                setLectures(data);
                setError(null);
                setRetryCount(0);
            } catch (err) {
                console.error('Failed to load lectures:', err);
                setError('Failed to load your lectures');

                // Implement retry with exponential backoff if we haven't retried too many times
                if (retryCount < 3) {
                    const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
                    setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                        // This will trigger the effect again
                    }, delay);
                }
            } finally {
                setLoading(false);
            }
        };

        loadLectures();
    }, [retryCount]);

    const handleCreateLecture = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLectureTitle.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const newLecture = await createLecture({
                title: newLectureTitle,
                description: newLectureDescription
            });

            setLectures(prev => [...prev, newLecture]);
            onLectureSelect(newLecture);

            // Reset form
            setNewLectureTitle('');
            setNewLectureDescription('');
            setShowCreateForm(false);
        } catch (err: any) {
            console.error('Failed to create lecture:', err);
            setError(err.response?.data?.message || 'Failed to create lecture. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinLecture = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setLoading(true);
        try {
            const lecture = await joinLecture(joinCode.trim());

            // Check if already in lectures list
            const exists = lectures.some(l => l._id === lecture._id);
            if (!exists) {
                setLectures(prev => [...prev, lecture]);
            }

            onLectureSelect(lecture);
            setJoinCode('');
            setShowJoinForm(false);
        } catch (err) {
            console.error('Failed to join lecture:', err);
            setError('Invalid lecture code or unable to join');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lecture-selector">
            <div className="lecture-selector-header">
                <h3>Your Lectures</h3>
                <div>
                    <button
                        onClick={() => {
                            setShowCreateForm(!showCreateForm);
                            setShowJoinForm(false);
                        }}
                        className="small-button"
                        disabled={loading}
                    >
                        Create
                    </button>
                    <button
                        onClick={() => {
                            setShowJoinForm(!showJoinForm);
                            setShowCreateForm(false);
                        }}
                        className="small-button"
                        disabled={loading}
                    >
                        Join
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button
                        onClick={() => {
                            setError(null);
                            setRetryCount(prev => prev + 1); // Trigger a retry
                        }}
                        className="retry-button"
                    >
                        Retry
                    </button>
                </div>
            )}

            {showCreateForm && (
                <form className="form-panel" onSubmit={handleCreateLecture}>
                    <input
                        type="text"
                        placeholder="Lecture title"
                        value={newLectureTitle}
                        onChange={(e) => setNewLectureTitle(e.target.value)}
                        required
                    />
                    <textarea
                        placeholder="Description (optional)"
                        value={newLectureDescription}
                        onChange={(e) => setNewLectureDescription(e.target.value)}
                    />
                    <div className="form-buttons">
                        <button type="button" onClick={() => setShowCreateForm(false)}>Cancel</button>
                        <button type="submit" disabled={loading || !newLectureTitle.trim()}>
                            {loading ? 'Creating...' : 'Create Lecture'}
                        </button>
                    </div>
                </form>
            )}

            {showJoinForm && (
                <form className="form-panel" onSubmit={handleJoinLecture}>
                    <input
                        type="text"
                        placeholder="Enter lecture code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        required
                    />
                    <div className="form-buttons">
                        <button type="button" onClick={() => setShowJoinForm(false)}>Cancel</button>
                        <button type="submit" disabled={loading || !joinCode.trim()}>
                            {loading ? 'Joining...' : 'Join Lecture'}
                        </button>
                    </div>
                </form>
            )}

            {loading && (
                <div className="loading-indicator">
                    {retryCount > 0 ? `Retrying (${retryCount})...` : 'Loading lectures...'}
                </div>
            )}

            <div className="lecture-list">
                {lectures.length === 0 && !loading ? (
                    <div className="empty-state">
                        <p>You haven't joined any lectures yet.</p>
                        <p>Create a new lecture or join one with a code.</p>
                    </div>
                ) : (
                    lectures.map(lecture => (
                        <div
                            key={lecture._id}
                            className={`lecture-item ${selectedLecture?._id === lecture._id ? 'selected' : ''}`}
                            onClick={() => onLectureSelect(lecture)}
                        >
                            <div className="lecture-title">{lecture.title}</div>
                            <div className="lecture-code">Code: {lecture.code}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LectureSelector;
