import { useState, useEffect, useRef } from 'react'
import './App.css'
import TextEditor from './components/TextEditor'
import Header from './components/Header'
import SuggestionPanel from './components/SuggestionPanel'

import { Note } from './types/types'
import { fetchNotes, saveNote } from './services/api'

function App() {
  const [currentNote, setCurrentNote] = useState<Note>({ id: '', content: '', userId: 'current-user', title: 'Untitled Note' })
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const editorRef = useRef(null)

  // Load initial note data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        // for now using temp id
        const notes = await fetchNotes('current-user')
        if (notes.length > 0) {
          setCurrentNote(notes[0])
        }

      } catch (error) {
        console.error('Failed to load initial data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Save the current note and trigger suggestion generation
  const handleSaveNote = async (content: string) => {
    setLoading(true)
    try {
      const updatedNote = { ...currentNote, content }
      const savedNote = await saveNote(updatedNote)
      setCurrentNote(savedNote)

      // Additional check to ensure suggestions are refreshed on save
      if (showSuggestions && editorRef.current) {
        // Could trigger suggestion refresh here if needed
      }
    } catch (error) {
      console.error('Failed to save note:', error)
    } finally {
      setLoading(false)
    }
  }

  // Toggle suggestion panel visibility
  const toggleSuggestions = () => {
    setShowSuggestions(!showSuggestions)
  }

  return (
    <div className="app-container">
      <Header title="Collaborative Notes" loading={loading} />
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
