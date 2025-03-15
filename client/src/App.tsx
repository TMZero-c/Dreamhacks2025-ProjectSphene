import { useState, useEffect, useRef } from 'react'
import './App.css'
import TextEditor from './components/TextEditor'
import Header from './components/Header'
import SuggestionPanel from './components/SuggestionPanel'

import { Note } from './types/types'
import { fetchNotes, saveNote } from './services/api'

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

  const [currentNote, setCurrentNote] = useState<Note>({
    id: '',
    content: '',
    userId: userId,
    title: 'Loading...'
  });

  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const editorRef = useRef(null);

  // Load initial note data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      console.log(`Loading notes for user: ${userId}`);
      try {
        const notes = await fetchNotes(userId);
        if (notes && notes.length > 0) {
          console.log(`Loaded note: ${notes[0].title}`);
          setCurrentNote(notes[0]);
        } else {
          console.log('No notes found, using default');
          // If still no notes, ensure we have a valid note object
          setCurrentNote({
            id: `default-${Date.now()}`,
            content: JSON.stringify({
              ops: [
                { insert: 'New Note\n', attributes: { header: 1 } },
                { insert: 'Start writing here...\n' }
              ]
            }),
            userId: userId,
            title: 'New Note'
          });
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
        // Set a default note even on error
        setCurrentNote({
          id: `default-${Date.now()}`,
          content: JSON.stringify({
            ops: [
              { insert: 'New Note\n', attributes: { header: 1 } },
              { insert: 'Start writing here...\n' }
            ]
          }),
          userId: userId,
          title: 'New Note'
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadInitialData();
    }
  }, [userId]);

  // Save the current note
  const handleSaveNote = async (content: string) => {
    setLoading(true);
    try {
      const updatedNote = { ...currentNote, content, userId };
      const savedNote = await saveNote(updatedNote);
      setCurrentNote(savedNote);
      console.log('Note saved successfully');
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle suggestion panel visibility
  const toggleSuggestions = () => {
    setShowSuggestions(!showSuggestions);
  };

  // Handle user ID change (for testing)
  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserIdInput(e.target.value);
  };

  const applyUserId = () => {
    if (userIdInput) {
      localStorage.setItem('sphene_user_id', userIdInput);
      window.location.reload(); // Reload to apply the new user ID
    }
  };

  // Quick user switcher - for testing
  const quickSwitchUser = (testUserId: string) => {
    localStorage.setItem('sphene_user_id', testUserId);
    window.location.reload();
  }

  return (
    <div className="app-container">
      <Header title={`Collaborative Notes (${userId})`} loading={loading} />

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
              onChange={(e) => setUserIdInput(e.target.value)}
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
        {/* Editor section - adjust width based on suggestion panel visibility */}
        <div className={`editor-section ${showSuggestions ? 'with-suggestions' : ''}`}>
          <TextEditor
            ref={editorRef}
            content={currentNote.content}
            onSave={handleSaveNote}
            onToggleSuggestions={toggleSuggestions}
            showSuggestions={showSuggestions}
          />
        </div>

        {/* Side panel for suggestions */}
        {showSuggestions && (
          <div className="suggestions-section">
            <SuggestionPanel
              noteId={currentNote.id}
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
