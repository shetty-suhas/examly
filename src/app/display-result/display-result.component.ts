import { Component, OnInit } from '@angular/core';

interface Conflict {
  type: 'student' | 'faculty' | 'room';
  description: string;
  details: string;
  severity: 'high' | 'medium' | 'low';
} 

interface TimeSlot {
  time: string;
  [key: string]: string;
}

interface ExamSlot {
  day: string;
  slots: { [time: string]: string };
}

@Component({
  selector: 'app-display-result',
  templateUrl: './display-result.component.html',
  styleUrls: ['./display-result.component.css']
})
export class DisplayResultComponent implements OnInit {
  examSlots: ExamSlot[] = [];
  conflicts: Conflict[] = [];
  activeTab: 'timetable' | 'conflicts' = 'timetable';
  timeSlots: string[] = ['9:00 AM', '10:30 AM', '2:00 PM', '3:30 PM'];
  days: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  constructor() {}

  ngOnInit() {
    this.examSlots = this.days.map(day => ({
      day,
      slots: {
        '9:00 AM': 'Mathematics\nRoom: 201\nProf. Smith',
        '10:30 AM': 'Physics\nRoom: 301\nProf. Johnson',
        '2:00 PM': 'Chemistry\nRoom: 401\nProf. Davis',
        '3:30 PM': 'Biology\nRoom: 501\nProf. Wilson'
      }
    }));

    this.conflicts = [
      {
        type: 'student',
        description: 'Student time conflict',
        details: 'John Doe has two classes scheduled at 9:00 AM on Monday',
        severity: 'high'
      },
      {
        type: 'faculty',
        description: 'Faculty overlap',
        details: 'Prof. Smith is scheduled for two classes at 10:00 AM on Wednesday',
        severity: 'medium'
      },
      {
        type: 'room',
        description: 'Room double booking',
        details: 'Room 201 is scheduled for two classes at 9:00 AM on Monday',
        severity: 'high'
      }
    ];
  }

  getSlotContent(slot: TimeSlot, day: string): string {
    return slot[day.toLowerCase()] || '';
  }

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return '';
    }
  }

  getConflictIcon(type: string): string {
    switch (type) {
      case 'student':
        return 'M12 4.354a4 4 0 110 5.292V12H5.69a4 4 0 110-5.292V4.5a.5.5 0 01.5-.5h6a.5.5 0 01.5.5v2.146z';
      case 'faculty':
        return 'M12 14l9-5-9-5-9 5 9 5z';
      case 'room':
        return 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6';
      default:
        return '';
    }
  }

  getExamDetails(day: string, time: string): string {
    const daySlot = this.examSlots.find(slot => slot.day === day);
    return daySlot?.slots[time] || '';
  }

  downloadTimetable() {
    // Implement download functionality
    console.log('Downloading timetable...');
  }

  printTimetable() {
    window.print();
  } 

  getTabClass(tabName: 'timetable' | 'conflicts'): string {
    const isActive = this.activeTab === tabName;
    return isActive 
      ? 'border-b-2 border-purple-600 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600' 
      : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700';
  }

  getCellClass(content: string): string {
    return content 
      ? 'p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-100' 
      : '';
  }
}