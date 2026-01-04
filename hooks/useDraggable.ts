
import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, QuadrantId } from '../types';

interface DragState {
  task: Task;
  startX: number;
  startY: number;
}

interface DropTarget {
  zone: QuadrantId;
  index: number;
}

interface UseDraggableProps {
  onDrop: (task: Task, target: DropTarget) => void;
  onDragStart?: () => void;
}

// Interfaces for Cached Layout Data
interface CachedZone {
    id: QuadrantId;
    left: number;
    right: number;
    top: number;
    bottom: number;
}

interface CachedItem {
    id: string;
    zoneId: QuadrantId;
    centerY: number;
}

export const useDraggable = ({ onDrop, onDragStart }: UseDraggableProps) => {
  const [dragItem, setDragItem] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  // Refs for logic consistency
  const dragItemRef = useRef<DragState | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null); 
  
  // Internal Vanilla Ghost Ref
  const ghostElementRef = useRef<HTMLElement | null>(null);

  // Cache Refs
  const zonesRef = useRef<CachedZone[]>([]);
  const itemsRef = useRef<CachedItem[]>([]);
  
  // Throttling Refs
  const lastThrottleRef = useRef<number>(0);
  const lastStateUpdateRef = useRef<number>(0);

  const handlePointerMove = useCallback((e: PointerEvent) => {
      if (!dragItemRef.current) return;
      
      e.preventDefault();
      
      const { clientX, clientY } = e;

      // 1. Direct DOM Manipulation (Vanilla Ghost)
      if (ghostElementRef.current) {
          const deltaX = clientX - dragItemRef.current.startX;
          const deltaY = clientY - dragItemRef.current.startY;
          // Apply transform to the vanilla element
          ghostElementRef.current.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(1.05) rotate(2deg)`;
      }

      const now = Date.now();
      if (now - lastThrottleRef.current < 32) return;
      lastThrottleRef.current = now;

      // Hit Testing
      const activeZone = zonesRef.current.find(z => 
          clientX >= z.left && 
          clientX <= z.right && 
          clientY >= z.top && 
          clientY <= z.bottom
      );

      let newTarget: DropTarget | null = null;

      if (activeZone) {
          const zoneItems = itemsRef.current.filter(i => i.zoneId === activeZone.id);
          let index = zoneItems.length;
          for (let i = 0; i < zoneItems.length; i++) {
              if (clientY < zoneItems[i].centerY) {
                  index = i;
                  break;
              }
          }
          newTarget = { zone: activeZone.id, index };
      }

      // Smart State Lock
      const prev = dropTargetRef.current;
      const isSameTarget = (prev === null && newTarget === null) || 
                           (prev && newTarget && prev.zone === newTarget.zone && prev.index === newTarget.index);
      
      if (isSameTarget) return;

      const timeSinceLastRender = now - lastStateUpdateRef.current;
      if (prev && timeSinceLastRender < 80) return;

      setDropTarget(newTarget);
      dropTargetRef.current = newTarget;
      lastStateUpdateRef.current = now;

  }, []);

  const handlePointerUp = useCallback((e: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
      document.body.style.webkitUserSelect = '';

      // Remove Vanilla Ghost
      if (ghostElementRef.current) {
          ghostElementRef.current.remove();
          ghostElementRef.current = null;
      }

      if (dragItemRef.current && dropTargetRef.current) {
          onDrop(dragItemRef.current.task, dropTargetRef.current);
      }

      setDragItem(null);
      setDropTarget(null);
      
      dragItemRef.current = null;
      dropTargetRef.current = null;
      zonesRef.current = [];
      itemsRef.current = [];
  }, [handlePointerMove, onDrop]);

  const startDrag = useCallback((task: Task, clientX: number, clientY: number, element: HTMLElement, pointerId: number) => {
    const rect = element.getBoundingClientRect();
    
    if (element && typeof element.setPointerCapture === 'function') {
        try { element.setPointerCapture(pointerId); } catch (e) { console.warn(e); }
    }

    // Cache Layouts
    const zoneEls = document.querySelectorAll('[data-zone-id]');
    zonesRef.current = Array.from(zoneEls).map(el => {
        const r = el.getBoundingClientRect();
        return {
            id: el.getAttribute('data-zone-id') as QuadrantId,
            left: r.left, right: r.right, top: r.top, bottom: r.bottom
        };
    });

    const itemEls = document.querySelectorAll('[data-task-id]');
    itemsRef.current = Array.from(itemEls)
        .filter(el => el.getAttribute('data-task-id') !== task.id)
        .map(el => {
            const r = el.getBoundingClientRect();
            const parentZone = el.closest('[data-zone-id]')?.getAttribute('data-zone-id') as QuadrantId;
            return {
                id: el.getAttribute('data-task-id')!,
                zoneId: parentZone,
                centerY: r.top + (r.height / 2)
            };
        });

    document.body.style.userSelect = 'none';
    document.body.style.touchAction = 'none';
    document.body.style.webkitUserSelect = 'none';

    // --- CREATE VANILLA GHOST ---
    const ghost = element.cloneNode(true) as HTMLElement;
    // Apply styles to override existing layout constraints and ensure it floats
    Object.assign(ghost.style, {
        position: 'fixed',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        zIndex: '9999',
        pointerEvents: 'none', // Critical: Let events pass through to underlying elements
        margin: '0',
        transform: 'scale(1.05) rotate(2deg)', // Initial State
        transition: 'none',     // No delay
        opacity: '0.9',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
    });
    
    document.body.appendChild(ghost);
    ghostElementRef.current = ghost;
    // ----------------------------

    const startState: DragState = {
      task,
      startX: clientX,
      startY: clientY
    };

    dragItemRef.current = startState;
    lastStateUpdateRef.current = 0;
    
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    setDragItem(startState);
    
    onDragStart?.();
  }, [handlePointerMove, handlePointerUp, onDragStart]);

  useEffect(() => {
      return () => {
          window.removeEventListener('pointermove', handlePointerMove);
          window.removeEventListener('pointerup', handlePointerUp);
          window.removeEventListener('pointercancel', handlePointerUp);
          if (ghostElementRef.current) {
              ghostElementRef.current.remove();
          }
      };
  }, [handlePointerMove, handlePointerUp]);

  return { dragItem, dropTarget, startDrag };
};
