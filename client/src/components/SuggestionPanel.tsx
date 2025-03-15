import React, { useState, useEffect, useRef } from 'react';
import { fetchSuggestions, respondToSuggestion, triggerDocumentComparison } from '../services/api';
import SuggestionItem from './SuggestionItem';
import { Suggestion } from '../types/types';
import './SuggestionPanel.css';

interface SuggestionPanelProps {
    noteId?: string; // Make noteId optional
    userId: string; // Add userId prop
    lectureId: string; // Make lectureId required
    quillRef: React.RefObject<any>;
    visible: boolean;
}

const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
    noteId,
    userId,
    lectureId,
    quillRef,
    visible
}) => {
    console.log(`SuggestionPanel rendering for lecture: ${lectureId}, user: ${userId}`);

    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const hasFetched = useRef(false);
    const hasTriggeredGeneration = useRef(false);

    // Fetch suggestions when the panel becomes visible or lectureId/noteId changes
    useEffect(() => {
        if (visible && (noteId || (lectureId && userId))) {
            // Reset our reference flags when note or lecture changes
            if (hasFetched.current && hasTriggeredGeneration.current) {
                hasFetched.current = false;
                hasTriggeredGeneration.current = false;
            }

            if (!hasFetched.current) {
                (async () => {
                    hasFetched.current = true;
                    console.log(`Fetching suggestions for ${noteId ? `note: ${noteId}` : `lecture: ${lectureId}, user: ${userId}`}`);
                    setLoading(true);
                    try {
                        // Use either noteId or userId+lectureId to fetch suggestions
                        const fetchedSuggestions = noteId
                            ? await fetchSuggestions(noteId)
                            : await fetchSuggestions(null, lectureId, userId);

                        console.log(`Fetched ${fetchedSuggestions.length} suggestions`);
                        setSuggestions(fetchedSuggestions);

                        // If no suggestions found and we haven't triggered generation yet, do it automatically
                        if (fetchedSuggestions.length === 0 && !hasTriggeredGeneration.current) {
                            console.log("No suggestions found, automatically triggering generation");
                            handleGenerateSuggestions();
                        }
                    } catch (error) {
                        console.error('Error loading suggestions:', error);
                        setError('Failed to load suggestions');
                    } finally {
                        setLoading(false);
                    }
                })();
            }
        }
    }, [visible, noteId, lectureId, userId]);

    // Reset guard when dependencies change
    useEffect(() => {
        hasFetched.current = false;
        hasTriggeredGeneration.current = false;
    }, [noteId, lectureId, userId]);

    const loadSuggestions = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = noteId
                ? await fetchSuggestions(noteId)
                : await fetchSuggestions(null, lectureId, userId);

            setSuggestions(data);
        } catch (err) {
            console.error('Failed to load suggestions:', err);
            setError('Failed to load suggestions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Generate new suggestions using AI
    const handleGenerateSuggestions = async () => {
        // Clear any previous errors
        setError(null);

        if (!lectureId) {
            setError('Cannot generate suggestions: Lecture ID is missing');
            return;
        }

        hasTriggeredGeneration.current = true;
        setGenerating(true);

        try {
            console.log(`Triggering document comparison for lecture: ${lectureId}, user: ${userId}`);

            // Add timing information to help debug
            const startTime = Date.now();

            // Use the updated triggerDocumentComparison that can work with userId+lectureId
            const result = await triggerDocumentComparison(noteId, lectureId, userId);

            console.log(`Document comparison completed in ${Date.now() - startTime}ms, result:`, result);

            if (result?.suggestions?.length === 0) {
                setError('No suggestions were generated. You might need other users to take notes in this lecture first.');
            }

            // Wait a moment before reloading to ensure suggestions are saved
            setTimeout(async () => {
                await loadSuggestions();
            }, 1000);
        } catch (err: any) {
            console.error('Failed to generate suggestions:', err);
            setError(`Failed to generate suggestions: ${err?.message || 'Unknown error'}`);
        } finally {
            setGenerating(false);
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
            if (!suggestion._id) return;
            await respondToSuggestion(suggestion._id, 'accept');

            // Remove the suggestion from the list using functional state update
            setSuggestions(prevSuggestions => prevSuggestions.filter(s => s._id !== suggestion._id));
        } catch (error) {
            console.error('Error applying suggestion:', error);
        }
    };

    // Dismiss a suggestion
    const handleDismissSuggestion = async (suggestionId: string) => {
        await respondToSuggestion(suggestionId, 'dismiss');
        setSuggestions(prevSuggestions => prevSuggestions.filter(s => s._id !== suggestionId));
    };

    if (suggestions.length === 0 && !loading && !error) {
        console.log("No suggestions found for this note");
    }

    if (!visible) return null;

    return (
        <div className="suggestion-panel">
            <div className="panel-header">
                <h2 className="panel-title">Content Suggestions</h2>
                <div className="panel-actions">
                    <button
                        onClick={handleGenerateSuggestions}
                        disabled={loading || generating}
                        className="generate-button"
                    >
                        {generating ? 'Generating...' : 'Generate Suggestions'}
                    </button>
                    <button
                        onClick={loadSuggestions}
                        disabled={loading || generating}
                        className="refresh-button"
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {(loading || generating) && (
                <div className="loading-message">
                    {loading ? 'Loading suggestions...' : 'Generating suggestions...'}
                </div>
            )}

            {!loading && !generating && suggestions.length === 0 && (
                <div className="empty-state">
                    <p>No suggestions available</p>
                    <p className="empty-state-hint">
                        Click "Generate Suggestions" to create AI-powered content suggestions
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
