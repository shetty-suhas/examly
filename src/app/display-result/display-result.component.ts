import { OnInit, Component } from "@angular/core";
import { ResultService } from "../services/result.service";
import { ShareDatesService } from "../services/share-dates.service";

interface Conflict {
  student: string;
  slot: number;
  conflictingCourses: string[];
  severity: 'high' | 'medium' | 'low';
  type: 'time' | 'room' | 'other';
  description: string;
  details: string;
}

interface FacultyAssignment {
  faculty: string;
  timeRange: [number, number];
}

interface TimetableSlot {
  courses: string[];
  facultyAssignments?: {
    [timeSlot: string]: FacultyAssignment[];
  };
}

interface TimetableData {
  [day: string]: {
    [timeSlot: string]: TimetableSlot;
  };
}

@Component({
  selector: 'app-display-result',
  templateUrl: './display-result.component.html',
  styleUrls: ['./display-result.component.css']
})
export class DisplayResultComponent implements OnInit {
  selectedDates: Date[] = [];
  examSchedule$ = this.resultService.examSchedule$;
  facultySchedule$ = this.resultService.facultySchedule$;
  isCalculating$ = this.resultService.isLoading$;
  
  activeTab: 'timetable' | 'conflicts' = 'timetable';
  days: string[] = [];
  conflicts: Conflict[] = [];
  timetableData: TimetableData = {};

  constructor(
    private shareDates: ShareDatesService, 
    private resultService: ResultService
  ) {
    this.shareDates.selectedDates$.subscribe(dates => {
      this.selectedDates = dates;
      this.updateDays();
    });
  }

  ngOnInit() {
    this.selectedDates = this.shareDates.getSelectedDates();
    this.updateDays();
    
    // Subscribe to both exam and faculty schedules
    this.examSchedule$.subscribe(examSchedule => {
      if (examSchedule) {
        this.updateExamSchedule(examSchedule);
      }
    });

    this.facultySchedule$.subscribe(facultySchedule => {
      if (facultySchedule) {
        this.updateFacultySchedule(facultySchedule);
      }
    }); 
    console.log(this.facultySchedule$)
  }

  private updateDays() {
    this.days = this.selectedDates.map(date => 
      date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    );
  }

  private updateExamSchedule(examSchedule: any) {
    // Initialize timetable structure
    this.days.forEach(day => {
      this.timetableData[day] = {
        'Morning (9:00 AM - 12:00 PM)': { courses: [] },
        'Afternoon (1:00 PM - 4:00 PM)': { courses: [] }
      };
    });

    // Process exam schedule
    if (examSchedule?.timetable) {
      Object.entries(examSchedule.timetable).forEach(([timeSlot, courses]: [string, any]) => {
        const [dayPart, slotPart] = timeSlot.split(', ');
        const dayIndex = parseInt(dayPart.replace('Day ', '')) - 1;
        const day = this.days[dayIndex];
        
        if (day) {
          const timeKey = slotPart.includes('Slot 1') 
            ? 'Morning (9:00 AM - 12:00 PM)'
            : 'Afternoon (1:00 PM - 4:00 PM)';
          
          this.timetableData[day][timeKey].courses = courses;
        }
      });
    }

    // Process conflicts
    if (examSchedule?.conflictDetails) {
      this.conflicts = examSchedule.conflictDetails.map((conflict: any) => ({
        ...conflict,
        severity: 'high',
        type: 'time',
        description: `Scheduling conflict for ${conflict.student}`,
        details: `Courses: ${conflict.conflictingCourses.join(', ')}`
      }));
    }
  }

  private updateFacultySchedule(facultySchedule: any) {
    this.days.forEach((day, index) => {
      const daySchedule = facultySchedule[day];
      if (daySchedule) {
        // Update morning assignments
        if (daySchedule.facultyAssignments?.morning) {
          this.timetableData[day]['Morning (9:00 AM - 12:00 PM)'].facultyAssignments = {
            ...daySchedule.facultyAssignments.morning
          };
        }

        // Update afternoon assignments
        if (daySchedule.facultyAssignments?.afternoon) {
          this.timetableData[day]['Afternoon (1:00 PM - 4:00 PM)'].facultyAssignments = {
            ...daySchedule.facultyAssignments.afternoon
          };
        }
      }
    });
  }

  formatTimeRange(timeRange: [number, number]): string {
    return `${this.formatHour(timeRange[0])} - ${this.formatHour(timeRange[1])}`;
  }


  getTabClass(tab: string): string {
    const baseClasses = 'border-b-2 transition-colors duration-200';
    return tab === this.activeTab
      ? `${baseClasses} border-purple-500 text-purple-600`
      : `${baseClasses} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
  }

  getSeverityClass(severity: string): string {
    const baseClasses = 'bg-opacity-10 backdrop-blur-sm';
    switch (severity) {
      case 'high':
        return `${baseClasses} bg-red-50 border-red-200 text-red-800`;
      case 'medium':
        return `${baseClasses} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case 'low':
        return `${baseClasses} bg-blue-50 border-blue-200 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-200 text-gray-800`;
    }
  }

  getConflictIcon(type: string): string {
    switch (type) {
      case 'time':
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'room':
        return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
      default:
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
    }
  }

  downloadTimetable() {
    // Implement your download logic here
    console.log('Downloading timetable...');
  }

  // Add these methods to your DisplayResultComponent class

getTotalScheduledExams(): number {
  let total = 0;
  Object.values(this.timetableData).forEach(daySchedule => {
    Object.values(daySchedule).forEach(slot => {
      total += slot.courses?.length || 0;
    });
  });
  return total;
}

getTotalConflicts(): number {
  return this.conflicts.length;
}

getExamDetails(day: string, timeSlot: string): string[] {
  return this.timetableData[day]?.[timeSlot]?.courses || [];
}

getFacultyAssignmentsForTimeSlot(day: string, timeSlot: string, hourSlot: string): FacultyAssignment[] {
  const assignments = this.timetableData[day]?.[timeSlot]?.facultyAssignments?.[hourSlot];
  return assignments || [];
}

getFacultyAssignmentsForSlot(day: string, timeSlot: string): FacultyAssignment[] {
  const allAssignments: FacultyAssignment[] = [];
  const assignments = this.timetableData[day]?.[timeSlot]?.facultyAssignments;
  
  if (assignments) {
    Object.values(assignments).forEach(slotAssignments => {
      allAssignments.push(...slotAssignments);
    });
  }
  
  return allAssignments;
}

formatTimeSlot(slot: string): string {
  const [start, end] = slot.split('-');
  return `${this.formatHour(parseInt(start))} - ${this.formatHour(parseInt(end))}`;
}

private formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

getSlotTimes(isAfternoon: boolean): string[] {
  return isAfternoon 
    ? ['13:00-14:00', '14:00-15:00', '15:00-16:00']
    : ['9:00-10:00', '10:00-11:00', '11:00-12:00'];
}

hasFacultyAssignments(day: string, timeSlot: string): boolean {
  return Object.keys(this.timetableData[day]?.[timeSlot]?.facultyAssignments || {}).length > 0;
}

getSessionLabel(isAfternoon: boolean): string {
  return isAfternoon 
    ? 'Afternoon Session (1:00 PM - 4:00 PM)'
    : 'Morning Session (9:00 AM - 12:00 PM)';
}
}