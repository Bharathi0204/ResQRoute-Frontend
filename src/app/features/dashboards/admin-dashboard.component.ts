import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { HealthResponse } from '../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <header class="navbar">
        <div class="brand">
          <i class='bx bxs-shield-plus'></i>
          <span>RESQROUTE <strong>CONTROL CENTER</strong></span>
        </div>
        <div class="nav-right">
          <span class="status-indicator" [class.online]="healthData()?.status === 'ok'">
            <span class="dot"></span> {{ healthData()?.status === 'ok' ? 'SYSTEM HEALTH: OK' : 'SYSTEM HEALTH: CHECKING' }}
          </span>
          <button class="logout-btn" (click)="logout()">
            <i class='bx bx-log-out'></i> Logout
          </button>
        </div>
      </header>

      <main class="content">
        <div class="hero-card">
          <div class="hero-info">
            <span class="badge">COMMAND & DISPATCH</span>
            <h1>Welcome, Administrator {{ user()?.first_name || user()?.username }}!</h1>
            <p class="sub">MDoNER Logistics Authority | Guwahati → Silchar Operational Corridor</p>
          </div>
          <div class="server-badge">
            <i class='bx bx-server'></i>
            <span>{{ healthData()?.service || 'resqroute-api' }}</span>
            <small>Database: {{ healthData()?.database || 'PostgreSQL' }}</small>
          </div>
        </div>

        <div class="cards-grid">
          <div class="card">
            <div class="card-icon"><i class='bx bxs-check-shield'></i></div>
            <h4>Authentication Foundation</h4>
            <p class="val">Active & Verified ✓</p>
            <span class="tag">Django + DRF + JWT</span>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-data'></i></div>
            <h4>Database Layer</h4>
            <p class="val">Supabase PostgreSQL</p>
            <span class="tag">GeoDjango Ready</span>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-devices'></i></div>
            <h4>PWA Field Readiness</h4>
            <p class="val">Vercel Deployment Ready</p>
            <span class="tag">Angular PWA</span>
          </div>
        </div>

        <div class="build-plan-banner">
          <h3><i class='bx bx-list-check'></i> SIH26002 Milestone: Phase 01 Complete</h3>
          <p>
            The project foundation, custom user authentication models, Supabase database integration, 
            and role-based access control (Customer, Driver, Admin) have been successfully built and verified.
          </p>
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
      color: #f59e0b;
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
      padding: 4px 12px;
      border-radius: 12px;
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }
    .status-indicator.online {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }
    .status-indicator .dot {
      width: 8px;
      height: 8px;
      background: #f59e0b;
      border-radius: 50%;
    }
    .status-indicator.online .dot {
      background: #10b981;
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
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid #334155;
      padding: 32px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      margin-bottom: 24px;
    }
    .badge {
      font-size: 11px;
      letter-spacing: 1.5px;
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
      padding: 4px 10px;
      border-radius: 8px;
      font-weight: 700;
    }
    .hero-card h1 {
      margin: 12px 0 6px;
      font-size: 26px;
    }
    .hero-card .sub {
      color: #94a3b8;
      margin: 0;
      font-size: 14px;
    }
    .server-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      background: rgba(255, 255, 255, 0.05);
      padding: 16px 20px;
      border-radius: 16px;
      border: 1px solid #334155;
      font-size: 16px;
      font-weight: 700;
      color: #38bdf8;
    }
    .server-badge i {
      font-size: 32px;
    }
    .server-badge small {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 400;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      padding: 24px;
      border-radius: 16px;
    }
    .card-icon {
      font-size: 28px;
      color: #f59e0b;
      margin-bottom: 12px;
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
      font-size: 11px;
      background: #0f172a;
      padding: 4px 10px;
      border-radius: 8px;
      color: #f59e0b;
      font-weight: 600;
    }
    .build-plan-banner {
      background: #1e293b;
      border-left: 4px solid #10b981;
      padding: 20px 24px;
      border-radius: 12px;
    }
    .build-plan-banner h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 6px;
      color: #34d399;
      font-size: 16px;
    }
    .build-plan-banner p {
      margin: 0;
      color: #94a3b8;
      font-size: 13.5px;
      line-height: 1.6;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  public user = this.authService.currentUser;
  public healthData = signal<HealthResponse | null>(null);

  ngOnInit(): void {
    this.authService.checkHealth().subscribe({
      next: (res) => this.healthData.set(res),
      error: () => this.healthData.set({ status: 'error', service: 'offline', database: 'disconnected' })
    });
  }

  public logout(): void {
    this.authService.logout();
  }
}
