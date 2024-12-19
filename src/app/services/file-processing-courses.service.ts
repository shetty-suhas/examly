import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';

@Injectable({
  providedIn: 'root'
})
export class FileProcessingCoursesService {
  courseList: Set<string> = new Set();

  processCoursesFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (!fileExtension) {
        reject(new Error('Invalid file: No file extension found'));
        return;
      }

      if (fileExtension === 'csv') {
        this.processCSV(file, resolve, reject);
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        this.processExcel(file, resolve, reject);
      } else {
        reject(new Error('Invalid file format. Please upload a CSV or Excel file.'));
      }
    });
  }

  private processCSV(file: File, resolve: Function, reject: Function): void {
    Papa.parse(file, {
      complete: (results) => {
        try {
          this.processData(results.data);
          resolve();
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error('Error parsing CSV file: ' + error.message));
      },
      skipEmptyLines: true
    });
  }

  private processExcel(file: File, resolve: Function, reject: Function): void {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        this.processData(jsonData);
        resolve();
      } catch (error) {
        reject(new Error('Error processing Excel file: '));
      }
    };

    reader.onerror = (error) => {
      reject(new Error('Error reading file: ' + error));
    };

    reader.readAsArrayBuffer(file);
  }

  private processData(data: any[]): void {
    // Clear previous data
    this.courseList.clear();

    // Validate header row
    const headerRow = data[0];
    if (!this.validateHeaders(headerRow)) {
      throw new Error('Invalid file format: Missing required column (Course)');
    }

    // Process each row (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row && row[0]) {
        const course = row[0].toString().trim();

        // Skip empty courses
        if (!course) {
          console.warn(`Skipping empty course at row ${i + 1}`);
          continue;
        }

        // Add to course set (automatically handles duplicates)
        this.courseList.add(course);
      }
    }

    console.log('Processed Courses:', {
      totalCourses: this.courseList.size,
      courses: Array.from(this.courseList)
    });

    // Validate processed data
    if (this.courseList.size === 0) {
      throw new Error('No valid course data found in the file');
    }
  }

  private validateHeaders(headers: any[]): boolean {
    if (!headers || headers.length < 1) return false;
    
    const courseHeader = headers[0].toString().toLowerCase().trim();
    return courseHeader.includes('course');
  }

  // Get all courses as an array
  getCourses(): string[] {
    return Array.from(this.courseList);
  }

  // Check if a course exists
  hasCourse(course: string): boolean {
    return this.courseList.has(course);
  }

  // Get total number of courses
  getTotalCourses(): number {
    return this.courseList.size;
  }

  // Get data summary
  getDataSummary(): { totalCourses: number } {
    return {
      totalCourses: this.courseList.size
    };
  }

  // Validate if all courses in a list exist
  validateCourses(courses: string[]): { valid: boolean; invalidCourses: string[] } {
    const invalidCourses = courses.filter(course => !this.courseList.has(course));
    return {
      valid: invalidCourses.length === 0,
      invalidCourses
    };
  }

  // Clear all courses
  clearCourses(): void {
    this.courseList.clear();
  }
}