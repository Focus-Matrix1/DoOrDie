
import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, QuadrantId } from '../types';

interface DragState {
  task: Task;
  // Static initial positions for the Ghost element (Viewpoint relative)
  initialLeft: number;
  initialTop: number;
  // Pointer start position to calculate deltas
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
  ghostRef: React.RefObject<HTMLElement | null>;
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

export const useDraggable = ({ onDrop, onDragStart, ghostRef }: UseDraggableProps) => {
  // State is used ONLY for mounting/unmounting the ghost and static initialization.
  // No updates occur during the drag move cycle.
  const [dragItem, setDragItem] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  // Refs are used for logic consistency and synchronous access inside event handlers
  const dragItemRef = useRef<DragState | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null); 
  
  // Cache Refs
  const zonesRef = useRef<CachedZone[]>([]);
  const itemsRef = useRef<CachedItem[]>([]);
  
  // Throttling Refs
  const lastThrottleRef = useRef<number>(0); // For math calculation frequency
  const lastStateUpdateRef = useRef<number>(0); // For React Render frequency (The Smart Lock)

  // --- Event Handlers (Defined via Refs/Callback to be stable) ---

  const handlePointerMove = useCallback((e: PointerEvent) => {
      // CRITICAL: Read from Ref, not State
      if (!dragItemRef.current) return;
      
      e.preventDefault(); // Prevent scrolling on mobile
      
      const { clientX, clientY } = e;

      // 1. Direct DOM Manipulation (Zero React Renders, Always 60FPS)
      if (ghostRef.current) {
          const deltaX = clientX - dragItemRef.current.startX;
          const deltaY = clientY - dragItemRef.current.startY;
          // Apply hardware accelerated transform
          ghostRef.current.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(1.05) rotate(2deg)`;
      }

      const now = Date.now();

      // 2. Throttle Calculation (Limit math to ~30fps to save CPU)
      // We calculate more often than we render to ensure we have fresh data ready
      if (now - lastThrottleRef.current < 32) return;
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

      // 4. Smart State Lock (The Gatekeeper)
      const prev = dropTargetRef.current;

      // Condition A: Identity Check
      // If the target hasn't logically changed, do absolutely nothing.
      const isSameTarget = (prev === null && newTarget === null) || 
                           (prev && newTarget && prev.zone === newTarget.zone && prev.index === newTarget.index);
      
      if (isSameTarget) return;

      // Condition B: Time Gate (80ms Limit)
      // We force React to update at max ~12fps for the blue line.
      // This frees up the JS thread for the browser compositor to handle the ghost movement smoothly.
      const timeSinceLastRender = now - lastStateUpdateRef.current;
      
      // Allow immediate update if we had no previous target (entering a zone for the first time)
      // otherwise enforce the 80ms lock.
      if (prev && timeSinceLastRender < 80) {
          return; // REJECT UPDATE: Keep old state
      }

      // Pass: Update State
      setDropTarget(newTarget);
      dropTargetRef.current = newTarget;
      lastStateUpdateRef.current = now;

  }, [ghostRef]);

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

    // 4. Initialize State Object (Static Data Only)
    const startState: DragState = {
      task,
      initialLeft: rect.left,
      initialTop: rect.top,
      startX: clientX,
      startY: clientY
    };

    // 5. Update Ref FIRST (Synchronous Availability)
    dragItemRef.current = startState;
    lastStateUpdateRef.current = 0; // Reset lock
    
    // 6. Bind Listeners IMMEDIATELY (Do not wait for useEffect)
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    // 7. Trigger UI Render (Mounts the ghost)
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
