import { useState, useEffect } from 'react'
import './App.css'
import TextEditor from './components/TextEditor'
import Header from './components/Header'

import { Note } from './types/types'
import { fetchNotes, saveNote } from './services/api'

function App() {
  const [currentNote, setCurrentNote] = useState<Note>({ id: '', content: '', userId: 'current-user', title: 'Untitled Note' })
  const [loading, setLoading] = useState(false)

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

    } catch (error) {
      console.error('Failed to save note:', error)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="app-container">
      <Header title="Collaborative Notes" loading={loading} />
      <div className="main-content">
        <TextEditor
          content={currentNote.content}
          onSave={handleSaveNote}
        />

      </div>
    </div>
  )
}

export default App
