import React, { useState, JSX } from 'react';
import { Suggestion } from '../types/types';
import './SuggestionItem.css';

interface SuggestionItemProps {
    suggestion: Suggestion;
    onApply: (suggestion: Suggestion) => void;
    onDismiss: (suggestionId: string) => void;
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({
    suggestion,
    onApply,
    onDismiss
}) => {
    const [expanded, setExpanded] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    // Handle null or undefined suggestion
    if (!suggestion) {
        console.error("Received null or undefined suggestion");
        return null;
    }

    const handleDismiss = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRemoving(true);
        // Add small delay before actual dismissal to allow animation
        if (suggestion._id) {
            setTimeout(() => onDismiss(suggestion._id!), 300);
        }
    };

    const handleApply = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRemoving(true);
        // Add small delay before actual application to allow animation
        setTimeout(() => onApply(suggestion), 300);
    };

    // Format the suggestion content for preview (extract plain text)
    const previewText = (): string => {
        try {
            if (!suggestion.content || !suggestion.content.ops) {
                return 'No content available';
            }

            // Extract text from Delta ops while preserving basic structure
            return suggestion.content.ops
                .map((op: any) => {
                    if (typeof op.insert !== 'string') return '';

                    // If it's a heading, add some emphasis
                    if (op.attributes && op.attributes.header) {
                        return op.insert.trim();
                    }

                    return op.insert;
                })
                .join('')
                .substring(0, 100) + (
                    suggestion.content.ops.join('').length > 100 ? '...' : ''
                );
        } catch (e) {
            console.error("Error formatting preview text:", e);
            return 'Preview not available';
        }
    };

    // Display insertion point information if available
    const insertionPointInfo = (): JSX.Element | null => {
        if (!suggestion.insertionPoint) return null;

        try {
            const { contentMarker, position } = suggestion.insertionPoint;
            if (!contentMarker) return null;

            return (
                <div className="insertion-point-info">
                    <span className="insertion-label">Insert {position}:</span>
                    <span className="content-marker">"{contentMarker.substring(0, 40)}
                        {contentMarker.length > 40 ? '...' : ''}"</span>
                </div>
            );
        } catch (e) {
            console.error("Error rendering insertion point:", e);
            return null;
        }
    };

    // Get badge styles based on suggestion type
    const getIndicatorClass = (): string => {
        switch (suggestion.type) {
            case 'missing_content':
                return 'indicator-missing';
            case 'key_point':
                return 'indicator-key';
            case 'structure':
                return 'indicator-structure';
            case 'clarification':
                return 'indicator-clarification';
            default:
                return '';
        }
    };

    // Format the date
    const formatDate = (date?: Date): string => {
        if (!date) return '';
        return new Date(date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Add debug logging
    console.log("Rendering suggestion:", {
        id: suggestion._id || suggestion.id,
        title: suggestion.title,
        type: suggestion.type
    });

    return (
        <div className={`suggestion-item ${expanded ? 'expanded' : ''} ${isRemoving ? 'removing' : ''}`}>
            <div
                className="suggestion-header"
                onClick={() => setExpanded(!expanded)}
            >
                <span className={`suggestion-indicator ${getIndicatorClass()}`}></span>
                <h3 className="suggestion-title">{suggestion.title || "Untitled Suggestion"}</h3>
                <span className="toggle-icon">
                    {expanded ? '▼' : '►'}
                </span>
            </div>

            {expanded && (
                <div className="suggestion-content">
                    <div className="source-info">
                        {suggestion.source && <span>From {suggestion.source} • </span>}
                        <span>{formatDate(suggestion.createdAt)}</span>
                    </div>

                    {/* Add insertion point info */}
                    {insertionPointInfo()}

                    <div className="preview-text">
                        {previewText()}
                    </div>

                    <div className="suggestion-actions">
                        <button
                            className="dismiss-button"
                            onClick={handleDismiss}
                        >
                            Dismiss
                        </button>
                        <button
                            className="apply-button"
                            onClick={handleApply}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuggestionItem;
