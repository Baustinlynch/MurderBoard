import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Main App Component
const PostItNotesApp = () => {
  const [notes, setNotes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [dragLine, setDragLine] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Note Component
  const Note = ({ id, position, onDelete }) => {
    const [text, setText] = useState('');
    const [pos, setPos] = useState(position);
    const [isDragging, setIsDragging] = useState(false);
    const noteRef = useRef(null);
    const colors = ['bg-yellow-200', 'bg-amber-200'];
    const color = colors[id % colors.length];

    // Handle note dragging
    const startNoteDrag = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.classList.contains('connect-dot')) return;
      
      const startX = e.clientX - pos.x;
      const startY = e.clientY - pos.y;
      
      const moveNote = (e) => {
        setPos({
          x: e.clientX - startX,
          y: e.clientY - startY
        });
      };
      
      const stopDrag = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', moveNote);
        document.removeEventListener('mouseup', stopDrag);
      };
      
      setIsDragging(true);
      document.addEventListener('mousemove', moveNote);
      document.addEventListener('mouseup', stopDrag);
    };

    // Handle connection line dragging
    const startLineDrag = (e) => {
      e.stopPropagation();
      const rect = noteRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      const startDot = {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top
      };
      
      setDragLine({
        start: { x: startDot.x, y: startDot.y },
        end: { x: startDot.x, y: startDot.y },
        fromId: id
      });
      
      const dragConnection = (e) => {
        setDragLine(prev => ({
          ...prev,
          end: { 
            x: e.clientX - containerRect.left, 
            y: e.clientY - containerRect.top 
          }
        }));
      };
      
      const endConnection = (e) => {
        document.removeEventListener('mousemove', dragConnection);
        document.removeEventListener('mouseup', endConnection);
        
        // Find if we're over another note
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const targetNote = elements.find(el => 
          el.dataset && el.dataset.noteId && el.dataset.noteId !== id.toString()
        );
        
        if (targetNote) {
          const targetId = parseInt(targetNote.dataset.noteId);
          setConnections(prev => [...prev, {
            fromId: id,
            toId: targetId,
            fromEl: noteRef.current,
            toEl: targetNote
          }]);
        }
        
        setDragLine(null);
      };
      
      document.addEventListener('mousemove', dragConnection);
      document.addEventListener('mouseup', endConnection);
    };

    return (
      <div
        ref={noteRef}
        data-note-id={id}
        className="absolute cursor-move group"
        style={{ left: `${pos.x}px`, top: `${pos.y}px`, zIndex: 10 }}
        onMouseDown={startNoteDrag}
      >
        <div className={`w-64 p-4 shadow-lg ${color} border-2 border-yellow-300 transform rotate-1 transition-transform group-hover:rotate-2`}>
          <textarea
            placeholder="Write your note here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={`w-full h-32 resize-none bg-transparent border-none outline-none text-gray-800 text-lg ${color}`}
          />
          <div className="flex justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div 
              className="connect-dot w-4 h-4 bg-blue-500 rounded-full cursor-pointer"
              onMouseDown={startLineDrag}
            />
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => onDelete(id)}
              className="bg-red-500 text-white"
            >
              Delete
            </Button>
          </div>
        </div>
        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 ${color} border-t-2 border-x-2 border-yellow-300 transform rotate-6`} />
      </div>
    );
  };

  // Draw connections on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const containerRect = containerRef.current.getBoundingClientRect();
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw permanent connections
    connections.forEach(conn => {
      const fromRect = conn.fromEl.getBoundingClientRect();
      const toRect = conn.toEl.getBoundingClientRect();

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
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
    // Draw temporary connection line
    if (dragLine) {
      ctx.beginPath();
      ctx.moveTo(dragLine.start.x, dragLine.start.y);
      ctx.lineTo(dragLine.end.x, dragLine.end.y);
      ctx.strokeStyle = 'rgba(0,0,255,0.5)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  }, [connections, dragLine]);

  // Add a new note
  const addNote = () => {
    const randomX = Math.random() * 300 + 100;
    const randomY = Math.random() * 200 + 100;
    setNotes(prev => [...prev, { 
      id: Date.now(),
      position: { x: randomX, y: randomY }
    }]);
  };

  // Delete a note
  const deleteNote = (id) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    setConnections(prev => prev.filter(conn => 
      conn.fromId !== id && conn.toId !== id
    ));
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-gray-50">
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
          position={note.position}
          onDelete={deleteNote}
        />
      ))}
    </div>
  );
};

export default PostItNotesApp;
