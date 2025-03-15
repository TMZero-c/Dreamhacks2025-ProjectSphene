import { useEffect, useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Delta as QuillDelta } from 'quill';

interface TextEditorProps {
    content: string;
    onSave: (content: string) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ content, onSave }) => {
    const [value, setValue] = useState<QuillDelta | null>(null);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
    const quillRef = useRef<ReactQuill>(null);

    // Initialize with content when it changes
    useEffect(() => {
        if (content && quillRef.current) {
            try {
                // Try to parse the content as Delta JSON
                const deltaContent = JSON.parse(content);
                setValue(deltaContent);
            } catch (e) {
                // If parsing fails (first load or content is HTML), 
                // set content directly and let Quill handle it
                quillRef.current.getEditor().clipboard.dangerouslyPasteHTML(content);
                setValue(quillRef.current.getEditor().getContents());
            }
            setSaveStatus('saved');
        }
    }, [content]);

    const handleChange = (_content: string, _delta: any, _source: any, editor: any) => {
        // Store the Delta object
        setValue(editor.getContents());
        setSaveStatus('unsaved');
    };

    const handleSave = () => {
        if (value) {
            setSaveStatus('saving');
            // Convert Delta to JSON string for saving
            onSave(JSON.stringify(value));
            setTimeout(() => setSaveStatus('saved'), 1000);
        }
    };

    // Quill editor modules/formats
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            ['blockquote', 'code-block'],
            ['link', 'image', 'video'],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            ['clean']
        ],
        clipboard: {
            matchVisual: false
        }
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'font',
        'align',
        'list', 'bullet',
        'script',
        'blockquote', 'code-block',
        'link', 'image', 'video',
        'indent'
    ];

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
                ref={quillRef}
                theme="snow"
                value={value || undefined}
                onChange={handleChange}
                modules={modules}
                formats={formats}
                placeholder="Start taking notes..."
            />
        </div>
    );
};

export default TextEditor;