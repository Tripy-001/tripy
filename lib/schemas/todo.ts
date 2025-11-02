// Todo item schema for trip planning checklist
export interface TodoItem {
  id: string;
  tripId: string;
  dayNumber: number; // Which day of the trip (1, 2, 3, etc.)
  activityName: string;
  description?: string;
  isCompleted: boolean;
  isCustom: boolean; // true if user-added, false if auto-generated from itinerary
  activityId?: string; // Reference to the activity in daily_itineraries if not custom
  order: number; // For drag-and-drop reordering within a day
  createdAt: string;
  updatedAt: string;
}

export interface TodoDay {
  dayNumber: number;
  date?: string; // Actual date if available from itinerary
  todos: TodoItem[];
  completedCount: number;
  totalCount: number;
}

export interface CreateTodoInput {
  tripId: string;
  dayNumber: number;
  activityName: string;
  description?: string;
  isCustom: boolean;
  activityId?: string;
  order?: number;
}

export interface UpdateTodoInput {
  activityName?: string;
  description?: string;
  isCompleted?: boolean;
  order?: number;
}
