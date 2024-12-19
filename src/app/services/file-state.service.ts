import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ImportType = 'students' | 'courses' | 'faculty';

interface StudentData {
  infoMap: [string, { name: string; email: string }][];
  courses: { [key: string]: string[] };
}

interface CourseData {
  courses: string[];
}

interface ConflictDetail {
  student: string;
  slot: number;
  conflictingCourses: string[];
}



interface ScheduleResult {
  timetable: Timetable;
  conflicts: number;
  conflictDetails: ConflictDetail[];
}

interface FacultyData {
  // Define faculty data structure when implemented
}

interface TimeSlot {
  day: number;
  slot: number;
  startTime: number;
  endTime: number;
  }

  interface CourseSlots {
    [course: string]: number;
  }

interface Timetable {
  [timeSlot: string]: string[];
}

export interface ProcessedFileState {
  fileName: string;
  processed: boolean;
  timestamp: number;
  data: StudentData | CourseData | FacultyData;
}

interface ScheduleResult {
  timetable: Timetable;
  conflicts: number;
  conflictDetails: ConflictDetail[];
}



@Injectable({
  providedIn: 'root'
})
export class FileStateService {
  private processedState: {
    [key in ImportType]?: {
      fileName: string;
      processed: boolean;
      timestamp: number;
      data: any;
    };
  } = {};
  private stateSubject = new BehaviorSubject<{ [key in ImportType]?: ProcessedFileState }>({});
  private scheduleResult: ScheduleResult | null = null;

  constructor() {
    this.loadState();
  }

  getProcessedData(type: ImportType) {
    return this.processedState[type];
  }

  updateProcessedData(type: ImportType, fileName: string, data: any) {
    // Validate data based on type
    switch (type) {
      case 'students':
        if (!this.isValidStudentData(data)) {
          throw new Error('Invalid student data format');
        }
        break;
      case 'courses':
        if (!this.isValidCourseData(data)) {
          throw new Error('Invalid course data format');
        }
        break;
      case 'faculty':
        // Add faculty data validation when implemented
        break;
    }

    this.processedState[type] = {
      fileName,
      processed: true,
      timestamp: Date.now(),
      data
    };

    this.saveState();
    this.stateSubject.next({ ...this.processedState });
  }

  isFileProcessed(type: ImportType): boolean {
    return !!this.processedState[type]?.processed;
  }

  getFileName(type: ImportType): string | undefined {
    return this.processedState[type]?.fileName;
  }

  removeProcessedData(type: ImportType) {
    delete this.processedState[type];
    this.saveState();
    this.stateSubject.next({ ...this.processedState });
  }

  clearAllData() {
    this.processedState = {};
    localStorage.removeItem('processedFileState');
    this.stateSubject.next({});
  }

  getStateChanges() {
    return this.stateSubject.asObservable();
  }

  // Data validation methods
  private isValidStudentData(data: any): data is StudentData {
    if (!data || typeof data !== 'object') return false;
    
    // Check if data has required properties
    if (!('infoMap' in data) || !('courses' in data)) return false;
    
    // Validate infoMap structure
    if (!Array.isArray(data.infoMap)) return false;
    
    // Validate courses structure
    if (typeof data.courses !== 'object') return false;
    
    return true;
  }

  private isValidCourseData(data: any): data is string[] {
    if (!Array.isArray(data)) return false;
    return data.every(item => typeof item === 'string');
  }

  // Storage methods
  private saveState() {
    try {
      localStorage.setItem('processedFileState', JSON.stringify(this.processedState));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
      // Handle storage errors (e.g., quota exceeded)
      this.handleStorageError();
    }
  }

  private loadState() {
    try {
      const savedState = localStorage.getItem('processedFileState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Validate the loaded state
        if (this.isValidState(parsedState)) {
          this.processedState = parsedState;
          this.stateSubject.next({ ...this.processedState });
        } else {
          // If state is invalid, clear it
          this.clearAllData();
        }
      }
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
      this.clearAllData();
    }
  }

  private isValidState(state: any): boolean {
    if (!state || typeof state !== 'object') return false;

    // Check if all properties are valid file states
    return Object.entries(state).every(([type, fileState]) => {
      if (!fileState || typeof fileState !== 'object') return false;
      
      // Check required properties
      if (!('fileName' in fileState) || 
          !('processed' in fileState) || 
          !('timestamp' in fileState) || 
          !('data' in fileState)) {
        return false;
      }

      // Validate based on type
      switch (type) {
        case 'students':
          return this.isValidStudentData(fileState.data);
        case 'courses':
          return this.isValidCourseData(fileState.data);
        case 'faculty':
          // Add faculty validation when implemented
          return true;
        default:
          return false;
      }
    });
  }

  private handleStorageError() {
    // Try to clear some space by removing old data
    try {
      const oldItems = Object.entries(this.processedState)
      .sort(([, stateA], [, stateB]) => {
        // Ensure we have valid state objects
        if (!stateA || !stateB) return 0;
        return stateA.timestamp - stateB.timestamp;
      });
    
    if (oldItems.length > 0) {
      // Remove oldest item
      const [oldestType] = oldItems[0];
      delete this.processedState[oldestType as ImportType];
      
      // Try saving again
      this.saveState();
    }
  } catch (error) {
    console.error('Failed to handle storage error:', error);
    // If all else fails, clear everything
    this.clearAllData();
  }
  }

  // Utility method to get state summary
  getStateSummary(): { [key in ImportType]?: { fileName: string; timestamp: Date } } {
    const summary: { [key in ImportType]?: { fileName: string; timestamp: Date } } = {};
    
    Object.entries(this.processedState).forEach(([type, state]) => {
      if (state) {
        summary[type as ImportType] = {
          fileName: state.fileName,
          timestamp: new Date(state.timestamp)
        };
      }
    });

    return summary;
  }

  updateScheduleResult(result: ScheduleResult) {
    this.scheduleResult = result;
  }

  getScheduleResult(): ScheduleResult | null {
    return this.scheduleResult;
  }
}