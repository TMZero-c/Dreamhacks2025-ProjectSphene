import React, { useState } from 'react';
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

    // Format the suggestion content for preview (extract plain text)
    const previewText = (): string => {
        try {
            if (!suggestion.content || !suggestion.content.ops) {
                return 'No content available';
            }

            // Extract text from Delta ops
            return suggestion.content.ops
                .map((op: any) => typeof op.insert === 'string' ? op.insert : '')
                .join('')
                .substring(0, 100) + (
                    suggestion.content.ops.join('').length > 100 ? '...' : ''
                );
        } catch (e) {
            return 'Preview not available';
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

    return (
        <div className={`suggestion-item ${expanded ? 'expanded' : ''}`}>
            <div
                className="suggestion-header"
                onClick={() => setExpanded(!expanded)}
            >
                <span className={`suggestion-indicator ${getIndicatorClass()}`}></span>
                <h3 className="suggestion-title">{suggestion.title}</h3>
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

                    <div className="preview-text">
                        {previewText()}
                    </div>

                    <div className="suggestion-actions">
                        <button
                            className="dismiss-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDismiss(suggestion.id);
                            }}
                        >
                            Dismiss
                        </button>
                        <button
                            className="apply-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onApply(suggestion);
                            }}
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
