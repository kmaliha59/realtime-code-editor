import './Editor.css';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { 
  Play, Save, Share2, Users, Settings, 
  Moon, Sun, Copy, Check 
} from 'lucide-react';
import toast from 'react-hot-toast';

const CodeEditor = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const username = searchParams.get('username') || 'Anonymous';

  const [code, setCode] = useState('// Start coding here...\n');
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('vs-dark');
  const [users, setUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const isRemoteChange = useRef(false);

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
  ];

  useEffect(() => {
    // Connect to server
    socketRef.current = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');

    socketRef.current.emit('join-room', roomId, username);

    // Listen for events
    socketRef.current.on('room-state', (state) => {
      setCode(state.code);
      setLanguage(state.language);
      setUsers(state.users);
    });

    socketRef.current.on('code-update', (data) => {
      isRemoteChange.current = true;
      setCode(data.code);
      setLanguage(data.language);
    });

    socketRef.current.on('user-joined', (user) => {
      setUsers(prev => [...prev, user]);
      toast.success(`${user.username} joined the room`);
    });

    socketRef.current.on('user-left', (userId) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
    });

    socketRef.current.on('user-typing', (username) => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1000);
    });

    socketRef.current.on('cursor-update', (data) => {
      // Update cursor position for other users
      // Implementation would show colored cursors
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId, username]);

  const handleEditorChange = useCallback((value) => {
    if (!isRemoteChange.current) {
      setCode(value);
      socketRef.current.emit('code-change', {
        code: value,
        language,
        cursor: editorRef.current?.getPosition()
      });
      socketRef.current.emit('typing');
    }
    isRemoteChange.current = false;
  }, [language]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    socketRef.current.emit('language-change', newLang);
  };

  const runCode = () => {
    if (language === 'javascript') {
      try {
        // eslint-disable-next-line no-eval
        const result = eval(code);
        setOutput(String(result));
      } catch (error) {
        setOutput(`Error: ${error.message}`);
      }
    } else {
      setOutput('Code execution for this language is coming soon!');
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Room link copied!');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'vs-dark' ? 'light' : 'vs-dark');
  };

  return (
    <div className="editor-container">
      {/* Header */}
      <div className="editor-header">
        <div className="header-left">
          <h2>Room: {roomId}</h2>
          <div className="users-count">
            <Users size={16} />
            <span>{users.length} online</span>
          </div>
          {isTyping && <span className="typing-indicator">Someone is typing...</span>}
        </div>

        <div className="header-right">
          <select 
            value={language} 
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="language-select"
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>

          <button onClick={toggleTheme} className="icon-btn">
            {theme === 'vs-dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button onClick={copyRoomLink} className="icon-btn">
            {copied ? <Check size={18} color="#22c55e" /> : <Share2 size={18} />}
          </button>

          <button onClick={runCode} className="run-btn">
            <Play size={16} /> Run
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="editor-main">
        <div className="editor-wrapper">
          <Editor
            height="100%"
            language={language}
            value={code}
            theme={theme}
            onChange={handleEditorChange}
            onMount={(editor) => { editorRef.current = editor; }}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
            }}
          />
        </div>

        {/* Output Panel */}
        <div className="output-panel">
          <div className="output-header">
            <Settings size={16} />
            <span>Output</span>
          </div>
          <pre className="output-content">{output || 'Click Run to see output...'}</pre>
        </div>
      </div>

      {/* Users Sidebar */}
      <div className="users-sidebar">
        <h3>Active Users</h3>
        {users.map(user => (
          <div key={user.id} className="user-item">
            <div className="user-avatar">{user.username[0].toUpperCase()}</div>
            <span>{user.username}</span>
            {user.id === socketRef.current?.id && <span className="you-badge">You</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CodeEditor;
