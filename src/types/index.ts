
export enum RepeatType {
  NONE = 'None',
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly'
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export enum Category {
  WORK = 'Work',
  PERSONAL = 'Personal',
  HEALTH = 'Health',
  SHOPPING = 'Shopping',
  FINANCE = 'Finance',
  EDUCATION = 'Education'
}

export enum PlanTier {
  FREE = 'Free',
  STANDARD = 'Standard',
  PRO = 'Pro'
}

export enum ReminderStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}

export type Theme = 'blue' | 'purple' | 'emerald' | 'rose';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: PlanTier;
  xp: number;
  level: number;
  theme: Theme;
  hasSeenOnboarding: boolean;
  geminiApiKey?: string;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDateTime: string;
  repeatType: RepeatType;
  priority: Priority;
  category: Category;
  isCompleted: boolean;
  status: ReminderStatus;
  createdAt: number;
  subtasks?: Subtask[];
}

export interface Note {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  zIndex: number;
  isMinimized?: boolean;
}

// --- WORKOUT TYPES ---

export interface ExerciseTemplate {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string;
  videoUrl?: string;
}

export interface Routine {
  id: string;
  name: string;
  exercises: ExerciseTemplate[];
}

export interface WorkoutSetResult {
  weight: number;
  reps: number;
  completed: boolean;
}

export interface WorkoutExerciseResult {
  exerciseName: string;
  sets: WorkoutSetResult[];
}

export interface WorkoutLog {
  id: string;
  routineName: string;
  date: string;
  durationSeconds: number;
  exercises: WorkoutExerciseResult[];
}

// --- NEWS TYPES ---
export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  thumbnail: string;
  author: string;
  source: string;
}

// --- AI TYPES (from Valhalla-Organizer) ---

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
}

export type ImageSize = '1K' | '2K' | '4K';

export interface GeneratedImage {
  url: string;
  prompt: string;
  size: ImageSize;
  timestamp: number;
}

export interface TTSState {
  text: string;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

export type ViewMode = 'dashboard' | 'reminders' | 'stickers' | 'calendar' | 'workouts' | 'settings' | 'admin' | 'oracle' | 'chat' | 'image' | 'tts' | 'nexus' | 'achievements';
