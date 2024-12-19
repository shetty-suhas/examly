import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TimeSlot {
  day: number;
  slot: number;
  startTime: number;
  endTime: number;
}

export interface ConflictDetail {
  student: string;
  slot: number;
  conflictingCourses: string[];
}

export interface ScheduleResult {
  timetable: {
    [timeSlot: string]: string[];
  };
  conflicts: number;
  conflictDetails: ConflictDetail[];
}

export interface ScheduleResult {
  timetable: {
    [timeSlot: string]: string[];
  };
  conflicts: number;
  conflictDetails: ConflictDetail[];
  facultyAssignments?: {
    [timeSlot: string]: {
      courses: string[];
      facultyAssignments: {
        [timeSlot: string]: Array<{
          faculty: string;
          timeRange: [number, number];
        }>;
      };
    };
  };
}

export interface ExamSchedule {
  timetable: {
    [timeSlot: string]: string[];
  };
  conflicts: number;
  conflictDetails: ConflictDetail[];
}

export interface FacultyAssignment {
  faculty: string;
  timeRange: [number, number];
}

export interface FacultySchedule {
  [timeSlot: string]: {
    courses: string[];
    facultyAssignments: {
      [timeSlot: string]: FacultyAssignment[];
    };
  };
}

export interface CompleteSchedule {
  examSchedule: ExamSchedule;
  facultySchedule: FacultySchedule;
}

@Injectable({
  providedIn: 'root'
})
export class ResultService {
  private examScheduleSubject = new BehaviorSubject<ExamSchedule | null>(null);
  private facultyScheduleSubject = new BehaviorSubject<FacultySchedule | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  examSchedule$ = this.examScheduleSubject.asObservable();
  facultySchedule$ = this.facultyScheduleSubject.asObservable();
  isLoading$ = this.loadingSubject.asObservable();

  setScheduleResult(result: CompleteSchedule) {
    const formattedExamSchedule = {
      ...result.examSchedule,
      timetable: this.formatTimetable(result.examSchedule.timetable)
    };
    
    this.examScheduleSubject.next(formattedExamSchedule);
    this.facultyScheduleSubject.next(result.facultySchedule); 
    console.log(result.facultySchedule)
    this.setLoading(false);
  }

  getExamSchedule(): ExamSchedule | null {
    return this.examScheduleSubject.getValue();
  }

  getFacultySchedule(): FacultySchedule | null {
    return this.facultyScheduleSubject.getValue();
  }

  getCompleteSchedule(): CompleteSchedule | null {
    const examSchedule = this.getExamSchedule();
    const facultySchedule = this.getFacultySchedule();

    if (!examSchedule || !facultySchedule) return null;

    return {
      examSchedule,
      facultySchedule
    };
  }

  setLoading(loading: boolean) {
    this.loadingSubject.next(loading);
  }

  clearResult() {
    this.examScheduleSubject.next(null);
    this.facultyScheduleSubject.next(null);
    this.setLoading(false);
  }

  private formatTimetable(timetable: { [key: string]: string[] }): { [key: string]: string[] } {
    const formattedTimetable: { [key: string]: string[] } = {};
    
    Object.entries(timetable).forEach(([timeSlot, courses]) => {
      const match = timeSlot.match(/Day (\d+), Slot (\d+)/);
      if (match) {
        const [_, day, slot] = match;
        const timeRange = slot === '1' ? '9:00-12:00' : '13:00-16:00';
        const formattedKey = `Day ${day}, Slot ${slot} (${timeRange})`;
        formattedTimetable[formattedKey] = courses;
      } else {
        formattedTimetable[timeSlot] = courses;
      }
    });

    return formattedTimetable;
  }

  private formatTime(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  hasResult(): boolean {
    return this.examScheduleSubject.getValue() !== null && 
           this.facultyScheduleSubject.getValue() !== null;
  }

  isLoading(): boolean {
    return this.loadingSubject.getValue();
  }

  getTotalScheduledExams(): number {
    const examSchedule = this.getExamSchedule();
    if (!examSchedule) return 0;

    return Object.values(examSchedule.timetable)
      .reduce((total, courses) => total + courses.length, 0);
  }

  getTotalConflicts(): number {
    const examSchedule = this.getExamSchedule();
    return examSchedule?.conflicts || 0;
  }

  getCoursesForSlot(day: number, slot: number): string[] {
    const examSchedule = this.getExamSchedule();
    if (!examSchedule) return [];

    const key = `Day ${day}, Slot ${slot}`;
    return examSchedule.timetable[key] || [];
  }

  getFacultyForSlot(day: number, slot: number): FacultyAssignment[] {
    const facultySchedule = this.getFacultySchedule();
    if (!facultySchedule) return [];

    const key = `Day ${day}, Slot ${slot}`;
    return facultySchedule[key]?.facultyAssignments[key] || [];
  }

  hasConflictsInSlot(day: number, slot: number): boolean {
    const examSchedule = this.getExamSchedule();
    if (!examSchedule) return false;

    return examSchedule.conflictDetails.some(
      conflict => Math.floor(conflict.slot / 2) === day && conflict.slot % 2 === slot
    );
  }
}