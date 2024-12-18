import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DisplayResultComponent } from './display-result/display-result.component';
import { FormLoginComponent } from './forms/form-login/form-login.component';
import { FormSignupComponent } from './forms/form-signup/form-signup.component';
import { AuthGuard } from './guards/auth.guard';
import { LandingPageComponent } from './landing-page/landing-page.component';

const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent
  },

  // Protected routes
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  }, 
  { path: 'display-result', 
  component: DisplayResultComponent,
  canActivate: [AuthGuard]
  },

  // Redirect unknown paths to home
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
