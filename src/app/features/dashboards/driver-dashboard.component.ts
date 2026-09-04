import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <header class="navbar">
        <div class="brand">
          <i class='bx bxs-shield-plus'></i>
          <span>RESQROUTE <strong>DRIVER PWA</strong></span>
        </div>
        <div class="nav-right">
          <span class="status-indicator online">
            <span class="dot"></span> ONLINE
          </span>
          <button class="security-btn" (click)="openPasswordModal()">
            <i class='bx bx-lock-alt'></i> Change Password
          </button>
          <button class="logout-btn" (click)="logout()">
            <i class='bx bx-log-out'></i> Logout
          </button>
        </div>
      </header>

      <main class="content">
        <div class="hero-card">
          <div class="hero-info">
            <span class="badge">ASSIGNED VEHICLE</span>
            <h1>Welcome, {{ user()?.first_name || user()?.username }}!</h1>
            <p class="sub">Guwahati → Silchar Demonstration Corridor</p>
          </div>
          <div class="vehicle-badge">
            <i class='bx bxs-truck'></i>
            <span>{{ user()?.driver_profile?.vehicle_number || 'TR-102' }}</span>
          </div>
        </div>

        <!-- Notification Banner -->
        <div class="alert-banner success" *ngIf="passwordSuccess()">
          <i class='bx bx-check-circle'></i>
          <span>{{ passwordSuccess() }}</span>
          <button (click)="passwordSuccess.set(null)">×</button>
        </div>

        <div class="pwa-install-card">
          <div class="pwa-icon">
            <i class='bx bx-mobile-alt'></i>
          </div>
          <div class="pwa-text">
            <h3>PWA Field Application Ready</h3>
            <p>Install ResQRoute to your mobile home screen for field navigation and offline corridor resilience.</p>
          </div>
          <button class="install-btn" (click)="promptInstall()">
            <i class='bx bx-download'></i> Install PWA App
          </button>
        </div>

        <div class="cards-grid">
          <div class="card">
            <div class="card-icon"><i class='bx bxs-id-card'></i></div>
            <h4>Driver Credential</h4>
            <p class="val">{{ user()?.driver_profile?.license_number || 'AS-01-2023-0089123' }}</p>
            <span class="tag">Verified Driver</span>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-map-pin'></i></div>
            <h4>Assigned Base District</h4>
            <p class="val">{{ user()?.driver_profile?.district || 'Kamrup Rural' }}</p>
            <span class="tag">{{ user()?.driver_profile?.state || 'Assam' }}</span>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-business'></i></div>
            <h4>Operating Agency</h4>
            <p class="val">{{ user()?.organization || 'Assam State Transport Corp' }}</p>
            <span class="tag">Active Fleet</span>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-phone'></i></div>
            <h4>Registered Contact</h4>
            <p class="val">{{ user()?.phone_number || '9876543210' }}</p>
            <span class="tag">SMS Dispatch Enabled</span>
          </div>

          <div class="card security-card">
            <div class="card-icon lock"><i class='bx bx-shield-quarter'></i></div>
            <h4>Security & Password</h4>
            <p class="val">Field Encrypted</p>
            <button class="action-link-btn" (click)="openPasswordModal()">
              <i class='bx bx-key'></i> Update Password
            </button>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-navigation'></i></div>
            <h4>Next Phase: Trips & QR</h4>
            <p class="val">Authentication Foundation Ready</p>
            <span class="tag notice">Phase 02 Target</span>
          </div>
        </div>
      </main>

      <!-- Change Password Modal -->
      <div class="modal-backdrop" *ngIf="showPasswordModal()" (click)="closePasswordModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i class='bx bx-lock-alt text-cyan'></i>
              <h3>Update Driver Password</h3>
            </div>
            <button class="modal-close-btn" (click)="closePasswordModal()">×</button>
          </div>

          <div class="modal-body">
            <p class="modal-intro">
              Update your field access password. If you recently used a temporary SMS password, please set your permanent password here.
            </p>

            <div class="alert-inline error" *ngIf="passwordError()">
              <i class='bx bx-error-circle'></i>
              <span>{{ passwordError() }}</span>
            </div>

            <div class="form-group">
              <label>Current or Temporary Password *</label>
              <div class="input-wrap">
                <i class='bx bx-lock form-icon'></i>
                <input 
                  [type]="showCurrentPassword() ? 'text' : 'password'" 
                  [(ngModel)]="currentPassword" 
                  placeholder="Enter current or SMS temporary password" 
                />
                <button type="button" class="eye-btn" (click)="toggleCurrentPass()">
                  <i class='bx' [class.bx-show]="!showCurrentPassword()" [class.bx-hide]="showCurrentPassword()"></i>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>New Strong Password * (Min 8 chars)</label>
              <div class="input-wrap">
                <i class='bx bx-key form-icon'></i>
                <input 
                  [type]="showNewPassword() ? 'text' : 'password'" 
                  [(ngModel)]="newPassword" 
                  placeholder="Enter new password" 
                />
                <button type="button" class="eye-btn" (click)="toggleNewPass()">
                  <i class='bx' [class.bx-show]="!showNewPassword()" [class.bx-hide]="showNewPassword()"></i>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Confirm New Password *</label>
              <div class="input-wrap">
                <i class='bx bx-check-double form-icon'></i>
                <input 
                  type="password" 
                  [(ngModel)]="confirmNewPassword" 
                  placeholder="Confirm new password" 
                />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="cancel-btn" (click)="closePasswordModal()" [disabled]="passwordLoading()">
              Cancel
            </button>
            <button class="submit-btn" (click)="submitPasswordChange()" [disabled]="passwordLoading()">
              <span *ngIf="!passwordLoading()"><i class='bx bx-check-shield'></i> Update Password</span>
              <span *ngIf="passwordLoading()"><i class='bx bx-loader-alt bx-spin'></i> Updating...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: #0f172a;
      color: #f8fafc;
      font-family: 'Poppins', sans-serif;
    }
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 32px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      letter-spacing: 1px;
      color: #38bdf8;
    }
    .brand strong {
      color: #f8fafc;
      font-weight: 700;
    }
    .nav-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }
    .status-indicator .dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
    }
    .security-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .security-btn:hover {
      background: rgba(56, 189, 248, 0.25);
    }
    .logout-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #334155;
      color: #f1f5f9;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .logout-btn:hover {
      background: #ef4444;
    }
    .content {
      max-width: 1000px;
      margin: 32px auto;
      padding: 0 20px;
    }
    .hero-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      padding: 32px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(37, 99, 235, 0.25);
      margin-bottom: 24px;
    }
    .badge {
      font-size: 11px;
      letter-spacing: 1.5px;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 10px;
      border-radius: 8px;
      font-weight: 700;
    }
    .hero-card h1 {
      margin: 12px 0 6px;
      font-size: 28px;
    }
    .hero-card .sub {
      color: #93c5fd;
      margin: 0;
      font-size: 14px;
    }
    .vehicle-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.18);
      padding: 16px 24px;
      border-radius: 16px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .vehicle-badge i {
      font-size: 32px;
    }
    .alert-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-radius: 12px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .alert-banner.success {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .alert-banner button {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: inherit;
    }
    .pwa-install-card {
      display: flex;
      align-items: center;
      gap: 20px;
      background: #1e293b;
      border: 1px solid #334155;
      padding: 20px 24px;
      border-radius: 16px;
      margin-bottom: 24px;
    }
    .pwa-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      flex-shrink: 0;
    }
    .pwa-text {
      flex: 1;
    }
    .pwa-text h3 {
      margin: 0 0 4px;
      font-size: 15px;
      color: #f8fafc;
    }
    .pwa-text p {
      margin: 0;
      font-size: 13px;
      color: #94a3b8;
    }
    .install-btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .install-btn:hover {
      background: #1d4ed8;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      padding: 24px;
      border-radius: 16px;
    }
    .card-icon {
      font-size: 28px;
      color: #38bdf8;
      margin-bottom: 12px;
    }
    .card-icon.lock {
      color: #10b981;
    }
    .card h4 {
      margin: 0 0 6px;
      font-size: 13px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .card .val {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 12px;
      color: #f8fafc;
    }
    .card .tag {
      font-size: 12px;
      background: rgba(56, 189, 248, 0.15);
      padding: 4px 10px;
      border-radius: 8px;
      color: #38bdf8;
      font-weight: 500;
    }
    .card .tag.notice {
      color: #fbbf24;
      background: rgba(245, 158, 11, 0.15);
    }
    .action-link-btn {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .action-link-btn:hover {
      background: rgba(16, 185, 129, 0.25);
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    .modal-dialog {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 20px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      overflow: hidden;
      animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalPop {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #334155;
      background: #0f172a;
    }
    .modal-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .modal-title-wrap i {
      font-size: 24px;
      color: #38bdf8;
    }
    .modal-title-wrap h3 {
      margin: 0;
      font-size: 17px;
      color: #f8fafc;
      font-weight: 700;
    }
    .modal-close-btn {
      background: none;
      border: none;
      font-size: 22px;
      color: #94a3b8;
      cursor: pointer;
      line-height: 1;
    }
    .modal-close-btn:hover {
      color: #f8fafc;
    }
    .modal-body {
      padding: 24px;
    }
    .modal-intro {
      font-size: 13px;
      color: #94a3b8;
      margin: 0 0 16px;
      line-height: 1.5;
    }
    .alert-inline {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .alert-inline.error {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      font-size: 12.5px;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 6px;
    }
    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .form-icon {
      position: absolute;
      left: 12px;
      font-size: 18px;
      color: #64748b;
    }
    .input-wrap input {
      width: 100%;
      padding: 11px 40px 11px 38px;
      border: 1.5px solid #475569;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      color: #f8fafc;
      background: #0f172a;
      transition: all 0.2s;
    }
    .input-wrap input:focus {
      outline: none;
      border-color: #38bdf8;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
    }
    .eye-btn {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
    }
    .eye-btn:hover {
      color: #f8fafc;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px;
      border-top: 1px solid #334155;
      background: #0f172a;
    }
    .cancel-btn {
      padding: 10px 16px;
      border: 1px solid #475569;
      background: #1e293b;
      color: #cbd5e1;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
    }
    .cancel-btn:hover {
      background: #334155;
    }
    .submit-btn {
      padding: 10px 20px;
      border: none;
      background: #2563eb;
      color: #ffffff;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .submit-btn:hover {
      background: #1d4ed8;
    }
    .submit-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  `]
})
export class DriverDashboardComponent {
  private authService = inject(AuthService);
  public user = this.authService.currentUser;

  public showPasswordModal = signal<boolean>(false);
  public showCurrentPassword = signal<boolean>(false);
  public showNewPassword = signal<boolean>(false);
  public passwordLoading = signal<boolean>(false);
  public passwordSuccess = signal<string | null>(null);
  public passwordError = signal<string | null>(null);

  public currentPassword = '';
  public newPassword = '';
  public confirmNewPassword = '';

  public promptInstall(): void {
    alert('ResQRoute Driver PWA can be installed via Chrome/Edge browser menu -> "Install ResQRoute" or "Add to Home Screen".');
  }

  public openPasswordModal(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmNewPassword = '';
    this.passwordError.set(null);
    this.showPasswordModal.set(true);
  }

  public closePasswordModal(): void {
    if (!this.passwordLoading()) {
      this.showPasswordModal.set(false);
    }
  }

  public toggleCurrentPass(): void {
    this.showCurrentPassword.update(v => !v);
  }

  public toggleNewPass(): void {
    this.showNewPassword.update(v => !v);
  }

  public submitPasswordChange(): void {
    this.passwordError.set(null);
    if (!this.currentPassword || !this.newPassword || !this.confirmNewPassword) {
      this.passwordError.set('Please fill in all password fields.');
      return;
    }
    if (this.newPassword.length < 8) {
      this.passwordError.set('New password must be at least 8 characters long.');
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.passwordError.set('New passwords do not match.');
      return;
    }

    this.passwordLoading.set(true);
    this.authService.changePassword({
      current_password: this.currentPassword,
      new_password: this.newPassword,
      confirm_new_password: this.confirmNewPassword
    }).subscribe({
      next: (res) => {
        this.passwordLoading.set(false);
        this.showPasswordModal.set(false);
        this.passwordSuccess.set(res.message || 'Driver password updated successfully! Keep it safe for corridor dispatch.');
        setTimeout(() => this.passwordSuccess.set(null), 7000);
      },
      error: (err) => {
        this.passwordLoading.set(false);
        const errDetail = err.error?.detail || err.error?.current_password?.[0] || err.error?.new_password?.[0] || 'Failed to update password. Please check your current password.';
        this.passwordError.set(errDetail);
      }
    });
  }

  public logout(): void {
    this.authService.logout();
  }
}
