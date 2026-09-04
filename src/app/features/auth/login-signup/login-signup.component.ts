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

  // Selected Role for Registration & Login: CUSTOMER, DRIVER, or ADMIN
  public selectedRole = signal<UserRole>('CUSTOMER');

  // Password Visibility Toggles
  public showLoginPassword = signal<boolean>(false);
  public showRegisterPassword = signal<boolean>(false);
  public showConfirmPassword = signal<boolean>(false);

  // Driving License Visual Specimen Modal (Matches user reference image)
  public showLicenseExampleModal = signal<boolean>(false);

  // Loading & Error States
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  // 8 North Eastern States (MDoNER Corridor Scope)
  public neStates: string[] = [
    'Assam',
    'Meghalaya',
    'Sikkim',
    'Arunachal Pradesh',
    'Nagaland',
    'Manipur',
    'Mizoram',
    'Tripura'
  ];

  // Driver Vehicle Specifications with interactive avatars/icons
  public vehicleTypes = [
    { id: 'Heavy Emergency Truck', name: 'Heavy Emergency Truck (6-10W)', icon: 'bxs-truck', desc: 'Bulk rations & emergency heavy payload' },
    { id: 'Medium Relief Carrier', name: 'Medium Relief Carrier (4-6W)', icon: 'bx-package', desc: 'Disaster supplies & medical boxes' },
    { id: 'Quick Medical Van', name: 'Quick Response Medical Van', icon: 'bxs-ambulance', desc: 'Vaccines, blood units & cold-chain' },
    { id: 'All-Terrain 4x4', name: 'All-Terrain 4x4 Hill Vehicle', icon: 'bxs-car', desc: 'Landslide & mountainous dirt corridors' },
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
      // Email is optional for drivers, required for customer/admin
      email: [''],
      phone: ['', [Validators.required]],
      
      // Customer specific
      areaType: ['CITY'],
      localityName: [''],
      pincode: [''],
      state: [''],

      // Driver specific
      vehicleType: ['Heavy Emergency Truck'],
      vehicleNumber: [''],
      licenseNumber: [''],
      licenseIssuingState: [''],

      // Government Authority specific
      officialId: [''],
      designation: [''],
      departmentName: [''],
      jurisdictionState: [''],
      officeAddress: [''],

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
        const detail = err.error?.detail || 'Invalid username or password. Please try again.';
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
        this.errorMessage.set('Please enter your City or Village name.');
        return;
      }
      if (!this.registerForm.value.pincode || !this.registerForm.value.pincode.trim()) {
        this.errorMessage.set('Please enter your 6-digit postal Pincode.');
        return;
      }
      if (!this.registerForm.value.state) {
        this.errorMessage.set('Please select your North Eastern State.');
        return;
      }
    } else if (currentRole === 'DRIVER') {
      // Email is OPTIONAL for field drivers!
      if (!this.registerForm.value.vehicleNumber || !this.registerForm.value.vehicleNumber.trim()) {
        this.errorMessage.set('Vehicle identifier is required for Field Drivers (e.g. TR-102).');
        return;
      }
      if (!this.registerForm.value.licenseNumber || !this.registerForm.value.licenseNumber.trim()) {
        this.errorMessage.set('Driving License number is required (e.g. TN01 20190001234). Use "View Example" if needed.');
        return;
      }
    } else if (currentRole === 'ADMIN') {
      const emailVal = (this.registerForm.value.email || '').trim();
      if (!emailVal || !emailVal.includes('@')) {
        this.errorMessage.set('Official government/agency email is required.');
        return;
      }
      if (!this.registerForm.value.officialId || !this.registerForm.value.officialId.trim()) {
        this.errorMessage.set('Please enter your Government Employee ID / Service Badge Code.');
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
      if (!this.registerForm.value.jurisdictionState) {
        this.errorMessage.set('Please select your Jurisdiction State.');
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
    };

    if (currentRole === 'CUSTOMER') {
      payload.area_type = val.areaType || 'CITY';
      payload.locality_name = (val.localityName || '').trim();
      payload.pincode = (val.pincode || '').trim();
      payload.state = val.state;
      payload.delivery_address = `${val.localityName}, ${val.state} - ${val.pincode}`;
    } else if (currentRole === 'DRIVER') {
      payload.vehicle_type = this.selectedVehicleType();
      payload.vehicle_number = (val.vehicleNumber || '').trim();
      payload.license_number = (val.licenseNumber || '').trim();
      payload.license_issuing_state = val.licenseIssuingState || '';
    } else if (currentRole === 'ADMIN') {
      payload.official_id = (val.officialId || '').trim();
      payload.designation = (val.designation || '').trim();
      payload.department_name = val.departmentName;
      payload.jurisdiction_state = val.jurisdictionState;
      payload.office_address = (val.officeAddress || '').trim();
      payload.organization = val.departmentName;
    }

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (currentRole === 'ADMIN') {
          this.successMessage.set('Government Official account created! Your registration is queued for Superadmin approval. You will receive login access once authorized.');
          setTimeout(() => {
            this.togglePanel(false);
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
        let msg = 'Registration failed. Please check your inputs.';
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
}
