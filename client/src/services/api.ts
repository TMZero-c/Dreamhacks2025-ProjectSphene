import { Note } from '../types/types';

// Mock data for development
const MOCK_NOTES: Note[] = [
    {
        id: '1',
        title: 'SPHEEENEE',
        content: '<h2>Bee My Honey</h2><p>asddhasjkdhakjdsyhiusayrcwebyaeciawynerudoxewybseiuaorctfbwreyutyvbeuisworynfgiubodfgxysrucygfi d<p/>',
        userId: 'current-user',
        createdAt: new Date(),
        updatedAt: new Date()
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
