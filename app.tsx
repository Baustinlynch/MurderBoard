import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Custom hook for draggable notes
const useDraggable = (initialPosition = { x: 100, y: 100 }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef(null);

  const handleMouseDown = (e) => {
    // Prevent dragging if interacting with textarea
    if (e.target.tagName === 'TEXTAREA') return;

    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e) => {
      setPosition({
        x: e.clientX - startX,
        y: e.clientY - startY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return { 
    position, 
    isDragging, 
    elementRef, 
    handleMouseDown 
  };
};

// Note Component
const Note = ({ 
  id, 
  onDelete, 
  onStartConnection, 
  onEndConnection 
}) => {
  const { position, handleMouseDown } = useDraggable();
  const [text, setText] = useState('');
  const noteRef = useRef(null);

  const postItColors = [
    'bg-yellow-100', 
    'bg-yellow-200', 
    'bg-amber-100', 
    'bg-amber-200'
  ];
  const randomColor = postItColors[Math.floor(Math.random() * postItColors.length)];

  const handleConnectionStart = (e) => {
    e.stopPropagation();
    onStartConnection(noteRef.current, id);
  };

  const handleConnectionEnd = (e) => {
    e.stopPropagation();
    onEndConnection(noteRef.current, id);
  };

  return (
    <div
      ref={noteRef}
      data-note-id={id}
      className="absolute cursor-move group"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`, 
        zIndex: 10 
      }}
    >
      <div 
        className={`
          w-64 p-4 shadow-lg 
          ${randomColor} 
          border-2 border-yellow-300 
          transform rotate-1 
          transition-transform 
          group-hover:rotate-2
        `}
        onMouseDown={handleMouseDown}
      >
        <textarea
          placeholder="Write your note here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`
            w-full h-32 resize-none 
            bg-transparent 
            border-none 
            outline-none 
            text-gray-800 
            font-handwriting
            text-lg
            ${randomColor}
          `}
        />
        <div className="flex justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div 
            onMouseDown={handleConnectionStart}
            className="w-4 h-4 bg-blue-500 rounded-full cursor-pointer"
          />
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onDelete}
            className="bg-red-500 text-white"
          >
            Delete
          </Button>
        </div>
      </div>
      <div 
        className={`
          absolute -top-2 left-1/2 -translate-x-1/2 
          w-8 h-4 
          ${randomColor} 
          border-t-2 border-x-2 border-yellow-300
          transform rotate-6
        `}
      />
    </div>
  );
};

// Main App Component
const PostItNotesApp = () => {
  const [notes, setNotes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [currentConnection, setCurrentConnection] = useState(null);
  const [tempConnection, setTempConnection] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const addNote = () => {
    const newNoteId = Date.now();
    setNotes([...notes, { id: newNoteId }]);
    return newNoteId;
  };

  const deleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
    // Remove any connections involving this note
    setConnections(connections.filter(
      conn => conn.fromId !== id && conn.toId !== id
    ));
  };

  const handleStartConnection = (noteElement, noteId) => {
    setCurrentConnection({
      from: noteElement,
      fromId: noteId,
      fromRect: noteElement.getBoundingClientRect()
    });
  };

  const handleEndConnection = (noteElement, noteId) => {
    if (currentConnection && currentConnection.fromId !== noteId) {
      setConnections([...connections, {
        fromId: currentConnection.fromId,
        toId: noteId,
        from: currentConnection.from,
        to: noteElement
      }]);
      setCurrentConnection(null);
      setTempConnection(null);
    }
  };

  // Track mouse movement for temporary connection line
  useEffect(() => {
    if (!currentConnection) return;

    const handleMouseMove = (e) => {
      const containerRect = containerRef.current.getBoundingClientRect();
      setTempConnection({
        startX: currentConnection.fromRect.left + currentConnection.fromRect.width / 2 - containerRect.left,
        startY: currentConnection.fromRect.top + currentConnection.fromRect.height / 2 - containerRect.top,
        endX: e.clientX - containerRect.left,
        endY: e.clientY - containerRect.top
      });
    };

    const handleMouseUp = () => {
      setCurrentConnection(null);
      setTempConnection(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [currentConnection]);

  // Draw connections on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw permanent connections
    connections.forEach(conn => {
      const fromRect = conn.from.getBoundingClientRect();
      const toRect = conn.to.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      ctx.beginPath();
      ctx.moveTo(
        fromRect.left + fromRect.width / 2 - containerRect.left, 
        fromRect.top + fromRect.height / 2 - containerRect.top
      );
      ctx.lineTo(
        toRect.left + toRect.width / 2 - containerRect.left, 
        toRect.top + toRect.height / 2 - containerRect.top
      );
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.setLineDash([5, 5]); // Dashed line
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
    });

    // Draw temporary connection line
    if (tempConnection) {
      ctx.beginPath();
      ctx.moveTo(tempConnection.startX, tempConnection.startY);
      ctx.lineTo(tempConnection.endX, tempConnection.endY);
      ctx.strokeStyle = 'rgba(0,0,255,0.5)';
      ctx.setLineDash([3, 3]); // Different dash for temp line
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
    }
  }, [connections, tempConnection]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-gray-50"
    >
      <canvas 
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        width={window.innerWidth}
        height={window.innerHeight}
      />
      <div className="absolute top-4 left-4 z-50">
        <Button onClick={addNote} className="bg-blue-500 text-white">
          Add Note
        </Button>
      </div>
      {notes.map(note => (
        <Note 
          key={note.id}
          id={note.id}
          onDelete={() => deleteNote(note.id)}
          onStartConnection={handleStartConnection}
          onEndConnection={handleEndConnection}
        />
      ))}
    </div>
  );
};

export default PostItNotesApp;
