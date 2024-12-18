import { TestBed } from '@angular/core/testing';

import { ShareDatesService } from './share-dates.service';

describe('ShareDatesService', () => {
  let service: ShareDatesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShareDatesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
