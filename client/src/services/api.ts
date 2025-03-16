import { Note, Suggestion, Lecture } from '../types/types';

// API base URL
const API_URL = 'http://localhost:5000/api';


// Fetch lectures for a user (created or joined)
export async function fetchUserLectures(userId: string): Promise<Lecture[]> {
    console.log(`Fetching lectures for user: ${userId}`);

    try {
        const response = await fetch(`${API_URL}/lectures/user/${userId}`);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching lectures:', error);
        return [];
    }
}

// Create a new lecture
export async function createLecture(lecture: Partial<Lecture>): Promise<Lecture> {

    try {
        const response = await fetch(`${API_URL}/lectures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lecture)
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating lecture:', error);
        throw error;
    }
}

// Join a lecture using code
export async function joinLecture(code: string, userId: string): Promise<Lecture> {


    try {
        const response = await fetch(`${API_URL}/lectures/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, userId })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error joining lecture:', error);
        throw error;
    }
}

// Fetch notes for a specific user and lecture
export async function fetchNotes(userId: string, lectureId?: string): Promise<Note[]> {
    console.log(`Fetching notes for user: ${userId}${lectureId ? ` and lecture: ${lectureId}` : ''}`);



    try {
        const endpoint = lectureId
            ? `${API_URL}/notes/user/${userId}/lecture/${lectureId}`
            : `${API_URL}/notes/user/${userId}`;

        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching notes:', error);
        return [];
    }

}

// Save a note - handle both create and update
export async function saveNote(note: Note): Promise<Note> {
    console.log(`Saving note for user: ${note.userId} in lecture: ${note.lectureId}`);


    try {
        // Always use POST for simplicity (server handles upsert)
        const response = await fetch(`${API_URL}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(note)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Error: ${response.status} - ${errorText}`);
        }

        const savedNote = await response.json();
        console.log('Note saved successfully:', savedNote);
        return savedNote;
    } catch (error) {
        console.error('Error saving note:', error);
        throw error;
    }

}

// Trigger document comparison via the backend
export async function triggerDocumentComparison(
    noteId?: string,
    lectureId?: string,
    userId?: string
): Promise<any> {
    console.log(`Triggering document comparison: ${noteId ? `noteId=${noteId}` : `lectureId=${lectureId}, userId=${userId}`}`);

    try {
        if (!noteId && (!lectureId || !userId)) {
            throw new Error('Either noteId or both lectureId and userId are required');
        }

        console.log(`Sending request to ${API_URL}/suggestions/compare`);
        const response = await fetch(`${API_URL}/suggestions/compare`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ noteId, lectureId, userId })
        });

        // Log the raw response for debugging
        const responseText = await response.text();
        console.log('Raw server response:', responseText);

        // Parse the response if possible
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Error parsing response:', e);
            throw new Error('Invalid response from server');
        }

        if (!response.ok) {
            console.error('Error response from server:', data);
            throw new Error(data?.message || `Server responded with ${response.status}`);
        }

        console.log(`Comparison complete, response:`, data);
        return data;
    } catch (error) {
        console.error('Error triggering document comparison:', error);
        throw error;
    }
}

/**
 * Fetches AI-generated suggestions for a specific note
 */
export async function fetchSuggestions(
    noteId?: string | null,
    lectureId?: string,
    userId?: string
): Promise<Suggestion[]> {
    console.log(`Fetching suggestions: ${noteId ? `noteId=${noteId}` : `lectureId=${lectureId}, userId=${userId}`}`);

    try {
        let endpoint;
        if (noteId) {
            endpoint = `${API_URL}/suggestions/note/${noteId}`;
        } else if (lectureId && userId) {
            endpoint = `${API_URL}/suggestions/lecture/${lectureId}/user/${userId}`;
        } else {
            throw new Error('Either noteId or both lectureId and userId are required');
        }

        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Fetched ${data.length} suggestions from API`);
        return data;
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        return [];
    }
}

// Accept or dismiss a suggestion
export async function respondToSuggestion(suggestionId: string, action: 'accept' | 'dismiss'): Promise<void> {


    console.log(`Sending ${action} request for suggestion: ${suggestionId}`);

    try {
        const response = await fetch(`${API_URL}/suggestions/${suggestionId}/respond`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Server responded with ${response.status}: ${errorData.message || response.statusText}`);
        }

        console.log(`Successfully ${action}ed suggestion ${suggestionId}`);
    } catch (error) {
        console.error(`Error ${action}ing suggestion:`, error);
        throw error;
    }
}

// Delete all suggestions for a specific note or lecture+user
export async function deleteAllSuggestions(
    noteId?: string | null,
    lectureId?: string,
    userId?: string
): Promise<void> {
    console.log(`Deleting all suggestions: ${noteId ? `noteId=${noteId}` : `lectureId=${lectureId}, userId=${userId}`}`);

    try {
        let endpoint;
        if (noteId) {
            endpoint = `${API_URL}/suggestions/note/${noteId}`;
        } else if (lectureId && userId) {
            endpoint = `${API_URL}/suggestions/lecture/${lectureId}/user/${userId}`;
        } else {
            throw new Error('Either noteId or both lectureId and userId are required');
        }

        const response = await fetch(endpoint, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        console.log('Successfully deleted all suggestions');
    } catch (error) {
        console.error('Error deleting suggestions:', error);
        throw error;
    }
}
