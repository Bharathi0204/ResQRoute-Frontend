import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <header class="navbar">
        <div class="brand">
          <i class='bx bxs-shield-plus'></i>
          <span>RESQROUTE <strong>OPERATIONS PORTAL</strong></span>
        </div>
        <div class="nav-right">
          <span class="status-indicator user-badge">
            <i class='bx bxs-user-pin'></i> CUSTOMER
          </span>
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

        <div class="cards-grid">
          <div class="card">
            <div class="card-icon"><i class='bx bxs-user-account'></i></div>
            <h4>Account Profile</h4>
            <p class="val">{{ user()?.username }}</p>
            <span class="tag">{{ user()?.email }}</span>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-phone'></i></div>
            <h4>Contact Phone</h4>
            <p class="val">{{ user()?.phone_number || 'Not provided' }}</p>
            <span class="tag">Verified Contact</span>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-package'></i></div>
            <h4>Shipment Management</h4>
            <p class="val">Authentication Foundation Ready</p>
            <span class="tag notice">Phase 03 Target</span>
          </div>
        </div>
      </main>
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
      gap: 10px;
      font-size: 18px;
      letter-spacing: 1px;
      color: #2563eb;
    }
    .brand strong {
      color: #0f172a;
      font-weight: 700;
    }
    .nav-right {
      display: flex;
      align-items: center;
      gap: 16px;
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
  `]
})
export class CustomerDashboardComponent {
  private authService = inject(AuthService);
  public user = this.authService.currentUser;

  public logout(): void {
    this.authService.logout();
  }
}
