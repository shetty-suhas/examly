interface ScheduleResult {
    timetable: Timetable;
    conflicts: number;
    conflictDetails: ConflictDetail[];
  }