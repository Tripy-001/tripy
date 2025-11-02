'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TodoDay } from '@/lib/schemas/todo';
import { CheckSquare, ChevronDown, ChevronUp, Minimize2 } from 'lucide-react';

interface TodoWidgetProps {
  todoDays: TodoDay[];
  onToggleTodo: (todoId: string, isCompleted: boolean) => Promise<void>;
  onScrollToChecklist: () => void;
}

export default function TodoWidget({ todoDays, onToggleTodo, onScrollToChecklist }: TodoWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Calculate overall progress
  const totalTodos = todoDays.reduce((sum, day) => sum + day.totalCount, 0);
  const completedTodos = todoDays.reduce((sum, day) => sum + day.completedCount, 0);
  const progressPercent = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  // Get next 3 incomplete todos
  const incompleteTodos = todoDays
    .flatMap(day => 
      day.todos
        .filter(todo => !todo.isCompleted)
        .map(todo => ({ ...todo, dayNumber: day.dayNumber }))
    )
    .slice(0, 3);

  if (totalTodos === 0) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-24 right-6 z-40">
        <Button
          onClick={() => setIsMinimized(false)}
          className="h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:scale-105 transition-transform"
        >
          <CheckSquare className="w-7 h-7 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-40 w-[400px]">
      <Card className="border-2 shadow-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <CardTitle className="text-base">Trip Checklist</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="h-8 w-8 p-0"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {completedTodos} of {totalTodos} tasks
              </span>
              <Badge 
                variant="outline" 
                className={progressPercent === 100 ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800' : ''}
              >
                {progressPercent}%
              </Badge>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            {incompleteTodos.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Next tasks:</p>
                {incompleteTodos.map((todo) => (
                  <div 
                    key={todo.id}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={todo.isCompleted}
                      onCheckedChange={(checked) => onToggleTodo(todo.id, checked as boolean)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {todo.activityName}
                      </p>
                      <p className="text-xs text-muted-foreground">Day {todo.dayNumber}</p>
                    </div>
                  </div>
                ))}
                
                <Button
                  onClick={onScrollToChecklist}
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                >
                  View Full Checklist
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  🎉 All tasks completed!
                </p>
                <Button
                  onClick={onScrollToChecklist}
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                >
                  View Checklist
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
