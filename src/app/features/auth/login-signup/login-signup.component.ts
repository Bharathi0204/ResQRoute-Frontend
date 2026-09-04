import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-login-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-signup.component.html',
  styleUrls: ['./login-signup.component.css']
})
export class LoginSignupComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Toggle active state for sliding animation (matching 33-Login JS)
  public isRegisterActive = signal<boolean>(false);

  // Selected Role for Registration & Login
  public selectedRole = signal<UserRole>('CUSTOMER');

  // Backend Health & Status
  public backendStatus = signal<string>('Checking backend...');
  public isBackendOnline = signal<boolean>(false);

  // Loading & Error States
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  // Reactive Forms
  public loginForm!: FormGroup;
  public registerForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.checkBackendHealth();

    // If already logged in, redirect to respective role dashboard
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.authService.navigateForRole(currentUser.role);
    }
  }

  private initForms(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });

    this.registerForm = this.fb.group({
      role: ['CUSTOMER', [Validators.required]],
      fullName: ['', [Validators.required]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      organization: ['', [Validators.required]],
      // Driver specific
      vehicleNumber: [''],
      licenseNumber: [''],
      // Customer specific
      department: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  public checkBackendHealth(): void {
    this.authService.checkHealth().subscribe({
      next: (res) => {
        this.isBackendOnline.set(true);
        this.backendStatus.set('Backend Connected ✓ (ResQRoute API)');
      },
      error: () => {
        this.isBackendOnline.set(false);
        this.backendStatus.set('Backend Offline (Start Django at :8000)');
      }
    });
  }

  public togglePanel(isRegister: boolean): void {
    this.isRegisterActive.set(isRegister);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  public setRole(role: UserRole): void {
    this.selectedRole.set(role);
    this.registerForm.patchValue({ role });
    this.errorMessage.set(null);
  }

  public quickFillDemo(role: 'admin' | 'driver' | 'customer'): void {
    if (role === 'admin') {
      this.loginForm.patchValue({ username: 'admin', password: 'admin123' });
    } else if (role === 'driver') {
      this.loginForm.patchValue({ username: 'driver1', password: 'driver123' });
    } else {
      this.loginForm.patchValue({ username: 'customer1', password: 'customer123' });
    }
    this.isRegisterActive.set(false);
  }

  public onLogin(): void {
    if (this.loginForm.invalid) {
      this.errorMessage.set('Please fill in both username/email and password.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { username, password } = this.loginForm.value;

    this.authService.login({ username, password }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set(`Welcome back, ${res.user.first_name || res.user.username}! Redirecting...`);
        setTimeout(() => {
          this.authService.navigateForRole(res.user.role);
        }, 800);
      },
      error: (err) => {
        this.isLoading.set(false);
        const detail = err.error?.detail || 'Invalid username or password. Please try again.';
        this.errorMessage.set(detail);
      }
    });
  }

  public onRegister(): void {
    if (this.registerForm.invalid) {
      this.errorMessage.set('Please complete all required fields correctly.');
      return;
    }

    const val = this.registerForm.value;

    if (val.password !== val.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    const currentRole = this.selectedRole();
    if (currentRole === 'DRIVER') {
      if (!val.vehicleNumber || !val.licenseNumber) {
        this.errorMessage.set('Vehicle number and License number are required for Drivers.');
        return;
      }
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const names = (val.fullName || '').trim().split(' ');
    const firstName = names[0] || val.username;
    const lastName = names.slice(1).join(' ') || '';

    const payload: any = {
      username: val.username,
      email: val.email,
      password: val.password,
      confirm_password: val.confirmPassword,
      first_name: firstName,
      last_name: lastName,
      role: currentRole,
      phone_number: val.phone,
      organization: val.organization
    };

    if (currentRole === 'DRIVER') {
      payload.vehicle_number = val.vehicleNumber;
      payload.license_number = val.licenseNumber;
    } else {
      payload.department = val.department || '';
    }

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set(`Account created successfully as ${res.user.role}! Redirecting...`);
        setTimeout(() => {
          this.authService.navigateForRole(res.user.role);
        }, 800);
      },
      error: (err) => {
        this.isLoading.set(false);
        let msg = 'Registration failed. Please check your inputs.';
        if (err.error) {
          const errors = Object.entries(err.error).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
          if (errors.length > 0) msg = errors.join(' | ');
        }
        this.errorMessage.set(msg);
      }
    });
  }
}
