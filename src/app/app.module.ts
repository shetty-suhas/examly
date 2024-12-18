import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { FormLoginComponent } from './forms/form-login/form-login.component';
import { FormSignupComponent } from './forms/form-signup/form-signup.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DisplayResultComponent } from './display-result/display-result.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { initializeApp } from 'firebase/app';
import { environment } from '../environments/environment';
import { MatSnackBarModule } from '@angular/material/snack-bar';

initializeApp(environment.firebase);

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    FormLoginComponent,
    FormSignupComponent,
    DashboardComponent,
    DisplayResultComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    BrowserAnimationsModule,
    MatSnackBarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
