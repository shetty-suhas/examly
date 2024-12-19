import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { FileStateService } from './services/file-state.service';
import { FirebaseService } from './services/firebase.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'examly'; 

  constructor(private firebaseService: FirebaseService, private router: Router, private fileStateService: FileStateService){}


  @HostListener('window:beforeunload', ['$event'])
  async beforeunloadHandler(event: Event) {
    try {
      await this.firebaseService.signOut();
      
      // Clear application data
      this.fileStateService.clearAllData();
      
      // Clear any stored tokens or session data
      localStorage.clear();
      sessionStorage.clear();
      
      // Navigate to home/login page
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
