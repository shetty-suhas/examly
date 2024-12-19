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
        if (!this.isValidFacultyData(data)) {
          throw new Error('Invalid faculty data format');
        }
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

  isValidFacultyData(data: any): boolean {
    // Check if data exists and is an object
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      console.error('Invalid data structure: Expected an object');
      return false;
    }
  
    // Validate each faculty entry
    return Object.entries(data).every(([facultyName, availability]) => {
      // Check if facultyName is a string and not empty
      if (typeof facultyName !== 'string' || !facultyName.trim()) {
        console.error('Invalid faculty name:', facultyName);
        return false;
      }
  
      // Check if availability is an array
      if (!Array.isArray(availability)) {
        console.error('Invalid availability format for faculty:', facultyName);
        return false;
      }
  
      // Validate each time slot array
      return availability.every((timeSlots, index) => {
        // Check if timeSlots is an array
        if (!Array.isArray(timeSlots)) {
          console.error(`Invalid time slot format at index ${index} for faculty:`, facultyName);
          return false;
        }
  
        // Check if each time slot array has exactly 2 elements
        if (timeSlots.length !== 2) {
          console.error(`Invalid time slot length at index ${index} for faculty:`, facultyName);
          return false;
        }
  
        const [start, end] = timeSlots;
  
        // Check if times are valid numbers
        if (typeof start !== 'number' || typeof end !== 'number') {
          console.error(`Invalid time format at index ${index} for faculty:`, facultyName);
          return false;
        }
  
        // Check if times are within valid range (9:00 - 17:00)
        if (start < 9 || start > 17 || end < 9 || end > 17) {
          console.error(`Time out of range at index ${index} for faculty:`, facultyName);
          return false;
        }
  
        // Check if end time is after start time
        if (end <= start) {
          console.error(`Invalid time range at index ${index} for faculty:`, facultyName);
          return false;
        }
  
        return true;
      });
    });
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
          return this.isValidFacultyData(fileState.data);
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