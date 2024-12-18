import { Injectable } from '@angular/core';

interface StudentCourses {
  [student: string]: string[];
}

interface ConflictGraph {
  [course: string]: Set<string>;
}

interface CourseSlots {
  [course: string]: number;
}

interface Timetable {
  [timeSlot: string]: string[];
}

interface TimeSlot {
  day: number;
  slot: number;
  startTime: number;
  endTime: number;
}

interface ConflictDetail {
  student: string;
  slot: number;
  conflictingCourses: string[];
}

interface ScheduleResult {
  timetable: Timetable;
  conflicts: number;
  conflictDetails: ConflictDetail[];
}

@Injectable({
  providedIn: 'root'
})
export class SchedulerService {
  scheduleExams(studentCourses: StudentCourses, days: number, slotsPerDay: number): ScheduleResult {
    // Step 1: Build the conflict graph
    const graph: ConflictGraph = {};
    
    for (const [student, courses] of Object.entries(studentCourses)) {
      for (let i = 0; i < courses.length; i++) {
        if (!graph[courses[i]]) {
          graph[courses[i]] = new Set<string>();
        }
        for (let j = i + 1; j < courses.length; j++) {
          graph[courses[i]].add(courses[j]);
          if (!graph[courses[j]]) {
            graph[courses[j]] = new Set<string>();
          }
          graph[courses[j]].add(courses[i]);
        }
      }
    }

    // Step 2: Generate time slots
    const courses = Object.keys(graph);
    const timeSlots: TimeSlot[] = [];
    const slotDuration = 3; // 3 hours per exam
    const breakDuration = 0.5; // 30 minutes break
    const startTime = 9; // Day starts at 9 AM
    const endTime = 17; // Day ends at 5 PM

    // Calculate slots based on duration and breaks
    for (let day = 1; day <= days; day++) {
      let currentTime = startTime;
      let slot = 1;
      while (currentTime + slotDuration <= endTime) {
        timeSlots.push({
          day,
          slot,
          startTime: currentTime,
          endTime: currentTime + slotDuration
        });
        currentTime += slotDuration + breakDuration;
        slot++;
      }
    }

    const totalSlots = timeSlots.length;
    
    // Step 3: Graph Coloring
    const courseSlots: CourseSlots = {};
    const availableColors = Array.from({ length: totalSlots }, (_, i) => i);
    const overflowCourses: string[] = [];

    for (const course of courses) {
      // Find colors of neighbors (conflicting courses)
      const neighborColors = new Set<number>();
      graph[course].forEach(neighbor => {
        if (neighbor in courseSlots) {
          neighborColors.add(courseSlots[neighbor]);
        }
      });

      // Assign the lowest available color or mark as overflow
      let colorAssigned = false;
      for (const color of availableColors) {
        if (!neighborColors.has(color)) {
          courseSlots[course] = color;
          colorAssigned = true;
          break;
        }
      }
      if (!colorAssigned) {
        overflowCourses.push(course);
      }
    }

    // Schedule overflow courses by reusing slots
    for (const course of overflowCourses) {
      courseSlots[course] = availableColors[0];
    }

    // Step 4: Calculate conflicts
    let conflicts = 0;
    const conflictDetails: ConflictDetail[] = [];
    
    for (const [student, courses] of Object.entries(studentCourses)) {
      const slotCount: { [slot: number]: string[] } = {};
      
      for (const course of courses) {
        if (course in courseSlots) {
          const slot = courseSlots[course];
          if (!slotCount[slot]) {
            slotCount[slot] = [];
          }
          slotCount[slot].push(course);
        }
      }

      // Count slots with more than one exam and log conflicts
      for (const [slot, assignedCourses] of Object.entries(slotCount)) {
        if (assignedCourses.length > 1) {
          conflicts += assignedCourses.length - 1;
          conflictDetails.push({
            student,
            slot: Number(slot),
            conflictingCourses: assignedCourses
          });
        }
      }
    }

    // Step 5: Convert slots to timetable
    const timetable: Timetable = {};
    
    for (const [course, slot] of Object.entries(courseSlots)) {
      const timeSlot = timeSlots[slot];
      const timeKey = `Day ${timeSlot.day}, Slot ${timeSlot.slot} (${timeSlot.startTime}:00-${timeSlot.endTime}:00)`;
      
      if (!timetable[timeKey]) {
        timetable[timeKey] = [];
      }
      timetable[timeKey].push(course);
    }

    return { timetable, conflicts, conflictDetails };
  }

  // Helper method to format time (optional)
  private formatTime(time: number): string {
    const hours = Math.floor(time);
    const minutes = (time % 1) * 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}