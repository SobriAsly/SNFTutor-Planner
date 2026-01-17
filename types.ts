
export interface Student {
  id: string;
  name: string;
  color: string;
}

export interface ClassSession {
  id: string;
  studentId?: string; // Optional for general events
  title?: string;     // For general events like "School Break"
  color?: string;     // Custom color for general events
  type: 'SESSION' | 'EVENT';
  date: string;       // Start Date (ISO format: YYYY-MM-DD)
  endDate?: string;   // Optional End Date for events (ISO format: YYYY-MM-DD)
  startTime?: string; // HH:mm (Optional)
  duration?: string;  // Format: HH:MM (Optional)
  notes?: string;
}

export type ViewType = 'MASTER' | string; // 'MASTER' or Student.id
