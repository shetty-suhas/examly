import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FileStatus } from '../models/file-status';

export type ImportType = 'students' | 'courses' | 'rooms' | 'faculty';

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

  constructor(private router: Router) {}

  get allFilesUploaded(): boolean {
    return Object.values(this.uploadedFiles).every(file => file !== null);
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
    console.log(`Selected ${type} file:`, {
      name: file.name,
      size: this.getReadableFileSize(file.size),
      type: file.type
    });
  }

  onSubmit(type: ImportType) {
    const currentFile = this.uploadedFiles[type];
    if (!currentFile) {
      alert(`Please select a ${type} file first`);
      return;
    }

    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('type', type);

    try {
      console.log(`Uploading ${type} file:`, {
        fileName: currentFile.name,
        fileSize: this.getReadableFileSize(currentFile.size),
        fileType: currentFile.type
      });

      // Add your API call here
      alert(`${type} file prepared for upload: ${currentFile.name}`);

    } catch (error) {
      console.error('Error during file upload:', error);
      alert('An error occurred during file upload. Please try again.');
    }
  }

  onLogout() {
    this.router.navigate(['/']);
  }

  generateSchedule() {
    if (!this.allFilesUploaded) {
      alert('Please upload all required files before generating the schedule');
      return;
    }

    const formData = new FormData();
    Object.entries(this.uploadedFiles).forEach(([type, file]) => {
      if (file) {
        formData.append(type, file);
      }
    });

    console.log('Generating schedule with files:', {
      students: this.uploadedFiles.students?.name,
      courses: this.uploadedFiles.courses?.name,
      rooms: this.uploadedFiles.rooms?.name,
      faculty: this.uploadedFiles.faculty?.name
    });

    // Add your schedule generation API call here
    alert('Schedule generation started with all files');
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