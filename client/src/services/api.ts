import { Note, Suggestion } from '../types/types';

// API base URL
const API_URL = 'http://localhost:5000/api';

// Mock data for development
const MOCK_NOTES: Note[] = [
    {
        id: '1',
        title: 'Bees and Pollination',
        content: JSON.stringify({
            ops: [
                { insert: 'Bees and Pollination\n', attributes: { header: 1 } },
                { insert: 'Honey bees are important pollinators. They collect nectar and pollen from flowers.\n' }
            ]
        }),
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '2',
        title: 'Colony Collapse Research',
        content: JSON.stringify({
            ops: [
                { insert: 'Colony Collapse Disorder\n', attributes: { header: 1 } },
                { insert: 'A phenomenon where worker bees abandon the hive, leaving the queen and immature bees behind.\n' }
            ]
        }),
        userId: 'user2',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '3',
        title: 'Bee Products and Benefits',
        content: JSON.stringify({
            ops: [
                { insert: 'Bee Products\n', attributes: { header: 1 } },
                { insert: 'Bees produce honey, beeswax, propolis, and royal jelly which all have different uses.\n' }
            ]
        }),
        userId: 'user3',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '4',
        title: 'SPHEEENEE',
        content: JSON.stringify({
            ops: [
                { insert: 'Bee My Honey', attributes: { header: 2 } },
                { insert: '\nasddhasjkdhakjdsyhiusayrcwebyaeciawynerudoxewybseiuaorctfbwreyutyvbeuisworynfgiubodfgxysrucygfi d\n' }
            ]
        }),
        userId: 'current-user',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Mock suggestions data for development - update to match the note IDs
const MOCK_SUGGESTIONS: Suggestion[] = [
    {
        id: 's1',
        title: 'Missing Key Point: Colony Collapse',
        type: 'missing_content',
        content: {
            ops: [
                { insert: "Colony Collapse Disorder\n", attributes: { header: 3 } },
                { insert: "A phenomenon where worker bees abandon the hive, leaving the queen and immature bees behind. This has resulted in significant bee population decline since 2006.\n" }
            ]
        },
        noteId: '1', // This will match user1's note
        source: 'User 2',
        createdAt: new Date()
    },
    {
        id: 's2',
        title: 'Additional Context: Pollination Importance',
        type: 'key_point',
        content: {
            ops: [
                { insert: "Pollination Impact\n", attributes: { header: 3 } },
                { insert: "Bees pollinate approximately 70% of the world's cultivated crops, accounting for about 90% of global nutrition. Without bees, many plants would fail to reproduce.\n" }
            ]
        },
        noteId: '1', // This will match user1's note
        source: 'User 3',
        createdAt: new Date()
    },
    {
        id: 's3',
        title: 'Suggested Structure: Add Introduction',
        type: 'structure',
        content: {
            ops: [
                { insert: "Introduction\n", attributes: { header: 2 } },
                { insert: "Honey bees (Apis mellifera) are vital pollinators responsible for the reproduction of flowering plants and crops worldwide. Their complex social structure and behavior make them fascinating subjects of study in entomology and ecology.\n" }
            ]
        },
        noteId: '1', // This will match user1's note
        source: 'User 1',
        createdAt: new Date()
    },
    // Add suggestions for user2 and user3
    {
        id: 's4',
        title: 'Additional Information: Bee Products',
        type: 'missing_content',
        content: {
            ops: [
                { insert: "Bee Products\n", attributes: { header: 3 } },
                { insert: "Honey bees produce honey, beeswax, propolis, and royal jelly - all of which have commercial and medicinal applications.\n" }
            ]
        },
        noteId: '2', // This will match user2's note
        source: 'User 3',
        createdAt: new Date()
    },
    {
        id: 's5',
        title: 'Missing Detail: Types of Bees',
        type: 'missing_content',
        content: {
            ops: [
                { insert: "Types of Bees\n", attributes: { header: 3 } },
                { insert: "There are over 20,000 known species of bees, including honey bees, bumble bees, carpenter bees, and many solitary species.\n" }
            ]
        },
        noteId: '3', // This will match user3's note
        source: 'User 1',
        createdAt: new Date()
    }
];

// Use mock data for development if explicitly set to true
const USE_MOCK_DATA = false;

// Fetch notes for a specific user
export async function fetchNotes(userId: string): Promise<Note[]> {
    console.log(`Fetching notes for user: ${userId}`);

    if (USE_MOCK_DATA) {
        // Fake api delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const filteredNotes = MOCK_NOTES.filter(note => note.userId === userId);
        console.log(`Found ${filteredNotes.length} notes for user ${userId}`);

        // If no notes found for this user, create a default one
        if (filteredNotes.length === 0) {
            const defaultNote: Note = {
                id: `note-${Math.random().toString(36).substring(2, 9)}`,
                title: 'My First Note',
                content: JSON.stringify({
                    ops: [
                        { insert: 'My Notes\n', attributes: { header: 1 } },
                        { insert: 'Start taking notes here...\n' }
                    ]
                }),
                userId: userId,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            MOCK_NOTES.push(defaultNote);
            return [defaultNote];
        }

        return filteredNotes;
    } else {
        try {
            const response = await fetch(`${API_URL}/notes/user/${userId}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching notes:', error);
            return [];
        }
    }
}

// Save a note
export async function saveNote(note: Note): Promise<Note> {
    console.log(`Saving note for user: ${note.userId}`);
    if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 800));

        const updatedNote = {
            ...note,
            updatedAt: new Date(),
            id: note.id || Math.random().toString(36).substring(7)
        };

        console.log('Saving note:', updatedNote);
        return updatedNote;
    } else {
        try {
            const url = note.id ?
                `${API_URL}/notes/${note.id}` :
                `${API_URL}/notes`;

            const method = note.id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(note)
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving note:', error);
            throw error;
        }
    }
}

// Trigger document comparison via the backend
export async function triggerDocumentComparison(noteId: string): Promise<void> {
    console.log(`Triggering document comparison for note: ${noteId}`);

    if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`Triggered comparison for note: ${noteId}`);
    } else {
        try {
            const response = await fetch(`${API_URL}/suggestions/compare`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ noteId })
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            console.log(`Triggered comparison for note: ${noteId}`);
        } catch (error) {
            console.error('Error triggering document comparison:', error);
            throw error;
        }
    }
}

/**
 * Fetches AI-generated suggestions for a specific note
 */
export async function fetchSuggestions(noteId: string): Promise<Suggestion[]> {
    console.log(`Fetching suggestions for note ID: ${noteId}`);

    if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const suggestions = MOCK_SUGGESTIONS.filter(suggestion => suggestion.noteId === noteId);
        console.log(`Found ${suggestions.length} mock suggestions for note ${noteId}`);
        return suggestions;
    } else {
        try {
            const response = await fetch(`${API_URL}/suggestions/note/${noteId}`);

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            console.log(`Fetched ${data.length} suggestions from API for note ${noteId}`);
            return data;
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            return [];
        }
    }
}

// Accept or dismiss a suggestion
export async function respondToSuggestion(suggestionId: string, action: 'accept' | 'dismiss'): Promise<void> {
    if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 400));
        console.log(`Suggestion ${suggestionId} was ${action}ed`);
    } else {
        try {
            const response = await fetch(`${API_URL}/suggestions/${suggestionId}/respond`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action })
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            console.log(`Suggestion ${suggestionId} was ${action}ed`);
        } catch (error) {
            console.error(`Error ${action}ing suggestion:`, error);
            throw error;
        }
    }
}
