import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSuggestions, respondToSuggestion, triggerDocumentComparison, deleteAllSuggestions } from '../services/api';
import SuggestionItem from './SuggestionItem';
import { Suggestion } from '../types/types';
import './SuggestionPanel.css';

interface SuggestionPanelProps {
    noteId?: string; // Make noteId optional
    lectureId: string; // Make lectureId required
    quillRef: React.RefObject<any>;
    visible: boolean;
}

const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
    noteId,
    lectureId,
    quillRef,
    visible
}) => {
    console.log(`SuggestionPanel rendering for lecture: ${lectureId}`);

    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const hasFetched = useRef(false);
    const hasTriggeredGeneration = useRef(false);

    // Add debouncing for button clicks
    const [isGenerateButtonDisabled, setIsGenerateButtonDisabled] = useState(false);
    const [isRemoveAllButtonDisabled, setIsRemoveAllButtonDisabled] = useState(false);

    // Keep track of active operations to prevent race conditions
    const activeOperation = useRef<string | null>(null);

    // Track modifications to document for better insertion point calculation
    const documentModifications = useRef<{
        appliedSuggestions: Array<{
            id: string;
            marker: string;
            position: 'before' | 'after';
            insertedAt: number;
            contentLength: number;
        }>;
        originalText: string | null;
    }>({
        appliedSuggestions: [],
        originalText: null
    });

    // Only clear errors when explicitly dismissed by user
    const clearError = () => {
        setError(null);
    };

    // Fetch suggestions when the panel becomes visible or lectureId/noteId changes
    useEffect(() => {
        if (visible && (noteId || lectureId)) {
            // Reset our reference flags when note or lecture changes
            if (hasFetched.current && hasTriggeredGeneration.current) {
                hasFetched.current = false;
                hasTriggeredGeneration.current = false;
            }

            if (!hasFetched.current) {
                (async () => {
                    hasFetched.current = true;
                    console.log(`Fetching suggestions for ${noteId ? `note: ${noteId}` : `lecture: ${lectureId}`}`);
                    setLoading(true);
                    try {
                        // Use either noteId or lectureId to fetch suggestions
                        const fetchedSuggestions = noteId
                            ? await fetchSuggestions(noteId)
                            : await fetchSuggestions(null, lectureId);

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
    }, [visible, noteId, lectureId]);

    // Reset guard when dependencies change
    useEffect(() => {
        hasFetched.current = false;
        hasTriggeredGeneration.current = false;
        documentModifications.current = {
            appliedSuggestions: [],
            originalText: null
        };
    }, [noteId, lectureId]);

    // Generate new suggestions using AI
    const handleGenerateSuggestions = async () => {
        if (activeOperation.current === 'generateSuggestions') return;

        // Validate the necessary IDs
        if (!lectureId) {
            setError('Cannot generate suggestions: Lecture ID is missing');
            return;
        }

        activeOperation.current = 'generateSuggestions';
        hasTriggeredGeneration.current = true;
        setGenerating(true);
        setIsGenerateButtonDisabled(true);

        try {
            // First, delete all existing suggestions
            console.log(`Deleting existing suggestions before generating new ones`);
            try {
                await deleteAllSuggestions(noteId, lectureId);
                // Clear suggestions from state immediately
                setSuggestions([]);
            } catch (error) {
                console.error('Error deleting existing suggestions:', error);
                // Continue with generation even if deletion fails
            }

            console.log(`Triggering document comparison for lecture: ${lectureId}`);

            // Add timing information to help debug
            const startTime = Date.now();

            // Use the updated triggerDocumentComparison that can work with lectureId
            const result = await triggerDocumentComparison(noteId, lectureId);

            console.log(`Document comparison completed in ${Date.now() - startTime}ms, result:`, result);

            if (result?.suggestions?.length === 0) {
                setError('No suggestions were generated. You might need other users to take notes in this lecture first.');
            } else {
                // Only clear error on success
                clearError();
            }

            // Wait a moment before reloading to ensure suggestions are saved
            setTimeout(async () => {
                try {
                    const newSuggestions = noteId
                        ? await fetchSuggestions(noteId)
                        : await fetchSuggestions(null, lectureId);
                    setSuggestions(newSuggestions);
                } catch (error) {
                    console.error('Error fetching new suggestions:', error);
                }
            }, 1000);
        } catch (err: any) {
            console.error('Failed to generate suggestions:', err);
            setError(`Failed to generate suggestions: ${err?.message || 'Unknown error'}`);
        } finally {
            setGenerating(false);
            activeOperation.current = null;

            // Re-enable button after a delay
            setTimeout(() => {
                setIsGenerateButtonDisabled(false);
            }, 2000); // Longer delay for generate button to prevent rapid clicking
        }
    };

    // Handle removing all suggestions
    const handleRemoveAllSuggestions = async () => {
        if (activeOperation.current === 'removeAllSuggestions') return;

        activeOperation.current = 'removeAllSuggestions';
        setIsRemoveAllButtonDisabled(true);
        setLoading(true);

        try {
            console.log(`Deleting all suggestions for ${noteId ? `note: ${noteId}` : `lecture: ${lectureId}`}`);
            await deleteAllSuggestions(noteId, lectureId);

            // Clear suggestions from state
            setSuggestions([]);
            clearError();

        } catch (err) {
            console.error('Failed to delete suggestions:', err);
            setError('Failed to delete suggestions. Please try again.');
        } finally {
            setLoading(false);
            activeOperation.current = null;

            // Re-enable button after a short delay
            setTimeout(() => {
                setIsRemoveAllButtonDisabled(false);
            }, 1000);
        }
    };

    // Improved suggestion application with better insertion point handling
    const handleApplySuggestion = async (suggestion: Suggestion) => {
        if (!quillRef.current || !quillRef.current.getEditor) return;

        try {
            const editor = quillRef.current.getEditor();
            const currentText = editor.getText();

            // First time? Store original text for reference
            if (!documentModifications.current.originalText) {
                documentModifications.current.originalText = currentText;
            }

            // Track that we're applying this suggestion
            if (suggestion._id) {
                documentModifications.current.appliedSuggestions.push({
                    id: suggestion._id,
                    marker: suggestion.insertionPoint?.contentMarker || '',
                    position: suggestion.insertionPoint?.position || 'after',
                    insertedAt: Date.now(),
                    contentLength: calculateDeltaLength(suggestion.content)
                });
            }

            // Default insertion point (end of document)
            let insertionIndex = editor.getLength() - 1;

            // Try to find the insertion point if one is specified
            if (suggestion.insertionPoint && suggestion.insertionPoint.contentMarker) {
                const { contentMarker, position } = suggestion.insertionPoint;
                insertionIndex = findBestInsertionPoint(editor, contentMarker, position);
            }

            // Get the current selection range or use our calculated insertion index
            const range = editor.getSelection() || { index: insertionIndex, length: 0 };

            // Insert newlines for spacing if needed
            const needsNewlineBefore = range.index > 0 &&
                currentText.charAt(range.index - 1) !== '\n';

            const needsNewlineAfter = range.index < currentText.length &&
                currentText.charAt(range.index) !== '\n';

            let insertionOffset = 0;
            if (needsNewlineBefore) {
                editor.insertText(range.index, '\n');
                insertionOffset++;
            }

            // Additional newline for separation
            editor.insertText(range.index + insertionOffset, '\n');
            insertionOffset++;

            // Ensure the suggestion content is valid
            if (!suggestion.content || !suggestion.content.ops || !Array.isArray(suggestion.content.ops)) {
                console.error('Invalid suggestion content format:', suggestion.content);
                setError('This suggestion has invalid formatting and cannot be applied.');
                return;
            }

            // Insert the content
            editor.updateContents({
                ops: [
                    { retain: range.index + insertionOffset },
                    ...suggestion.content.ops
                ]
            });

            // Add trailing newline if needed
            if (needsNewlineAfter) {
                const contentLength = calculateDeltaLength(suggestion.content);
                editor.insertText(range.index + insertionOffset + contentLength, '\n');
            }

            // Scroll to the inserted content
            editor.setSelection(range.index + insertionOffset, 0);

            // Update TextEditor state
            if (quillRef.current.updateState) {
                quillRef.current.updateState();
            }

            // Mark suggestion as accepted in backend
            if (!suggestion._id) return;
            await respondToSuggestion(suggestion._id, 'accept');

            // Remove from UI list
            setSuggestions(prevSuggestions =>
                prevSuggestions.filter(s => s._id !== suggestion._id)
            );

        } catch (error) {
            console.error('Error applying suggestion:', error);
            setError('Failed to apply suggestion. Please try again.');
        }
    };

    // Helper function to calculate Quill Delta content length
    const calculateDeltaLength = (delta: any): number => {
        if (!delta || !delta.ops) return 0;

        return delta.ops.reduce((length: number, op: any) => {
            if (typeof op.insert === 'string') {
                return length + op.insert.length;
            }
            return length;
        }, 0);
    };

    // Enhanced insertion point finder with fuzzy matching for better accuracy
    const findBestInsertionPoint = (
        editor: any,
        contentMarker: string,
        position: 'before' | 'after'
    ): number => {
        const currentText = editor.getText();
        const originalText = documentModifications.current.originalText || currentText;

        // Adjust marker position based on previous insertions
        let markerIndex = currentText.indexOf(contentMarker);
        let adjustedIndex = markerIndex;

        if (markerIndex >= 0) {
            // Sort previous modifications by insertion point
            const previousMods = [...documentModifications.current.appliedSuggestions]
                .sort((a, b) => a.insertedAt - b.insertedAt);

            // Adjust marker position based on previous insertions
            for (const mod of previousMods) {
                // If this modification affected text before our current marker
                if (mod.insertedAt <= markerIndex) {
                    // Adjust the marker position by the length of inserted content
                    adjustedIndex += mod.contentLength;
                }
            }

            markerIndex = adjustedIndex;
        } else {
            // Fallback fuzzy matching logic
            // ...existing fuzzy matching code...
        }

        // Calculate final insertion point
        if (markerIndex >= 0) {
            formatLog('info', 'Found marker in document', {
                marker: contentMarker.substring(0, 30),
                position,
                originalIndex: markerIndex,
                adjustedIndex
            });

            if (position === 'after') {
                let insertAfter = markerIndex + contentMarker.length;
                const nextNewline = currentText.indexOf('\n', insertAfter);
                return nextNewline >= 0 && nextNewline - insertAfter < 100 ?
                    nextNewline + 1 : insertAfter;
            } else {
                let paragraphStart = currentText.lastIndexOf('\n\n', markerIndex);
                if (paragraphStart === -1) {
                    paragraphStart = currentText.lastIndexOf('\n', markerIndex);
                }
                return paragraphStart >= 0 ? paragraphStart + 1 : markerIndex;
            }
        }

        // Fallback to end of document
        return editor.getLength() - 1;
    };

    // Dismiss a suggestion
    const handleDismissSuggestion = async (suggestionId: string) => {
        await respondToSuggestion(suggestionId, 'dismiss');
        setSuggestions(prevSuggestions => prevSuggestions.filter(s => s._id !== suggestionId));
    };

    if (suggestions.length === 0 && !loading && !error) {
        console.log("No suggestions found for this note");
    }

    // Add this debugging right before the return statement
    useEffect(() => {
        console.log("Suggestions state:", {
            count: suggestions.length,
            loading,
            generating,
            error
        });
    }, [suggestions, loading, generating, error]);

    // Ensure we map over suggestions safely
    const renderSuggestions = () => {
        if (!suggestions || suggestions.length === 0) return null;

        return suggestions.map((suggestion) => (
            <SuggestionItem
                key={suggestion._id || suggestion.id || Math.random().toString()}
                suggestion={suggestion}
                onApply={handleApplySuggestion}
                onDismiss={handleDismissSuggestion}
            />
        ));
    };

    if (!visible) return null;

    return (
        <div className="suggestion-panel">
            <div className="panel-header">
                <h2 className="panel-title">Content Suggestions</h2>
                <div className="panel-actions">
                    <button
                        onClick={handleGenerateSuggestions}
                        disabled={loading || generating || isGenerateButtonDisabled}
                        className={`generate-button ${isGenerateButtonDisabled ? 'disabled' : ''}`}
                    >
                        {generating ? 'Generating...' : 'Generate'}
                    </button>
                    <button
                        onClick={handleRemoveAllSuggestions}
                        disabled={loading || generating || isRemoveAllButtonDisabled || suggestions.length === 0}
                        className={`remove-all-button ${isRemoveAllButtonDisabled || suggestions.length === 0 ? 'disabled' : ''}`}
                    >
                        {loading && activeOperation.current === 'removeAllSuggestions' ? 'Removing...' : 'Remove All'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button
                        className="dismiss-error"
                        onClick={clearError}
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
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
                {renderSuggestions()}
            </div>
        </div>
    );
};

// Helper function for logging
const formatLog = (type: string, message: string, data: any = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[SuggestionPanel][${timestamp}][${type}] ${message}`, data || '');
};

export default SuggestionPanel;
