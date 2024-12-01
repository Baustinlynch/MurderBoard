import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

// Custom hook for draggable notes
const useDraggable = (initialPosition = { x: 100, y: 100 }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target instanceof HTMLTextAreaElement) return;
    
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX - startX, y: e.clientY - startY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [position]);

  return { position, isDragging, elementRef, handleMouseDown, setPosition };
};

interface NoteProps {
  id: string;
  onDelete: (id: string) => void;
  onStartConnection: (element: HTMLElement, id: string, position: { x: number; y: number }) => void;
  onEndConnection: (element: HTMLElement, id: string) => void;
  initialPosition: { x: number; y: number };
  isConnecting: boolean;
}

const Note: React.FC<NoteProps> = ({ id, onDelete, onStartConnection, onEndConnection, initialPosition, isConnecting }) => {
  const { position, handleMouseDown, setPosition } = useDraggable(initialPosition);
  const [text, setText] = useState('');
  const noteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [initialPosition, setPosition]);

  const postItColors = ['bg-yellow-100', 'bg-yellow-200', 'bg-amber-100', 'bg-amber-200'];
  const randomColor = postItColors[Math.floor(Math.random() * postItColors.length)];

  const handleConnectionStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (noteRef.current) {
      onStartConnection(noteRef.current, id, position);
    }
  }, [id, onStartConnection, position]);

  const handleConnectionEnd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (noteRef.current) {
      onEndConnection(noteRef.current, id);
    }
  }, [id, onEndConnection]);

  return (
    // ... rest of the component
  );
};

export default Note;