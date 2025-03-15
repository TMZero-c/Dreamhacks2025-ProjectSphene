import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface TextEditorProps {
    content: string;
    onSave: (content: string) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ content, onSave }) => {
    const [value, setValue] = useState('');
    const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');

    // Initialize with content when it changes
    useEffect(() => {
        if (content) {
            setValue(content);
            setSaveStatus('saved');
        }
    }, [content]);

    const handleChange = (newContent: string) => {
        setValue(newContent);
        setSaveStatus('unsaved');
    };

    const handleSave = () => {
        setSaveStatus('saving');
        onSave(value);
        setTimeout(() => setSaveStatus('saved'), 1000);
    };

    // Quill editor modules/formats
    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'code-block'],
            ['link'],
            ['clean']
        ],
    };

    return (
        <div className="editor-container">
            <div className="editor-header">
                <h2>Your Notes</h2>
                <div className="editor-controls">
                    <span className={`save-status ${saveStatus}`}>
                        {saveStatus === 'saving' ? 'Saving...' :
                            saveStatus === 'unsaved' ? 'Unsaved changes' :
                                'All changes saved'}
                    </span>
                    <button
                        onClick={handleSave}
                        disabled={saveStatus === 'saved'}
                        className={saveStatus === 'unsaved' ? 'unsaved' : ''}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={handleChange}
                modules={modules}
                placeholder="Start taking notes..."
            />
        </div>
    );
};

export default TextEditor;