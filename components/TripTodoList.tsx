'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  GripVertical,
  ListTodo,
  Calendar,
  Sparkles
} from 'lucide-react';
import { TodoItem, TodoDay } from '@/lib/schemas/todo';
import { cn } from '@/lib/utils';

interface TripTodoListProps {
  tripId: string;
  initialDays?: TodoDay[];
  onTodoToggle?: (todoId: string, isCompleted: boolean) => void;
  onTodoAdd?: (dayNumber: number, activityName: string, description?: string) => void;
  onTodoUpdate?: (todoId: string, activityName: string, description?: string) => void;
  onTodoDelete?: (todoId: string) => void;
}

export default function TripTodoList({ 
  initialDays = [],
  onTodoToggle,
  onTodoAdd,
  onTodoUpdate,
  onTodoDelete
}: TripTodoListProps) {
  const [todoDays, setTodoDays] = useState<TodoDay[]>(initialDays);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [newTodoDay, setNewTodoDay] = useState<number | null>(null);
  const [newTodoName, setNewTodoName] = useState('');
  const [newTodoDesc, setNewTodoDesc] = useState('');
  const [editTodoName, setEditTodoName] = useState('');
  const [editTodoDesc, setEditTodoDesc] = useState('');

  useEffect(() => {
    setTodoDays(initialDays);
  }, [initialDays]);

  const handleToggle = (todo: TodoItem) => {
    const newCompleted = !todo.isCompleted;
    
    // Optimistic update
    setTodoDays(prev => prev.map(day => ({
      ...day,
      todos: day.todos.map(t => t.id === todo.id ? { ...t, isCompleted: newCompleted } : t),
      completedCount: day.todos.filter(t => 
        t.id === todo.id ? newCompleted : t.isCompleted
      ).length
    })));

    onTodoToggle?.(todo.id, newCompleted);
  };

  const handleAddTodo = (dayNumber: number) => {
    if (!newTodoName.trim()) return;
    
    onTodoAdd?.(dayNumber, newTodoName, newTodoDesc);
    setNewTodoName('');
    setNewTodoDesc('');
    setNewTodoDay(null);
  };

  const handleUpdateTodo = () => {
    if (!editingTodo || !editTodoName.trim()) return;
    
    onTodoUpdate?.(editingTodo.id, editTodoName, editTodoDesc);
    setEditingTodo(null);
    setEditTodoName('');
    setEditTodoDesc('');
  };

  const handleDeleteTodo = (todoId: string) => {
    onTodoDelete?.(todoId);
  };

  const openEditDialog = (todo: TodoItem) => {
    setEditingTodo(todo);
    setEditTodoName(todo.activityName);
    setEditTodoDesc(todo.description || '');
  };

  const totalTodos = todoDays.reduce((acc, day) => acc + day.totalCount, 0);
  const totalCompleted = todoDays.reduce((acc, day) => acc + day.completedCount, 0);
  const completionPercentage = totalTodos > 0 ? Math.round((totalCompleted / totalTodos) * 100) : 0;

  return (
    <Card className="glass-card border-2 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 border-b px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900">
              <ListTodo className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="text-xl font-semibold">Trip Checklist</div>
              <div className="text-sm text-muted-foreground">
                {totalCompleted} of {totalTodos} tasks completed
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {completionPercentage}%
              </div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Todo Days Accordion */}
      <div className="p-6">
        {todoDays.length === 0 ? (
          <div className="text-center py-12">
            <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground mb-2">No tasks yet</p>
            <p className="text-sm text-muted-foreground">
              Tasks will be auto-generated from your itinerary
            </p>
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={todoDays.map((_, i) => `day-${i}`)} className="w-full space-y-3">
            {todoDays.map((day, dayIndex) => (
              <AccordionItem 
                key={`day-${day.dayNumber}`} 
                value={`day-${dayIndex}`}
                className="border-2 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden">
                  <div className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <div className="text-left">
                          <div className="font-semibold">Day {day.dayNumber}</div>
                          {day.date && (
                            <div className="text-xs text-muted-foreground">{day.date}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={day.completedCount === day.totalCount ? "default" : "outline"}
                          className={cn(
                            "font-medium",
                            day.completedCount === day.totalCount && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          )}
                        >
                          {day.completedCount}/{day.totalCount}
                        </Badge>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180">
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="p-4">
                  <div className="space-y-2">
                    {day.todos.map((todo) => (
                      <div
                        key={todo.id}
                        className={cn(
                          "group flex items-start gap-3 p-3 rounded-lg border-2 transition-all",
                          todo.isCompleted 
                            ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900" 
                            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800"
                        )}
                      >
                        <div className="cursor-grab text-gray-400 hover:text-gray-600 mt-1">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        
                        <div className="mt-1">
                          <Checkbox
                            checked={todo.isCompleted}
                            onCheckedChange={() => handleToggle(todo)}
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "font-medium",
                            todo.isCompleted && "line-through text-muted-foreground"
                          )}>
                            {todo.activityName}
                            {!todo.isCustom && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Auto
                              </Badge>
                            )}
                          </div>
                          {todo.description && (
                            <div className={cn(
                              "text-sm text-muted-foreground mt-1",
                              todo.isCompleted && "line-through"
                            )}>
                              {todo.description}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(todo)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Add new todo */}
                    {newTodoDay === day.dayNumber ? (
                      <div className="p-3 rounded-lg border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20">
                        <Input
                          placeholder="Task name..."
                          value={newTodoName}
                          onChange={(e) => setNewTodoName(e.target.value)}
                          className="mb-2"
                          autoFocus
                        />
                        <Textarea
                          placeholder="Description (optional)..."
                          value={newTodoDesc}
                          onChange={(e) => setNewTodoDesc(e.target.value)}
                          className="mb-2 min-h-[60px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddTodo(day.dayNumber)}
                            className="bg-gradient-to-r from-indigo-500 to-purple-500"
                          >
                            Add Task
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setNewTodoDay(null);
                              setNewTodoName('');
                              setNewTodoDesc('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNewTodoDay(day.dayNumber)}
                        className="w-full border-dashed border-2 hover:border-indigo-400 dark:hover:border-indigo-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Custom Task
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTodo} onOpenChange={(open) => !open && setEditingTodo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Task Name</label>
              <Input
                value={editTodoName}
                onChange={(e) => setEditTodoName(e.target.value)}
                placeholder="Task name..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={editTodoDesc}
                onChange={(e) => setEditTodoDesc(e.target.value)}
                placeholder="Description (optional)..."
                className="min-h-[100px]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingTodo(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTodo} className="bg-gradient-to-r from-indigo-500 to-purple-500">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
