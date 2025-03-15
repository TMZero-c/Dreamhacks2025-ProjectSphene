import React, { useState, useEffect } from 'react';
import { fetchSuggestions, respondToSuggestion } from '../services/api';
import SuggestionItem from './SuggestionItem';
import { Suggestion } from '../types/types';
import './SuggestionPanel.css';

interface SuggestionPanelProps {
    noteId: string;
    quillRef: React.RefObject<any>;
    visible: boolean;
}

const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
    noteId,
    quillRef,
    visible
}) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch suggestions when the panel becomes visible or noteId changes
    useEffect(() => {
        if (visible && noteId) {
            loadSuggestions();
        }
    }, [visible, noteId]);

    const loadSuggestions = async () => {
        if (!noteId) return;

        setLoading(true);
        setError(null);

        try {
            const data = await fetchSuggestions(noteId);
            setSuggestions(data);
        } catch (err) {
            console.error('Failed to load suggestions:', err);
            setError('Failed to load suggestions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Apply a suggestion to the editor using Quill Delta
    const handleApplySuggestion = async (suggestion: Suggestion) => {
        if (!quillRef.current || !quillRef.current.getEditor) return;

        try {
            const editor = quillRef.current.getEditor();

            // Get the current selection range or default to end of document
            const range = editor.getSelection() || { index: editor.getLength() - 1, length: 0 };

            // Insert a newline first if not at the beginning of the document
            if (range.index > 0) {
                editor.insertText(range.index, '\n\n');
                range.index += 2;
            }

            // Insert the suggestion content at the cursor position or end
            editor.updateContents({
                ops: [
                    { retain: range.index },
                    ...suggestion.content.ops
                ]
            });

            // Scroll to the inserted content
            editor.setSelection(range.index + 1, 0);

            // Update the TextEditor component's internal state
            if (quillRef.current.updateState) {
                quillRef.current.updateState();
            }

            // Mark the suggestion as accepted in the backend
            await respondToSuggestion(suggestion.id, 'accept');

            // Remove the suggestion from the list
            setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
        } catch (error) {
            console.error('Error applying suggestion:', error);
        }
    };

    // Dismiss a suggestion
    const handleDismissSuggestion = async (suggestionId: string) => {
        await respondToSuggestion(suggestionId, 'dismiss');
        setSuggestions(suggestions.filter(s => s.id !== suggestionId));
    };

    if (!visible) return null;

    return (
        <div className="suggestion-panel">
            <div className="panel-header">
                <h2 className="panel-title">Content Suggestions</h2>
                <button
                    onClick={loadSuggestions}
                    disabled={loading}
                    className="refresh-button"
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {loading && (
                <div className="loading-message">
                    Loading suggestions...
                </div>
            )}

            {!loading && suggestions.length === 0 && (
                <div className="empty-state">
                    <p>No suggestions available</p>
                    <p className="empty-state-hint">
                        Suggestions will appear as collaborators add content
                    </p>
                </div>
            )}

            <div className="suggestions-list">
                {suggestions.map((suggestion) => (
                    <SuggestionItem
                        key={suggestion.id}
                        suggestion={suggestion}
                        onApply={handleApplySuggestion}
                        onDismiss={handleDismissSuggestion}
                    />
                ))}
            </div>
        </div>
    );
};

export default SuggestionPanel;
