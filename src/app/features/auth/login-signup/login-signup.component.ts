import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole, NE_STATE_DISTRICTS_MAP, ForgotPasswordResponse } from '../../../core/models/user.model';

@Component({
  selector: 'app-login-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login-signup.component.html',
  styleUrls: ['./login-signup.component.css']
})
export class LoginSignupComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Active View Mode: 'signup' | 'signin' | 'forgot'
  public viewMode = signal<'signup' | 'signin' | 'forgot'>('signup');

  // Selected Role for Registration & Login: CUSTOMER, DRIVER, or ADMIN
  public selectedRole = signal<UserRole>('DRIVER');

  // Password Visibility Toggles
  public showLoginPassword = signal<boolean>(false);
  public showRegisterPassword = signal<boolean>(false);
  public showConfirmPassword = signal<boolean>(false);

  // Driving License Visual Specimen Modal
  public showLicenseExampleModal = signal<boolean>(false);

  // Loading & Feedback States
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  // 8 North Eastern States (MDoNER Scope)
  public neStates: string[] = Object.keys(NE_STATE_DISTRICTS_MAP);
  public selectedState = signal<string>('Assam');

  // Dynamic cascading districts for currently selected state
  public availableDistricts = computed(() => {
    return NE_STATE_DISTRICTS_MAP[this.selectedState()] || [];
  });

  // Driver Vehicle Specifications
  public vehicleTypes = [
    { id: 'Heavy Emergency Truck', name: 'Heavy Emergency Truck (6-10W)', icon: 'bxs-truck' },
    { id: 'Medium Relief Carrier', name: 'Medium Relief Carrier (4-6W)', icon: 'bx-package' },
    { id: 'Quick Medical Van', name: 'Quick Response Medical Van', icon: 'bxs-ambulance' },
    { id: 'All-Terrain 4x4', name: 'All-Terrain 4x4 Mountain Rover', icon: 'bxs-car' },
  ];
  public selectedVehicleType = signal<string>('Heavy Emergency Truck');

  // Government Authority Ministries & Agencies
  public authorityDepartments: string[] = [
    'Ministry of Development of North Eastern Region (MDoNER)',
    'State Disaster Management Authority (SDMA)',
    'National Disaster Response Force (NDRF)',
    'State Disaster Response Force (SDRF)',
    'Border Roads Organisation (BRO / Vartak / Pushpak)',
    'State Transport Corporation (ASTC / MSTC / TRTC)',
    'Health & Family Welfare / District Civil Hospital',
    'District Collector / Magistrate Administration'
  ];

  // Forgot Password States
  public forgotRole = signal<UserRole>('DRIVER');
  public forgotPhone = signal<string>('');
  public forgotEmail = signal<string>('');
  public forgotOfficialId = signal<string>('');
  public forgotReason = signal<string>('');
  public forgotLoading = signal<boolean>(false);
  public forgotResponse = signal<ForgotPasswordResponse | null>(null);

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
      password: ['', [Validators.required, Validators.minLength(4)]],
      role: ['']
    });

    this.registerForm = this.fb.group({
      role: ['DRIVER', [Validators.required]],
      fullName: ['', [Validators.required]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: [''],
      phone: ['', [Validators.required]],
      
      // Location details (Cascading State & District)
      state: ['Assam', [Validators.required]],
      district: ['Kamrup Metropolitan', [Validators.required]],

      // Customer specific
      areaType: ['CITY'],
      localityName: [''],
      pincode: [''],

      // Driver specific
      vehicleType: ['Heavy Emergency Truck'],
      vehicleNumber: [''],
      licenseNumber: [''],
      licenseExpiry: [''],

      // Government Authority specific
      officialId: [''],
      designation: [''],
      departmentName: [this.authorityDepartments[0]],
      districtOffice: [''],
      officeAddress: [''],

      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  public setViewMode(mode: 'signup' | 'signin' | 'forgot'): void {
    this.viewMode.set(mode);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.forgotResponse.set(null);
  }

  public setRole(role: UserRole): void {
    this.selectedRole.set(role);
    this.forgotRole.set(role);
    this.registerForm.patchValue({ role });
    this.errorMessage.set(null);
  }

  public selectRole(role: UserRole): void {
    this.setRole(role);
  }

  public setForgotRole(role: UserRole): void {
    this.forgotRole.set(role);
    this.errorMessage.set(null);
    this.forgotResponse.set(null);
  }

  public onStateChange(newState: string): void {
    this.selectedState.set(newState);
    this.registerForm.patchValue({ state: newState });
    const dists = NE_STATE_DISTRICTS_MAP[newState] || [];
    if (dists.length > 0) {
      this.registerForm.patchValue({ district: dists[0], districtOffice: dists[0] });
    }
  }

  public selectVehicleType(typeId: string): void {
    this.selectedVehicleType.set(typeId);
    this.registerForm.patchValue({ vehicleType: typeId });
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

  public toggleLicenseExampleModal(): void {
    this.showLicenseExampleModal.update(v => !v);
  }

  public onConfirmPasswordPaste(e: ClipboardEvent): void {
    e.preventDefault();
    this.errorMessage.set('For security, please type your confirm password manually.');
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
        const detail = err.error?.detail || 'Invalid credentials. Please verify your username and password.';
        this.errorMessage.set(detail);
      }
    });
  }

  public onRegister(): void {
    const currentRole = this.selectedRole();
    const f = this.registerForm.controls;

    // Common validations
    if (f['fullName'].invalid) {
      this.errorMessage.set('Please enter your Full Name.');
      return;
    }
    if (f['username'].invalid) {
      this.errorMessage.set('Username must be at least 3 characters.');
      return;
    }
    if (f['phone'].invalid) {
      this.errorMessage.set('Please enter your Phone number.');
      return;
    }

    // Role-specific validations
    if (currentRole === 'CUSTOMER') {
      const emailVal = (this.registerForm.value.email || '').trim();
      if (!emailVal || !emailVal.includes('@')) {
        this.errorMessage.set('Please enter a valid Email address.');
        return;
      }
      if (!this.registerForm.value.localityName || !this.registerForm.value.localityName.trim()) {
        this.errorMessage.set('Please enter your City or Town name.');
        return;
      }
      if (!this.registerForm.value.pincode || !this.registerForm.value.pincode.trim()) {
        this.errorMessage.set('Please enter your 6-digit postal Pincode.');
        return;
      }
    } else if (currentRole === 'DRIVER') {
      // Email is OPTIONAL for field drivers!
      if (!this.registerForm.value.vehicleNumber || !this.registerForm.value.vehicleNumber.trim()) {
        this.errorMessage.set('Vehicle identifier is required (e.g. AS01EC1234).');
        return;
      }
      if (!this.registerForm.value.licenseNumber || !this.registerForm.value.licenseNumber.trim()) {
        this.errorMessage.set('Driving License number is required. Click (?) to view example.');
        return;
      }
    } else if (currentRole === 'ADMIN') {
      const emailVal = (this.registerForm.value.email || '').trim();
      if (!emailVal || !emailVal.includes('@')) {
        this.errorMessage.set('Official government or agency email is required.');
        return;
      }
      if (!this.registerForm.value.designation || !this.registerForm.value.designation.trim()) {
        this.errorMessage.set('Please enter your Official Government Designation / Title.');
        return;
      }
      if (!this.registerForm.value.departmentName) {
        this.errorMessage.set('Please select your Government Department or Ministry.');
        return;
      }
    }

    if (f['password'].invalid) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }
    if (f['confirmPassword'].invalid) {
      this.errorMessage.set('Confirm Password must be at least 6 characters.');
      return;
    }

    const val = this.registerForm.value;
    if (val.password !== val.confirmPassword) {
      this.errorMessage.set('Passwords do not match. Please verify both password fields.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

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
      state: val.state,
      district: val.district
    };

    if (currentRole === 'CUSTOMER') {
      payload.area_type = val.areaType || 'CITY';
      payload.locality_name = (val.localityName || '').trim();
      payload.pincode = (val.pincode || '').trim();
      payload.delivery_address = `${val.localityName}, ${val.district}, ${val.state} - ${val.pincode}`;
    } else if (currentRole === 'DRIVER') {
      payload.vehicle_type = this.selectedVehicleType();
      payload.vehicle_number = (val.vehicleNumber || '').trim();
      payload.license_number = (val.licenseNumber || '').trim();
      payload.license_issuing_state = val.state;
      payload.license_expiry = val.licenseExpiry || null;
    } else if (currentRole === 'ADMIN') {
      payload.official_id = (val.officialId || '').trim();
      payload.designation = (val.designation || '').trim();
      payload.department_name = val.departmentName;
      payload.jurisdiction_state = val.state;
      payload.district_office = val.districtOffice || val.district;
      payload.office_address = (val.officeAddress || '').trim();
      payload.organization = val.departmentName;
    }

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (currentRole === 'ADMIN') {
          this.successMessage.set('Government Official registration submitted! Your request is queued for Superadmin clearance.');
          setTimeout(() => {
            this.setViewMode('signin');
          }, 2500);
        } else {
          this.successMessage.set(`Account created successfully as ${res.user.role}! Redirecting...`);
          setTimeout(() => {
            this.authService.navigateForRole(res.user.role);
          }, 800);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        let msg = 'Registration failed. Please verify your inputs.';
        if (err.error) {
          if (typeof err.error === 'string') {
            msg = err.error;
          } else if (typeof err.error === 'object') {
            const errors = Object.entries(err.error).map(([k, v]) => {
              const valStr = Array.isArray(v) ? v.join(', ') : String(v);
              const label = k === 'detail' ? '' : `${k.replace('_', ' ').toUpperCase()}: `;
              return `${label}${valStr}`;
            });
            if (errors.length > 0) msg = errors.join(' | ');
          }
        }
        this.errorMessage.set(msg);
      }
    });
  }

  public onForgotPasswordSubmit(): void {
    const role = this.forgotRole();
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.forgotResponse.set(null);

    const payload: any = { role };

    if (role === 'DRIVER') {
      if (!this.forgotPhone().trim()) {
        this.errorMessage.set('Please enter your registered mobile number.');
        return;
      }
      payload.phone_number = this.forgotPhone().trim();
    } else if (role === 'CUSTOMER') {
      if (!this.forgotEmail().trim() || !this.forgotEmail().includes('@')) {
        this.errorMessage.set('Please enter your registered Gmail or email address.');
        return;
      }
      payload.email = this.forgotEmail().trim().toLowerCase();
    } else if (role === 'ADMIN') {
      if (!this.forgotOfficialId().trim() && !this.forgotEmail().trim()) {
        this.errorMessage.set('Please enter your Official Badge ID or Official Email.');
        return;
      }
      payload.official_id = this.forgotOfficialId().trim();
      payload.email = this.forgotEmail().trim().toLowerCase();
      payload.reason = this.forgotReason().trim() || 'Password recovery requested by official';
    }

    this.forgotLoading.set(true);
    this.authService.forgotPassword(payload).subscribe({
      next: (res) => {
        this.forgotLoading.set(false);
        this.forgotResponse.set(res);
        this.successMessage.set(res.message);
      },
      error: (err) => {
        this.forgotLoading.set(false);
        const detail = err.error?.detail || err.error?.phone_number || err.error?.email || err.error?.official_id || 'Failed to process password reset request.';
        this.errorMessage.set(Array.isArray(detail) ? detail.join(', ') : String(detail));
      }
    });
  }

  public fillCredentialsAndSignIn(usernameOrPhone: string, tempPass: string): void {
    this.loginForm.patchValue({
      username: usernameOrPhone,
      password: tempPass
    });
    this.setViewMode('signin');
    this.successMessage.set('Temporary password auto-filled! Click "Sign In" to access your dashboard and update your password.');
  }
}

