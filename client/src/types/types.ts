export interface Note {
    id: string;
    title: string;
    content: string;
    userId: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface User {
    id: string;
    name: string;
    email: string;
}

// Interface for AI-generated suggestions
export interface Suggestion {
    id: string;
    title: string;
    content: any; // Quill Delta object
    noteId: string;
    type: 'missing_content' | 'clarification' | 'structure' | 'key_point';
    source?: string; // Could indicate which user's document this came from
    createdAt?: Date;
}
