import { Component, OnInit, Input } from '@angular/core';
import { ShareDatesService } from '../services/share-dates.service';

interface Conflict {
  student: string;
  slot: number;
  conflictingCourses: string[];
  severity: 'high' | 'medium' | 'low';
  type: 'time' | 'room' | 'other';
  description: string;
  details: string;
}

@Component({
  selector: 'app-display-result',
  templateUrl: './display-result.component.html',
  styleUrls: ['./display-result.component.css']
})
export class DisplayResultComponent implements OnInit {
  selectedDates: Date[] = [];
  
  activeTab: 'timetable' | 'conflicts' = 'timetable';
  days: string[] = [];
  timeSlots: string[] = [];
  examSlots: any[] = [];
  conflicts: Conflict[] = [];
  timetableData: { [key: string]: { [key: string]: string } } = {};

  constructor(private shareDates: ShareDatesService) {
    this.shareDates.selectedDates$.subscribe(dates => {
      this.selectedDates = dates;
    });

    for (let hour = 9; hour <= 17; hour++) {
      this.timeSlots.push(this.formatHour(hour));
    }
  } 

  ngOnInit() {
    this.updateDays();
  }

  ngOnChanges() {
    this.updateDays();
  }

  private updateDays() {
    // Format the selected dates for display
    this.days = this.selectedDates.map(date => 
      date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    );
  }

  private formatHour(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  getTabClass(tab: string): string {
    const baseClasses = 'border-b-2 transition-colors duration-200';
    return tab === this.activeTab
      ? `${baseClasses} border-purple-500 text-purple-600`
      : `${baseClasses} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
  } 

  getTotalExams(): number {
    return Object.keys(this.timetableData).length;
  }

  getExamDetails(day: string, time: string): string | null {
    return this.timetableData[day]?.[time] || null;
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

  updateTimetableData(scheduleResult: any) {
    this.timetableData = {};
    this.conflicts = [];

    // Process schedule results
    if (scheduleResult?.timetable) {
      Object.entries(scheduleResult.timetable).forEach(([timeSlot, courses]: [string, any]) => {
        const [date, time] = timeSlot.split(', ');
        if (!this.timetableData[date]) {
          this.timetableData[date] = {};
        }
        this.timetableData[date][time] = courses.join('\n');
      });
    }

    // Process conflicts
    if (scheduleResult?.conflictDetails) {
      this.conflicts = scheduleResult.conflictDetails.map((conflict: any) => ({
        ...conflict,
        severity: 'high',
        type: 'time',
        description: `Scheduling conflict for ${conflict.student}`,
        details: `Courses: ${conflict.conflictingCourses.join(', ')}`
      }));
    }
  }
}