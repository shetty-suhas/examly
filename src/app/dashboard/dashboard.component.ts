import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';

export type ImportType = 'students' | 'courses' | 'rooms' | 'faculty';

export interface FileStatus {
  students: File | null;
  courses: File | null;
  rooms: File | null;
  faculty: File | null;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  isDragging = false;
  importTypes: ImportType[] = ['students', 'courses', 'rooms', 'faculty'];
  

  uploadedFiles: FileStatus = {
    students: null,
    courses: null,
    rooms: null,
    faculty: null
  };

  // Calendar related properties
  selectedDates: Date[] = [];
  minDate: Date = new Date();
  maxDate: Date = new Date(new Date().setMonth(new Date().getMonth() + 3));
  selected: Date | null = null;

  constructor(private router: Router) {}

  get allFilesUploaded(): boolean {
    return Object.values(this.uploadedFiles).every(file => file !== null);
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const day = date.getDay();
    return day !== 0;
  };

  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    if (view === 'month') {
      const isSelected = this.selectedDates.some(
        date => date.toDateString() === cellDate.toDateString()
      );
      return isSelected ? 'selected-date' : '';
    }
    return '';
  };

  onDateSelection(date: Date | null) {
    if (!date) return; // Early return if date is null
    
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
      alert('Please select a valid file format (.xlsx, .xls, or .csv)');
      return;
    }

    if (!this.validateFileSize(file)) {
      return;
    }

    this.uploadedFiles[type] = file;
  }

  onSubmit(type: ImportType) {
    const file = this.uploadedFiles[type];
    if (!file) {
      alert(`Please select a ${type} file first`);
      return;
    }

    // Add your file upload logic here
    console.log(`Uploading ${type} file:`, file);
  }

  onLogout() {
    this.router.navigate(['/']);
  }

  generateSchedule() {
    if (!this.allFilesUploaded) {
      alert('Please upload all required files before generating the schedule');
      return;
    }

    if (this.selectedDates.length === 0) {
      alert('Please select at least one exam date');
      return;
    }

    console.log('Selected Dates:', this.selectedDates.map(d => d.toLocaleDateString()));
    // Add your schedule generation logic here
  }

  removeFile(type: ImportType) {
    this.uploadedFiles[type] = null;
  }

  private validateFileSize(file: File): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert(`File size must not exceed ${this.getReadableFileSize(maxSize)}`);
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
}