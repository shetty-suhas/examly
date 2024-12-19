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

@Injectable({
  providedIn: 'root'
})
export class ResultService {
  private scheduleResultSubject = new BehaviorSubject<ScheduleResult | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Public observables
  scheduleResult$ = this.scheduleResultSubject.asObservable();
  isLoading$ = this.loadingSubject.asObservable();

  constructor() {}

  setScheduleResult(result: ScheduleResult) {
    // Format the timetable data before storing
    const formattedResult: ScheduleResult = {
      ...result,
      timetable: this.formatTimetable(result.timetable)
    };
    
    this.scheduleResultSubject.next(formattedResult);
    this.setLoading(false);
  }

  getScheduleResult(): ScheduleResult | null {
    return this.scheduleResultSubject.getValue();
  }

  setLoading(loading: boolean) {
    this.loadingSubject.next(loading);
  }

  clearResult() {
    this.scheduleResultSubject.next(null);
    this.setLoading(false);
  }

  private formatTimetable(timetable: { [key: string]: string[] }): { [key: string]: string[] } {
    const formattedTimetable: { [key: string]: string[] } = {};
    
    Object.entries(timetable).forEach(([timeSlot, courses]) => {
      // Extract day and slot information
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

  // Helper method to get formatted time string
  private formatTime(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  // Method to check if a result exists
  hasResult(): boolean {
    return this.scheduleResultSubject.getValue() !== null;
  }

  // Method to get loading state
  isLoading(): boolean {
    return this.loadingSubject.getValue();
  }

  // Method to get total number of scheduled exams
  getTotalScheduledExams(): number {
    const result = this.getScheduleResult();
    if (!result) return 0;

    return Object.values(result.timetable)
      .reduce((total, courses) => total + courses.length, 0);
  }

  // Method to get total number of conflicts
  getTotalConflicts(): number {
    const result = this.getScheduleResult();
    return result?.conflicts || 0;
  }

  // Method to get courses for a specific day and slot
  getCoursesForSlot(day: number, slot: number): string[] {
    const result = this.getScheduleResult();
    if (!result) return [];

    const key = `Day ${day}, Slot ${slot}`;
    return result.timetable[key] || [];
  }

  // Method to check if a specific timeslot has conflicts
  hasConflictsInSlot(day: number, slot: number): boolean {
    const result = this.getScheduleResult();
    if (!result) return false;

    return result.conflictDetails.some(
      conflict => Math.floor(conflict.slot / 2) === day && conflict.slot % 2 === slot
    );
  }
}