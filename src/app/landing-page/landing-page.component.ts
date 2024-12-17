import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent { 
  showLoginModal = false;
  showSignupModal = false;

  toggleLoginModal() {
    this.showLoginModal = !this.showLoginModal;
  }

  toggleSignupModal() {
    this.showSignupModal = !this.showSignupModal;
    if (this.showSignupModal) this.showLoginModal = false;
  }
}
