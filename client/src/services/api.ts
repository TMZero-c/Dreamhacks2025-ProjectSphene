import { Note, Suggestion } from '../types/types';

// Mock data for development
const MOCK_NOTES: Note[] = [
    {
        id: '1',
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

// Mock suggestions data for development
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
        noteId: '1',
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
        noteId: '1',
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
        noteId: '1',
        source: 'User 1',
        createdAt: new Date()
    }
];

// Fetch notes for a specific user
export async function fetchNotes(userId: string): Promise<Note[]> {
    // Fake api delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_NOTES.filter(note => note.userId === userId);
}

// Save a note
export async function saveNote(note: Note): Promise<Note> {

    await new Promise(resolve => setTimeout(resolve, 800));

    const updatedNote = {
        ...note,
        updatedAt: new Date(),
        id: note.id || Math.random().toString(36).substring(7)
    };

    console.log('Saving note:', updatedNote);

    return updatedNote;
}

// Example function for triggering document comparison via the backend
export async function triggerDocumentComparison(noteId: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real app, this would call a backend endpoint that:
    // 1. Fetches all documents on the same topic
    // 2. Calls the OpenAI API to compare them
    // 3. Generates suggestions based on differences
    console.log(`Triggered comparison for note: ${noteId}`);
}

/**
 * Fetches AI-generated suggestions for a specific note
 * In a real implementation, this would call the backend which would:
 * 1. Retrieve other users' notes on the same topic
 * 2. Call an LLM to compare and generate suggestions
 * 3. Return formatted suggestions as Quill Deltas
 */
export async function fetchSuggestions(noteId: string): Promise<Suggestion[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Return mock suggestions for the specific note
    return MOCK_SUGGESTIONS.filter(suggestion => suggestion.noteId === noteId);
}

// Accept or dismiss a suggestion
export async function respondToSuggestion(suggestionId: string, action: 'accept' | 'dismiss'): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));

    console.log(`Suggestion ${suggestionId} was ${action}ed`);
    // In a real app, this would update the suggestion status in the database
}
