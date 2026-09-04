import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const expectedRole = route.data?.['role'] as UserRole | undefined;
  const user = authService.currentUser();

  if (expectedRole && user && user.role !== expectedRole && user.role !== 'ADMIN') {
    authService.navigateForRole(user.role);
    return false;
  }

  return true;
};
