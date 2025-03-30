import { Note, Suggestion, Lecture } from '../types/types';
import axios from 'axios';

// API base URL
export const API_URL = process.env.NODE_ENV === 'production'
    ? '/api' // In production, API calls are relative to the same domain
    : 'http://localhost:5000/api'; // In development, use localhost

// Configure axios
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

// Add request handlers
api.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    const devUserId = localStorage.getItem('dev_user_id');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else if (process.env.NODE_ENV === 'development' && devUserId) {
        // For development, use a special dev token format
        config.headers.Authorization = `DevToken ${devUserId}`;
    }

    return config;
}, error => {
    return Promise.reject(error);
});

// Add response handlers with retry logic
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If we don't have a config or we've already retried, reject the promise
        if (!originalRequest || originalRequest._retry) {
            return Promise.reject(error);
        }

        // Handle rate limit (429) errors
        if (error.response && error.response.status === 429) {
            console.warn('Rate limit hit. Retrying after delay...');

            // Mark that we're retrying this request
            originalRequest._retry = true;

            // Wait for a random amount of time (300-800ms) to prevent stampeding
            const delay = 300 + Math.random() * 500;
            await new Promise(resolve => setTimeout(resolve, delay));

            // Retry the request
            return api(originalRequest);
        }

        // For 401 errors, could handle token refresh here
        // For now, just reject other errors
        return Promise.reject(error);
    }
);

// Fetch lectures for a user (created or joined)
export async function fetchUserLectures(): Promise<Lecture[]> {
    try {
        // Add a small random delay to prevent simultaneous requests
        if (process.env.NODE_ENV === 'development') {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        }

        const response = await api.get('/lectures/user');
        return response.data;
    } catch (error) {
        console.error('Error fetching lectures:', error);

        // Return an empty array rather than throwing for this particular method
        return [];
    }
}

// Create a new lecture
export async function createLecture(lecture: Partial<Lecture>): Promise<Lecture> {
    try {
        const response = await api.post('/lectures', lecture);
        return response.data;
    } catch (error) {
        console.error('Error creating lecture:', error);
        throw error;
    }
}

// Join a lecture using code
export async function joinLecture(code: string): Promise<Lecture> {
    try {
        const response = await api.post('/lectures/join', { code });
        return response.data;
    } catch (error) {
        console.error('Error joining lecture:', error);
        throw error;
    }
}

// Fetch notes for a specific user and lecture
export async function fetchNotes(lectureId?: string): Promise<Note[]> {
    try {
        const endpoint = lectureId
            ? `/notes/lecture/${lectureId}`
            : `/notes`;

        const response = await api.get(endpoint);
        return response.data;
    } catch (error) {
        console.error('Error fetching notes:', error);
        return [];
    }
}

// Save a note - handle both create and update
export async function saveNote(note: Note): Promise<Note> {
    try {
        const response = await api.post('/notes', note);
        console.log('Note saved successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error saving note:', error);
        throw error;
    }
}

// Trigger document comparison via the backend
export async function triggerDocumentComparison(
    noteId?: string,
    lectureId?: string
): Promise<{ message: string; suggestions?: Suggestion[] }> {
    try {
        if (!noteId && !lectureId) {
            throw new Error('Either noteId or lectureId is required');
        }

        const response = await api.post('/suggestions/compare',
            { noteId, lectureId }
        );

        console.log(`Comparison complete, response:`, response.data);
        return response.data;
    } catch (error) {
        console.error('Error triggering document comparison:', error);
        throw error;
    }
}

// Fetches AI-generated suggestions for a specific note
export async function fetchSuggestions(
    noteId?: string | null,
    lectureId?: string
): Promise<Suggestion[]> {
    try {
        let endpoint;
        if (noteId) {
            endpoint = `/suggestions/note/${noteId}`;
        } else if (lectureId) {
            endpoint = `/suggestions/lecture/${lectureId}`;
        } else {
            throw new Error('Either noteId or lectureId is required');
        }

        const response = await api.get(endpoint);
        console.log(`Fetched ${response.data.length} suggestions from API`);
        return response.data;
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        return [];
    }
}

// Accept or dismiss a suggestion
export async function respondToSuggestion(suggestionId: string, action: 'accept' | 'dismiss'): Promise<void> {
    console.log(`Sending ${action} request for suggestion: ${suggestionId}`);

    try {
        await api.post(`/suggestions/${suggestionId}/respond`, { action });
        console.log(`Successfully ${action}ed suggestion ${suggestionId}`);
    } catch (error) {
        console.error(`Error ${action}ing suggestion:`, error);
        throw error;
    }
}

// Delete all suggestions for a specific note or lecture+user
export async function deleteAllSuggestions(
    noteId?: string | null,
    lectureId?: string
): Promise<void> {
    try {
        let endpoint;
        if (noteId) {
            endpoint = `/suggestions/note/${noteId}`;
        } else if (lectureId) {
            endpoint = `/suggestions/lecture/${lectureId}`;
        } else {
            throw new Error('Either noteId or lectureId is required');
        }

        await api.delete(endpoint);
        console.log('Successfully deleted all suggestions');
    } catch (error) {
        console.error('Error deleting suggestions:', error);
        throw error;
    }
}
