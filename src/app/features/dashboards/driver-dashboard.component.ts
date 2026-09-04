import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule],
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
            <p class="val">{{ user()?.driver_profile?.license_number || 'DRV-001' }}</p>
            <span class="tag">Verified Driver</span>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-business'></i></div>
            <h4>Operating Agency</h4>
            <p class="val">{{ user()?.organization || 'Assam State Transport Corp' }}</p>
            <span class="tag">Active Fleet</span>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-navigation'></i></div>
            <h4>Next Phase: Trips & QR</h4>
            <p class="val">Authentication Foundation Ready</p>
            <span class="tag notice">Phase 02 Target</span>
          </div>
        </div>
      </main>
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
      gap: 16px;
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
      color: #bfdbfe;
      margin: 0;
      font-size: 14px;
    }
    .vehicle-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.15);
      padding: 16px 24px;
      border-radius: 16px;
      backdrop-filter: blur(6px);
      font-size: 22px;
      font-weight: 800;
    }
    .vehicle-badge i {
      font-size: 36px;
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
      font-size: 36px;
      color: #38bdf8;
    }
    .pwa-text {
      flex: 1;
    }
    .pwa-text h3 {
      margin: 0 0 4px;
      font-size: 16px;
    }
    .pwa-text p {
      margin: 0;
      font-size: 13px;
      color: #94a3b8;
    }
    .install-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #38bdf8;
      color: #0f172a;
      border: none;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 13.5px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .install-btn:hover {
      background: #7dd3fc;
      transform: translateY(-1px);
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
    .card h4 {
      margin: 0 0 6px;
      font-size: 14px;
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
      font-size: 11px;
      background: #0f172a;
      padding: 4px 10px;
      border-radius: 8px;
      color: #38bdf8;
      font-weight: 600;
    }
    .card .tag.notice {
      color: #fbbf24;
      background: rgba(251, 191, 36, 0.1);
    }
  `]
})
export class DriverDashboardComponent {
  private authService = inject(AuthService);
  public user = this.authService.currentUser;

  public logout(): void {
    this.authService.logout();
  }

  public promptInstall(): void {
    alert('ResQRoute is PWA-ready! On mobile browsers (Chrome/Safari), tap "Add to Home Screen" from your browser share menu to install.');
  }
}
