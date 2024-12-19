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
  [key: string]: {  // key format: "Day X, Slot Y"
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
  
  scheduleFaculties(
    examSchedule: { [key: string]: string[] },
    facultyAvailability: FacultyAvailability,
    selectedDates: Date[]
  ): ExamFacultySchedule {  
    const facultySchedule: ExamFacultySchedule = {};
    const assignedFaculties = new Map<string, Set<string>>(); // Track faculty assignments per day

    // Initialize tracking for each day
    selectedDates.forEach((_, index) => {
      assignedFaculties.set(`Day ${index + 1}`, new Set<string>());
    });

    // Process each exam slot
    for (const [slotKey, courses] of Object.entries(examSchedule)) {
      const [dayStr, slotStr] = slotKey.split(', ');
      const dayNumber = parseInt(dayStr.replace('Day ', ''));
      const isMorningSlot = slotStr.includes('Slot 1');
      
      // Determine slot timing
      const startTime = isMorningSlot ? 9 : 13;
      const endTime = isMorningSlot ? 12 : 16;

      // Get assigned faculties for this day
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
    const assignedFacultiesThisSlot = new Set<string>();

    // Process each hour-long slot
    for (const slot of timeSlots) {
      const [slotStart, slotEnd] = slot;
      const timeKey = `${slotStart}:00-${slotEnd}:00`;
      
      // Find available faculties for this time slot
      const availableFaculties = Object.entries(facultyAvailability)
        .filter(([faculty, availability]) => {
          // Check if faculty is available and not over-assigned
          return !assignedFacultiesThisSlot.has(faculty) &&
                 this.isFacultyAvailableForSlot(availability, slotStart, slotEnd) &&
                 !this.hasReachedDailyLimit(faculty, assignedFacultiesForDay);
        })
        .map(([faculty]) => faculty);

      // Assign faculties to this slot
      const slotAssignments: FacultyAssignment[] = [];
      for (const faculty of availableFaculties) {
        slotAssignments.push({
          faculty,
          timeRange: [slotStart, slotEnd]
        });
        
        assignedFacultiesThisSlot.add(faculty);
        assignedFacultiesForDay.add(faculty);
        
        // Break if we have assigned enough faculties for this slot
        if (slotAssignments.length >= 2) break; // Assuming we need 2 faculties per slot
      }

      assignments[timeKey] = slotAssignments;
    }

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
    let assignmentCount = 0;
    
    if (assignedFacultiesForDay.has(faculty)) {
      assignmentCount++;
    }

    return assignmentCount >= MAX_HOURS_PER_DAY;
  }
}