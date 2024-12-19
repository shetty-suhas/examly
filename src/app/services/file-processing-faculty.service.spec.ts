import { TestBed } from '@angular/core/testing';

import { FileProcessingFacultyService } from './file-processing-faculty.service';

describe('FileProcessingFacultyService', () => {
  let service: FileProcessingFacultyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileProcessingFacultyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
