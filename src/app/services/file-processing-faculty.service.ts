import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';

export interface FileState {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  data: any;
  error?: string;
}

export interface FacultyData {
  facultyName: string;
  email: string;
  availability: number[][];
} 

export interface FacultyDataSummary {
  totalFaculty: number;
  totalTimeSlots: number;
  averageAvailabilityHours: number;
  facultyWithFullAvailability: number;
  facultyWithLimitedAvailability: number;
}

export interface CompleteData {
  facultyEmailMap: { [faculty: string]: string };
  facultyAvailability: { [faculty: string]: number[][] };
  summary: FacultyDataSummary;
}

@Injectable({
  providedIn: 'root'
})
export class FileProcessingFacultyService {
  private facultyEmailMap = new Map<string, string>();
  private facultyAvailability = new Map<string, number[][]>();
  
  private fileStateSubject = new BehaviorSubject<FileState>({
    name: '',
    status: 'pending',
    data: null
  });

  fileState$ = this.fileStateSubject.asObservable();

  constructor() {}

  async processFacultyFile(file: File): Promise<void> {
    this.updateFileState({
      name: file.name,
      status: 'processing',
      data: null
    });

    try {
      let rows: any[];

      // Check file extension
      if (file.name.endsWith('.csv')) {
        rows = await this.readCSV(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        rows = await this.readExcel(file);
      } else {
        throw new Error('Unsupported file format. Please upload a CSV or Excel file.');
      }

      // Process the data
      await this.processFacultyData(rows);

      // Update file state with processed data
      const processedData = {
        facultyEmailMap: Object.fromEntries(this.facultyEmailMap),
        facultyAvailability: Object.fromEntries(this.facultyAvailability)
      };

      this.updateFileState({
        name: file.name,
        status: 'completed',
        data: processedData
      });

      console.log('Processed Faculty Data:', processedData);

    } catch (error) {
      const errorMessage = 'Error processing faculty file: ' + error;
      this.updateFileState({
        name: file.name,
        status: 'error',
        data: null,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  }

  private async readCSV(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (result) => {
          resolve(result.data);
        },
        error: (error) => {
          reject(error);
        },
        header: false,
        skipEmptyLines: true
      });
    });
  }

  private async readExcel(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet, { 
            header: 1,
            blankrows: false
          });
          resolve(rows);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading excel file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  private async processFacultyData(rows: any[]): Promise<void> {
    // Clear previous data
    this.facultyEmailMap.clear();
    this.facultyAvailability.clear();
  
    // Validate header row
    const headerRow = rows[0];
    if (!this.validateHeaders(headerRow)) {
      throw new Error('Invalid file format: Missing required columns');
    }
  
    // Process each row (skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 3) continue; // Skip invalid rows
  
      // Extract faculty name and email
      const fullName = row[0]?.toString().trim();
      const emailPart = row[1]?.toString().trim();
  
      // Split the combined name-email if necessary
      let facultyName = fullName;
      let email = emailPart;
  
      // Handle cases where name and email are in the same column
      if (fullName.includes('@')) {
        const parts = fullName.split(' ');
        email = parts.pop() || '';
        facultyName = parts.join(' ');
      }
  
      if (!facultyName || !email) continue;
  
      // Store faculty email mapping
      this.facultyEmailMap.set(facultyName, email);
  
      // Process availability slots (starting from index 2)
      const timeSlots: number[][] = [];
      
      // Map the time slots based on the header
      const availabilityColumns = row.slice(2);
      availabilityColumns.forEach((value: any, index: number) => {
        const slotValue = value?.toString().toLowerCase().trim();
        if (slotValue === 'yes') {
          const hour = 9 + index; // Starting from 9 AM
          timeSlots.push([hour, hour + 1]);
        }
      });
  
      // Merge consecutive slots and store
      const mergedSlots = this.mergeConsecutiveSlots(timeSlots);
      this.facultyAvailability.set(facultyName, mergedSlots);
    }
  
    // Validate that we have processed some data
    if (this.facultyEmailMap.size === 0) {
      throw new Error('No valid faculty data found in the file');
    }
  }
  
  private validateHeaders(headers: any[]): boolean {
    if (!headers || headers.length < 10) return false; // At least name, email, and time slots
  
    const requiredColumns = [
      'faculty',
      'email',
      '9am-10am',
      '10am-11am',
      '11am-12pm',
      '12pm-1pm',
      '1pm-2pm',
      '2pm-3pm',
      '3pm-4pm',
      '4pm-5pm'
    ];
  
    // Convert headers to lowercase for case-insensitive comparison
    const headerNames = headers.map(h => h?.toString().toLowerCase().trim());
  
    // Check if the first column contains 'faculty' or 'name'
    if (!headerNames[0]?.includes('faculty') && !headerNames[0]?.includes('name')) {
      return false;
    }
  
    // Check if the second column is related to email
    if (!headerNames[1]?.includes('email')) {
      return false;
    }
  
    // Check if we have enough time slot columns
    return headerNames.length >= requiredColumns.length;
  }
  
  // Add this helper method to clean faculty names
  private cleanFacultyName(name: string): string {
    // Remove common prefixes
    const prefixes = ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.'];
    let cleanName = name;
    
    prefixes.forEach(prefix => {
      if (cleanName.startsWith(prefix)) {
        cleanName = cleanName.substring(prefix.length).trim();
      }
    });
  
    return cleanName;
  }

  private mergeConsecutiveSlots(slots: number[][]): number[][] {
    if (slots.length === 0) return [];
    
    slots.sort((a, b) => a[0] - b[0]);
    const merged: number[][] = [slots[0]];
    
    for (let i = 1; i < slots.length; i++) {
      const current = slots[i];
      const previous = merged[merged.length - 1];
      
      if (current[0] === previous[1]) {
        previous[1] = current[1];
      } else {
        merged.push(current);
      }
    }
    
    return merged;
  }

  getFacultyAvailability(): { [faculty: string]: number[][] } {
    return Object.fromEntries(this.facultyAvailability);
  }

  getFacultyEmails(): { [faculty: string]: string } {
    return Object.fromEntries(this.facultyEmailMap);
  }

  private updateFileState(state: FileState) {
    this.fileStateSubject.next(state);
  }

  clearData() {
    this.facultyEmailMap.clear();
    this.facultyAvailability.clear();
    this.updateFileState({
      name: '',
      status: 'pending',
      data: null
    });
  }

  isDataLoaded(): boolean {
    return this.facultyEmailMap.size > 0 && this.facultyAvailability.size > 0;
  }

  validateFacultyData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    if (!data.facultyEmailMap || !data.facultyAvailability) return false;

    // Validate structure and data types
    for (const [faculty, slots] of Object.entries(data.facultyAvailability)) {
      if (typeof faculty !== 'string') return false;
      if (!Array.isArray(slots)) return false;

      for (const slot of slots) {
        if (!Array.isArray(slot) || slot.length !== 2) return false;
        if (!Number.isInteger(slot[0]) || !Number.isInteger(slot[1])) return false;
        if (slot[0] >= slot[1] || slot[0] < 9 || slot[1] > 17) return false;
      }
    }

    for (const [faculty, email] of Object.entries(data.facultyEmailMap)) {
      if (typeof faculty !== 'string' || typeof email !== 'string') return false;
      if (!email.includes('@')) return false;
    }

    return true;
  }

  getAllFacultyData(): CompleteData {
    const facultyEmailMap = this.getFacultyEmails();
    const facultyAvailability = this.getFacultyAvailability();
    const summary = this.getDataSummary();
  
    return {
      facultyEmailMap,
      facultyAvailability,
      summary
    };
  }
  
  getDataSummary(): FacultyDataSummary {
    const totalFaculty = this.facultyEmailMap.size;
    let totalSlots = 0;
    let facultyWithFullAvailability = 0;
    let facultyWithLimitedAvailability = 0;
    
    // Calculate total hours and availability distribution
    for (const [faculty, slots] of this.facultyAvailability.entries()) {
      let facultyTotalHours = 0;
      
      // Calculate total hours for this faculty
      slots.forEach(([start, end]) => {
        facultyTotalHours += (end - start);
      });
      
      totalSlots += facultyTotalHours;
      
      // Full availability is considered as 6 or more hours
      if (facultyTotalHours >= 6) {
        facultyWithFullAvailability++;
      } else {
        facultyWithLimitedAvailability++;
      }
    }
  
    const averageAvailabilityHours = totalFaculty > 0 
      ? Number((totalSlots / totalFaculty).toFixed(1))
      : 0;
  
    return {
      totalFaculty,
      totalTimeSlots: totalSlots,
      averageAvailabilityHours,
      facultyWithFullAvailability,
      facultyWithLimitedAvailability
    };
  }
}