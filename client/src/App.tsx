import { useState, useEffect, useRef } from 'react'
import './App.css'
import TextEditor from './components/TextEditor'
import Header from './components/Header'
import SuggestionPanel from './components/SuggestionPanel'
import LectureSelector from './components/LectureSelector'

import { Note, Lecture } from './types/types'
import { fetchNotes, saveNote, fetchUserLectures, createLecture } from './services/api'

// Test user IDs for easier testing
const TEST_USER_IDS = ['user1', 'user2', 'user3'];

function App() {
  // Generate a random user ID or get from local storage to simulate different users in different browsers
  const [userId] = useState(() => {
    const storedUserId = localStorage.getItem('sphene_user_id');
    if (storedUserId) return storedUserId;

    // Use user1 as default test user
    const defaultUserId = TEST_USER_IDS[0];
    localStorage.setItem('sphene_user_id', defaultUserId);
    return defaultUserId;
  });

  // For development/testing: Allow manual override of user ID
  const [userIdInput, setUserIdInput] = useState('');
  const [showUserIdInput, setShowUserIdInput] = useState(false);

  // State for the current note and lecture
  const [currentNote, setCurrentNote] = useState<Note>({
    id: '',
    content: '',
    userId: userId,
    title: 'Loading...',
    lectureId: ''
  });

  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const editorRef = useRef(null);

  // Load initial lectures when the app starts
  useEffect(() => {
    const loadInitialLectures = async () => {
      setLoading(true);
      try {
        const lectures = await fetchUserLectures(userId);

        // If the user has no lectures, create a default one
        if (!lectures || lectures.length === 0) {
          const defaultLecture = await createLecture({
            title: 'My First Lecture',
            description: 'Default lecture for notes',
            code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            createdBy: userId
          });

          setSelectedLecture(defaultLecture);
        } else {
          setSelectedLecture(lectures[0]);
        }
      } catch (error) {
        console.error('Failed to load initial lectures:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadInitialLectures();
    }
  }, [userId]);

  // Load notes when selected lecture changes
  useEffect(() => {
    if (selectedLecture) {
      // Clear current note first to avoid showing stale data
      setCurrentNote({
        id: '',
        content: '',
        userId: userId,
        title: selectedLecture.title, // Use lecture title as default note title
        lectureId: selectedLecture._id
      });

      loadNoteForLecture(selectedLecture._id);
    }
  }, [selectedLecture, userId]);

  // Load note for a specific lecture - simplified to one note per lecture
  const loadNoteForLecture = async (lectureId: string) => {
    setLoading(true);
    console.log(`Loading note for lecture: ${lectureId}`);

    try {
      const notes = await fetchNotes(userId, lectureId);

      if (notes && notes.length > 0) {
        // Use the first (and should be only) note
        console.log(`Loaded note: ${notes[0].title} with id ${notes[0].id}`);
        setCurrentNote(notes[0]);
      } else {
        console.log('No note found, creating default note for this lecture');
        // Create a default note for this lecture
        const defaultNote: Note = {
          id: '', // Let the server generate an ID
          content: JSON.stringify({
            ops: [
              { insert: `${selectedLecture?.title || 'New Note'}\n`, attributes: { header: 1 } },
              { insert: 'Start taking notes here...\n' }
            ]
          }),
          userId: userId,
          lectureId: lectureId,
          title: selectedLecture?.title || 'New Note'
        };

        // Save the note immediately
        const savedNote = await saveNote(defaultNote);
        console.log('Created default note:', savedNote);
        setCurrentNote(savedNote);
      }
    } catch (error) {
      console.error('Failed to load note for lecture:', error);

      // Set a default note even on error, but don't try to save it
      setCurrentNote({
        id: '',
        content: JSON.stringify({
          ops: [
            { insert: 'Error Loading Note\n', attributes: { header: 1 } },
            { insert: 'There was an error loading your note. Please try again.\n' }
          ]
        }),
        userId: userId,
        lectureId: lectureId,
        title: 'Error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Save the current note
  const handleSaveNote = async (content: string) => {
    if (!selectedLecture) {
      console.error('Cannot save note: No lecture selected');
      return;
    }

    setLoading(true);
    try {
      const updatedNote = {
        ...currentNote,
        content,
        userId,
        lectureId: selectedLecture._id
      };

      console.log('Saving note:', updatedNote);
      const savedNote = await saveNote(updatedNote);
      setCurrentNote(savedNote);
      console.log('Note saved successfully:', savedNote);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle lecture selection
  const handleLectureSelect = (lecture: Lecture) => {
    setSelectedLecture(lecture);
  };

  // Toggle suggestion panel visibility
  const toggleSuggestions = () => {
    setShowSuggestions(!showSuggestions);
  };

  // Handle user ID change (for testing)
  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserIdInput(e.target.value);
  };

  // Quick user switcher - for testing
  const quickSwitchUser = (testUserId: string) => {
    localStorage.setItem('sphene_user_id', testUserId);
    window.location.reload();
  }

  return (
    <div className="app-container">
      <Header
        title={`${selectedLecture?.title || 'Loading...'} (${userId})`}
        loading={loading}
      />

      {/* User ID test controls (for development only) */}
      <div className="user-controls" style={{ padding: '8px', textAlign: 'center' }}>
        <div style={{ marginBottom: '8px' }}>
          <span>Quick Switch: </span>
          {TEST_USER_IDS.map((testId) => (
            <button
              key={testId}
              onClick={() => quickSwitchUser(testId)}
              style={{
                padding: '4px 8px',
                marginRight: '8px',
                fontWeight: userId === testId ? 'bold' : 'normal',
                backgroundColor: userId === testId ? '#e0e0e0' : 'transparent'
              }}
            >
              {testId}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowUserIdInput(!showUserIdInput)}
          style={{ padding: '4px 8px', marginRight: '8px' }}
        >
          {showUserIdInput ? 'Hide Custom User ID' : 'Use Custom User ID'}
        </button>

        {showUserIdInput && (
          <span>
            <input
              type="text"
              value={userIdInput}
              onChange={handleUserIdChange}
              placeholder="Enter custom user ID"
              style={{ padding: '4px', marginRight: '8px', width: '180px' }}
            />
            <button
              onClick={() => {
                if (userIdInput.trim()) {
                  localStorage.setItem('sphene_user_id', userIdInput.trim());
                  window.location.reload();
                }
              }}
              style={{ padding: '4px 8px' }}
              disabled={!userIdInput.trim()}
            >
              Apply
            </button>
          </span>
        )}
      </div>

      <div className="main-content">
        {/* Sidebar with lecture selector */}
        <div className="sidebar">
          <LectureSelector
            userId={userId}
            selectedLecture={selectedLecture}
            onLectureSelect={handleLectureSelect}
          />
        </div>

        {/* Editor section - adjust width based on suggestion panel visibility */}
        <div className={`editor-section ${showSuggestions ? 'with-suggestions' : ''}`}>
          {selectedLecture ? (
            <TextEditor
              ref={editorRef}
              content={currentNote.content}
              onSave={handleSaveNote}
              onToggleSuggestions={toggleSuggestions}
              showSuggestions={showSuggestions}
            />
          ) : (
            <div className="loading-placeholder">
              Select or create a lecture to start taking notes
            </div>
          )}
        </div>

        {/* Side panel for suggestions */}
        {showSuggestions && selectedLecture && (
          <div className="suggestions-section">
            <SuggestionPanel
              noteId={currentNote.id}
              lectureId={selectedLecture._id} // Pass the current lecture ID
              quillRef={editorRef}
              visible={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
