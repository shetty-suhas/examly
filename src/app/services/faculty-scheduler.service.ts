import { Injectable } from '@angular/core';

interface FacultyAvailability {
  [faculty: string]: number[][];
}

interface ExamSlot {
  day: number;
  startTime: number;
  endTime: number;
  courses: string[];
}

interface FacultyAssignment {
  faculty: string;
  timeRange: [number, number];
}

interface ExamFacultySchedule {
  [key: string]: {
    courses: string[];
    facultyAssignments: {
      [timeSlot: string]: FacultyAssignment[];
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class FacultySchedulerService {
  private dailyFacultyAssignments: Map<string, Map<string, Set<string>>> = new Map();
  
  scheduleFaculties(
    examSchedule: { [key: string]: string[] },
    facultyAvailability: FacultyAvailability,
    selectedDates: Date[]
  ): ExamFacultySchedule {  
    const facultySchedule: ExamFacultySchedule = {};
    const assignedFaculties = new Map<string, Set<string>>();
    this.dailyFacultyAssignments.clear();

    // Initialize tracking for each day
    selectedDates.forEach((_, index) => {
      const dayStr = `Day ${index + 1}`;
      assignedFaculties.set(dayStr, new Set<string>());
      this.dailyFacultyAssignments.set(dayStr, new Map());
    });

    // Process each exam slot
    for (const [slotKey, courses] of Object.entries(examSchedule)) {
      const [dayStr, slotStr] = slotKey.split(', ');
      const isMorningSlot = slotStr.includes('Slot 1');
      
      const startTime = isMorningSlot ? 9 : 13;
      const endTime = isMorningSlot ? 12 : 16;

      const dayAssignments = assignedFaculties.get(dayStr) || new Set<string>();

      facultySchedule[slotKey] = {
        courses,
        facultyAssignments: this.assignFacultiesForSlot(
          dayStr,
          startTime,
          endTime,
          facultyAvailability,
          dayAssignments
        )
      };
    }

    return facultySchedule;
  }

  private assignFacultiesForSlot(
    dayStr: string,
    startTime: number,
    endTime: number,
    facultyAvailability: FacultyAvailability,
    assignedFacultiesForDay: Set<string>
  ): { [timeSlot: string]: FacultyAssignment[] } {
    const assignments: { [timeSlot: string]: FacultyAssignment[] } = {};
    const timeSlots = this.generateTimeSlots(startTime, endTime);
    
    // Get or create the daily time slot assignments map
    const dayTimeSlots = this.dailyFacultyAssignments.get(dayStr) || new Map<string, Set<string>>();

    for (const slot of timeSlots) {
      const [slotStart, slotEnd] = slot;
      const timeKey = `${slotStart}:00-${slotEnd}:00`;
      
      // Initialize time slot tracking if needed
      if (!dayTimeSlots.has(timeKey)) {
        dayTimeSlots.set(timeKey, new Set<string>());
      }

      const availableFaculties = Object.entries(facultyAvailability)
        .filter(([faculty, availability]) => {
          const isAvailableForTimeSlot = this.isFacultyAvailableForSlot(availability, slotStart, slotEnd);
          const hasNotReachedDailyLimit = !this.hasReachedDailyLimit(faculty, assignedFacultiesForDay);
          const notAssignedInThisTimeSlot = !dayTimeSlots.get(timeKey)?.has(faculty);
          
          return isAvailableForTimeSlot && hasNotReachedDailyLimit && notAssignedInThisTimeSlot;
        })
        .map(([faculty]) => faculty);

      // Assign only one faculty to this slot
      if (availableFaculties.length > 0) {
        const selectedFaculty = availableFaculties[0];
        
        assignments[timeKey] = [{
          faculty: selectedFaculty,
          timeRange: [slotStart, slotEnd]
        }];

        // Update tracking
        dayTimeSlots.get(timeKey)?.add(selectedFaculty);
        assignedFacultiesForDay.add(selectedFaculty);
      } else {
        assignments[timeKey] = [];
      }
    }

    // Update the daily assignments tracking
    this.dailyFacultyAssignments.set(dayStr, dayTimeSlots);
    
    return assignments;
  }

  private generateTimeSlots(startTime: number, endTime: number): [number, number][] {
    const slots: [number, number][] = [];
    for (let time = startTime; time < endTime; time++) {
      slots.push([time, time + 1]);
    }
    return slots;
  }

  private isFacultyAvailableForSlot(
    availability: number[][],
    startTime: number,
    endTime: number
  ): boolean {
    return availability.some(([rangeStart, rangeEnd]) => 
      rangeStart <= startTime && rangeEnd >= endTime
    );
  }

  private hasReachedDailyLimit(
    faculty: string,
    assignedFacultiesForDay: Set<string>
  ): boolean {
    const MAX_HOURS_PER_DAY = 3;
    return assignedFacultiesForDay.has(faculty);
  }
}