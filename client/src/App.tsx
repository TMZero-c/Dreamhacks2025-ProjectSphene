import { useState, useEffect, useRef } from 'react'
import './App.css'
import TextEditor from './components/TextEditor'
import Header from './components/Header'
import SuggestionPanel from './components/SuggestionPanel'
import LectureSelector from './components/LectureSelector'
import { AuthContainer } from './components/AuthComponents'
import { useAuth } from './contexts/AuthContext'

import { Note, Lecture } from './types/types'
import { fetchNotes, saveNote, fetchUserLectures, createLecture } from './services/api'

function App() {
  const { isAuthenticated, user, logout, loading: authLoading } = useAuth();

  // State for the current note and lecture
  const [currentNote, setCurrentNote] = useState<Note>({
    id: '',
    content: '',
    userId: user?.id || '',
    title: 'Loading...',
    lectureId: ''
  });

  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const editorRef = useRef(null);

  // Add a reference to track the currently selected lecture to prevent race conditions
  const currentOperation = useRef<string | null>(null);
  const lastSelectedLectureId = useRef<string | null>(null);

  // Load initial lectures when the app starts and user is authenticated
  useEffect(() => {
    if (user) {
      loadInitialLectures();
    }
  }, [user]);

  const loadInitialLectures = async () => {
    setLoading(true);
    try {
      const lectures = await fetchUserLectures();

      // If the user has no lectures, create a default one
      if (!lectures || lectures.length === 0) {
        const defaultLecture = await createLecture({
          title: 'My First Lecture',
          description: 'Default lecture for notes'
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

  // Load notes when selected lecture changes
  useEffect(() => {
    if (selectedLecture && selectedLecture._id !== lastSelectedLectureId.current) {
      lastSelectedLectureId.current = selectedLecture._id;

      // Clear current note first to avoid showing stale data
      setCurrentNote({
        id: '',
        content: '',
        userId: user?.id || '',
        title: selectedLecture.title, // Use lecture title as default note title
        lectureId: selectedLecture._id
      });

      loadNoteForLecture(selectedLecture._id);
    }
  }, [selectedLecture, user]);

  // Load note for a specific lecture - simplified to one note per lecture
  const loadNoteForLecture = async (lectureId: string) => {
    // If there's already an active operation for this lecture, don't start another one
    if (currentOperation.current === lectureId) return;

    currentOperation.current = lectureId;
    setLoading(true);
    console.log(`Loading note for lecture: ${lectureId}`);

    try {
      // If the selected lecture has changed while we're fetching, abort
      if (lastSelectedLectureId.current !== lectureId) {
        console.log('Lecture selection changed during load, aborting');
        return;
      }

      const notes = await fetchNotes(lectureId);

      // Check again if selected lecture has changed
      if (lastSelectedLectureId.current !== lectureId) {
        console.log('Lecture selection changed after fetching notes, aborting');
        return;
      }

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
          userId: user?.id || '',
          lectureId: lectureId,
          title: selectedLecture?.title || 'New Note'
        };

        // Final check before saving
        if (lastSelectedLectureId.current !== lectureId) {
          return;
        }

        // Save the note immediately
        const savedNote = await saveNote(defaultNote);
        console.log('Created default note:', savedNote);
        setCurrentNote(savedNote);
      }
    } catch (error) {
      console.error('Failed to load note for lecture:', error);

      // Only set error state if this is still the selected lecture
      if (lastSelectedLectureId.current === lectureId) {
        // Set a default note even on error
        setCurrentNote({
          id: '',
          content: JSON.stringify({
            ops: [
              { insert: 'Error Loading Note\n', attributes: { header: 1 } },
              { insert: 'There was an error loading your note. Please try again.\n' }
            ]
          }),
          userId: user?.id || '',
          lectureId: lectureId,
          title: 'Error'
        });
      }
    } finally {
      if (lastSelectedLectureId.current === lectureId) {
        setLoading(false);
      }
      currentOperation.current = null;
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
        userId: user?.id || '',
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

  // Handle lecture selection with debouncing
  const handleLectureSelect = (lecture: Lecture) => {
    if (lecture._id === selectedLecture?._id) return; // Already selected

    // Clear any existing timeout
    if (window.selectLectureTimeout) {
      clearTimeout(window.selectLectureTimeout);
    }

    // Use a slight timeout to avoid rapid changes
    window.selectLectureTimeout = setTimeout(() => {
      setSelectedLecture(lecture);
    }, 100);
  };

  // Toggle suggestion panel visibility
  const toggleSuggestions = () => {
    setShowSuggestions(!showSuggestions);
    // When showing suggestions on mobile, ensure focus is on the suggestions section
    if (!showSuggestions && window.innerWidth <= 991) {
      setTimeout(() => {
        const suggestionsSection = document.querySelector('.suggestions-section');
        if (suggestionsSection) {
          suggestionsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  // For development mode only - add dev user switching functionality
  const DevUserControls = () => {
    if (process.env.NODE_ENV !== 'development') return null;

    const switchDevUser = (userId: string) => {
      localStorage.setItem('dev_user_id', userId);
      window.location.reload(); // Reload to apply the changes
    };

    return (
      <div className="dev-controls">
        <h4>Development Mode: Switch User</h4>
        <div className="dev-user-buttons">
          <button onClick={() => switchDevUser('user1')}>User 1</button>
          <button onClick={() => switchDevUser('user2')}>User 2</button>
          <button onClick={() => switchDevUser('admin')}>Admin</button>
        </div>
      </div>
    );
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    window.location.reload(); // Refresh to update auth context
  };

  if (authLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <AuthContainer onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="app-container">
      <Header
        title={`${selectedLecture?.title || 'Loading...'}`}
        loading={loading}
        user={user}
        onLogout={logout}
      />

      {/* Development-only user controls */}
      {process.env.NODE_ENV === 'development' && <DevUserControls />}

      <div className="main-content">
        {/* Sidebar with lecture selector - only show when suggestions are hidden */}
        <div className={`sidebar ${showSuggestions ? 'hide-sidebar' : ''}`}>
          <LectureSelector
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

        {/* Side panel for suggestions - only show when enabled */}
        {showSuggestions && selectedLecture && (
          <div className="suggestions-section">
            <SuggestionPanel
              noteId={currentNote.id}
              lectureId={selectedLecture._id}
              quillRef={editorRef}
              visible={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Add this to the Window interface
declare global {
  interface Window {
    selectLectureTimeout: NodeJS.Timeout | null;
  }
}

// Initialize the property
window.selectLectureTimeout = null;

export default App
