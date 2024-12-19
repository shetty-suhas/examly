import { TestBed } from '@angular/core/testing';

import { FileProcessingCoursesService } from './file-processing-courses.service';

describe('FileProcessingCoursesService', () => {
  let service: FileProcessingCoursesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileProcessingCoursesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
