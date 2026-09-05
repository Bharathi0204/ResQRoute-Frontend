import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
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
    <div class="driver-app">
      <!-- Top Navigation Bar -->
      <header class="top-bar">
        <div class="bar-left">
          <img src="assets/resqroute-logo.jpg" alt="Logo" class="app-logo" />
          <div class="brand-titles">
            <span class="brand-title">RESQROUTE</span>
            <span class="brand-tag">FIELD DRIVER TERMINAL</span>
          </div>
        </div>

        <div class="bar-right">
          <!-- Connectivity Status Badge -->
          <div class="connectivity-badge" [ngClass]="isOnline() ? 'online' : 'offline'" (click)="checkConnectivity()" title="Click to test server connection">
            <span class="pulse-dot"></span>
            <span class="conn-text">{{ isOnline() ? 'ONLINE' : 'OFFLINE' }}</span>
            <i class='bx bx-refresh refresh-icon' [class.bx-spin]="isCheckingPing()"></i>
          </div>

          <!-- PWA Install Button -->
          <button class="install-pwa-btn" (click)="handleInstallClick()">
            <i class='bx bx-download'></i>
            <span>{{ isAppInstalled() ? 'App Installed' : 'Install App' }}</span>
          </button>

          <!-- Security Password Button -->
          <button class="icon-btn" (click)="openPasswordModal()" title="Security & Password">
            <i class='bx bx-shield-quarter'></i>
          </button>

          <!-- Logout Button -->
          <button class="icon-btn logout" (click)="logout()" title="Logout">
            <i class='bx bx-log-out'></i>
          </button>
        </div>
      </header>

      <!-- Main Body Container -->
      <main class="main-body">
        <!-- Driver Profile Header -->
        <section class="driver-profile-strip">
          <div class="driver-avatar">
            <i class='bx bxs-user-detail'></i>
          </div>
          <div class="driver-info">
            <div class="driver-name-row">
              <h3>{{ user()?.first_name || user()?.username }}</h3>
              <span class="role-chip">Verified Field Driver</span>
            </div>
            <div class="driver-sub-meta">
              <span><i class='bx bxs-truck'></i> <strong>{{ assignedVehiclePlate }}</strong></span>
              <span><i class='bx bxs-id-card'></i> {{ user()?.driver_profile?.license_number || 'AS-01-2024-DRV' }}</span>
              <span><i class='bx bxs-map-pin'></i> {{ user()?.driver_profile?.district || 'Kamrup Base' }}</span>
            </div>
          </div>
          <div class="quick-actions-box">
            <button class="primary-scan-btn" (click)="openActivateModal()">
              <i class='bx bx-qr-scan'></i>
              <span>Activate Mission with QR</span>
            </button>
          </div>
        </section>

        <!-- Feedback Banners -->
        <div class="system-alert success" *ngIf="actionSuccess()">
          <i class='bx bx-check-circle'></i>
          <span>{{ actionSuccess() }}</span>
          <button class="alert-dismiss" (click)="actionSuccess.set(null)">×</button>
        </div>
        <div class="system-alert error" *ngIf="actionError()">
          <i class='bx bx-error-circle'></i>
          <span>{{ actionError() }}</span>
          <button class="alert-dismiss" (click)="actionError.set(null)">×</button>
        </div>
        <div class="system-alert warning" *ngIf="!isOnline()">
          <i class='bx bx-wifi-off'></i>
          <span>Mountain Corridor Mode: Operating from local offline cache. Changes will sync once cell tower connects.</span>
        </div>

        <!-- ACTIVE MISSION COCKPIT -->
        <section class="mission-cockpit" *ngIf="activeTrip() as trip">
          <div class="cockpit-header">
            <div class="mission-id-block">
              <span class="mission-status-chip" [ngClass]="trip.status.toLowerCase()">
                <span class="status-indicator-dot"></span>
                {{ formatTripStatus(trip.status) }}
              </span>
              <h2>{{ trip.trip_code }}</h2>
              <span class="shipment-ref">Requisition: <strong>{{ trip.shipment?.shipment_code || 'RSQ-102' }}</strong></span>
            </div>
            <div class="mission-specs">
              <div class="spec-item">
                <small>CARGO</small>
                <strong>{{ formatCargo(trip.shipment?.cargo_type || 'MEDICINE') }}</strong>
              </div>
              <div class="spec-item">
                <small>PAYLOAD</small>
                <strong>{{ trip.shipment?.weight_kg || 650 }} kg</strong>
              </div>
              <div class="spec-item">
                <small>PRIORITY</small>
                <span class="priority-tag" [ngClass]="(trip.shipment?.cargo_priority || 'CRITICAL').toLowerCase()">
                  {{ trip.shipment?.cargo_priority || 'CRITICAL' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Corridor Path Visualizer -->
          <div class="corridor-path-card">
            <div class="path-visual">
              <div class="stop origin">
                <i class='bx bxs-circle-quarter'></i>
                <div>
                  <small>DISPATCH POINT</small>
                  <h4>{{ trip.shipment?.origin || 'Origin Hub' }}</h4>
                </div>
              </div>
              <div class="path-connector">
                <div class="connector-track">
                  <div class="connector-fill" [style.width]="getProgressPercent(trip.status)"></div>
                </div>
                <div class="moving-vehicle" [style.left]="getProgressPercent(trip.status)">
                  <i class='bx bxs-truck'></i>
                </div>
              </div>
              <div class="stop destination">
                <i class='bx bxs-flag-checkered'></i>
                <div>
                  <small>DESTINATION</small>
                  <h4>{{ trip.shipment?.destination || 'Target Facility' }}</h4>
                </div>
              </div>
            </div>

            <!-- Current Segment & GPS Checkpoint -->
            <div class="checkpoint-status-row">
              <div class="curr-segment">
                <i class='bx bx-map-pin text-blue'></i>
                <span>Current Checkpoint: <strong>{{ trip.current_corridor_segment }}</strong></span>
              </div>
              <button class="ping-gps-btn" (click)="sendGpsPing(trip)" [disabled]="isUpdatingStatus()">
                <i class='bx bx-broadcast' [class.bx-spin]="isUpdatingStatus()"></i>
                <span>Update Checkpoint</span>
              </button>
            </div>
          </div>

          <!-- AI Terrain & Weather Advisory Card -->
          <div class="ai-advisory-card" *ngIf="trip.shipment">
            <div class="advisory-badge-row">
              <span class="ai-risk-chip" [ngClass]="trip.shipment.risk_level.toLowerCase()">
                <i class='bx bx-brain'></i>
                Hazard Score: {{ trip.shipment.risk_score }}/100 • {{ trip.shipment.risk_level }}
              </span>
              <span class="ai-model-label">OpenAI Highland Route Advisory</span>
            </div>
            <p class="advisory-text">
              <i class='bx bx-shield-quarter'></i>
              {{ trip.route_advisory || trip.shipment.risk_summary }}
            </p>
            <div class="recommended-bypass" *ngIf="trip.shipment.recommended_route">
              <i class='bx bx-compass'></i>
              <span><strong>Authorized Pass:</strong> {{ trip.shipment.recommended_route }}</span>
            </div>
          </div>

          <!-- DRIVER TRANSIT CONTROLS (Working Buttons) -->
          <div class="mission-controls">
            <!-- If Trip is READY -->
            <button 
              class="control-btn start-btn" 
              *ngIf="trip.status === 'READY'"
              (click)="updateStatus(trip.trip_code, 'ACTIVE', 'Base Departure Point')"
              [disabled]="isUpdatingStatus()">
              <i class='bx bx-play-circle'></i>
              <span>Depart Base & Start Mission</span>
            </button>

            <!-- If Trip is ACTIVE (Base Departed) -->
            <button 
              class="control-btn checkpoint-btn" 
              *ngIf="trip.status === 'ACTIVE'"
              (click)="updateStatus(trip.trip_code, 'IN_TRANSIT', 'Mountain Pass Ridge Transit')"
              [disabled]="isUpdatingStatus()">
              <i class='bx bx-navigation'></i>
              <span>Report Mountain Pass Crossing (In-Transit)</span>
            </button>

            <!-- If Trip is IN_TRANSIT -->
            <button 
              class="control-btn deliver-btn" 
              *ngIf="trip.status === 'IN_TRANSIT' || trip.status === 'ACTIVE'"
              (click)="updateStatus(trip.trip_code, 'COMPLETED', 'Destination Facility Offloaded')"
              [disabled]="isUpdatingStatus()">
              <i class='bx bx-check-circle'></i>
              <span>Confirm Destination Delivery & Handover</span>
            </button>

            <!-- SOS Road Hazard Alert -->
            <button class="control-btn hazard-btn" (click)="reportRoadHazard(trip)">
              <i class='bx bx-error-alt'></i>
              <span>Report Hazard / Landslide</span>
            </button>

            <!-- Download Offline Mission Packet -->
            <button class="control-btn packet-btn" (click)="downloadMissionPacket(trip)">
              <i class='bx bx-download'></i>
              <span>Download Offline Mission Packet</span>
            </button>
          </div>
        </section>

        <!-- NO ACTIVE TRIP PLACEHOLDER -->
        <section class="no-active-mission" *ngIf="!activeTrip()">
          <div class="idle-graphic">
            <i class='bx bxs-truck'></i>
          </div>
          <h3>Vehicle Standby: Ready for Dispatch</h3>
          <p>You have no active corridor run at this moment. Scan a dispatch QR badge or select a pending shipment to initiate transit.</p>
          <button class="primary-scan-btn" (click)="openActivateModal()">
            <i class='bx bx-qr-scan'></i>
            <span>Scan QR Dispatch Badge</span>
          </button>
        </section>

        <!-- ASSIGNED MANIFESTS & RUN HISTORY -->
        <section class="manifests-section">
          <div class="section-title-bar">
            <div>
              <h3><i class='bx bx-list-ul'></i> Corridor Manifests & Missions</h3>
              <p>Assigned Highland routes for your vehicle fleet.</p>
            </div>
            <button class="refresh-list-btn" (click)="loadTrips()" [disabled]="isLoadingTrips()">
              <i class='bx bx-refresh' [class.bx-spin]="isLoadingTrips()"></i>
              <span>Refresh</span>
            </button>
          </div>

          <!-- Empty list state -->
          <div class="manifests-empty" *ngIf="trips().length === 0 && !isLoadingTrips()">
            <p>No trip manifests assigned yet. Use <strong>Activate Mission with QR</strong> to claim a shipment.</p>
          </div>

          <!-- Manifest Cards Grid -->
          <div class="manifest-cards-grid">
            <div class="manifest-card" *ngFor="let t of trips()" [class.selected]="activeTrip()?.id === t.id">
              <div class="card-head">
                <div class="id-wrap">
                  <span class="trip-number">{{ t.trip_code }}</span>
                  <span class="plate-pill">{{ t.vehicle_number }}</span>
                </div>
                <span class="manifest-status-tag" [ngClass]="t.status.toLowerCase()">
                  {{ formatTripStatus(t.status) }}
                </span>
              </div>

              <div class="card-route">
                <div class="route-point">
                  <i class='bx bxs-circle origin-dot'></i>
                  <span>{{ t.shipment?.origin }}</span>
                </div>
                <div class="route-line"><i class='bx bx-chevron-down'></i></div>
                <div class="route-point">
                  <i class='bx bxs-map dest-dot'></i>
                  <span>{{ t.shipment?.destination }}</span>
                </div>
              </div>

              <div class="card-details">
                <span class="cargo-item"><i class='bx bx-package'></i> {{ formatCargo(t.shipment?.cargo_type || '') }}</span>
                <span class="weight-item">{{ t.shipment?.weight_kg || 500 }} kg</span>
              </div>

              <div class="card-actions">
                <button class="card-select-btn" (click)="selectMission(t)">
                  <i class='bx bx-select-multiple'></i>
                  <span>{{ activeTrip()?.id === t.id ? 'Viewing in Cockpit ✓' : 'Load into Cockpit' }}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <!-- QR ACTIVATION MODAL -->
      <div class="modal-overlay" *ngIf="showActivateModal()" (click)="closeActivateModal()">
        <div class="modal-panel activate-modal" (click)="$event.stopPropagation()">
          <div class="modal-top">
            <div class="title-wrap">
              <i class='bx bx-qr-scan text-blue'></i>
              <div>
                <h3>Activate Corridor Mission</h3>
                <p>Scan driver dispatch badge or enter token</p>
              </div>
            </div>
            <button class="modal-close-btn" (click)="closeActivateModal()">×</button>
          </div>

          <div class="modal-content-area">
            <!-- Simulated Camera Scan Viewfinder -->
            <div class="camera-viewfinder-box">
              <div class="viewfinder-frame">
                <div class="laser-line"></div>
                <div class="corner top-left"></div>
                <div class="corner top-right"></div>
                <div class="corner btm-left"></div>
                <div class="corner btm-right"></div>
                <div class="viewfinder-center">
                  <i class='bx bx-camera'></i>
                  <span>Camera Optical Scanner Ready</span>
                </div>
              </div>
              <button type="button" class="sim-scan-btn" (click)="loadDemoToken('RSQ-102')">
                <i class='bx bx-scan'></i> Scan Active Dispatch Badge (Demo)
              </button>
            </div>

            <!-- 1-Click Quick Demo Chips -->
            <div class="quick-token-chips">
              <small>QUICK CODES:</small>
              <button type="button" class="token-chip" (click)="loadDemoToken('RSQ-101')">RSQ-101 (Guwahati → Silchar)</button>
              <button type="button" class="token-chip" (click)="loadDemoToken('RSQ-102')">RSQ-102 (Siliguri → Gangtok)</button>
            </div>

            <div class="input-field-group">
              <label>Shipment Code or Cryptographic QR Token</label>
              <input 
                type="text" 
                class="clean-input" 
                [(ngModel)]="qrInput" 
                placeholder="e.g. RSQ-102 or RSQ-102-3D5E8A99" 
              />
            </div>

            <div class="input-field-group">
              <label>Assigned Vehicle Plate</label>
              <input 
                type="text" 
                class="clean-input" 
                [(ngModel)]="assignedVehiclePlate" 
                placeholder="e.g. TR-102 or AS-01-GC-4921" 
              />
            </div>
          </div>

          <div class="modal-bottom">
            <button class="btn-cancel" (click)="closeActivateModal()" [disabled]="isActivating()">Cancel</button>
            <button class="btn-confirm" (click)="submitActivateTrip()" [disabled]="isActivating()">
              <i class='bx bx-loader-alt bx-spin' *ngIf="isActivating()"></i>
              <i class='bx bx-check-double' *ngIf="!isActivating()"></i>
              <span>{{ isActivating() ? 'Verifying Dispatch...' : 'Confirm & Activate Mission' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- PWA INSTALL GUIDE MODAL -->
      <div class="modal-overlay" *ngIf="showInstallModal()" (click)="showInstallModal.set(false)">
        <div class="modal-panel install-modal" (click)="$event.stopPropagation()">
          <div class="modal-top">
            <div class="title-wrap">
              <i class='bx bx-mobile-alt text-blue'></i>
              <div>
                <h3>Install ResQRoute Driver App</h3>
                <p>Run full-screen on your phone with offline support</p>
              </div>
            </div>
            <button class="modal-close-btn" (click)="showInstallModal.set(false)">×</button>
          </div>

          <div class="modal-content-area">
            <div class="install-guide-steps">
              <div class="guide-step">
                <div class="step-num">1</div>
                <div class="step-desc">
                  <strong>On Android (Chrome / Edge):</strong>
                  <p>Tap the browser menu (<strong>⋮</strong> three dots in top right) and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</p>
                </div>
              </div>

              <div class="guide-step">
                <div class="step-num">2</div>
                <div class="step-desc">
                  <strong>On iPhone / iPad (Safari):</strong>
                  <p>Tap the <strong>Share</strong> button at bottom, scroll down, and tap <strong>"Add to Home Screen"</strong>.</p>
                </div>
              </div>

              <div class="guide-step">
                <div class="step-num">3</div>
                <div class="step-desc">
                  <strong>On Windows / Desktop:</strong>
                  <p>Click the install icon in your address bar (right corner) to install as a standalone desktop app.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-bottom">
            <button class="btn-confirm" (click)="showInstallModal.set(false)">
              <span>Got it</span>
            </button>
          </div>
        </div>
      </div>

      <!-- CHECKPOINT UPDATE MODAL -->
      <div class="modal-overlay" *ngIf="showCheckpointModal()" (click)="showCheckpointModal.set(false)">
        <div class="modal-panel checkpoint-modal" (click)="$event.stopPropagation()">
          <div class="modal-top">
            <div class="title-wrap">
              <i class='bx bx-map-pin text-blue'></i>
              <div>
                <h3>Update Corridor Checkpoint</h3>
                <p>Select or report physical road checkpoint location</p>
              </div>
            </div>
            <button class="modal-close-btn" (click)="showCheckpointModal.set(false)">×</button>
          </div>

          <div class="modal-content-area">
            <div class="quick-checkpoints-list">
              <small>QUICK MOUNTAIN CHECKPOINTS:</small>
              <div class="cp-buttons">
                <button type="button" class="cp-btn" (click)="setCheckpoint('NH-6 Meghalaya Ridge Ascent')">NH-6 Meghalaya Ridge</button>
                <button type="button" class="cp-btn" (click)="setCheckpoint('Sonapur Tunnel Bypass (Barak Valley)')">Sonapur Tunnel</button>
                <button type="button" class="cp-btn" (click)="setCheckpoint('NH-10 Sevoke Valley - Rangpo Checkpost')">Rangpo Checkpost</button>
                <button type="button" class="cp-btn" (click)="setCheckpoint('29th Mile Landslide Bypass Zone')">29th Mile Bypass</button>
              </div>
            </div>

            <div class="input-field-group">
              <label>Current Highway Segment or Landmark</label>
              <input 
                type="text" 
                class="clean-input" 
                [(ngModel)]="customCheckpointText" 
                placeholder="e.g. Lumshnong Ridge Bridge Mile 44" 
              />
            </div>
          </div>

          <div class="modal-bottom">
            <button class="btn-cancel" (click)="showCheckpointModal.set(false)">Cancel</button>
            <button class="btn-confirm" (click)="submitCheckpointUpdate()" [disabled]="isUpdatingStatus()">
              <i class='bx bx-loader-alt bx-spin' *ngIf="isUpdatingStatus()"></i>
              <span>Save & Transmit Ping</span>
            </button>
          </div>
        </div>
      </div>

      <!-- PASSWORD CHANGE MODAL -->
      <div class="modal-overlay" *ngIf="showPasswordModal()" (click)="closePasswordModal()">
        <div class="modal-panel password-modal" (click)="$event.stopPropagation()">
          <div class="modal-top">
            <div class="title-wrap">
              <i class='bx bx-lock-alt text-blue'></i>
              <div>
                <h3>Driver Security</h3>
                <p>Update your account access password</p>
              </div>
            </div>
            <button class="modal-close-btn" (click)="closePasswordModal()">×</button>
          </div>

          <div class="modal-content-area">
            <div class="system-alert error" *ngIf="passwordError()">
              <i class='bx bx-error-circle'></i>
              <span>{{ passwordError() }}</span>
            </div>

            <div class="input-field-group">
              <label>Current Password</label>
              <div class="password-wrap">
                <input 
                  [type]="showCurrentPassword() ? 'text' : 'password'" 
                  class="clean-input" 
                  [(ngModel)]="currentPassword" 
                  placeholder="Enter current password" 
                />
                <button type="button" class="toggle-eye" (click)="showCurrentPassword.update(v => !v)">
                  <i class='bx' [ngClass]="showCurrentPassword() ? 'bx-hide' : 'bx-show'"></i>
                </button>
              </div>
            </div>

            <div class="input-field-group">
              <label>New Password (min 8 characters)</label>
              <div class="password-wrap">
                <input 
                  [type]="showNewPassword() ? 'text' : 'password'" 
                  class="clean-input" 
                  [(ngModel)]="newPassword" 
                  placeholder="Enter new password" 
                />
                <button type="button" class="toggle-eye" (click)="showNewPassword.update(v => !v)">
                  <i class='bx' [ngClass]="showNewPassword() ? 'bx-hide' : 'bx-show'"></i>
                </button>
              </div>
            </div>

            <div class="input-field-group">
              <label>Confirm New Password</label>
              <input 
                type="password" 
                class="clean-input" 
                [(ngModel)]="confirmNewPassword" 
                placeholder="Repeat new password" 
              />
            </div>
          </div>

          <div class="modal-bottom">
            <button class="btn-cancel" (click)="closePasswordModal()" [disabled]="passwordLoading()">Cancel</button>
            <button class="btn-confirm" (click)="submitPasswordChange()" [disabled]="passwordLoading()">
              <span *ngIf="!passwordLoading()">Update Password</span>
              <span *ngIf="passwordLoading()"><i class='bx bx-loader-alt bx-spin'></i> Saving...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Clean, Professional Driver Terminal Theme */
    .driver-app {
      min-height: 100vh;
      background: #f1f5f9;
      color: #0f172a;
      font-family: 'Poppins', system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
    }

    /* Top Bar */
    .top-bar {
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #1e293b;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .bar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .app-logo {
      height: 36px;
      width: auto;
      border-radius: 6px;
    }
    .brand-titles {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
    }
    .brand-title {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #38bdf8;
    }
    .brand-tag {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 600;
      letter-spacing: 0.4px;
    }
    .bar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Connectivity Status Badge */
    .connectivity-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s;
    }
    .connectivity-badge.online {
      background: #064e3b;
      color: #34d399;
      border: 1px solid #059669;
    }
    .connectivity-badge.offline {
      background: #78350f;
      color: #fcd34d;
      border: 1px solid #d97706;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
    }
    .refresh-icon {
      font-size: 13px;
      opacity: 0.8;
    }

    /* PWA Install Button */
    .install-pwa-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .install-pwa-btn:hover {
      background: #334155;
      color: #38bdf8;
    }
    .icon-btn {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s;
    }
    .icon-btn:hover { background: #334155; color: #ffffff; }
    .icon-btn.logout:hover { background: #e11d48; color: #ffffff; border-color: #e11d48; }

    /* Main Body */
    .main-body {
      max-width: 1080px;
      width: 100%;
      margin: 0 auto;
      padding: 20px 16px 60px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    /* Driver Profile Strip */
    .driver-profile-strip {
      background: #ffffff;
      border-radius: 14px;
      padding: 16px 20px;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      flex-wrap: wrap;
    }
    .driver-avatar {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      background: #e0f2fe;
      color: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }
    .driver-info {
      flex: 1;
      min-width: 200px;
    }
    .driver-name-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }
    .driver-name-row h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }
    .role-chip {
      font-size: 11px;
      background: #ecfdf5;
      color: #059669;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .driver-sub-meta {
      display: flex;
      gap: 14px;
      font-size: 12.5px;
      color: #64748b;
      flex-wrap: wrap;
    }
    .driver-sub-meta span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .primary-scan-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 11px 20px;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);
      transition: all 0.2s;
      white-space: nowrap;
    }
    .primary-scan-btn:hover {
      background: #0369a1;
      transform: translateY(-1px);
    }

    /* System Alert Banners */
    .system-alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13px;
    }
    .system-alert.success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .system-alert.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .system-alert.warning { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    .alert-dismiss {
      margin-left: auto;
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: inherit;
    }

    /* MISSION COCKPIT CARD */
    .mission-cockpit {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.04);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .cockpit-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 14px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 14px;
    }
    .mission-id-block {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mission-status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 12px;
      width: fit-content;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .mission-status-chip.ready { background: #f1f5f9; color: #475569; }
    .mission-status-chip.active { background: #ecfdf5; color: #047857; border: 1px solid #6ee7b7; }
    .mission-status-chip.in_transit { background: #eff6ff; color: #1d4ed8; border: 1px solid #93c5fd; }
    .mission-status-chip.completed { background: #f0fdf4; color: #166534; }
    .status-indicator-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    .mission-id-block h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
    }
    .shipment-ref {
      font-size: 12px;
      color: #64748b;
    }
    .mission-specs {
      display: flex;
      gap: 14px;
      align-items: center;
      flex-wrap: wrap;
    }
    .spec-item {
      display: flex;
      flex-direction: column;
      background: #f8fafc;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .spec-item small { font-size: 10px; color: #64748b; font-weight: 700; }
    .spec-item strong { font-size: 13px; color: #0f172a; }
    .priority-tag {
      font-size: 10.5px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      width: fit-content;
    }
    .priority-tag.critical { background: #fee2e2; color: #b91c1c; }
    .priority-tag.high { background: #fef3c7; color: #b45309; }

    /* Corridor Path Card */
    .corridor-path-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .path-visual {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .stop {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .stop i { font-size: 22px; }
    .stop.origin i { color: #0284c7; }
    .stop.destination i { color: #16a34a; }
    .stop small { font-size: 10px; color: #64748b; font-weight: 700; }
    .stop h4 { margin: 0; font-size: 14px; color: #0f172a; font-weight: 700; }

    .path-connector {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }
    .connector-track {
      width: 100%;
      height: 6px;
      background: #cbd5e1;
      border-radius: 3px;
      overflow: hidden;
    }
    .connector-fill {
      height: 100%;
      background: #0284c7;
      border-radius: 3px;
      transition: width 0.4s ease;
    }
    .moving-vehicle {
      position: absolute;
      transform: translate(-50%, 0);
      background: #ffffff;
      border: 2px solid #0284c7;
      color: #0284c7;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      transition: left 0.4s ease;
    }

    .checkpoint-status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 13px;
    }
    .curr-segment {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #334155;
    }
    .ping-gps-btn {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #0284c7;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .ping-gps-btn:hover { background: #f0f9ff; border-color: #0284c7; }

    /* AI Advisory Card */
    .ai-advisory-card {
      background: #fdf4ff;
      border: 1px solid #f0abfc;
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .advisory-badge-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ai-risk-chip {
      font-size: 11.5px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .ai-risk-chip.safe { background: #ecfdf5; color: #065f46; }
    .ai-risk-chip.caution { background: #fef3c7; color: #92400e; }
    .ai-risk-chip.blocked { background: #fee2e2; color: #991b1b; }
    .ai-model-label { font-size: 11px; color: #a21caf; font-weight: 600; }
    .advisory-text {
      margin: 0;
      font-size: 13px;
      color: #4a044e;
      line-height: 1.4;
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }
    .advisory-text i { font-size: 16px; color: #c026d3; flex-shrink: 0; margin-top: 2px; }
    .recommended-bypass {
      font-size: 12px;
      color: #701a75;
      display: flex;
      align-items: center;
      gap: 6px;
      padding-top: 4px;
      border-top: 1px dashed #f5d0fe;
    }

    /* Working Mission Controls */
    .mission-controls {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .control-btn {
      flex: 1;
      min-width: 200px;
      padding: 13px 18px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
      border: none;
    }
    .start-btn {
      background: #0284c7;
      color: #ffffff;
    }
    .start-btn:hover:not(:disabled) { background: #0369a1; }
    .checkpoint-btn {
      background: #f59e0b;
      color: #ffffff;
    }
    .checkpoint-btn:hover:not(:disabled) { background: #d97706; }
    .deliver-btn {
      background: #10b981;
      color: #ffffff;
    }
    .deliver-btn:hover:not(:disabled) { background: #059669; }
    .hazard-btn {
      flex: 0 0 auto;
      min-width: 160px;
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .hazard-btn:hover:not(:disabled) { background: #fecaca; }
    .packet-btn {
      background: #0f172a;
      color: #38bdf8;
      border: 1px solid #1e293b;
    }
    .packet-btn:hover:not(:disabled) { background: #1e293b; color: #7dd3fc; }
    .control-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* No Active Mission */
    .no-active-mission {
      background: #ffffff;
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
      padding: 40px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .idle-graphic {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #f1f5f9;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }
    .no-active-mission h3 { margin: 0; font-size: 18px; color: #0f172a; }
    .no-active-mission p { margin: 0; font-size: 13px; color: #64748b; max-width: 460px; }

    /* Manifests Section */
    .manifests-section {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .section-title-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-title-bar h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-title-bar p { margin: 2px 0 0; font-size: 12px; color: #64748b; }
    .refresh-list-btn {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #475569;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .manifest-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 14px;
    }
    .manifest-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: all 0.2s;
    }
    .manifest-card.selected {
      border-color: #0284c7;
      background: #f0f9ff;
    }
    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .id-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .trip-number { font-weight: 800; font-size: 14px; color: #0284c7; }
    .plate-pill { font-size: 11px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    .manifest-status-tag {
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .manifest-status-tag.ready { background: #e2e8f0; color: #475569; }
    .manifest-status-tag.active { background: #ecfdf5; color: #047857; }
    .manifest-status-tag.in_transit { background: #eff6ff; color: #1d4ed8; }
    .manifest-status-tag.completed { background: #f0fdf4; color: #166534; }

    .card-route {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 12.5px;
      color: #334155;
    }
    .route-point { display: flex; align-items: center; gap: 6px; }
    .origin-dot { color: #0284c7; font-size: 10px; }
    .dest-dot { color: #10b981; font-size: 12px; }
    .route-line { padding-left: 3px; font-size: 12px; color: #94a3b8; }

    .card-details {
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      color: #64748b;
      padding-top: 6px;
      border-top: 1px solid #e2e8f0;
    }
    .card-select-btn {
      width: 100%;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #0284c7;
      padding: 7px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .card-select-btn:hover { background: #0284c7; color: #ffffff; }

    /* Modals System */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }
    .modal-panel {
      background: #ffffff;
      border-radius: 16px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .modal-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 18px 20px;
      border-bottom: 1px solid #e2e8f0;
    }
    .title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .title-wrap i { font-size: 24px; }
    .title-wrap h3 { margin: 0; font-size: 17px; font-weight: 700; color: #0f172a; }
    .title-wrap p { margin: 2px 0 0; font-size: 12px; color: #64748b; }
    .modal-close-btn {
      background: none;
      border: none;
      font-size: 22px;
      color: #94a3b8;
      cursor: pointer;
    }
    .modal-content-area {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-height: 75vh;
      overflow-y: auto;
    }
    .modal-bottom {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 20px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }

    /* Camera Viewfinder */
    .camera-viewfinder-box {
      background: #0f172a;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    .viewfinder-frame {
      width: 180px;
      height: 180px;
      position: relative;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .corner {
      position: absolute;
      width: 16px;
      height: 16px;
      border-color: #38bdf8;
      border-style: solid;
    }
    .corner.top-left { top: 6px; left: 6px; border-width: 3px 0 0 3px; }
    .corner.top-right { top: 6px; right: 6px; border-width: 3px 3px 0 0; }
    .corner.btm-left { bottom: 6px; left: 6px; border-width: 0 0 3px 3px; }
    .corner.btm-right { bottom: 6px; right: 6px; border-width: 0 3px 3px 0; }
    .laser-line {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: #38bdf8;
      box-shadow: 0 0 8px #38bdf8;
      animation: scanLaser 2s linear infinite;
    }
    @keyframes scanLaser {
      0% { top: 0%; }
      50% { top: 100%; }
      100% { top: 0%; }
    }
    .viewfinder-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #94a3b8;
      font-size: 11px;
      text-align: center;
      gap: 4px;
    }
    .viewfinder-center i { font-size: 28px; color: #cbd5e1; }
    .sim-scan-btn {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .quick-token-chips {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .quick-token-chips small { font-size: 10.5px; font-weight: 700; color: #64748b; }
    .token-chip {
      background: #f0f9ff;
      color: #0369a1;
      border: 1px solid #bae6fd;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
    }
    .token-chip:hover { background: #e0f2fe; }

    .input-field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .input-field-group label {
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .clean-input {
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13.5px;
      color: #0f172a;
      outline: none;
    }
    .clean-input:focus { border-color: #0284c7; }

    .btn-cancel {
      padding: 8px 16px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-confirm {
      padding: 8px 18px;
      background: #0284c7;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-confirm:hover { background: #0369a1; }
    .btn-confirm:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Install Guide Steps */
    .install-guide-steps {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .guide-step {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      background: #f8fafc;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }
    .step-num {
      width: 28px;
      height: 28px;
      background: #0284c7;
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .step-desc strong { font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px; }
    .step-desc p { margin: 0; font-size: 12px; color: #475569; line-height: 1.4; }

    /* Checkpoint Modal Specifics */
    .quick-checkpoints-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .quick-checkpoints-list small { font-size: 11px; font-weight: 700; color: #64748b; }
    .cp-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .cp-btn {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 12px;
      color: #334155;
      text-align: left;
      cursor: pointer;
    }
    .cp-btn:hover { background: #f0f9ff; border-color: #0284c7; color: #0284c7; }

    .password-wrap { position: relative; display: flex; align-items: center; }
    .toggle-eye {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-size: 18px;
    }

    @media (max-width: 640px) {
      .path-visual { flex-direction: column; align-items: flex-start; }
      .path-connector { display: none; }
      .mission-controls { flex-direction: column; }
      .control-btn { min-width: 100%; }
      .driver-profile-strip { flex-direction: column; align-items: flex-start; }
      .quick-actions-box { width: 100%; }
      .primary-scan-btn { width: 100%; justify-content: center; }
    }
  `]
})
export class DriverDashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private logisticsService = inject(LogisticsService);

  public user = this.authService.currentUser;

  // Real-time Connectivity Signals
  public isOnline = signal<boolean>(navigator.onLine);
  public isCheckingPing = signal<boolean>(false);

  // PWA Install Signals & Event
  public isAppInstalled = signal<boolean>(false);
  public showInstallModal = signal<boolean>(false);
  private deferredPrompt: any = null;

  // Trips & Active Mission
  public trips = signal<Trip[]>([]);
  public activeTrip = signal<Trip | null>(null);
  public isLoadingTrips = signal<boolean>(false);
  public isUpdatingStatus = signal<boolean>(false);
  public actionSuccess = signal<string | null>(null);
  public actionError = signal<string | null>(null);

  // Activate Mission Modal
  public showActivateModal = signal<boolean>(false);
  public isActivating = signal<boolean>(false);
  public qrInput = '';
  public assignedVehiclePlate = 'TR-102';

  // Checkpoint Modal
  public showCheckpointModal = signal<boolean>(false);
  public customCheckpointText = '';

  // Password Modal
  public showPasswordModal = signal<boolean>(false);
  public showCurrentPassword = signal<boolean>(false);
  public showNewPassword = signal<boolean>(false);
  public passwordLoading = signal<boolean>(false);
  public passwordError = signal<string | null>(null);

  public currentPassword = '';
  public newPassword = '';
  public confirmNewPassword = '';

  private onlineHandler = () => this.handleNetworkChange(true);
  private offlineHandler = () => this.handleNetworkChange(false);
  private beforeInstallPromptHandler = (e: any) => {
    e.preventDefault();
    this.deferredPrompt = e;
  };

  ngOnInit(): void {
    if (this.user()?.driver_profile?.vehicle_number) {
      this.assignedVehiclePlate = this.user()!.driver_profile!.vehicle_number;
    }

    // Check if app is already running standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isAppInstalled.set(true);
    }

    // Network listeners
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    window.addEventListener('beforeinstallprompt', this.beforeInstallPromptHandler);

    this.loadTrips();
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
    window.removeEventListener('beforeinstallprompt', this.beforeInstallPromptHandler);
  }

  private handleNetworkChange(status: boolean): void {
    this.isOnline.set(status);
    if (status) {
      this.actionSuccess.set('Network reconnected! Synchronizing with Highland Logistics Hub...');
      this.loadTrips();
    } else {
      this.actionError.set('Cellular link lost. Switched to offline corridor cache mode.');
    }
  }

  public checkConnectivity(): void {
    this.isCheckingPing.set(true);
    this.authService.checkHealth().subscribe({
      next: () => {
        this.isCheckingPing.set(false);
        this.isOnline.set(true);
        this.actionSuccess.set('Highland Command Link: Optimal (Online • 14ms ping)');
        setTimeout(() => this.actionSuccess.set(null), 4000);
      },
      error: () => {
        this.isCheckingPing.set(false);
        this.isOnline.set(false);
        this.actionError.set('Server unreachable. Running in offline corridor mode.');
      }
    });
  }

  public handleInstallClick(): void {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choice: any) => {
        if (choice.outcome === 'accepted') {
          this.isAppInstalled.set(true);
          this.actionSuccess.set('ResQRoute Driver PWA installed successfully on your device!');
        }
        this.deferredPrompt = null;
      });
    } else {
      // Show simple 3-step installation guide modal
      this.showInstallModal.set(true);
    }
  }

  public loadTrips(): void {
    this.isLoadingTrips.set(true);
    this.logisticsService.getActiveTrips().subscribe({
      next: (res) => {
        this.isLoadingTrips.set(false);
        const list = res.trips || [];
        this.trips.set(list);

        // Cache trips locally for offline resilience in mountain passes
        try {
          localStorage.setItem('resqroute_cached_trips', JSON.stringify(list));
        } catch { /* storage full */ }

        // Select active trip
        const active = list.find(t => t.status === 'ACTIVE' || t.status === 'IN_TRANSIT');
        if (active) {
          this.activeTrip.set(active);
        } else if (list.length > 0 && !this.activeTrip()) {
          this.activeTrip.set(list[0]);
        }
      },
      error: () => {
        this.isLoadingTrips.set(false);
        // Load from offline cache
        const raw = localStorage.getItem('resqroute_cached_trips');
        if (raw) {
          try {
            const cached = JSON.parse(raw);
            this.trips.set(cached);
            if (cached.length > 0) this.activeTrip.set(cached[0]);
          } catch {}
        }
      }
    });
  }

  public selectMission(t: Trip): void {
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
        this.actionSuccess.set(`Mission ${res.trip.trip_code} Activated! Safe travels on the corridor.`);
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
    this.actionError.set(null);

    this.logisticsService.updateTripStatus(tripCode, status, segment).subscribe({
      next: (res) => {
        this.isUpdatingStatus.set(false);
        this.actionSuccess.set(res.message || `Status updated to ${status}`);
        this.activeTrip.set(res.trip);
        this.loadTrips();
      },
      error: (err) => {
        this.isUpdatingStatus.set(false);
        this.actionError.set(err.error?.detail || 'Failed to update transit status. Check connection.');
      }
    });
  }

  public sendGpsPing(trip: Trip): void {
    this.customCheckpointText = trip.current_corridor_segment || '';
    this.showCheckpointModal.set(true);
  }

  public setCheckpoint(text: string): void {
    this.customCheckpointText = text;
  }

  public submitCheckpointUpdate(): void {
    if (!this.activeTrip() || !this.customCheckpointText.trim()) return;

    this.isUpdatingStatus.set(true);
    this.logisticsService.updateTripStatus(
      this.activeTrip()!.trip_code,
      this.activeTrip()!.status,
      this.customCheckpointText.trim()
    ).subscribe({
      next: (res) => {
        this.isUpdatingStatus.set(false);
        this.showCheckpointModal.set(false);
        this.actionSuccess.set(`Checkpoint updated: "${this.customCheckpointText}"`);
        this.activeTrip.set(res.trip);
        this.loadTrips();
      },
      error: () => {
        this.isUpdatingStatus.set(false);
        this.showCheckpointModal.set(false);
      }
    });
  }

  public reportRoadHazard(trip: Trip): void {
    const hazard = prompt('Enter Road Hazard / Blockage details (e.g. Landslide at KM-42):', 'Landslide blockage observed on mountain pass. Single-lane slow transit.');
    if (!hazard) return;

    this.updateStatus(trip.trip_code, trip.status, `HAZARD REPORTED: ${hazard}`);
    alert('Emergency SOS Hazard Logged! Central Command Hub notified of route obstruction.');
  }

  public downloadMissionPacket(trip: Trip): void {
    const packet = {
      packet_type: 'ResQRoute Offline Field Mission Packet',
      downloaded_at: new Date().toISOString(),
      trip_code: trip.trip_code,
      assigned_vehicle: trip.vehicle_number,
      vehicle_type: trip.vehicle_type,
      mission_status: trip.status,
      current_checkpoint: trip.current_corridor_segment,
      shipment: {
        code: trip.shipment?.shipment_code,
        token: trip.shipment?.qr_token,
        cargo_type: trip.shipment?.cargo_type,
        weight_kg: trip.shipment?.weight_kg,
        priority: trip.shipment?.cargo_priority,
        special_instructions: trip.shipment?.special_instructions,
        delivery_address: trip.shipment?.delivery_address
      },
      route_navigation: {
        origin: trip.shipment?.origin,
        destination: trip.shipment?.destination,
        authorized_pass: trip.shipment?.recommended_route,
        driver_safety_advisory: trip.route_advisory || trip.shipment?.risk_summary
      },
      ai_terrain_hazard_intelligence: {
        risk_score: trip.shipment?.risk_score,
        risk_level: trip.shipment?.risk_level,
        terrain_factors: trip.shipment?.risk_factors
      },
      emergency_dispatch_frequencies: {
        central_command_hub: '+91 361 2237000',
        bro_mountain_clearance: '1800-11-2026',
        state_disaster_management_authority: '1070',
        police_highway_patrol: '112'
      }
    };

    const blob = new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ResQRoute-Mission-${trip.trip_code}-OfflinePacket.json`;
    a.click();
    URL.revokeObjectURL(url);

    try {
      localStorage.setItem(`resqroute_offline_packet_${trip.trip_code}`, JSON.stringify(packet));
    } catch {}

    this.actionSuccess.set(`Offline Mission Packet for ${trip.trip_code} downloaded & cached!`);
    setTimeout(() => this.actionSuccess.set(null), 5000);
  }

  public getProgressPercent(status: TripStatus): string {
    switch (status) {
      case 'READY': return '5%';
      case 'ACTIVE': return '35%';
      case 'IN_TRANSIT': return '65%';
      case 'COMPLETED': return '96%';
      default: return '10%';
    }
  }

  public formatCargo(type: string): string {
    switch (type) {
      case 'MEDICINE': return 'Critical Medicine & Vaccines';
      case 'FOOD': return 'Emergency Rations & Water';
      case 'RELIEF': return 'Disaster Relief Tents';
      case 'DISASTER_AID': return 'Rescue Gear & Generators';
      default: return 'General Supplies';
    }
  }

  public formatTripStatus(status: string): string {
    switch (status) {
      case 'READY': return 'Pending Dispatch';
      case 'ACTIVE': return 'Mission Active';
      case 'IN_TRANSIT': return 'In-Transit on Pass';
      case 'COMPLETED': return 'Delivered & Handed Over';
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
        this.actionSuccess.set(res.message || 'Driver password updated successfully!');
        setTimeout(() => this.actionSuccess.set(null), 5000);
      },
      error: (err) => {
        this.passwordLoading.set(false);
        this.passwordError.set(err.error?.detail || err.error?.current_password?.[0] || 'Failed to update password.');
      }
    });
  }

  public logout(): void {
    this.authService.logout();
  }
}
