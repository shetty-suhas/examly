import { TestBed } from '@angular/core/testing';

import { FileProcessingStudentsService } from './file-processing-students.service';

describe('FileProcessingStudentsService', () => {
  let service: FileProcessingStudentsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileProcessingStudentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
