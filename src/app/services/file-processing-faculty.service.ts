import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

interface FacultyTimeSlot {
  start: number;
  end: number;
}

interface TimeSlot {
  start: number;
  end: number;
}


@Injectable({
  providedIn: 'root'
})
export class FileProcessingFacultyService {
  facultyEmailMap = new Map<string, string>();
  facultyAvailability = new Map<string, FacultyTimeSlot[]>();
  
  // Time slot mappings
  private timeSlots: Record<string, TimeSlot> = {
    '9am-10am': { start: 9, end: 10 },
    '10am-11am': { start: 10, end: 11 },
    '11am-12pm': { start: 11, end: 12 },
    '12pm-1pm': { start: 12, end: 13 },
    '1pm-2pm': { start: 13, end: 14 },
    '2pm-3pm': { start: 14, end: 15 },
    '3pm-4pm': { start: 15, end: 16 },
    '4pm-5pm': { start: 16, end: 17 }
  } as const;

  constructor() {}

  async processFacultyFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

          // Clear previous data
          this.facultyEmailMap.clear();
          this.facultyAvailability.clear();

          // Process the data
          this.processFacultyData(jsonData as string[][]);
          resolve();
        } catch (error) {
          reject(new Error('Error processing faculty file: ' + error));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading faculty file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  private processFacultyData(data: string[][]) {
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const facultyName = row[0];
      const email = row[1];

      if (!facultyName || !email) continue;

      this.facultyEmailMap.set(facultyName, email);
      const availableSlots: FacultyTimeSlot[] = [];
      
      for (let j = 2; j < row.length; j++) {
        const timeSlotKey = headers[j];
        const isAvailable = row[j]?.toLowerCase() === 'yes';

        const timeSlot = this.timeSlots[timeSlotKey];
        if (isAvailable && timeSlot) {
          // Try to merge with previous slot if continuous
          if (availableSlots.length > 0) {
            const lastSlot = availableSlots[availableSlots.length - 1];
            if (lastSlot.end === timeSlot.start) {
              lastSlot.end = timeSlot.end;
              continue;
            }
          }
          
          availableSlots.push({ start: timeSlot.start, end: timeSlot.end });
        }
      }

      if (availableSlots.length > 0) {
        this.facultyAvailability.set(facultyName, availableSlots);
      }
    }
  }

  // Rest of the service implementation...
  getDataSummary() {
    return {
      totalFaculty: this.facultyEmailMap.size,
      facultyWithAvailability: this.facultyAvailability.size
    };
  }

  getFacultyEmail(name: string): string | undefined {
    return this.facultyEmailMap.get(name);
  }

  getFacultyAvailability(name: string): number[][] | undefined {
    const slots = this.facultyAvailability.get(name);
    if (!slots) return undefined;
    return slots.map(slot => [slot.start, slot.end]);
  }

  getAllFacultyData() {
    const data: { [key: string]: { email: string, availability: number[][] } } = {};
    
    this.facultyEmailMap.forEach((email, name) => {
      const availability = this.getFacultyAvailability(name) || [];
      data[name] = { email, availability };
    });
    
    return data;
  }
}