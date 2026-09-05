import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LogisticsService } from '../../core/services/logistics.service';
import { Trip, TripStatus } from '../../core/models/logistics.model';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <header class="navbar">
        <div class="brand">
          <img src="assets/resqroute-logo.jpg" alt="ResQRoute Logo" class="brand-logo-img">
          <div class="brand-text">
            <span>RESQROUTE <strong>DRIVER PWA</strong></span>
            <small class="brand-sub">Field Logistics Corridor • MDoNER & NDMA</small>
          </div>
        </div>
        <div class="nav-right">
          <span class="status-indicator online">
            <span class="dot"></span> ONLINE
          </span>
          <button class="security-btn" (click)="openPasswordModal()">
            <i class='bx bx-lock-alt'></i> Password
          </button>
          <button class="logout-btn" (click)="logout()">
            <i class='bx bx-log-out'></i> Logout
          </button>
        </div>
      </header>

      <main class="content">
        <!-- Hero Card -->
        <div class="hero-card">
          <div class="hero-info">
            <span class="badge">FIELD DRIVER COCKPIT</span>
            <h1>Welcome, {{ user()?.first_name || user()?.username }}!</h1>
            <p class="sub">Highland Corridor Fleet • Vehicle: <strong>{{ assignedVehiclePlate }}</strong></p>
          </div>
          <div class="hero-actions">
            <button class="activate-btn" (click)="openActivateModal()">
              <i class='bx bx-qr-scan'></i> Activate Trip with QR
            </button>
          </div>
        </div>

        <!-- Alert Notification Banners -->
        <div class="alert-banner success" *ngIf="actionSuccess()">
          <i class='bx bx-check-circle'></i>
          <span>{{ actionSuccess() }}</span>
          <button (click)="actionSuccess.set(null)">×</button>
        </div>
        <div class="alert-banner error" *ngIf="actionError()">
          <i class='bx bx-error-circle'></i>
          <span>{{ actionError() }}</span>
          <button (click)="actionError.set(null)">×</button>
        </div>

        <!-- LIVE ACTIVE TRIP BANNER (TRIP ACTIVE ✓) -->
        <div class="active-trip-card" *ngIf="activeTrip() as trip">
          <div class="active-trip-header">
            <div class="active-title-block">
              <span class="pulse-active-badge">
                <span class="ping-circle"></span>
                TRIP ACTIVE ✓
              </span>
              <h2>{{ trip.trip_code }} • {{ trip.shipment?.shipment_code }}</h2>
              <span class="vehicle-plate-pill"><i class='bx bxs-truck'></i> {{ trip.vehicle_number }}</span>
            </div>
            <div class="active-meta-block">
              <span class="cargo-tag">{{ formatCargo(trip.shipment?.cargo_type || '') }}</span>
              <span class="weight-tag">{{ trip.shipment?.weight_kg || 500 }} kg</span>
            </div>
          </div>

          <!-- Corridor Route Card -->
          <div class="active-route-box">
            <div class="route-display">
              <div class="route-node">
                <i class='bx bxs-circle origin-point'></i>
                <div class="node-text">
                  <small>DISPATCH ORIGIN</small>
                  <strong>{{ trip.shipment?.origin }}</strong>
                </div>
              </div>
              <div class="route-line-wrap">
                <div class="route-progress-bar"></div>
                <i class='bx bxs-truck truck-moving-icon'></i>
              </div>
              <div class="route-node">
                <i class='bx bxs-map-pin dest-point'></i>
                <div class="node-text">
                  <small>DESTINATION</small>
                  <strong>{{ trip.shipment?.destination }}</strong>
                </div>
              </div>
            </div>

            <div class="current-segment-bar">
              <i class='bx bx-current-location'></i>
              <span><strong>Current Checkpoint:</strong> {{ trip.current_corridor_segment }}</span>
            </div>
          </div>

          <!-- AI Terrain Risk Advisory -->
          <div class="ai-advisory-banner" *ngIf="trip.shipment">
            <div class="advisory-top">
              <span class="risk-pill" [ngClass]="trip.shipment.risk_level.toLowerCase()">
                <i class='bx bx-brain'></i> AI Risk: {{ trip.shipment.risk_score }}/100 • {{ trip.shipment.risk_level }}
              </span>
              <span class="rec-route-text" *ngIf="trip.shipment.recommended_route">
                <i class='bx bx-compass'></i> {{ trip.shipment.recommended_route }}
              </span>
            </div>
            <p class="advisory-desc">{{ trip.route_advisory || trip.shipment.risk_summary }}</p>
          </div>

          <!-- Driver Transit Control Stepper -->
          <div class="transit-stepper-box">
            <h4><i class='bx bx-navigation'></i> Corridor Transit Progression</h4>
            <div class="stepper-controls">
              <button 
                class="step-action-btn in-transit-btn" 
                (click)="updateStatus(trip.trip_code, 'IN_TRANSIT', 'Mountain Pass Ridge Transit')"
                [disabled]="isUpdatingStatus() || trip.status === 'IN_TRANSIT' || trip.status === 'COMPLETED'">
                <i class='bx bx-map-alt'></i>
                <span>{{ trip.status === 'IN_TRANSIT' ? 'In-Transit Reported ✓' : 'Report Mountain Pass Checkpoint' }}</span>
              </button>

              <button 
                class="step-action-btn complete-btn" 
                (click)="updateStatus(trip.trip_code, 'COMPLETED', 'Destination Arrival')"
                [disabled]="isUpdatingStatus() || trip.status === 'COMPLETED'">
                <i class='bx bx-check-double'></i>
                <span>{{ trip.status === 'COMPLETED' ? 'Delivered & Verified ✓' : 'Confirm Destination Delivery' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Trips History & Manifests -->
        <div class="section-card">
          <div class="section-header">
            <div>
              <h2 class="section-title">
                <i class='bx bx-list-check'></i> Corridor Trip Manifests
              </h2>
              <p class="section-desc">Field missions scanned via driver QR codes or manual dispatch authorization.</p>
            </div>
            <div class="section-actions">
              <button class="refresh-btn" (click)="loadTrips()" [disabled]="isLoadingTrips()">
                <i class='bx bx-refresh' [class.bx-spin]="isLoadingTrips()"></i> Refresh
              </button>
              <button class="activate-btn-sm" (click)="openActivateModal()">
                <i class='bx bx-qr-scan'></i> Scan QR Code
              </button>
            </div>
          </div>

          <!-- Loading state -->
          <div class="loading-state" *ngIf="isLoadingTrips() && trips().length === 0">
            <i class='bx bx-loader-alt bx-spin'></i>
            <span>Loading corridor trip manifests...</span>
          </div>

          <!-- Empty state -->
          <div class="empty-state" *ngIf="!isLoadingTrips() && trips().length === 0">
            <i class='bx bx-navigation'></i>
            <p>No active corridor trips assigned yet.</p>
            <button class="activate-btn" (click)="openActivateModal()">
              <i class='bx bx-qr-scan'></i> Scan First Trip QR Badge
            </button>
          </div>

          <!-- Trips Table -->
          <div class="table-container" *ngIf="trips().length > 0">
            <table class="trips-table">
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Shipment</th>
                  <th>Assigned Corridor</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of trips()">
                  <td>
                    <span class="trip-tag">{{ t.trip_code }}</span>
                  </td>
                  <td>
                    <div class="shipment-cell">
                      <strong>{{ t.shipment?.shipment_code || 'RSQ' }}</strong>
                      <small>{{ formatCargo(t.shipment?.cargo_type || '') }}</small>
                    </div>
                  </td>
                  <td>
                    <div class="route-cell">
                      <span>{{ t.shipment?.origin }}</span>
                      <i class='bx bx-right-arrow-alt'></i>
                      <span>{{ t.shipment?.destination }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="plate-badge">{{ t.vehicle_number }}</span>
                  </td>
                  <td>
                    <span class="status-pill" [ngClass]="t.status.toLowerCase()">
                      {{ formatTripStatus(t.status) }}
                    </span>
                  </td>
                  <td>
                    <button 
                      class="view-trip-btn" 
                      *ngIf="t.status !== 'COMPLETED'"
                      (click)="setActiveTrip(t)">
                      <i class='bx bx-show'></i> Control Trip
                    </button>
                    <span class="done-tag" *ngIf="t.status === 'COMPLETED'">
                      <i class='bx bx-check'></i> Finished
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Driver Profile Information Cards -->
        <div class="cards-grid">
          <div class="card">
            <div class="card-icon"><i class='bx bxs-id-card'></i></div>
            <h4>Driver Credential</h4>
            <p class="val">{{ user()?.driver_profile?.license_number || 'AS-01-2023-0089123' }}</p>
            <span class="tag">Verified Commercial Operator</span>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-map-pin'></i></div>
            <h4>Assigned Base District</h4>
            <p class="val">{{ user()?.driver_profile?.district || 'Kamrup Rural' }}</p>
            <span class="tag">{{ user()?.driver_profile?.state || 'Assam' }}</span>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-truck'></i></div>
            <h4>Assigned Vehicle</h4>
            <p class="val">{{ assignedVehiclePlate }}</p>
            <span class="tag">Heavy Mountain Truck</span>
          </div>

          <div class="card security-card">
            <div class="card-icon lock"><i class='bx bx-shield-quarter'></i></div>
            <h4>Driver Security</h4>
            <p class="val">Password Protected</p>
            <button class="action-link-btn" (click)="openPasswordModal()">
              <i class='bx bx-key'></i> Update Password
            </button>
          </div>
        </div>
      </main>

      <!-- QR Trip Activation Modal -->
      <div class="modal-backdrop" *ngIf="showActivateModal()" (click)="closeActivateModal()">
        <div class="modal-dialog activate-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i class='bx bx-qr-scan text-cyan'></i>
              <div>
                <h3>Activate Corridor Trip</h3>
                <p class="modal-subtitle">Scan dispatch QR badge or enter cryptographic shipment token</p>
              </div>
            </div>
            <button class="close-x" (click)="closeActivateModal()">×</button>
          </div>

          <div class="modal-body">
            <!-- Quick Demo Selectors -->
            <div class="quick-demo-box">
              <small class="demo-lbl"><i class='bx bx-bolt-circle'></i> ONE-CLICK QUICK DEMO:</small>
              <div class="demo-chips">
                <button type="button" class="chip-btn" (click)="loadDemoToken('RSQ-101')">
                  Load RSQ-101 (Guwahati → Silchar)
                </button>
                <button type="button" class="chip-btn" (click)="loadDemoToken('RSQ-102')">
                  Load RSQ-102 (Siliguri → Gangtok)
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>QR Token or Shipment Code <span class="req">*</span></label>
              <div class="token-input-wrap">
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="qrInput" 
                  placeholder="e.g. RSQ-102 or RSQ-102-3D5E8A99" 
                />
              </div>
              <small class="help-text">You can paste the token string, enter the shipment code, or load a demo code above.</small>
            </div>

            <div class="form-group">
              <label>Field Vehicle Plate / Number</label>
              <input 
                type="text" 
                class="form-control" 
                [(ngModel)]="assignedVehiclePlate" 
                placeholder="e.g. AS-01-GC-4921 (TR-102)" 
              />
            </div>
          </div>

          <div class="modal-footer">
            <button class="cancel-btn" (click)="closeActivateModal()" [disabled]="isActivating()">
              Cancel
            </button>
            <button class="submit-btn activate-btn" (click)="submitActivateTrip()" [disabled]="isActivating()">
              <i class='bx bx-loader-alt bx-spin' *ngIf="isActivating()"></i>
              <i class='bx bx-check-circle' *ngIf="!isActivating()"></i>
              {{ isActivating() ? 'Verifying Token...' : 'Confirm & Activate Trip' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Change Password Modal -->
      <div class="modal-backdrop" *ngIf="showPasswordModal()" (click)="closePasswordModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i class='bx bx-lock-alt text-cyan'></i>
              <h3>Update Driver Password</h3>
            </div>
            <button class="close-x" (click)="closePasswordModal()">×</button>
          </div>

          <div class="modal-body">
            <div class="alert-banner error" *ngIf="passwordError()">
              <i class='bx bx-error-circle'></i>
              <span>{{ passwordError() }}</span>
            </div>

            <div class="form-group">
              <label>Current Password</label>
              <div class="password-input-wrap">
                <input 
                  [type]="showCurrentPassword() ? 'text' : 'password'" 
                  class="form-control" 
                  [(ngModel)]="currentPassword" 
                  placeholder="Enter current password" 
                />
                <button type="button" class="eye-toggle-btn" (click)="toggleCurrentPass()">
                  <i class='bx' [ngClass]="showCurrentPassword() ? 'bx-hide' : 'bx-show'"></i>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>New Password (min 8 characters)</label>
              <div class="password-input-wrap">
                <input 
                  [type]="showNewPassword() ? 'text' : 'password'" 
                  class="form-control" 
                  [(ngModel)]="newPassword" 
                  placeholder="Enter new password" 
                />
                <button type="button" class="eye-toggle-btn" (click)="toggleNewPass()">
                  <i class='bx' [ngClass]="showNewPassword() ? 'bx-hide' : 'bx-show'"></i>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Confirm New Password</label>
              <div class="password-input-wrap">
                <input 
                  type="password" 
                  class="form-control" 
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
      padding: 16px 32px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
      color: #0284c7;
    }
    .brand-logo-img {
      height: 38px;
      width: auto;
      border-radius: 8px;
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
    }
    .status-indicator.online {
      background: #ecfdf5;
      color: #059669;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
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
    .security-btn:hover { background: #dcfce7; }
    .logout-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #fff1f2;
      color: #e11d48;
      border: 1px solid #fecdd3;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .logout-btn:hover { background: #ffe4e6; }

    .content {
      max-width: 1280px;
      margin: 0 auto;
      padding: 28px 24px 60px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .hero-card {
      background: linear-gradient(135deg, #0369a1 0%, #0284c7 55%, #0ea5e9 100%);
      color: #ffffff;
      padding: 28px 32px;
      border-radius: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.25);
      flex-wrap: wrap;
      gap: 20px;
    }
    .hero-info .badge {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
    }
    .hero-info h1 {
      margin: 10px 0 6px;
      font-size: 26px;
      font-weight: 700;
    }
    .hero-info .sub {
      opacity: 0.9;
      font-size: 14px;
      margin: 0;
    }
    .activate-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      color: #0369a1;
      border: none;
      padding: 12px 22px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      transition: all 0.2s;
    }
    .activate-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
      background: #f8fafc;
    }

    /* TRIP ACTIVE BANNER */
    .active-trip-card {
      background: #ffffff;
      border: 2px solid #0284c7;
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 10px 30px -5px rgba(2, 132, 199, 0.15);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .active-trip-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 14px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 16px;
    }
    .active-title-block {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .pulse-active-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #6ee7b7;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      width: fit-content;
    }
    .ping-circle {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
    }
    .active-title-block h2 {
      margin: 0;
      font-size: 22px;
      color: #0f172a;
      font-weight: 700;
    }
    .vehicle-plate-pill {
      font-size: 12px;
      background: #f1f5f9;
      color: #334155;
      padding: 3px 8px;
      border-radius: 6px;
      width: fit-content;
      font-family: monospace;
      font-weight: 600;
    }
    .active-meta-block {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .cargo-tag {
      background: #e0f2fe;
      color: #0369a1;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
    }
    .weight-tag {
      background: #f1f5f9;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      font-family: monospace;
    }

    /* Route Box */
    .active-route-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .route-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .route-node {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .origin-point { color: #0284c7; font-size: 16px; }
    .dest-point { color: #10b981; font-size: 20px; }
    .node-text { display: flex; flex-direction: column; }
    .node-text small { font-size: 10.5px; color: #64748b; font-weight: 700; }
    .node-text strong { font-size: 14px; color: #0f172a; }

    .route-line-wrap {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .route-progress-bar {
      width: 100%;
      height: 4px;
      background: #cbd5e1;
      border-radius: 2px;
    }
    .truck-moving-icon {
      position: absolute;
      color: #0284c7;
      font-size: 24px;
      background: #ffffff;
      padding: 2px;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    .current-segment-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #334155;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
    }
    .current-segment-bar i { color: #0284c7; font-size: 18px; }

    /* AI Terrain Advisory */
    .ai-advisory-banner {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .advisory-top {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .risk-pill {
      font-size: 11.5px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .risk-pill.safe { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .risk-pill.caution { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    .risk-pill.blocked { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .rec-route-text { font-size: 12px; color: #6b21a8; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
    .advisory-desc { font-size: 13px; color: #334155; margin: 0; line-height: 1.45; }

    /* Stepper Box */
    .transit-stepper-box {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .transit-stepper-box h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .stepper-controls {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .step-action-btn {
      flex: 1;
      min-width: 220px;
      padding: 12px 18px;
      border-radius: 10px;
      border: none;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .in-transit-btn { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .in-transit-btn:hover:not(:disabled) { background: #fde68a; }
    .complete-btn { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .complete-btn:hover:not(:disabled) { background: #a7f3d0; }
    .step-action-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Section Card */
    .section-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 14px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 4px;
    }
    .section-desc { font-size: 13px; color: #64748b; margin: 0; }
    .section-actions { display: flex; align-items: center; gap: 10px; }
    .refresh-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }
    .activate-btn-sm {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }

    /* Table Styles */
    .table-container {
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }
    .trips-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }
    .trips-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    .trips-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .trips-table tr:hover { background: #f8fafc; }
    .trip-tag { font-family: monospace; font-weight: 700; color: #0284c7; }
    .shipment-cell { display: flex; flex-direction: column; }
    .shipment-cell strong { color: #0f172a; }
    .shipment-cell small { color: #64748b; font-size: 11px; }
    .route-cell { display: flex; align-items: center; gap: 6px; font-size: 12.5px; }
    .plate-badge { font-family: monospace; font-weight: 600; background: #f1f5f9; padding: 3px 8px; border-radius: 4px; }
    .status-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11.5px;
      font-weight: 700;
    }
    .status-pill.ready { background: #f1f5f9; color: #475569; }
    .status-pill.active { background: #eff6ff; color: #1d4ed8; }
    .status-pill.in_transit { background: #fef3c7; color: #b45309; }
    .status-pill.completed { background: #ecfdf5; color: #047857; }

    .view-trip-btn {
      background: #eff6ff;
      color: #0284c7;
      border: 1px solid #bae6fd;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .view-trip-btn:hover { background: #0284c7; color: #ffffff; }
    .done-tag { font-size: 12px; color: #059669; font-weight: 600; }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      gap: 12px;
      color: #64748b;
    }
    .loading-state i, .empty-state i { font-size: 38px; color: #94a3b8; }

    /* Cards Grid */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .card-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #e0f2fe;
      color: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      margin-bottom: 12px;
    }
    .card-icon.lock { background: #f0fdf4; color: #16a34a; }
    .card h4 { font-size: 13px; color: #64748b; margin: 0 0 6px; font-weight: 500; }
    .card .val { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 10px; }
    .card .tag {
      font-size: 11.5px;
      background: #f1f5f9;
      color: #475569;
      padding: 3px 8px;
      border-radius: 6px;
      width: fit-content;
    }
    .action-link-btn {
      background: none;
      border: none;
      color: #0284c7;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 0;
      margin-top: 4px;
    }
    .action-link-btn:hover { text-decoration: underline; }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }
    .modal-dialog {
      background: #ffffff;
      border-radius: 18px;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      max-height: 90vh;
    }
    .activate-dialog { max-width: 560px; }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
    }
    .modal-title-wrap { display: flex; align-items: center; gap: 12px; }
    .modal-title-wrap i { font-size: 24px; color: #0284c7; }
    .modal-title-wrap h3 { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; }
    .modal-subtitle { margin: 2px 0 0; font-size: 12px; color: #64748b; }
    .close-x { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; }

    .modal-body {
      padding: 20px 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 12.5px; font-weight: 600; color: #334155; }
    .req { color: #dc2626; }
    .form-control {
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13.5px;
      color: #0f172a;
      outline: none;
    }
    .form-control:focus { border-color: #0284c7; }
    .help-text { font-size: 11.5px; color: #64748b; }

    .quick-demo-box {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .demo-lbl { font-size: 10.5px; font-weight: 700; color: #0369a1; letter-spacing: 0.5px; }
    .demo-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip-btn {
      background: #ffffff;
      border: 1px solid #7dd3fc;
      color: #0369a1;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .chip-btn:hover { background: #0284c7; color: #ffffff; }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .cancel-btn {
      padding: 9px 18px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .submit-btn {
      padding: 9px 20px;
      background: #0284c7;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .submit-btn:hover { background: #0369a1; }
    .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

    /* Alert Banners */
    .alert-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13px;
    }
    .alert-banner.success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .alert-banner.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .alert-banner button { margin-left: auto; background: none; border: none; font-size: 18px; cursor: pointer; color: inherit; }

    .password-input-wrap { position: relative; display: flex; align-items: center; }
    .eye-toggle-btn {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-size: 18px;
    }

    @media (max-width: 768px) {
      .route-display { flex-direction: column; align-items: flex-start; }
      .route-line-wrap { display: none; }
      .navbar { padding: 14px 16px; }
      .content { padding: 16px; }
    }
  `]
})
export class DriverDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private logisticsService = inject(LogisticsService);

  public user = this.authService.currentUser;

  // Trips state
  public trips = signal<Trip[]>([]);
  public activeTrip = signal<Trip | null>(null);
  public isLoadingTrips = signal<boolean>(false);
  public isUpdatingStatus = signal<boolean>(false);
  public actionSuccess = signal<string | null>(null);
  public actionError = signal<string | null>(null);

  // Activate Modal
  public showActivateModal = signal<boolean>(false);
  public isActivating = signal<boolean>(false);
  public qrInput = '';
  public assignedVehiclePlate = 'TR-102';

  // Password Modal
  public showPasswordModal = signal<boolean>(false);
  public showCurrentPassword = signal<boolean>(false);
  public showNewPassword = signal<boolean>(false);
  public passwordLoading = signal<boolean>(false);
  public passwordSuccess = signal<string | null>(null);
  public passwordError = signal<string | null>(null);

  public currentPassword = '';
  public newPassword = '';
  public confirmNewPassword = '';

  ngOnInit(): void {
    if (this.user()?.driver_profile?.vehicle_number) {
      this.assignedVehiclePlate = this.user()!.driver_profile!.vehicle_number;
    }
    this.loadTrips();
  }

  public loadTrips(): void {
    this.isLoadingTrips.set(true);
    this.logisticsService.getActiveTrips().subscribe({
      next: (res) => {
        this.isLoadingTrips.set(false);
        const list = res.trips || [];
        this.trips.set(list);

        // Auto-select the first active or in-transit trip as prominent cockpit banner
        const active = list.find(t => t.status === 'ACTIVE' || t.status === 'IN_TRANSIT');
        if (active) {
          this.activeTrip.set(active);
        } else if (list.length > 0 && !this.activeTrip()) {
          this.activeTrip.set(list[0]);
        }
      },
      error: () => {
        this.isLoadingTrips.set(false);
      }
    });
  }

  public setActiveTrip(t: Trip): void {
    this.activeTrip.set(t);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  public openActivateModal(): void {
    this.qrInput = '';
    this.showActivateModal.set(true);
  }

  public closeActivateModal(): void {
    if (!this.isActivating()) {
      this.showActivateModal.set(false);
    }
  }

  public loadDemoToken(code: string): void {
    this.qrInput = code;
  }

  public submitActivateTrip(): void {
    if (!this.qrInput.trim()) {
      this.actionError.set('Please enter or scan a valid QR token or shipment code.');
      return;
    }

    this.isActivating.set(true);
    this.actionError.set(null);

    this.logisticsService.activateTrip({
      qr_token: this.qrInput.trim(),
      vehicle_number: this.assignedVehiclePlate
    }).subscribe({
      next: (res) => {
        this.isActivating.set(false);
        this.showActivateModal.set(false);
        this.actionSuccess.set(res.message);
        this.activeTrip.set(res.trip);
        this.loadTrips();
      },
      error: (err) => {
        this.isActivating.set(false);
        const msg = err.error?.detail || 'Invalid or unrecognized QR token. Please verify dispatch badge.';
        this.actionError.set(msg);
      }
    });
  }

  public updateStatus(tripCode: string, status: TripStatus, segment?: string): void {
    this.isUpdatingStatus.set(true);
    this.logisticsService.updateTripStatus(tripCode, status, segment).subscribe({
      next: (res) => {
        this.isUpdatingStatus.set(false);
        this.actionSuccess.set(res.message);
        this.activeTrip.set(res.trip);
        this.loadTrips();
      },
      error: (err) => {
        this.isUpdatingStatus.set(false);
        this.actionError.set(err.error?.detail || 'Failed to update transit status.');
      }
    });
  }

  public formatCargo(type: string): string {
    switch (type) {
      case 'MEDICINE': return 'Critical Medicine';
      case 'FOOD': return 'Emergency Rations';
      case 'RELIEF': return 'Disaster Relief Tents';
      case 'DISASTER_AID': return 'Rescue Gear & Generators';
      default: return 'General Cargo';
    }
  }

  public formatTripStatus(status: string): string {
    switch (status) {
      case 'READY': return 'Pending Activation';
      case 'ACTIVE': return 'Active • Departed Base';
      case 'IN_TRANSIT': return 'In-Transit on Pass';
      case 'COMPLETED': return 'Delivered & Completed';
      default: return status;
    }
  }

  // Password methods
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
        this.actionSuccess.set(res.message || 'Password updated successfully!');
        setTimeout(() => this.actionSuccess.set(null), 7000);
      },
      error: (err) => {
        this.passwordLoading.set(false);
        const errDetail = err.error?.detail || err.error?.current_password?.[0] || 'Failed to update password.';
        this.passwordError.set(errDetail);
      }
    });
  }

  public logout(): void {
    this.authService.logout();
  }
}
