import { Injectable } from '@angular/core';

interface StudentCourses {
  [student: string]: string[];
}

interface ConflictGraph {
  [course: string]: Set<string>;
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

interface FacultyData {
  // Define faculty data structure when implemented
}

interface TimeSlot {
  day: number;
  slot: number;
  startTime: number;
  endTime: number;
  }

  interface CourseSlots {
    [course: string]: number;
  }

interface Timetable {
  [timeSlot: string]: string[];
}

// ... other interfaces remain the same ...

@Injectable({
  providedIn: 'root'
})
export class SchedulerService {
  scheduleExams(
    studentCourses: StudentCourses, 
    courseList: string[], // New parameter
    days: number, 
    slotsPerDay: number
  ): ScheduleResult {
    // Step 1: Build the conflict graph only for provided courses
    const graph: ConflictGraph = {};
    
    // Initialize graph with provided courses
    courseList.forEach(course => {
      graph[course] = new Set<string>();
    });
    
    // Build conflicts only for courses in courseList
    for (const [student, courses] of Object.entries(studentCourses)) {
      const studentCoursesInList = courses.filter(course => courseList.includes(course));
      
      for (let i = 0; i < studentCoursesInList.length; i++) {
        for (let j = i + 1; j < studentCoursesInList.length; j++) {
          const course1 = studentCoursesInList[i];
          const course2 = studentCoursesInList[j];
          
          // Only add conflicts for courses in our list
          if (graph[course1] && graph[course2]) {
            graph[course1].add(course2);
            graph[course2].add(course1);
          }
        }
      }
    }

    // Step 2: Generate time slots
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
    
    // Step 3: Graph Coloring (using provided courseList)
    const courseSlots: CourseSlots = {};
    const availableColors = Array.from({ length: totalSlots }, (_, i) => i);
    const overflowCourses: string[] = [];

    for (const course of courseList) {
      // Find colors of neighbors (conflicting courses)
      const neighborColors = new Set<number>();
      if (graph[course]) {
        graph[course].forEach(neighbor => {
          if (neighbor in courseSlots) {
            neighborColors.add(courseSlots[neighbor]);
          }
        });
      }

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

    // Step 4: Calculate conflicts (only for provided courses)
    let conflicts = 0;
    const conflictDetails: ConflictDetail[] = [];
    
    for (const [student, courses] of Object.entries(studentCourses)) {
      const coursesInList = courses.filter(course => courseList.includes(course));
      const slotCount: { [slot: number]: string[] } = {};
      
      for (const course of coursesInList) {
        if (course in courseSlots) {
          const slot = courseSlots[course];
          if (!slotCount[slot]) {
            slotCount[slot] = [];
          }
          slotCount[slot].push(course);
        }
      }

      // Count slots with more than one exam
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

    // Step 5: Convert slots to timetable (only for provided courses)
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

  private formatTime(time: number): string {
    const hours = Math.floor(time);
    const minutes = (time % 1) * 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}