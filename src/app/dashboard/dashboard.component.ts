import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { Subscription } from 'rxjs';
import { FileStateService } from '../services/file-state.service';
import { ShareDatesService } from '../services/share-dates.service';
import { FileProcessingStudentsService } from '../services/file-processing-students.service';
import { FileProcessingCoursesService } from '../services/file-processing-courses.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FileProcessingFacultyService } from '../services/file-processing-faculty.service';
import { SchedulerService } from '../services/scheduler.service';
import { ResultService } from '../services/result.service';
import { FacultySchedulerService } from '../services/faculty-scheduler.service';
import { FirebaseService } from '../services/firebase.service';

export type ImportType = 'students' | 'courses' | 'faculty';

interface ConflictDetail {
  student: string;
  slot: number;
  conflictingCourses: string[];
}

interface StudentData {
  infoMap: [string, string[]][];  // Array of [studentId, info] tuples
  courses: {
    [studentId: string]: string[];
  };
}

interface ProcessedData {
  fileName: string;
  processed: boolean;
  timestamp: number;
  data: any;
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

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private stateSubscription: Subscription;
  isDragging = false;
  importTypes: ImportType[] = ['students', 'courses', 'faculty'];
  uploadedFiles: { [key in ImportType]?: File } = {};
  processedFiles: { [key in ImportType]?: string } = {};
  
  // Calendar related properties
  selectedDates: Date[] = [];
  minDate: Date = new Date();
  maxDate: Date = new Date(new Date().setMonth(new Date().getMonth() + 3));
  selected: Date | null = null;

  constructor(
    private router: Router,
    private fileStateService: FileStateService,
    private shareDates: ShareDatesService,
    private fileProcessingStudentsService: FileProcessingStudentsService,
    private fileProcessingCoursesService: FileProcessingCoursesService,
    private fileProcessingFacultyService: FileProcessingFacultyService, 
    private schedulerService: SchedulerService,
    private facultySchedulerService: FacultySchedulerService,
    private resultService: ResultService,
    private firebaseService: FirebaseService,
    private snackBar: MatSnackBar
  ) {
    this.stateSubscription = this.fileStateService.getStateChanges()
      .subscribe(state => {
        Object.entries(state).forEach(([type, fileState]) => {
          if (fileState?.processed) {
            this.processedFiles[type as ImportType] = fileState.fileName;
          } else {
            delete this.processedFiles[type as ImportType];
          }
        });
      });
  }

  ngOnInit() {
    // Load any saved state
  }

  ngOnDestroy() {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  async onSubmit(type: ImportType) {
    if (!this.uploadedFiles[type]) {
      this.snackBar.open('No file selected', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    try {
      switch (type) {
        case 'students':
          await this.fileProcessingStudentsService.processStudentFile(this.uploadedFiles[type]!);
          const studentData = {
            infoMap: Array.from(this.fileProcessingStudentsService.studentInfoMap.entries()),
            courses: this.fileProcessingStudentsService.studentCourses
          };
          this.fileStateService.updateProcessedData(type, this.uploadedFiles[type]!.name, studentData);
          
          const summaryst = this.fileProcessingStudentsService.getDataSummary();
          this.snackBar.open(
            `Successfully processed ${summaryst.totalStudents} students with ${summaryst.totalCourses} unique courses`,
            'Close',
            { duration: 5000, panelClass: ['success-snackbar'] }
          );
          break;

        case 'courses':
          await this.fileProcessingCoursesService.processCoursesFile(this.uploadedFiles[type]!);
          const courseData = Array.from(this.fileProcessingCoursesService.courseList);
          this.fileStateService.updateProcessedData(type, this.uploadedFiles[type]!.name, courseData);
          
          const summarycs = this.fileProcessingCoursesService.getDataSummary();
          this.snackBar.open(
            `Successfully processed ${summarycs.totalCourses} unique courses`,
            'Close',
            { duration: 5000, panelClass: ['success-snackbar'] }
          );
          break;

          case 'faculty':
            await this.fileProcessingFacultyService.processFacultyFile(this.uploadedFiles[type]!);
            const facultyData = this.fileProcessingFacultyService.getAllFacultyData();
            this.fileStateService.updateProcessedData(type, this.uploadedFiles[type]!.name, facultyData.facultyAvailability);
            
            const summaryFaculty = this.fileProcessingFacultyService.getDataSummary();
            this.snackBar.open(
              `Successfully processed ${summaryFaculty.totalFaculty}`,
              'Close',
              { duration: 5000, panelClass: ['success-snackbar'] }
            );
            break;

          default:
            throw new Error('Invalid file type');
          }
      
          // Update processed files tracking
          this.processedFiles[type] = this.uploadedFiles[type]!.name;
      
    } catch (error) {
      console.error(`Error processing ${type} file:`, error);
      this.snackBar.open(
        `Error processing ${type} file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Close',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
    }
  }

  onFileSelected(event: any, type: ImportType) {
    const file = event.target.files[0];
    if (file) {
      this.validateAndSetFile(file, type);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent, type: ImportType) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.validateAndSetFile(files[0], type);
    }
  }

  validateAndSetFile(file: File, type: ImportType) {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      this.snackBar.open('Please select a valid file format (.xlsx, .xls, or .csv)', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (!this.validateFileSize(file)) {
      return;
    }

    if (this.processedFiles[type]) {
      if (confirm(`A file is already processed for ${type}. Do you want to replace it?`)) {
        this.uploadedFiles[type] = file;
      }
    } else {
      this.uploadedFiles[type] = file;
    }
  }

  removeFile(type: ImportType) {
    delete this.uploadedFiles[type];
    this.fileStateService.removeProcessedData(type);
  }

  private validateFileSize(file: File): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.snackBar.open(`File size must not exceed ${this.getReadableFileSize(maxSize)}`, 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return false;
    }
    return true;
  }

  getReadableFileSize(size: number): string {
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Calendar methods
  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const day = date.getDay();
    return day !== 0; // Exclude Sundays
  };

  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    if (view === 'month') {
      return this.selectedDates.some(date => 
        date.toDateString() === cellDate.toDateString()
      ) ? 'selected-date' : '';
    }
    return '';
  };

  onDateSelection(date: Date | null) {
    if (!date) return;
    
    const index = this.selectedDates.findIndex(
      d => d.toDateString() === date.toDateString()
    );

    if (index === -1) {
      this.selectedDates.push(date);
    } else {
      this.selectedDates.splice(index, 1);
    }
    
    this.selectedDates.sort((a, b) => a.getTime() - b.getTime());
    this.selected = date;
  }

  removeDate(date: Date) {
    const index = this.selectedDates.findIndex(
      d => d.toDateString() === date.toDateString()
    );
    if (index !== -1) {
      this.selectedDates.splice(index, 1);
    }
  }

  getFormattedDateRange(): string {
    if (this.selectedDates.length === 0) return 'No dates selected';
    
    const start = this.selectedDates[0];
    const end = this.selectedDates[this.selectedDates.length - 1];
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }

  generateSchedule() {
    if (!this.allFilesUploaded) {
      this.snackBar.open('Please upload all required files before generating the schedule', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (this.selectedDates.length === 0) {
      this.snackBar.open('Please select at least one exam date', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    try {
      // Get processed data using the correct methods
      const studentsProcessedData = this.fileStateService.getProcessedData('students');
      const coursesProcessedData = this.fileStateService.getProcessedData('courses');
      const facultyProcessedData = this.fileStateService.getProcessedData('faculty');
    
      if (!studentsProcessedData || !coursesProcessedData || !facultyProcessedData) {
        throw new Error('Required data not found');
      }
    
      // Type assertion for student data
      const studentData = studentsProcessedData.data as StudentData; 
      
      // Create student courses mapping
      const studentCourses: { [student: string]: string[] } = {};
      studentData.infoMap.forEach(([studentId, _]: [string, string[]]) => {
        studentCourses[studentId] = studentData.courses[studentId] || [];
      });
    
      // Get course list from processed course data
      const courseList = coursesProcessedData.data as string[];
    
      // Calculate slots based on selected dates
      const slotsPerDay = 2; // Assuming 2 slots per day
      const days = this.selectedDates.length;
    
      // Generate exam schedule
      const examSchedule = this.schedulerService.scheduleExams(
        studentCourses,
        courseList,
        days,
        slotsPerDay
      );
    
      // Generate faculty schedule
      const facultySchedule = this.facultySchedulerService.scheduleFaculties(
        examSchedule.timetable,
        facultyProcessedData.data,
        this.selectedDates
      );
    
      // Combine both schedules into complete schedule
      const completeSchedule = {
        examSchedule: {
          timetable: examSchedule.timetable,
          conflicts: examSchedule.conflicts,
          conflictDetails: examSchedule.conflictDetails
        },
        facultySchedule: facultySchedule
      };
    
      // Store the complete result
      this.resultService.setScheduleResult(completeSchedule);
      
      // Set selected dates and navigate
      this.shareDates.setSelectedDates(this.selectedDates);
      this.router.navigate(['/display-result']);
    
    } catch (error) {
      console.error('Error generating schedule:', error);
      this.snackBar.open(
        `Error generating schedule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    }
  }

  get allFilesUploaded(): boolean {
    return this.importTypes.every(type => this.fileStateService.isFileProcessed(type));
  }

  async onLogout() {
    try {
      // Firebase sign out
      await this.firebaseService.signOut();
      
      // Clear application data
      this.fileStateService.clearAllData();
      
      // Clear any stored tokens or session data
      localStorage.clear();
      sessionStorage.clear();
      
      // Navigate to home/login page
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}