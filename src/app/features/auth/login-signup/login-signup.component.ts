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

  // Toggle active state for sliding animation
  public isRegisterActive = signal<boolean>(false);

  // Selected Role for Registration & Login
  public selectedRole = signal<UserRole>('CUSTOMER');

  // Password Visibility Toggles
  public showLoginPassword = signal<boolean>(false);
  public showRegisterPassword = signal<boolean>(false);
  public showConfirmPassword = signal<boolean>(false);

  // Loading & Error States
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  // Predefined Organizations & Departments
  public organizations: string[] = [
    'Assam State Transport Corporation (ASTC)',
    'Guwahati Medical College & Hospital (GMCH)',
    'National Disaster Response Force (NDRF)',
    'State Disaster Response Force (SDRF Assam)',
    'Ministry of Development of North Eastern Region (MDoNER)',
    'Civil Hospital Silchar / District Administration',
    'Meghalaya State Transport Corporation (MSTC)',
    'Border Roads Organisation (BRO / Vartak)',
    'Other Logistics Partner'
  ];

  public departments: string[] = [
    'Emergency Logistics & Relief Operations',
    'Emergency Medical Supplies & Vaccines',
    'Disaster Relief & Essential Food Supplies',
    'Corridor Dispatch & Fleet Coordination',
    'District Disaster Management Authority (DDMA)',
    'Civil Hospital Medical Store',
    'General Healthcare Operations',
    'Other Department'
  ];

  // Reactive Forms
  public loginForm!: FormGroup;
  public registerForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();

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

  public toggleLoginPassword(): void {
    this.showLoginPassword.update(v => !v);
  }

  public toggleRegisterPassword(): void {
    this.showRegisterPassword.update(v => !v);
  }

  public toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  public onConfirmPasswordPaste(e: ClipboardEvent): void {
    e.preventDefault();
    this.errorMessage.set('For security, please type your confirm password manually.');
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

    this.authService.login({ username: username.trim(), password }).subscribe({
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
    // Specific, actionable field-level validation messages
    if (this.registerForm.invalid) {
      const f = this.registerForm.controls;
      if (f['fullName'].invalid) {
        this.errorMessage.set('Please enter your Full Name.');
        return;
      }
      if (f['username'].invalid) {
        this.errorMessage.set('Username must be at least 3 characters.');
        return;
      }
      if (f['email'].invalid) {
        this.errorMessage.set('Please enter a valid Email address.');
        return;
      }
      if (f['phone'].invalid) {
        this.errorMessage.set('Please enter your Phone number.');
        return;
      }
      if (f['organization'].invalid) {
        this.errorMessage.set('Please select your Organization from the dropdown.');
        return;
      }
      if (f['password'].invalid) {
        this.errorMessage.set('Password must be at least 6 characters.');
        return;
      }
      if (f['confirmPassword'].invalid) {
        this.errorMessage.set('Confirm Password must be at least 6 characters.');
        return;
      }
      this.errorMessage.set('Please complete all required fields.');
      return;
    }

    const val = this.registerForm.value;

    if (val.password !== val.confirmPassword) {
      this.errorMessage.set('Passwords do not match. Please verify both password fields.');
      return;
    }

    const currentRole = this.selectedRole();
    if (currentRole === 'DRIVER') {
      if (!val.vehicleNumber || !val.vehicleNumber.trim()) {
        this.errorMessage.set('Vehicle number is required for Driver registration (e.g. TR-102).');
        return;
      }
      if (!val.licenseNumber || !val.licenseNumber.trim()) {
        this.errorMessage.set('License ID is required for Driver registration (e.g. DRV-001).');
        return;
      }
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Auto-sanitize spaces in username (e.g. "Bharathi 02" -> "bharathi_02")
    const sanitizedUsername = (val.username || '').trim().replace(/\s+/g, '_').toLowerCase();

    const names = (val.fullName || '').trim().split(' ');
    const firstName = names[0] || sanitizedUsername;
    const lastName = names.slice(1).join(' ') || '';

    const payload: any = {
      username: sanitizedUsername,
      email: (val.email || '').trim().toLowerCase(),
      password: val.password,
      confirm_password: val.confirmPassword,
      first_name: firstName,
      last_name: lastName,
      role: currentRole,
      phone_number: (val.phone || '').trim(),
      organization: val.organization
    };

    if (currentRole === 'DRIVER') {
      payload.vehicle_number = val.vehicleNumber.trim();
      payload.license_number = val.licenseNumber.trim();
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
          const errors = Object.entries(err.error).map(([k, v]) => {
            const valStr = Array.isArray(v) ? v.join(', ') : String(v);
            return `${k}: ${valStr}`;
          });
          if (errors.length > 0) msg = errors.join(' | ');
        }
        this.errorMessage.set(msg);
      }
    });
  }
}
