import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse'; // Add this for CSV processing

interface StudentInfo {
  rollNo: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileProcessingStudentsService {
  studentNameMap: Map<string, string> = new Map();
  studentCourses: { [student: string]: string[] } = {};

  processStudentFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check file extension
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
    this.studentNameMap.clear();
    this.studentCourses = {};

    // Validate header row
    const headerRow = data[0];
    if (!this.validateHeaders(headerRow)) {
      throw new Error('Invalid file format: Missing required columns (Roll No, Name)');
    }

    // Process each row (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.length >= 2) {
        const rollNo = row[0].toString().trim();
        const name = row[1].toString().trim();

        // Validate roll number and name
        if (!rollNo || !name) {
          console.warn(`Skipping invalid row ${i + 1}: Missing roll number or name`);
          continue;
        }

        // Store in name map
        this.studentNameMap.set(rollNo, name);

        // Get courses (all columns after name)
        const courses = row.slice(2)
          .filter((course : any) => course && course.toString().trim()) // Remove empty values
          .map((course : any) => course.toString().trim());

        // Store in courses object
        this.studentCourses[rollNo] = courses;
      }
    }

    // Validate processed data
    if (this.studentNameMap.size === 0) {
      throw new Error('No valid student data found in the file');
    }

    console.log('Processed Students:', {
      totalStudents: this.studentNameMap.size,
      totalCourseEnrollments: Object.values(this.studentCourses)
        .reduce((sum, courses) => sum + courses.length, 0)
    });
  }

  private validateHeaders(headers: any[]): boolean {
    if (!headers || headers.length < 2) return false;
    
    const rollNoHeader = headers[0].toString().toLowerCase().trim();
    const nameHeader = headers[1].toString().toLowerCase().trim();

    return rollNoHeader.includes('roll') && nameHeader.includes('name');
  }

  getStudentName(rollNo: string): string {
    return this.studentNameMap.get(rollNo) || rollNo;
  }

  getStudentCourses(rollNo: string): string[] {
    return this.studentCourses[rollNo] || [];
  }

  // Helper method to get data summary
  getDataSummary(): { totalStudents: number, totalCourses: number } {
    const uniqueCourses = new Set<string>();
    Object.values(this.studentCourses).forEach(courses => {
      courses.forEach(course => uniqueCourses.add(course));
    });

    return {
      totalStudents: this.studentNameMap.size,
      totalCourses: uniqueCourses.size
    };
  }
}
