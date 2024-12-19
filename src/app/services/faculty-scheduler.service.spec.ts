import { TestBed } from '@angular/core/testing';

import { FacultySchedulerService } from './faculty-scheduler.service';

describe('FacultySchedulerService', () => {
  let service: FacultySchedulerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacultySchedulerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
