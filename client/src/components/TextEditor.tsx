import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Delta as QuillDelta } from 'quill';
import './TextEditor.css';

interface TextEditorProps {
    content: string;
    onSave: (content: string) => void;
    onToggleSuggestions?: () => void;
    showSuggestions?: boolean;
}

// Use forwardRef to expose the Quill editor to parent components
const TextEditor = forwardRef<any, TextEditorProps>((props, ref) => {
    const { content, onSave, onToggleSuggestions, showSuggestions } = props;
    const [value, setValue] = useState<QuillDelta | null>(null);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
    const quillRef = useRef<ReactQuill>(null);

    // Expose the quillRef to parent components through the forwarded ref
    useImperativeHandle(ref, () => ({
        getEditor: () => quillRef.current?.getEditor(),
        // Add method to update internal state after external changes
        updateState: () => {
            if (quillRef.current) {
                const editor = quillRef.current.getEditor();
                setValue(editor.getContents());
                setSaveStatus('unsaved');
            }
        }
    }));

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
        // Only update if the change came from user input, not programmatic changes
        if (_source === 'user') {
            setValue(editor.getContents());
            setSaveStatus('unsaved');
        }
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
                <h2 className="editor-title">Your Notes</h2>
                <div className="editor-controls">
                    <span className={`save-status ${saveStatus}`}>
                        {saveStatus === 'saving' ? 'Saving...' :
                            saveStatus === 'unsaved' ? 'Unsaved changes' :
                                'All changes saved'}
                    </span>

                    <div className="control-buttons">
                        {onToggleSuggestions && (
                            <button
                                onClick={onToggleSuggestions}
                                className={`toggle-button ${showSuggestions ? 'active' : 'inactive'}`}
                                aria-label={showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
                            >
                                {showSuggestions ? 'Hide Suggestions' : 'Show Suggestions'}
                            </button>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={saveStatus === 'saved'}
                            className={`save-button ${saveStatus === 'unsaved' ? 'enabled' : 'disabled'}`}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
            <div className="quill-wrapper">
                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={value || undefined}
                    onChange={handleChange}
                    modules={modules}
                    formats={formats}
                    placeholder="Start taking notes..."
                    className="h-full"
                />
            </div>
        </div>
    );
});

export default TextEditor;