import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <header class="navbar">
        <div class="brand">
          <img src="assets/resqroute-logo.jpg" alt="ResQRoute Logo" class="brand-logo-img">
          <div class="brand-text">
            <span>RESQROUTE <strong>OPERATIONS PORTAL</strong></span>
            <small class="brand-sub">Northeast Logistics Corridor</small>
          </div>
        </div>
        <div class="nav-right">
          <span class="status-indicator user-badge">
            <i class='bx bxs-user-pin'></i> CUSTOMER
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
            <span class="badge">LOGISTICS REQUISITIONER</span>
            <h1>Welcome, {{ user()?.first_name || user()?.username }}!</h1>
            <p class="sub">{{ user()?.organization || 'Guwahati Medical College & Hospital' }}</p>
          </div>
          <div class="org-badge">
            <i class='bx bxs-institution'></i>
            <span>{{ user()?.customer_profile?.department || 'Emergency Supplies' }}</span>
          </div>
        </div>

        <!-- Success/Error Global Toast -->
        <div class="alert-banner success" *ngIf="passwordSuccess()">
          <i class='bx bx-check-circle'></i>
          <span>{{ passwordSuccess() }}</span>
          <button (click)="passwordSuccess.set(null)">×</button>
        </div>

        <div class="cards-grid">
          <div class="card">
            <div class="card-icon"><i class='bx bxs-user-account'></i></div>
            <h4>Account Profile</h4>
            <p class="val">{{ user()?.username }}</p>
            <span class="tag">{{ user()?.email }}</span>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-map-pin'></i></div>
            <h4>Region & District</h4>
            <p class="val">{{ user()?.customer_profile?.district || 'Kamrup Metropolitan' }}</p>
            <span class="tag">{{ user()?.customer_profile?.state || 'Assam' }}</span>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-phone'></i></div>
            <h4>Contact Phone</h4>
            <p class="val">{{ user()?.phone_number || 'Not provided' }}</p>
            <span class="tag">Verified Contact</span>
          </div>

          <div class="card security-card">
            <div class="card-icon lock"><i class='bx bx-shield-quarter'></i></div>
            <h4>Account Security</h4>
            <p class="val">Password Protected</p>
            <button class="action-link-btn" (click)="openPasswordModal()">
              <i class='bx bx-key'></i> Update Password
            </button>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-package'></i></div>
            <h4>Shipment Management</h4>
            <p class="val">Corridor Requisition Ready</p>
            <span class="tag notice">Phase 03 Target</span>
          </div>
        </div>
      </main>

      <!-- Change Password Modal -->
      <div class="modal-backdrop" *ngIf="showPasswordModal()" (click)="closePasswordModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i class='bx bx-lock-alt text-primary'></i>
              <h3>Update Account Password</h3>
            </div>
            <button class="modal-close-btn" (click)="closePasswordModal()">×</button>
          </div>

          <div class="modal-body">
            <p class="modal-intro">
              Enter your current password and choose a secure new password for your ResQRoute account.
            </p>

            <div class="alert-inline error" *ngIf="passwordError()">
              <i class='bx bx-error-circle'></i>
              <span>{{ passwordError() }}</span>
            </div>

            <div class="form-group">
              <label>Current Password *</label>
              <div class="input-wrap">
                <i class='bx bx-lock form-icon'></i>
                <input 
                  [type]="showCurrentPassword() ? 'text' : 'password'" 
                  [(ngModel)]="currentPassword" 
                  placeholder="Enter current password" 
                />
                <button type="button" class="eye-btn" (click)="toggleCurrentPass()">
                  <i class='bx' [class.bx-show]="!showCurrentPassword()" [class.bx-hide]="showCurrentPassword()"></i>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>New Password * (Min 8 characters)</label>
              <div class="input-wrap">
                <i class='bx bx-key form-icon'></i>
                <input 
                  [type]="showNewPassword() ? 'text' : 'password'" 
                  [(ngModel)]="newPassword" 
                  placeholder="Enter new strong password" 
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
      background: #f8fafc;
      color: #0f172a;
      font-family: 'Poppins', sans-serif;
    }
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 32px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 17px;
      letter-spacing: 0.5px;
      color: #2563eb;
    }
    .brand-logo-img {
      height: 38px;
      width: auto;
      object-fit: contain;
      border-radius: 8px;
      image-rendering: -webkit-optimize-contrast;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      letter-spacing: 0.3px;
    }
    .brand strong {
      color: #0f172a;
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
      padding: 6px 12px;
      border-radius: 12px;
      background: #eff6ff;
      color: #2563eb;
    }
    .security-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f0fdf4;
      color: #16a34a;
      border: 1px solid #bbf7d0;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .security-btn:hover {
      background: #dcfce7;
    }
    .logout-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .logout-btn:hover {
      background: #fee2e2;
      color: #dc2626;
      border-color: #fecaca;
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
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: #ffffff;
      padding: 32px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(37, 99, 235, 0.2);
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
      color: #dbeafe;
      margin: 0;
      font-size: 14px;
    }
    .org-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.18);
      padding: 16px 20px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      max-width: 220px;
    }
    .org-badge i {
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
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .alert-banner button {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: inherit;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }
    .card-icon {
      font-size: 28px;
      color: #2563eb;
      margin-bottom: 12px;
    }
    .card-icon.lock {
      color: #10b981;
    }
    .card h4 {
      margin: 0 0 6px;
      font-size: 13px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .card .val {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 12px;
      color: #0f172a;
    }
    .card .tag {
      font-size: 12px;
      background: #eff6ff;
      padding: 4px 10px;
      border-radius: 8px;
      color: #2563eb;
      font-weight: 500;
    }
    .card .tag.notice {
      color: #d97706;
      background: #fef3c7;
    }
    .action-link-btn {
      background: #f0fdf4;
      color: #16a34a;
      border: 1px solid #bbf7d0;
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
      background: #dcfce7;
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    .modal-dialog {
      background: #ffffff;
      border-radius: 20px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
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
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .modal-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .modal-title-wrap i {
      font-size: 24px;
      color: #2563eb;
    }
    .modal-title-wrap h3 {
      margin: 0;
      font-size: 17px;
      color: #0f172a;
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
      color: #0f172a;
    }
    .modal-body {
      padding: 24px;
    }
    .modal-intro {
      font-size: 13px;
      color: #64748b;
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
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      font-size: 12.5px;
      font-weight: 600;
      color: #334155;
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
      color: #94a3b8;
    }
    .input-wrap input {
      width: 100%;
      padding: 11px 40px 11px 38px;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      color: #0f172a;
      background: #ffffff;
      transition: all 0.2s;
    }
    .input-wrap input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    .eye-btn {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
    }
    .eye-btn:hover {
      color: #334155;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .cancel-btn {
      padding: 10px 16px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
    }
    .cancel-btn:hover {
      background: #f1f5f9;
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
export class CustomerDashboardComponent {
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
        this.passwordSuccess.set(res.message || 'Password updated successfully! Please keep it secure.');
        setTimeout(() => this.passwordSuccess.set(null), 7000);
      },
      error: (err) => {
        this.passwordLoading.set(false);
        const errDetail = err.error?.detail || err.error?.current_password?.[0] || err.error?.new_password?.[0] || 'Failed to update password. Please verify current password.';
        this.passwordError.set(errDetail);
      }
    });
  }

  public logout(): void {
    this.authService.logout();
  }
}
