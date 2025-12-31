
import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, QuadrantId } from '../types';

interface DragState {
  task: Task;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
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
  // State is used primarily for rendering the UI (Ghost item position)
  const [dragItem, setDragItem] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  // Refs are used for logic consistency and synchronous access inside event handlers
  const dragItemRef = useRef<DragState | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null); 
  
  // Cache Refs
  const zonesRef = useRef<CachedZone[]>([]);
  const itemsRef = useRef<CachedItem[]>([]);
  const lastThrottleRef = useRef<number>(0);

  // --- Event Handlers (Defined via Refs/Callback to be stable) ---

  const handlePointerMove = useCallback((e: PointerEvent) => {
      // CRITICAL: Read from Ref, not State, to avoid stale closures and ensure immediate availability
      if (!dragItemRef.current) return;
      
      e.preventDefault(); // Prevent scrolling on mobile
      
      const { clientX, clientY } = e;

      // 1. Update State/Ref for Visuals (Real-time)
      const newItem = { ...dragItemRef.current, x: clientX, y: clientY };
      dragItemRef.current = newItem;
      setDragItem(newItem); // Trigger re-render for the ghost item

      // 2. Throttle Drop Calculation (Limit to ~25fps to save CPU)
      const now = Date.now();
      if (now - lastThrottleRef.current < 40) return;
      lastThrottleRef.current = now;

      // 3. Pure Math Hit-Testing (No DOM reads)
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

      // 4. Update Drop Target State (Only if changed)
      const prev = dropTargetRef.current;
      if (
          !prev || 
          !newTarget || 
          prev.zone !== newTarget.zone || 
          prev.index !== newTarget.index
      ) {
          if (prev !== newTarget) { // Simple object reference check isn't enough, but logic above handles value diff
               setDropTarget(newTarget);
               dropTargetRef.current = newTarget;
          }
      }
  }, []);

  const handlePointerUp = useCallback((e: PointerEvent) => {
      // Cleanup Listeners Immediately
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      // Unlock Body Interaction
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
      document.body.style.webkitUserSelect = '';

      // Execute Logic using Refs
      if (dragItemRef.current && dropTargetRef.current) {
          onDrop(dragItemRef.current.task, dropTargetRef.current);
      }

      // Reset State & Refs
      setDragItem(null);
      setDropTarget(null);
      
      dragItemRef.current = null;
      dropTargetRef.current = null;
      zonesRef.current = [];
      itemsRef.current = [];
  }, [handlePointerMove, onDrop]);

  // --- Start Drag Logic ---

  const startDrag = useCallback((task: Task, clientX: number, clientY: number, element: HTMLElement, pointerId: number) => {
    const rect = element.getBoundingClientRect();
    
    // 1. Pointer Capture (Critical for Mobile)
    if (element && typeof element.setPointerCapture === 'function') {
        try {
            element.setPointerCapture(pointerId);
        } catch (e) {
            console.warn("Failed to capture pointer", e);
        }
    }

    // 2. Cache Layouts (Sync Read)
    const zoneEls = document.querySelectorAll('[data-zone-id]');
    zonesRef.current = Array.from(zoneEls).map(el => {
        const r = el.getBoundingClientRect();
        return {
            id: el.getAttribute('data-zone-id') as QuadrantId,
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom
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

    // 3. Lock Body Styles
    document.body.style.userSelect = 'none';
    document.body.style.touchAction = 'none';
    document.body.style.webkitUserSelect = 'none';

    // 4. Initialize State Object
    const startState: DragState = {
      task,
      x: clientX,
      y: clientY,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
    };

    // 5. Update Ref FIRST (Synchronous Availability)
    dragItemRef.current = startState;
    
    // 6. Bind Listeners IMMEDIATELY (Do not wait for useEffect)
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    // 7. Trigger UI Render
    setDragItem(startState);
    
    onDragStart?.();
  }, [handlePointerMove, handlePointerUp, onDragStart]);

  // Cleanup on Unmount (Safety Net)
  useEffect(() => {
      return () => {
          window.removeEventListener('pointermove', handlePointerMove);
          window.removeEventListener('pointerup', handlePointerUp);
          window.removeEventListener('pointercancel', handlePointerUp);
          document.body.style.userSelect = '';
          document.body.style.touchAction = '';
          document.body.style.webkitUserSelect = '';
      };
  }, [handlePointerMove, handlePointerUp]);

  return { dragItem, dropTarget, startDrag };
};
