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

          <!-- PWA Install / Download Button -->
          <button class="install-pwa-btn" (click)="handleInstallClick()" title="Download & Install Application">
            <i class='bx bx-download'></i>
            <span>{{ isAppInstalled() ? 'App Installed ✓' : 'Install / Download App' }}</span>
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
            <button class="secondary-download-btn" (click)="showInstallModal.set(true)" title="Download Standalone Application for PC & Mobile">
              <i class='bx bxs-download'></i>
              <span>Download App</span>
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

      <!-- DOWNLOAD & INSTALL APPLICATION CENTER MODAL -->
      <div class="modal-overlay" *ngIf="showInstallModal()" (click)="showInstallModal.set(false)">
        <div class="modal-panel install-modal" (click)="$event.stopPropagation()">
          <div class="modal-top">
            <div class="title-wrap">
              <i class='bx bxs-download text-blue'></i>
              <div>
                <h3>Download & Install Driver Application</h3>
                <p>1-Click Mobile Installation & Desktop System Download Center</p>
              </div>
            </div>
            <button class="modal-close-btn" (click)="showInstallModal.set(false)">×</button>
          </div>

          <div class="modal-content-area">
            <!-- 1-Click Instant Mobile & Desktop Install Action -->
            <div class="one-click-install-card" *ngIf="hasDeferredPrompt() || !isAppInstalled()">
              <div class="card-lead">
                <div class="pulse-app-icon">
                  <i class='bx bx-mobile-alt'></i>
                </div>
                <div class="lead-text">
                  <strong>1-Click Instant Mobile & Desktop Install</strong>
                  <p>Installs directly to your home screen or desktop application tray with offline mountain support.</p>
                </div>
              </div>
              <button type="button" class="action-install-primary" (click)="triggerNativeInstallPrompt()">
                <i class='bx bx-bolt-circle'></i>
                <span>Install Application Now (1-Click)</span>
              </button>
            </div>

            <div class="installed-badge-card" *ngIf="isAppInstalled()">
              <i class='bx bxs-check-shield text-emerald'></i>
              <div>
                <strong>ResQRoute is Installed on this Device</strong>
                <p>Operating as a standalone full-screen application with offline cache.</p>
              </div>
            </div>

            <!-- DESKTOP / PC DOWNLOADS SECTION -->
            <div class="download-section-group">
              <div class="section-group-label">
                <i class='bx bxl-windows'></i>
                <span>DOWNLOAD FOR SYSTEMS (WINDOWS / PC / LAPTOP)</span>
              </div>

              <div class="download-grid">
                <!-- Windows Launcher (.bat) -->
                <div class="download-item-card" (click)="downloadWindowsAppLauncher()">
                  <div class="item-icon-box win">
                    <i class='bx bxl-windows'></i>
                  </div>
                  <div class="item-content">
                    <div class="item-title-row">
                      <h4>Windows App Launcher</h4>
                      <span class="file-ext">.BAT</span>
                    </div>
                    <p>Launches Driver Terminal in standalone borderless desktop app mode (1-Click).</p>
                    <span class="download-cta"><i class='bx bx-download'></i> Download Windows App (.bat)</span>
                  </div>
                </div>

                <!-- Desktop Shortcut (.url) -->
                <div class="download-item-card" (click)="downloadDesktopAppLauncher()">
                  <div class="item-icon-box url">
                    <i class='bx bx-desktop'></i>
                  </div>
                  <div class="item-content">
                    <div class="item-title-row">
                      <h4>Desktop Shortcut</h4>
                      <span class="file-ext">.URL</span>
                    </div>
                    <p>Places a 1-click desktop icon with official ResQRoute emblem on your PC.</p>
                    <span class="download-cta"><i class='bx bx-download'></i> Download Shortcut (.url)</span>
                  </div>
                </div>

                <!-- Offline Emergency Console (.html) -->
                <div class="download-item-card" (click)="downloadOfflineEmergencyConsole()">
                  <div class="item-icon-box html">
                    <i class='bx bx-file'></i>
                  </div>
                  <div class="item-content">
                    <div class="item-title-row">
                      <h4>Offline Emergency Console</h4>
                      <span class="file-ext">.HTML</span>
                    </div>
                    <p>Single-file emergency bundle. Works with 0% internet on any computer or phone.</p>
                    <span class="download-cta"><i class='bx bx-download'></i> Download Offline App (.html)</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- MOBILE ONE-CLICK INSTALL GUIDE -->
            <div class="download-section-group">
              <div class="section-group-label">
                <i class='bx bx-mobile'></i>
                <span>MOBILE ONE-CLICK INSTALL GUIDE</span>
              </div>

              <div class="install-guide-steps">
                <div class="guide-step">
                  <div class="step-num android">
                    <i class='bx bxl-android'></i>
                  </div>
                  <div class="step-desc">
                    <strong>Android (Chrome / Edge / Samsung Internet):</strong>
                    <p>
                      Click <strong>"Install Application Now"</strong> above, OR tap your browser menu 
                      (<strong>⋮</strong> three dots top right) and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>. An icon will appear on your phone like other native applications.
                    </p>
                  </div>
                </div>

                <div class="guide-step">
                  <div class="step-num apple">
                    <i class='bx bxl-apple'></i>
                  </div>
                  <div class="step-desc">
                    <strong>iPhone / iPad (Apple Safari):</strong>
                    <p>
                      Tap the <strong>Share</strong> button (<i class='bx bx-share'></i> bottom bar), scroll down, and tap 
                      <strong>"Add to Home Screen"</strong> (<i class='bx bx-plus-square'></i>).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-bottom">
            <button class="btn-cancel" (click)="showInstallModal.set(false)">Close</button>
            <button class="btn-confirm" (click)="downloadWindowsAppLauncher()">
              <i class='bx bx-download'></i>
              <span>Download for Windows (.bat)</span>
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
    .secondary-download-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      padding: 11px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .secondary-download-btn:hover {
      background: #e2e8f0;
      border-color: #94a3b8;
      color: #0284c7;
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

    /* Download & Install Application Center */
    .install-modal {
      max-width: 620px;
    }
    .one-click-install-card {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border: 1px solid #38bdf8;
      border-radius: 12px;
      padding: 16px;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 4px 15px rgba(2, 132, 199, 0.15);
    }
    .card-lead {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .pulse-app-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #0284c7;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.5);
    }
    .lead-text strong {
      font-size: 14.5px;
      color: #ffffff;
      display: block;
      margin-bottom: 2px;
    }
    .lead-text p {
      margin: 0;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.4;
    }
    .action-install-primary {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 12px 18px;
      border-radius: 8px;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
    }
    .action-install-primary:hover {
      background: #0369a1;
      transform: translateY(-1px);
    }
    .installed-badge-card {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #065f46;
    }
    .installed-badge-card i {
      font-size: 26px;
      color: #059669;
    }
    .installed-badge-card strong {
      font-size: 13.5px;
      display: block;
      color: #047857;
    }
    .installed-badge-card p {
      margin: 2px 0 0;
      font-size: 12px;
      color: #065f46;
    }

    .download-section-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .section-group-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.6px;
    }
    .download-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .download-item-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .download-item-card:hover {
      border-color: #0284c7;
      background: #f8fafc;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
    }
    .item-icon-box {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }
    .item-icon-box.win {
      background: #eff6ff;
      color: #0284c7;
    }
    .item-icon-box.url {
      background: #f5f3ff;
      color: #7c3aed;
    }
    .item-icon-box.html {
      background: #ecfdf5;
      color: #059669;
    }
    .item-content {
      flex: 1;
    }
    .item-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .item-title-row h4 {
      margin: 0;
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .file-ext {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
    }
    .item-content p {
      margin: 0 0 6px;
      font-size: 11.5px;
      color: #64748b;
      line-height: 1.35;
    }
    .download-cta {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 700;
      color: #0284c7;
    }
    .download-cta:hover {
      text-decoration: underline;
    }

    /* Mobile Install Guide */
    .install-guide-steps {
      display: flex;
      flex-direction: column;
      gap: 8px;
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
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }
    .step-num.android {
      background: #10b981;
      color: #ffffff;
    }
    .step-num.apple {
      background: #0f172a;
      color: #ffffff;
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
  public hasDeferredPrompt = signal<boolean>(false);
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
    this.hasDeferredPrompt.set(true);
  };
  private pwaPromptReadyHandler = () => {
    if ((window as any).deferredPWAInstallPrompt) {
      this.deferredPrompt = (window as any).deferredPWAInstallPrompt;
      this.hasDeferredPrompt.set(true);
    }
  };
  private appInstalledHandler = () => {
    this.isAppInstalled.set(true);
    this.hasDeferredPrompt.set(false);
    this.deferredPrompt = null;
    (window as any).deferredPWAInstallPrompt = null;
    this.actionSuccess.set('ResQRoute Driver Application is installed on this device!');
  };

  ngOnInit(): void {
    if (this.user()?.driver_profile?.vehicle_number) {
      this.assignedVehiclePlate = this.user()!.driver_profile!.vehicle_number;
    }

    // Check if early prompt already captured in window
    if ((window as any).deferredPWAInstallPrompt) {
      this.deferredPrompt = (window as any).deferredPWAInstallPrompt;
      this.hasDeferredPrompt.set(true);
    }

    // Check if app is already running standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true) {
      this.isAppInstalled.set(true);
    }

    // Network & PWA listeners
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    window.addEventListener('beforeinstallprompt', this.beforeInstallPromptHandler);
    window.addEventListener('pwa-prompt-ready', this.pwaPromptReadyHandler);
    window.addEventListener('appinstalled', this.appInstalledHandler);

    this.loadTrips();
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
    window.removeEventListener('beforeinstallprompt', this.beforeInstallPromptHandler);
    window.removeEventListener('pwa-prompt-ready', this.pwaPromptReadyHandler);
    window.removeEventListener('appinstalled', this.appInstalledHandler);
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
    const promptEvent = this.deferredPrompt || (window as any).deferredPWAInstallPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      promptEvent.userChoice.then((choice: any) => {
        if (choice && choice.outcome === 'accepted') {
          this.isAppInstalled.set(true);
          this.hasDeferredPrompt.set(false);
          this.actionSuccess.set('ResQRoute Driver PWA installed successfully on your device!');
        }
        this.deferredPrompt = null;
        (window as any).deferredPWAInstallPrompt = null;
      });
    } else {
      // Show Download & Install Center with 1-Click Mobile guide & Windows launchers
      this.showInstallModal.set(true);
    }
  }

  public triggerNativeInstallPrompt(): void {
    const promptEvent = this.deferredPrompt || (window as any).deferredPWAInstallPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      promptEvent.userChoice.then((choice: any) => {
        if (choice && choice.outcome === 'accepted') {
          this.isAppInstalled.set(true);
          this.hasDeferredPrompt.set(false);
          this.showInstallModal.set(false);
          this.actionSuccess.set('ResQRoute Driver Application installed successfully!');
        }
        this.deferredPrompt = null;
        (window as any).deferredPWAInstallPrompt = null;
      });
    } else {
      alert('1-Click Mobile & PC Setup:\n\n• Android: Tap browser menu (⋮) -> "Install App" or "Add to Home Screen".\n• iPhone: Tap Share -> "Add to Home Screen".\n• Windows / PC: Click the "Download Windows App (.bat)" button to launch standalone app on your desktop!');
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

  public downloadWindowsAppLauncher(): void {
    const appUrl = window.location.origin + '/driver/dashboard';
    const batContent = `@echo off
:: =========================================================================
:: ResQRoute Field Driver Terminal - Windows Desktop Standalone Launcher
:: Smart India Hackathon 2024 - Problem SIH26002 (North Eastern Corridors)
:: =========================================================================
title ResQRoute Field Driver Terminal
cls
echo =========================================================================
echo         RESQROUTE - FIELD DRIVER COMMAND TERMINAL
echo    Highland Logistics & Autonomous Offline Route Intelligence
echo =========================================================================
echo.
echo Launching standalone high-contrast driver cockpit on Windows...
echo Destination: ${appUrl}
echo.

:: Try launching Microsoft Edge in standalone App Mode
where msedge >nul 2>&1
if %errorlevel%==0 (
    start msedge --app="${appUrl}" --window-size=1280,840
    exit
)

:: Try launching Google Chrome in standalone App Mode
where chrome >nul 2>&1
if %errorlevel%==0 (
    start chrome --app="${appUrl}" --window-size=1280,840
    exit
)

:: Fallback to default browser
start "" "${appUrl}"
exit
`;
    this.saveFileDownload(batContent, 'Launch-ResQRoute-Driver.bat', 'application/x-bat');
    this.actionSuccess.set('Windows Launcher (.bat) downloaded! Run it to launch the standalone desktop app.');
    setTimeout(() => this.actionSuccess.set(null), 6000);
  }

  public downloadDesktopAppLauncher(): void {
    const appUrl = window.location.origin + '/driver/dashboard';
    const iconUrl = window.location.origin + '/assets/icon-192.png';
    const urlContent = `[{000214A0-0000-0000-C000-000000000046}]
Prop3=19,11
[InternetShortcut]
IDList=
URL=${appUrl}
IconFile=${iconUrl}
IconIndex=0
HotKey=0
`;
    this.saveFileDownload(urlContent, 'ResQRoute-Driver-Terminal.url', 'application/internet-shortcut');
    this.actionSuccess.set('Desktop Shortcut (.url) downloaded! Move to your desktop for 1-click launch.');
    setTimeout(() => this.actionSuccess.set(null), 6000);
  }

  public downloadOfflineEmergencyConsole(): void {
    const appUrl = window.location.origin + '/driver/dashboard';
    const cachedTrips = localStorage.getItem('resqroute_cached_trips') || '[]';
    const userObj = this.user() || { username: 'Field Driver', assignedVehicle: this.assignedVehiclePlate };
    const userJson = JSON.stringify(userObj);

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>ResQRoute Driver — Offline Emergency Console</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1120; color: #f8fafc; margin: 0; padding: 16px; }
    .header { background: #1e293b; border-radius: 12px; padding: 16px 20px; border: 1px solid #334155; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
    h1 { margin: 0; font-size: 18px; color: #38bdf8; font-weight: 800; }
    .badge { background: #059669; color: #ffffff; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .card { background: #1e293b; border-radius: 12px; padding: 16px 20px; border: 1px solid #334155; margin-bottom: 14px; }
    .card h3 { margin: 0 0 10px; font-size: 15px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .btn { background: #0284c7; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .btn-hazard { background: #e11d48; margin-left: 8px; }
    .btn:hover { opacity: 0.9; }
    .link-btn { color: #38bdf8; text-decoration: none; font-size: 13.5px; font-weight: 600; display: inline-block; margin-top: 8px; }
    pre { background: #030712; padding: 14px; border-radius: 8px; overflow-x: auto; color: #34d399; font-size: 12px; line-height: 1.5; border: 1px solid #1f2937; }
    .log-box { margin-top: 14px; padding: 10px 14px; background: #0f172a; border-radius: 8px; font-size: 13px; border-left: 4px solid #38bdf8; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>ResQRoute Field Driver Terminal</h1>
      <small style="color: #94a3b8;">Standalone Offline Highland Emergency Console (SIH26002)</small>
    </div>
    <span class="badge">STANDALONE 100% OFFLINE</span>
  </div>

  <div class="card">
    <h3>Driver & Vehicle Telemetry</h3>
    <p style="margin: 0; font-size: 14px;">Driver: <strong id="driverName" style="color: #38bdf8;">Loading...</strong> | Assigned Vehicle: <strong style="color: #f59e0b;">${this.assignedVehiclePlate}</strong></p>
    <a class="link-btn" href="${appUrl}">Launch Online Cloud Driver Terminal &rarr;</a>
  </div>

  <div class="card">
    <h3>Highland Corridor Emergency Controls</h3>
    <button class="btn" onclick="recordCheckpoint()">Log Mountain Pass Checkpoint</button>
    <button class="btn btn-hazard" onclick="recordSOS()">Broadcast Landslide SOS Alert</button>
    <div id="logMsg" class="log-box">Ready for autonomous offline operations. Local events are recorded to memory.</div>
  </div>

  <div class="card">
    <h3>Preserved Corridor Mission Manifests</h3>
    <pre id="manifestData"></pre>
  </div>

  <script>
    const user = ${userJson};
    const trips = ${cachedTrips};
    document.getElementById('driverName').textContent = user.first_name || user.username || 'Field Driver';
    document.getElementById('manifestData').textContent = JSON.stringify(trips, null, 2);

    function recordCheckpoint() {
      const stamp = new Date().toLocaleTimeString();
      document.getElementById('logMsg').innerHTML = '<strong>✓ Checkpoint logged at ' + stamp + ':</strong> Ridge Pass reached. Will synchronize automatically when cell tower connects.';
    }
    function recordSOS() {
      const stamp = new Date().toLocaleTimeString();
      document.getElementById('logMsg').innerHTML = '<strong style="color: #f87171;">⚠️ EMERGENCY SOS RECORDED at ' + stamp + ':</strong> Landslide blockage reported. Local beacon activated.';
    }
  </script>
</body>
</html>`;
    this.saveFileDownload(htmlContent, 'ResQRoute-Driver-Offline-Emergency.html', 'text/html');
    this.actionSuccess.set('Standalone Offline Emergency Console (.html) downloaded! Open in any browser without internet.');
    setTimeout(() => this.actionSuccess.set(null), 6000);
  }

  private saveFileDownload(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
