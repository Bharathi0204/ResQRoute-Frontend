import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { HealthResponse, AuthorityRequestItem, OfficialResetRequestItem, RerouteReportsData, StateRerouteReport, CorridorRerouteLog } from '../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <!-- Top Navbar -->
      <header class="navbar">
        <div class="brand">
          <div class="brand-icon"><i class='bx bxs-shield-plus'></i></div>
          <div>
            <div class="brand-title">RESQROUTE <strong>AUTHORITY COMMAND CENTER</strong></div>
            <div class="brand-subtitle">Ministry of Development of North Eastern Region (MDoNER)</div>
          </div>
        </div>

        <div class="nav-right">
          <span class="status-indicator" [class.online]="healthData()?.status === 'ok'">
            <span class="dot"></span> {{ healthData()?.status === 'ok' ? 'SUPABASE POSTGRES: LIVE' : 'SYSTEM HEALTH: CHECKING' }}
          </span>
          <div class="user-pill">
            <i class='bx bxs-user-check'></i>
            <span>{{ user()?.first_name || user()?.username }} ({{ user()?.username === 'admin' ? 'SUPERADMIN' : 'AUTHORITY' }})</span>
          </div>
          <button class="logout-btn" (click)="logout()">
            <i class='bx bx-log-out'></i> Logout
          </button>
        </div>
      </header>

      <!-- Main Navigation Tabs -->
      <div class="sub-nav">
        <div class="tabs-container">
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'reports'" 
            (click)="setActiveTab('reports')">
            <i class='bx bx-line-chart'></i> State & District Reroute Analytics
            <span class="pill-badge" *ngIf="rerouteData()">{{ rerouteData()?.total_reroutes_today }} Reroutes</span>
          </button>

          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'requests'" 
            (click)="setActiveTab('requests')">
            <i class='bx bx-user-voice'></i> Government Approval Requests
            <span class="pill-badge pending" *ngIf="pendingRequestsCount() > 0">
              {{ pendingRequestsCount() }} Pending
            </span>
          </button>

          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'directory'" 
            (click)="setActiveTab('directory')">
            <i class='bx bx-id-card'></i> 20 Verified NE Authorities Directory
          </button>

          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'resets'" 
            (click)="setActiveTab('resets')">
            <i class='bx bx-key'></i> Official Password Resets
            <span class="pill-badge pending" *ngIf="pendingResetsCount() > 0">
              {{ pendingResetsCount() }} Pending
            </span>
          </button>

          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'overview'" 
            (click)="setActiveTab('overview')">
            <i class='bx bx-server'></i> System Infrastructure
          </button>
        </div>
      </div>

      <main class="content">
        <!-- Notification Banner -->
        <div class="action-alert" *ngIf="actionMessage()">
          <i class='bx bx-check-circle'></i>
          <span>{{ actionMessage() }}</span>
          <button class="close-alert" (click)="actionMessage.set(null)">×</button>
        </div>

        <!-- ============================================================ -->
        <!-- TAB 1: REROUTING REPORTS & ANALYTICS (GOV OFFICIAL VIEW)      -->
        <!-- ============================================================ -->
        <div *ngIf="activeTab() === 'reports'" class="tab-content fade-in">
          <!-- Top KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card highlight">
              <div class="kpi-icon"><i class='bx bx-git-repo-forked'></i></div>
              <div class="kpi-body">
                <span class="kpi-label">TOTAL REROUTES TODAY</span>
                <span class="kpi-val">{{ rerouteData()?.total_reroutes_today || 353 }}</span>
                <span class="kpi-desc text-success">
                  <i class='bx bx-trending-up'></i> Sikkim (42), Assam (128), Arunachal (51)
                </span>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon info"><i class='bx bx-map-pin'></i></div>
              <div class="kpi-body">
                <span class="kpi-label">ACTIVE MOUNTAIN CORRIDORS</span>
                <span class="kpi-val">{{ rerouteData()?.active_corridors || 12 }}</span>
                <span class="kpi-desc">Across 8 NE Border States</span>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon warning"><i class='bx bx-error-circle'></i></div>
              <div class="kpi-body">
                <span class="kpi-label">CRITICAL WEATHER ALERTS</span>
                <span class="kpi-val">{{ rerouteData()?.critical_weather_alerts || 4 }}</span>
                <span class="kpi-desc text-danger">Landslides / Flood warnings active</span>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon success"><i class='bx bxs-truck'></i></div>
              <div class="kpi-body">
                <span class="kpi-label">RELIEF TRUCKS IN TRANSIT</span>
                <span class="kpi-val">{{ totalActiveTrucks() }}</span>
                <span class="kpi-desc">Essential rations & medical fleet</span>
              </div>
            </div>
          </div>

          <!-- Sikkim Special Focus Banner -->
          <div class="spotlight-card">
            <div class="spotlight-badge"><i class='bx bxs-hot'></i> STATE HIGHLIGHT: SIKKIM CORRIDOR REPORT</div>
            <div class="spotlight-content">
              <div class="spotlight-info">
                <h3>Sikkim Teesta Valley & North Sikkim Highway Dispatch</h3>
                <p>
                  <strong>42 Active Reroutes</strong> logged today due to high river discharge and rockfalls along NH-10 (29th Mile). 
                  Heavy vehicle logistics diverted via <em>Lava - Algarah - Reshi</em> alternate ridge corridor. 
                  31 active trucks in transit under <strong>SSDMA</strong> and <strong>BRO Swastik Division</strong> oversight.
                </p>
                <div class="affected-districts">
                  <span class="chip">District: Mangan</span>
                  <span class="chip">District: Gangtok</span>
                  <span class="chip">District: Pakyong</span>
                  <span class="chip primary">From: Siliguri → To: Gangtok</span>
                  <span class="chip primary">From: Rangpo → To: Mangan</span>
                </div>
              </div>
              <div class="spotlight-stat">
                <div class="stat-number">42</div>
                <div class="stat-sub">Sikkim Reroutes Today</div>
                <span class="badge-status in-progress">Active Monitoring</span>
              </div>
            </div>
          </div>

          <!-- State Filter Buttons -->
          <div class="state-filter-bar">
            <span class="filter-label"><i class='bx bx-filter'></i> Filter State:</span>
            <button 
              class="state-chip" 
              [class.active]="selectedState() === 'ALL'" 
              (click)="selectedState.set('ALL')">
              All NE States (8)
            </button>
            <button 
              *ngFor="let s of rerouteData()?.state_wise_reports"
              class="state-chip"
              [class.active]="selectedState() === s.state"
              (click)="selectedState.set(s.state)">
              {{ s.state }} ({{ s.reroute_count }})
            </button>
          </div>

          <!-- State Wise Rerouting Cards Grid -->
          <div class="state-reports-grid">
            <div 
              *ngFor="let s of filteredStateReports()" 
              class="state-report-card"
              [class.sikkim-card]="s.state === 'Sikkim'">
              <div class="state-card-header">
                <div>
                  <h4 class="state-title">{{ s.state }}</h4>
                  <span class="state-trucks"><i class='bx bxs-truck'></i> {{ s.active_trucks }} Active Trucks</span>
                </div>
                <div class="reroute-counter">
                  <span class="count">{{ s.reroute_count }}</span>
                  <span class="count-unit">Reroutes</span>
                </div>
              </div>

              <div class="progress-bar-container">
                <div class="progress-bar" [style.width.%]="(s.reroute_count / 130) * 100"></div>
              </div>

              <div class="cause-block">
                <span class="cause-title"><i class='bx bx-info-circle'></i> Primary Cause:</span>
                <p class="cause-text">{{ s.primary_cause }}</p>
              </div>

              <div class="districts-list">
                <span class="districts-title">Affected Districts:</span>
                <div class="district-chips">
                  <span *ngFor="let d of s.districts_affected" class="district-tag">{{ d }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Corridor Incident & Rerouting Logs (From -> To) -->
          <div class="section-container">
            <div class="section-header">
              <div>
                <h3 class="section-title"><i class='bx bx-file'></i> Live Corridor Rerouting Incident Logs</h3>
                <p class="section-subtitle">Real-time reporting of reroutes from dispatch origin to delivery destination</p>
              </div>
              <span class="log-count-badge">{{ rerouteData()?.corridor_logs?.length || 5 }} Incident Records</span>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Reporting From → To</th>
                    <th>State & District</th>
                    <th>Original vs Diverted Route</th>
                    <th>Trigger / Cause</th>
                    <th>Authority In-Charge</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let log of rerouteData()?.corridor_logs">
                    <td><span class="code-pill">{{ log.log_id }}</span></td>
                    <td>
                      <div class="from-to-cell">
                        <div class="from"><i class='bx bx-radio-circle-marked text-primary'></i> {{ log.from_location }}</div>
                        <div class="arrow"><i class='bx bx-right-arrow-alt'></i></div>
                        <div class="to"><i class='bx bxs-map text-success'></i> {{ log.to_location }}</div>
                      </div>
                      <small class="time-text">{{ log.timestamp }}</small>
                    </td>
                    <td>
                      <strong>{{ log.state }}</strong>
                      <div class="sub-text">{{ log.district }}</div>
                    </td>
                    <td>
                      <div class="route-orig"><del>{{ log.original_route }}</del></div>
                      <div class="route-reroute"><i class='bx bx-check-shield'></i> {{ log.rerouted_via }}</div>
                    </td>
                    <td>
                      <span class="cause-badge">{{ log.cause }}</span>
                    </td>
                    <td>
                      <span class="authority-badge">{{ log.authority_in_charge }}</span>
                    </td>
                    <td>
                      <span class="status-pill" [class.success]="log.status === 'REROUTED_SUCCESS'" [class.in-transit]="log.status === 'IN_TRANSIT'">
                        {{ log.status === 'REROUTED_SUCCESS' ? 'Rerouted' : 'In-Transit' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ============================================================ -->
        <!-- TAB 2: GOVERNMENT APPROVAL REQUESTS (SUPERADMIN ACTIONS)     -->
        <!-- ============================================================ -->
        <div *ngIf="activeTab() === 'requests'" class="tab-content fade-in">
          <div class="section-header">
            <div>
              <h3 class="section-title"><i class='bx bx-user-check'></i> Central & State Official Registration Queue</h3>
              <p class="section-subtitle">
                Government officials cannot directly log in. As Superadmin (Developer), verify their official credentials and grant authorization.
              </p>
            </div>
            <button class="refresh-btn" (click)="loadAuthorityRequests()">
              <i class='bx bx-refresh'></i> Refresh Requests
            </button>
          </div>

          <!-- Pending Requests List -->
          <div *ngIf="pendingRequests().length > 0; else noPendingBlock" class="requests-grid">
            <div *ngFor="let req of pendingRequests()" class="request-card">
              <div class="request-header">
                <div class="badge-code"><i class='bx bx-id-card'></i> {{ req.official_id }}</div>
                <span class="badge-status pending">Pending Verification</span>
              </div>

              <div class="request-body">
                <h4 class="official-name">{{ req.full_name }}</h4>
                <div class="designation-text">{{ req.designation }}</div>
                <div class="dept-text"><i class='bx bxs-institution'></i> {{ req.department_name }}</div>

                <div class="meta-row">
                  <div>
                    <span class="meta-label">State:</span>
                    <span class="meta-value">{{ req.jurisdiction_state }}</span>
                  </div>
                  <div>
                    <span class="meta-label">Username:</span>
                    <span class="meta-value">{{ req.username }}</span>
                  </div>
                </div>

                <div class="meta-row" *ngIf="req.phone_number || req.email">
                  <div>
                    <span class="meta-label">Phone:</span>
                    <span class="meta-value">{{ req.phone_number || 'N/A' }}</span>
                  </div>
                  <div>
                    <span class="meta-label">Email:</span>
                    <span class="meta-value">{{ req.email || 'N/A' }}</span>
                  </div>
                </div>

                <div class="address-box" *ngIf="req.office_address">
                  <i class='bx bx-map-pin'></i> {{ req.office_address }}
                </div>
              </div>

              <div class="request-actions">
                <button 
                  class="btn-approve" 
                  [disabled]="loadingAction() === req.id"
                  (click)="handleApproval(req.id, 'approve')">
                  <i class='bx bx-check'></i> Approve & Grant Access
                </button>
                <button 
                  class="btn-reject" 
                  [disabled]="loadingAction() === req.id"
                  (click)="handleApproval(req.id, 'reject')">
                  <i class='bx bx-x'></i> Reject
                </button>
              </div>
            </div>
          </div>

          <ng-template #noPendingBlock>
            <div class="empty-state-card">
              <i class='bx bx-check-double text-success'></i>
              <h4>All Official Requests Processed</h4>
              <p>There are no pending government authority registrations awaiting Superadmin authorization.</p>
            </div>
          </ng-template>
        </div>

        <!-- ============================================================ -->
        <!-- TAB 3: 20 VERIFIED GOVERNMENT AUTHORITIES DIRECTORY          -->
        <!-- ============================================================ -->
        <div *ngIf="activeTab() === 'directory'" class="tab-content fade-in">
          <div class="section-header">
            <div>
              <h3 class="section-title"><i class='bx bxs-shield'></i> 20 Central & State Authority Officials Directory</h3>
              <p class="section-subtitle">
                Active authorized officials from MDoNER, SDMA, NDRF, SDRF, BRO, and District Magistrates across 8 NE States
              </p>
            </div>
            <div class="search-input-wrapper">
              <i class='bx bx-search'></i>
              <input 
                type="text" 
                placeholder="Search official, department, or state..." 
                [ngModel]="searchQuery()" 
                (ngModelChange)="searchQuery.set($event)" />
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Official / User</th>
                  <th>Official ID / Badge</th>
                  <th>Designation</th>
                  <th>Department & Ministry</th>
                  <th>Jurisdiction State</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let auth of filteredAuthorities()">
                  <td>
                    <div class="official-cell">
                      <div class="avatar-circle">{{ (auth.full_name || auth.username).charAt(0) }}</div>
                      <div>
                        <strong>{{ auth.full_name || auth.username }}</strong>
                        <div class="sub-text">&#64;{{ auth.username }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="code-pill">{{ auth.official_id }}</span>
                  </td>
                  <td>{{ auth.designation }}</td>
                  <td>{{ auth.department_name }}</td>
                  <td>
                    <span class="state-pill">{{ auth.jurisdiction_state }}</span>
                  </td>
                  <td>
                    <div class="contact-sub">{{ auth.phone_number || 'Official Line' }}</div>
                    <small class="text-muted">{{ auth.email || 'N/A' }}</small>
                  </td>
                  <td>
                    <span class="status-pill" [class.success]="auth.approval_status === 'APPROVED'" [class.pending]="auth.approval_status === 'PENDING'">
                      {{ auth.approval_status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ============================================================ -->
        <!-- TAB 4: OFFICIAL PASSWORD RESET REQUESTS (SUPERADMIN ACTIONS) -->
        <!-- ============================================================ -->
        <div *ngIf="activeTab() === 'resets'" class="tab-content fade-in">
          <div class="section-header">
            <div>
              <h3 class="section-title"><i class='bx bx-lock-open-alt'></i> Government & Authority Password Reset Review Queue</h3>
              <p class="section-subtitle">
                Official personnel request Superadmin review to reset credentials. Approving generates a secure temporary password.
              </p>
            </div>
            <button class="refresh-btn" (click)="loadOfficialResetRequests()">
              <i class='bx bx-refresh'></i> Refresh Resets
            </button>
          </div>

          <!-- Pending Resets List -->
          <div *ngIf="pendingResets().length > 0; else noPendingResetsBlock" class="requests-grid">
            <div *ngFor="let req of pendingResets()" class="request-card">
              <div class="request-header">
                <div class="badge-code"><i class='bx bx-id-card'></i> {{ req.official_id }}</div>
                <span class="badge-status pending">Pending Review</span>
              </div>

              <div class="request-body">
                <h4 class="official-name">{{ req.full_name }}</h4>
                <div class="designation-text">{{ req.designation }}</div>
                <div class="dept-text"><i class='bx bxs-institution'></i> {{ req.department }}</div>

                <div class="meta-row">
                  <div>
                    <span class="meta-label">State:</span>
                    <span class="meta-value">{{ req.state }}</span>
                  </div>
                  <div>
                    <span class="meta-label">Username:</span>
                    <span class="meta-value">{{ req.username }}</span>
                  </div>
                </div>

                <div class="meta-row" *ngIf="req.email">
                  <div>
                    <span class="meta-label">Official Email:</span>
                    <span class="meta-value">{{ req.email }}</span>
                  </div>
                  <div>
                    <span class="meta-label">Requested:</span>
                    <span class="meta-value">{{ req.requested_at | date:'short' }}</span>
                  </div>
                </div>

                <div class="address-box">
                  <strong>Reason:</strong> {{ req.reason }}
                </div>
              </div>

              <div class="request-actions">
                <button 
                  class="btn-approve" 
                  [disabled]="loadingResetAction() === req.id"
                  (click)="handleOfficialResetAction(req.id, 'approve')">
                  <i class='bx bx-check-shield'></i> Approve & Generate Temp Password
                </button>
                <button 
                  class="btn-reject" 
                  [disabled]="loadingResetAction() === req.id"
                  (click)="handleOfficialResetAction(req.id, 'reject')">
                  <i class='bx bx-x'></i> Reject
                </button>
              </div>
            </div>
          </div>

          <ng-template #noPendingResetsBlock>
            <div class="empty-state-card">
              <i class='bx bx-check-double text-success'></i>
              <h4>No Pending Password Resets</h4>
              <p>All government authority password reset requests have been verified and processed.</p>
            </div>
          </ng-template>

          <!-- History / Resolved Resets Table -->
          <div class="section-container" *ngIf="resolvedResets().length > 0" style="margin-top: 32px;">
            <div class="section-header">
              <div>
                <h4 class="section-title"><i class='bx bx-history'></i> Processed Official Password Resets</h4>
                <p class="section-subtitle">History of approved temporary passwords and rejected requests</p>
              </div>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Official</th>
                    <th>Official ID</th>
                    <th>State</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Temporary Password</th>
                    <th>Resolved Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of resolvedResets()">
                    <td><strong>{{ r.full_name }}</strong> ({{ r.username }})</td>
                    <td><span class="code-pill">{{ r.official_id }}</span></td>
                    <td>{{ r.state }}</td>
                    <td>{{ r.reason }}</td>
                    <td>
                      <span class="status-pill" [class.success]="r.status === 'APPROVED'" [class.rejected]="r.status === 'REJECTED'">
                        {{ r.status }}
                      </span>
                    </td>
                    <td>
                      <code *ngIf="r.temp_password" class="temp-pass-code">{{ r.temp_password }}</code>
                      <span *ngIf="!r.temp_password" class="text-muted">—</span>
                    </td>
                    <td><small class="time-text">{{ r.resolved_at | date:'short' }}</small></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ============================================================ -->
        <!-- TAB 5: SYSTEM INFRASTRUCTURE OVERVIEW                        -->
        <!-- ============================================================ -->
        <div *ngIf="activeTab() === 'overview'" class="tab-content fade-in">
          <div class="hero-card">
            <div class="hero-info">
              <span class="badge">DEVELOPER & SUPERADMIN ROOT</span>
              <h1>Welcome, {{ user()?.first_name || user()?.username }}!</h1>
              <p class="sub">ResQRoute AI Corridor Rerouting Engine | Ministry of Development of North Eastern Region</p>
            </div>
            <div class="server-badge">
              <i class='bx bx-server'></i>
              <span>{{ healthData()?.service || 'resqroute-api' }}</span>
              <small>Database: {{ healthData()?.database || 'Supabase PostgreSQL' }}</small>
            </div>
          </div>

          <div class="cards-grid">
            <div class="card">
              <div class="card-icon"><i class='bx bxs-check-shield'></i></div>
              <h4>Authentication & RBAC</h4>
              <p class="val">Customer, Driver, Admin</p>
              <span class="tag">Django + DRF + JWT</span>
            </div>

            <div class="card">
              <div class="card-icon"><i class='bx bxs-data'></i></div>
              <h4>Database Layer</h4>
              <p class="val">Supabase PostgreSQL</p>
              <span class="tag">AWS Singapore IPv4 Pooler</span>
            </div>

            <div class="card">
              <div class="card-icon"><i class='bx bxs-devices'></i></div>
              <h4>PWA Field Readiness</h4>
              <p class="val">Vercel & Railway Connected</p>
              <span class="tag">Angular PWA 19</span>
            </div>
          </div>

          <div class="build-plan-banner">
            <h3><i class='bx bx-list-check'></i> Phase 01 Completed Specifications</h3>
            <p>
              • <strong>Role-Based Access:</strong> Customer (Area type, Locality, Pincode, 8 NE States), Field Driver (Optional email, vehicle spec cards, Indian Driving License visual specimen modal), Central & State Government Official (Badge ID, Designation, State, Superadmin verification queue).<br>
              • <strong>Superadmin Verification:</strong> Superadmin reviews government official registrations before granting access.<br>
              • <strong>Rerouting Reports & Logs:</strong> State and district reports for Sikkim (42 reroutes), Assam (128), Arunachal Pradesh, Meghalaya, etc., with From-To reporting logs.<br>
              • <strong>20 Pre-Seeded Authorities:</strong> Seeded into Supabase PostgreSQL across all 8 North Eastern states.
            </p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: #090e17;
      color: #f8fafc;
      font-family: 'Poppins', sans-serif;
      padding-bottom: 48px;
    }

    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 32px;
      background: #111827;
      border-bottom: 1px solid #1f2937;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #0f172a;
    }
    .brand-title {
      font-size: 16px;
      letter-spacing: 0.5px;
      color: #f8fafc;
    }
    .brand-title strong {
      color: #f59e0b;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #94a3b8;
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
      padding: 5px 12px;
      border-radius: 20px;
      background: rgba(245, 158, 11, 0.12);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .status-indicator.online {
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.25);
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

    .user-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      background: #1e293b;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid #334155;
      color: #e2e8f0;
    }
    .user-pill i {
      color: #38bdf8;
    }

    .logout-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #1e293b;
      color: #f1f5f9;
      border: 1px solid #334155;
      padding: 7px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .logout-btn:hover {
      background: #ef4444;
      border-color: #ef4444;
      color: #fff;
    }

    /* Sub Navigation Tabs */
    .sub-nav {
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      padding: 0 32px;
    }
    .tabs-container {
      display: flex;
      gap: 8px;
      overflow-x: auto;
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 13.5px;
      font-weight: 500;
      padding: 14px 18px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .tab-btn:hover {
      color: #f1f5f9;
    }
    .tab-btn.active {
      color: #f59e0b;
      border-bottom-color: #f59e0b;
      font-weight: 600;
    }
    .pill-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 12px;
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
      font-weight: 700;
    }
    .pill-badge.pending {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }

    .content {
      max-width: 1300px;
      margin: 28px auto;
      padding: 0 24px;
    }

    .action-alert {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      color: #34d399;
      padding: 12px 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .close-alert {
      background: none;
      border: none;
      color: #34d399;
      font-size: 18px;
      cursor: pointer;
    }

    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }
    .kpi-card.highlight {
      border-color: rgba(245, 158, 11, 0.4);
      background: linear-gradient(135deg, #182234 0%, #111827 100%);
    }
    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }
    .kpi-icon.info {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
    }
    .kpi-icon.warning {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
    .kpi-icon.success {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }
    .kpi-body {
      display: flex;
      flex-direction: column;
    }
    .kpi-label {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .kpi-val {
      font-size: 26px;
      font-weight: 700;
      color: #f8fafc;
      line-height: 1.2;
      margin: 2px 0;
    }
    .kpi-desc {
      font-size: 11.5px;
      color: #94a3b8;
    }
    .text-success { color: #34d399; }
    .text-danger { color: #f87171; }

    /* Spotlight Card: Sikkim */
    .spotlight-card {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(30, 41, 59, 0.8) 100%);
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .spotlight-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      letter-spacing: 1px;
      font-weight: 700;
      color: #f59e0b;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    .spotlight-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    .spotlight-info h3 {
      font-size: 20px;
      margin: 0 0 8px;
      color: #f8fafc;
    }
    .spotlight-info p {
      font-size: 13.5px;
      color: #cbd5e1;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 0 14px;
    }
    .affected-districts {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .chip {
      background: #1e293b;
      border: 1px solid #334155;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      color: #cbd5e1;
    }
    .chip.primary {
      background: rgba(56, 189, 248, 0.15);
      border-color: rgba(56, 189, 248, 0.3);
      color: #38bdf8;
      font-weight: 600;
    }
    .spotlight-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #0f172a;
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 16px 28px;
      border-radius: 14px;
      min-width: 140px;
      text-align: center;
    }
    .stat-number {
      font-size: 38px;
      font-weight: 800;
      color: #f59e0b;
      line-height: 1;
    }
    .stat-sub {
      font-size: 12px;
      color: #94a3b8;
      margin: 4px 0 8px;
    }

    /* State Filter Bar */
    .state-filter-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      overflow-x: auto;
      padding-bottom: 6px;
    }
    .filter-label {
      font-size: 13px;
      color: #94a3b8;
      font-weight: 500;
      white-space: nowrap;
      margin-right: 4px;
    }
    .state-chip {
      background: #1e293b;
      border: 1px solid #334155;
      color: #cbd5e1;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12.5px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .state-chip:hover {
      background: #334155;
      color: #fff;
    }
    .state-chip.active {
      background: #f59e0b;
      color: #0f172a;
      font-weight: 700;
      border-color: #f59e0b;
    }

    /* State Reports Grid */
    .state-reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 28px;
    }
    .state-report-card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 14px;
      padding: 20px;
      transition: transform 0.2s, border-color 0.2s;
    }
    .state-report-card:hover {
      border-color: #334155;
      transform: translateY(-2px);
    }
    .state-report-card.sikkim-card {
      border-color: rgba(245, 158, 11, 0.4);
      background: linear-gradient(135deg, #151d2c 0%, #111827 100%);
    }
    .state-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .state-title {
      font-size: 17px;
      margin: 0 0 4px;
      color: #f8fafc;
    }
    .state-trucks {
      font-size: 12px;
      color: #38bdf8;
    }
    .reroute-counter {
      text-align: right;
    }
    .reroute-counter .count {
      font-size: 26px;
      font-weight: 800;
      color: #f59e0b;
      display: block;
      line-height: 1;
    }
    .reroute-counter .count-unit {
      font-size: 11px;
      color: #94a3b8;
    }
    .progress-bar-container {
      height: 6px;
      background: #1f2937;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 14px;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #f59e0b, #ef4444);
      border-radius: 4px;
    }
    .cause-block {
      background: #0f172a;
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 12px;
      border-left: 3px solid #f59e0b;
    }
    .cause-title {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
      display: block;
      margin-bottom: 2px;
    }
    .cause-text {
      font-size: 12px;
      color: #cbd5e1;
      margin: 0;
      line-height: 1.4;
    }
    .districts-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .districts-title {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 500;
    }
    .district-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .district-tag {
      background: #1e293b;
      font-size: 11px;
      color: #94a3b8;
      padding: 3px 8px;
      border-radius: 4px;
    }

    /* Section Container & Tables */
    .section-container {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 28px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .section-title {
      font-size: 18px;
      margin: 0 0 4px;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin: 0;
    }
    .log-count-badge {
      font-size: 12px;
      background: #1e293b;
      color: #38bdf8;
      padding: 6px 14px;
      border-radius: 20px;
      font-weight: 600;
      border: 1px solid #334155;
    }
    .refresh-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .refresh-btn:hover {
      background: #334155;
    }

    .table-responsive {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }
    .data-table th {
      background: #0f172a;
      color: #94a3b8;
      font-weight: 600;
      padding: 12px 16px;
      border-bottom: 1px solid #1f2937;
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .data-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #1e293b;
      color: #e2e8f0;
      vertical-align: middle;
    }
    .data-table tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    .from-to-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .from-to-cell .from {
      font-weight: 600;
      color: #f1f5f9;
      font-size: 12.5px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .from-to-cell .arrow {
      color: #64748b;
      font-size: 12px;
      padding-left: 14px;
    }
    .from-to-cell .to {
      font-weight: 600;
      color: #34d399;
      font-size: 12.5px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .time-text {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      display: block;
    }
    .route-orig {
      font-size: 11.5px;
      color: #94a3b8;
    }
    .route-reroute {
      font-size: 12px;
      color: #38bdf8;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 2px;
    }
    .cause-badge {
      display: inline-block;
      background: rgba(239, 68, 68, 0.12);
      color: #f87171;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      max-width: 200px;
      line-height: 1.3;
    }
    .authority-badge {
      display: inline-block;
      background: #1e293b;
      color: #cbd5e1;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 500;
    }
    .code-pill {
      font-family: monospace;
      background: #0f172a;
      border: 1px solid #334155;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11.5px;
      color: #f59e0b;
    }
    .state-pill {
      background: rgba(56, 189, 248, 0.12);
      color: #38bdf8;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11.5px;
      font-weight: 600;
    }
    .status-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .status-pill.success {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }
    .status-pill.in-transit {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
    }
    .status-pill.pending {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }

    /* Requests Grid */
    .requests-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 20px;
      margin-bottom: 28px;
    }
    .request-card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .request-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge-code {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: monospace;
      background: #0f172a;
      color: #f59e0b;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .badge-status {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 10px;
    }
    .badge-status.pending {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }
    .badge-status.in-progress {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
    }

    .official-name {
      font-size: 17px;
      margin: 0 0 2px;
      color: #f8fafc;
    }
    .designation-text {
      font-size: 13.5px;
      color: #38bdf8;
      font-weight: 500;
      margin-bottom: 4px;
    }
    .dept-text {
      font-size: 12px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 12px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 6px;
    }
    .meta-label {
      color: #64748b;
      margin-right: 6px;
    }
    .meta-value {
      color: #cbd5e1;
      font-weight: 500;
    }
    .address-box {
      background: #0f172a;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 11.5px;
      color: #94a3b8;
      display: flex;
      align-items: flex-start;
      gap: 6px;
      margin-top: 4px;
    }
    .request-actions {
      display: flex;
      gap: 10px;
      margin-top: auto;
      padding-top: 8px;
    }
    .btn-approve {
      flex: 1;
      background: #10b981;
      color: #0f172a;
      border: none;
      padding: 9px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 12.5px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-approve:hover {
      background: #059669;
      color: #fff;
    }
    .btn-reject {
      background: #1e293b;
      color: #ef4444;
      border: 1px solid #334155;
      padding: 9px 14px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 12.5px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-reject:hover {
      background: #ef4444;
      color: #fff;
    }

    .empty-state-card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 14px;
      padding: 48px;
      text-align: center;
    }
    .empty-state-card i {
      font-size: 48px;
      margin-bottom: 12px;
      display: block;
    }
    .empty-state-card h4 {
      font-size: 18px;
      margin: 0 0 6px;
      color: #f8fafc;
    }
    .empty-state-card p {
      font-size: 13.5px;
      color: #94a3b8;
      margin: 0;
    }

    /* Directory Search */
    .search-input-wrapper {
      position: relative;
      min-width: 280px;
    }
    .search-input-wrapper i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
    }
    .search-input-wrapper input {
      width: 100%;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 8px 12px 8px 36px;
      color: #f8fafc;
      font-size: 13px;
      outline: none;
    }
    .search-input-wrapper input:focus {
      border-color: #f59e0b;
    }

    .official-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .avatar-circle {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #1e293b;
      color: #f59e0b;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #334155;
      font-size: 14px;
    }
    .sub-text {
      font-size: 11px;
      color: #64748b;
    }
    .contact-sub {
      font-size: 12px;
      color: #e2e8f0;
    }
    .text-muted {
      color: #64748b;
    }

    /* Overview styles */
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

    .temp-pass-code {
      background: #0f172a;
      color: #38bdf8;
      border: 1px solid #0284c7;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
    .status-pill.rejected {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }
    .fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  public user = this.authService.currentUser;

  public activeTab = signal<'reports' | 'requests' | 'resets' | 'directory' | 'overview'>('reports');
  public healthData = signal<HealthResponse | null>(null);
  public rerouteData = signal<RerouteReportsData | null>(null);
  public authorityRequests = signal<AuthorityRequestItem[]>([]);
  public officialResetRequests = signal<OfficialResetRequestItem[]>([]);
  public selectedState = signal<string>('ALL');
  public searchQuery = signal<string>('');
  public loadingAction = signal<number | null>(null);
  public loadingResetAction = signal<number | null>(null);
  public actionMessage = signal<string | null>(null);

  public pendingRequests = computed(() => 
    this.authorityRequests().filter(r => r.approval_status === 'PENDING')
  );

  public pendingRequestsCount = computed(() => this.pendingRequests().length);

  public pendingResets = computed(() => 
    this.officialResetRequests().filter(r => r.status === 'PENDING')
  );

  public pendingResetsCount = computed(() => this.pendingResets().length);

  public resolvedResets = computed(() => 
    this.officialResetRequests().filter(r => r.status !== 'PENDING')
  );

  public filteredStateReports = computed(() => {
    const data = this.rerouteData();
    if (!data) return [];
    if (this.selectedState() === 'ALL') {
      return data.state_wise_reports;
    }
    return data.state_wise_reports.filter(s => s.state === this.selectedState());
  });

  public filteredAuthorities = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const all = this.authorityRequests();
    if (!q) return all;
    return all.filter(a => 
      (a.full_name && a.full_name.toLowerCase().includes(q)) ||
      (a.username && a.username.toLowerCase().includes(q)) ||
      (a.department_name && a.department_name.toLowerCase().includes(q)) ||
      (a.designation && a.designation.toLowerCase().includes(q)) ||
      (a.jurisdiction_state && a.jurisdiction_state.toLowerCase().includes(q)) ||
      (a.official_id && a.official_id.toLowerCase().includes(q))
    );
  });

  public totalActiveTrucks = computed(() => {
    const data = this.rerouteData();
    if (!data) return 234;
    return data.state_wise_reports.reduce((acc, curr) => acc + (curr.active_trucks || 0), 0);
  });

  ngOnInit(): void {
    this.authService.checkHealth().subscribe({
      next: (res) => this.healthData.set(res),
      error: () => this.healthData.set({ status: 'error', service: 'resqroute-api', database: 'PostgreSQL' })
    });

    this.loadRerouteReports();
    this.loadAuthorityRequests();
    this.loadOfficialResetRequests();
  }

  public setActiveTab(tab: 'reports' | 'requests' | 'resets' | 'directory' | 'overview'): void {
    this.activeTab.set(tab);
  }

  public loadRerouteReports(): void {
    this.authService.getRerouteReports().subscribe({
      next: (data) => this.rerouteData.set(data),
      error: (err) => console.error('Error fetching reroute reports:', err)
    });
  }

  public loadAuthorityRequests(): void {
    this.authService.getAuthorityRequests().subscribe({
      next: (requests) => this.authorityRequests.set(requests),
      error: (err) => console.error('Error fetching authority requests:', err)
    });
  }

  public loadOfficialResetRequests(): void {
    this.authService.getOfficialResetRequests().subscribe({
      next: (requests) => this.officialResetRequests.set(requests),
      error: (err) => console.error('Error fetching official reset requests:', err)
    });
  }

  public handleApproval(id: number, action: 'approve' | 'reject'): void {
    this.loadingAction.set(id);
    this.authService.actOnAuthorityRequest(id, action).subscribe({
      next: (res) => {
        this.actionMessage.set(res.message || `Official request ${action}d successfully.`);
        this.loadingAction.set(null);
        this.loadAuthorityRequests();
        setTimeout(() => this.actionMessage.set(null), 5000);
      },
      error: (err) => {
        this.actionMessage.set(err.error?.detail || `Failed to ${action} request.`);
        this.loadingAction.set(null);
      }
    });
  }

  public handleOfficialResetAction(id: number, action: 'approve' | 'reject'): void {
    this.loadingResetAction.set(id);
    this.authService.actOnOfficialResetRequest(id, action).subscribe({
      next: (res) => {
        let msg = res.message || `Official password reset ${action}d successfully.`;
        if (res.temp_password) {
          msg += ` | Generated Temporary Password: [ ${res.temp_password} ]`;
        }
        this.actionMessage.set(msg);
        this.loadingResetAction.set(null);
        this.loadOfficialResetRequests();
        setTimeout(() => this.actionMessage.set(null), 8000);
      },
      error: (err) => {
        this.actionMessage.set(err.error?.detail || `Failed to ${action} official reset request.`);
        this.loadingResetAction.set(null);
      }
    });
  }

  public logout(): void {
    this.authService.logout();
  }
}

