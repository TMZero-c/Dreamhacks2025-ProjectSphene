import React, { useState, useEffect } from 'react';
import { Lecture } from '../types/types';
import { fetchUserLectures, createLecture, joinLecture } from '../services/api';
import './LectureSelector.css';

interface LectureSelectorProps {
    userId: string;
    selectedLecture?: Lecture | null;
    onLectureSelect: (lecture: Lecture) => void;
}

const LectureSelector: React.FC<LectureSelectorProps> = ({
    userId,
    selectedLecture,
    onLectureSelect
}) => {
    const [lectures, setLectures] = useState<Lecture[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // UI state
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showJoinForm, setShowJoinForm] = useState(false);

    // Form states
    const [newLectureTitle, setNewLectureTitle] = useState('');
    const [newLectureDescription, setNewLectureDescription] = useState('');
    const [joinCode, setJoinCode] = useState('');

    // Load lectures when component mounts or userId changes
    useEffect(() => {
        loadLectures();
    }, [userId]);

    const loadLectures = async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const userLectures = await fetchUserLectures(userId);
            setLectures(userLectures);

            // If no lecture is selected and we have lectures, select the first one
            if (!selectedLecture && userLectures.length > 0) {
                onLectureSelect(userLectures[0]);
            }
        } catch (err) {
            console.error('Failed to load lectures:', err);
            setError('Failed to load your lectures');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLecture = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLectureTitle.trim()) return;

        setLoading(true);
        try {
            // Generate a random 6-character code
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();

            const createdLecture = await createLecture({
                title: newLectureTitle,
                description: newLectureDescription,
                code,
                createdBy: userId
            });

            // Add to lectures list and select it
            setLectures(prev => [...prev, createdLecture]);
            onLectureSelect(createdLecture);

            // Reset form
            setNewLectureTitle('');
            setNewLectureDescription('');
            setShowCreateForm(false);
        } catch (err) {
            console.error('Failed to create lecture:', err);
            setError('Failed to create lecture');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinLecture = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setLoading(true);
        try {
            const joinedLecture = await joinLecture(joinCode.trim(), userId);

            // Check if already in lectures list
            const exists = lectures.some(l => l._id === joinedLecture._id);
            if (!exists) {
                setLectures(prev => [...prev, joinedLecture]);
            }

            onLectureSelect(joinedLecture);
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
                    >
                        Create
                    </button>
                    <button
                        onClick={() => {
                            setShowJoinForm(!showJoinForm);
                            setShowCreateForm(false);
                        }}
                        className="small-button"
                    >
                        Join
                    </button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

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

            {loading && !showCreateForm && !showJoinForm && (
                <div className="loading-indicator">Loading lectures...</div>
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
