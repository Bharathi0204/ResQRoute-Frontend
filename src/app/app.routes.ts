import { Routes } from '@angular/router';
import { LoginSignupComponent } from './features/auth/login-signup/login-signup.component';
import { DriverDashboardComponent } from './features/dashboards/driver-dashboard.component';
import { CustomerDashboardComponent } from './features/dashboards/customer-dashboard.component';
import { AdminDashboardComponent } from './features/dashboards/admin-dashboard.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginSignupComponent
  },
  {
    path: 'driver/dashboard',
    component: DriverDashboardComponent,
    canActivate: [authGuard],
    data: { role: 'DRIVER' }
  },
  {
    path: 'customer/dashboard',
    component: CustomerDashboardComponent,
    canActivate: [authGuard],
    data: { role: 'CUSTOMER' }
  },
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard],
    data: { role: 'ADMIN' }
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
