import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private auth = getAuth();
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private router: Router) {
    // Listen to auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.userSubject.next(user);
      
      // Navigate based on auth state
      if (user) {
        // User is signed in, redirect to dashboard if on landing
        if (this.router.url === '/') {
          this.router.navigate(['/dashboard']);
        }
      } else {
        // User is signed out, redirect to landing if on protected route
        if (this.router.url !== '/') {
          this.router.navigate(['/']);
        }
      }
    });
  }

  // Sign up with email/password
  async signUp(email: string, password: string, name: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      
      // Update user profile with name using the imported updateProfile function
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name
        });
      }

      return userCredential.user;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Sign in with email/password
  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      return userCredential.user;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get current user
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.auth.currentUser !== null;
  }

  // Error handling
  private handleError(error: any) {
    let errorMessage = 'An error occurred';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email is already registered';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Email/password accounts are not enabled';
        break;
      case 'auth/weak-password':
        errorMessage = 'Please choose a stronger password';
        break;
      case 'auth/user-not-found':
        errorMessage = 'User not found';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password';
        break;
    }

    return new Error(errorMessage);
  }
}