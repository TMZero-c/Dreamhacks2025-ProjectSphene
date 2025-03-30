export interface Note {
    id: string;
    title: string;
    content: string;
    userId: string;
    lectureId: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface Lecture {
    _id: string;
    title: string;
    description: string;
    code: string;
    createdBy: string;
    participants: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface InsertionPoint {
    contentMarker: string;
    position: 'before' | 'after';
}

import { Delta } from 'quill';

// Interface for AI-generated suggestions
export interface Suggestion {
    id?: string;
    _id?: string; // Add the _id field here
    title: string;
    content: Delta; // Quill Delta object
    noteId: string;
    type: 'missing_content' | 'clarification' | 'structure' | 'key_point';
    source?: string; // Could indicate which user's document this came from
    status: 'pending' | 'accepted' | 'dismissed';
    createdAt?: Date;
    updatedAt?: Date;
    insertionPoint?: InsertionPoint | null;
}
