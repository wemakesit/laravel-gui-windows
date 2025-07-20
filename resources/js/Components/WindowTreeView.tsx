import { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface WindowItem {
  id: string;
  type: string;
  room: string;
  width: number;
  height: number;
  options: number[];
  extras: string[];
  finish: string;
  notes?: string;
  hasPhoto?: boolean;
}

interface WindowGroup {
  id: string;
  name: string;
  windows: WindowItem[];
  collapsed: boolean;
}

interface WindowTreeViewProps {
  windows: WindowItem[];
  onWindowsChange: (windows: WindowItem[]) => void;
  onWindowEdit: (windowId: string) => void;
  onWindowDelete: (windowId: string) => void;
  onWindowDuplicate: (windowId: string) => void;
  onPhotoCapture: (windowId: string) => void;
  className?: string;
}

export default function WindowTreeView({
  windows,
  onWindowsChange,
  onWindowEdit,
  onWindowDelete,
  onWindowDuplicate,
  onPhotoCapture,
  className = ''
}: WindowTreeViewProps) {
  const [groups, setGroups] = useState<WindowGroup[]>(() => {
    // Group windows by room
    const roomGroups = new Map<string, WindowItem[]>();
    
    windows.forEach(window => {
      const room = window.room || 'Ungrouped';
      if (!roomGroups.has(room)) {
        roomGroups.set(room, []);
      }
      roomGroups.get(room)!.push(window);
    });

    return Array.from(roomGroups.entries()).map(([room, roomWindows]) => ({
      id: `group-${room}`,
      name: room,
      windows: roomWindows,
      collapsed: false
    }));
  });

  const [selectedWindows, setSelectedWindows] = useState<Set<string>>(new Set());

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Handle reordering within the same group
    if (source.droppableId === destination.droppableId) {
      const groupIndex = groups.findIndex(g => g.id === source.droppableId);
      if (groupIndex === -1) return;

      const newGroups = [...groups];
      const group = newGroups[groupIndex];
      const newWindows = [...group.windows];
      
      const [removed] = newWindows.splice(source.index, 1);
      newWindows.splice(destination.index, 0, removed);
      
      newGroups[groupIndex] = { ...group, windows: newWindows };
      setGroups(newGroups);
      
      // Update the main windows array
      const allWindows = newGroups.flatMap(g => g.windows);
      onWindowsChange(allWindows);
    } else {
      // Handle moving between groups
      const sourceGroupIndex = groups.findIndex(g => g.id === source.droppableId);
      const destGroupIndex = groups.findIndex(g => g.id === destination.droppableId);
      
      if (sourceGroupIndex === -1 || destGroupIndex === -1) return;

      const newGroups = [...groups];
      const sourceGroup = newGroups[sourceGroupIndex];
      const destGroup = newGroups[destGroupIndex];
      
      const [removed] = sourceGroup.windows.splice(source.index, 1);
      
      // Update the window's room to match the destination group
      const updatedWindow = { ...removed, room: destGroup.name };
      destGroup.windows.splice(destination.index, 0, updatedWindow);
      
      setGroups(newGroups);
      
      // Update the main windows array
      const allWindows = newGroups.flatMap(g => g.windows);
      onWindowsChange(allWindows);
    }
  }, [groups, onWindowsChange]);

  const toggleGroup = (groupId: string) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, collapsed: !group.collapsed }
        : group
    ));
  };

  const toggleWindowSelection = (windowId: string) => {
    setSelectedWindows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(windowId)) {
        newSet.delete(windowId);
      } else {
        newSet.add(windowId);
      }
      return newSet;
    });
  };

  const selectAllInGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    setSelectedWindows(prev => {
      const newSet = new Set(prev);
      group.windows.forEach(window => newSet.add(window.id));
      return newSet;
    });
  };

  const bulkDelete = () => {
    if (selectedWindows.size === 0) return;
    
    if (confirm(`Delete ${selectedWindows.size} selected windows?`)) {
      selectedWindows.forEach(windowId => {
        onWindowDelete(windowId);
      });
      setSelectedWindows(new Set());
    }
  };

  const bulkDuplicate = () => {
    if (selectedWindows.size === 0) return;
    
    selectedWindows.forEach(windowId => {
      onWindowDuplicate(windowId);
    });
    setSelectedWindows(new Set());
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Windows ({windows.length})
          </h3>
          
          {selectedWindows.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedWindows.size} selected
              </span>
              <button
                onClick={bulkDuplicate}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Duplicate
              </button>
              <button
                onClick={bulkDelete}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedWindows(new Set())}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tree View */}
      <div className="p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          {groups.map((group) => (
            <div key={group.id} className="mb-4">
              {/* Group Header */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <svg
                    className={`h-4 w-4 transition-transform ${
                      group.collapsed ? 'rotate-0' : 'rotate-90'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>{group.name} ({group.windows.length})</span>
                </button>
                
                <button
                  onClick={() => selectAllInGroup(group.id)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
              </div>

              {/* Group Windows */}
              {!group.collapsed && (
                <Droppable droppableId={group.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`ml-6 space-y-2 min-h-[2rem] rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : ''
                      }`}
                    >
                      {group.windows.map((window, index) => (
                        <Draggable key={window.id} draggableId={window.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-3 border border-gray-200 rounded-lg bg-white transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                              } ${
                                selectedWindows.has(window.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {/* Drag Handle */}
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                                  >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                    </svg>
                                  </div>

                                  {/* Selection Checkbox */}
                                  <input
                                    type="checkbox"
                                    checked={selectedWindows.has(window.id)}
                                    onChange={() => toggleWindowSelection(window.id)}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                  />

                                  {/* Window Info */}
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-gray-900">{window.type}</span>
                                      <span className="text-sm text-gray-500">
                                        {window.width} × {window.height}
                                      </span>
                                      {window.hasPhoto && (
                                        <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        </svg>
                                      )}
                                    </div>
                                    {window.notes && (
                                      <p className="text-xs text-gray-600 mt-1">{window.notes}</p>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => onPhotoCapture(window.id)}
                                    className="p-1 text-gray-400 hover:text-blue-600"
                                    title="Capture Photo"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => onWindowEdit(window.id)}
                                    className="p-1 text-gray-400 hover:text-blue-600"
                                    title="Edit Window"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => onWindowDuplicate(window.id)}
                                    className="p-1 text-gray-400 hover:text-green-600"
                                    title="Duplicate Window"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => onWindowDelete(window.id)}
                                    className="p-1 text-gray-400 hover:text-red-600"
                                    title="Delete Window"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          ))}
        </DragDropContext>
      </div>
    </div>
  );
}
