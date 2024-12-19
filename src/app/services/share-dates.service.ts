import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShareDatesService {
  private selectedDatesSource = new BehaviorSubject<Date[]>([]);
  selectedDates$ = this.selectedDatesSource.asObservable();

  setSelectedDates(dates: Date[]) {
    this.selectedDatesSource.next(dates);
  }

  getSelectedDates(): Date[] {
    return this.selectedDatesSource.getValue();
  }

  clearDates() {
    this.selectedDatesSource.next([]);
  }
}
