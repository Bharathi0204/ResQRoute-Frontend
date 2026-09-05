import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../core/services/auth.service';
import { LogisticsService } from '../../core/services/logistics.service';
import { Shipment, CargoType, CargoPriority, AIRiskEvaluation } from '../../core/models/logistics.model';

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
            <small class="brand-sub">Northeast Logistics Corridor • MDoNER & NDMA</small>
          </div>
        </div>
        <div class="nav-right">
          <span class="status-indicator user-badge">
            <i class='bx bxs-user-pin'></i> REQUISITIONER
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
        <!-- Hero Header -->
        <div class="hero-card">
          <div class="hero-info">
            <span class="badge">NORTHEAST DISASTER & LOGISTICS SUPPLY</span>
            <h1>Welcome, {{ user()?.first_name || user()?.username }}!</h1>
            <p class="sub">{{ user()?.organization || 'Guwahati Medical College & Emergency Relief Center' }}</p>
          </div>
          <div class="hero-actions">
            <button class="create-shipment-btn" (click)="openCreateShipmentModal()">
              <i class='bx bx-plus-circle'></i> Requisition Corridor Shipment
            </button>
          </div>
        </div>

        <!-- Notification Banner -->
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

        <!-- Metric KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon blue"><i class='bx bxs-package'></i></div>
            <div class="kpi-data">
              <span class="kpi-num">{{ shipments().length }}</span>
              <span class="kpi-label">Total Shipments</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon amber"><i class='bx bxs-truck'></i></div>
            <div class="kpi-data">
              <span class="kpi-num">{{ inTransitCount() }}</span>
              <span class="kpi-label">Active In-Transit</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon green"><i class='bx bx-check-shield'></i></div>
            <div class="kpi-data">
              <span class="kpi-num">{{ deliveredCount() }}</span>
              <span class="kpi-label">Delivered & Verified</span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon purple"><i class='bx bx-brain'></i></div>
            <div class="kpi-data">
              <span class="kpi-num">100%</span>
              <span class="kpi-label">AI Corridor Scored</span>
            </div>
          </div>
        </div>

        <!-- Corridor Shipments Section -->
        <div class="section-card">
          <div class="section-header">
            <div>
              <h2 class="section-title">
                <i class='bx bx-transfer-alt'></i> Corridor Requisitions & Field Manifests
              </h2>
              <p class="section-desc">Live dispatch manifests powered by OpenAI Risk Evaluation & Driver QR tokens.</p>
            </div>
            <div class="section-actions">
              <button class="refresh-btn" (click)="loadShipments()" [disabled]="isLoadingShipments()">
                <i class='bx bx-refresh' [class.bx-spin]="isLoadingShipments()"></i> Refresh
              </button>
              <button class="btn-sm-primary" (click)="openCreateShipmentModal()">
                <i class='bx bx-plus'></i> New Requisition
              </button>
            </div>
          </div>

          <!-- Loading state -->
          <div class="loading-state" *ngIf="isLoadingShipments() && shipments().length === 0">
            <i class='bx bx-loader-alt bx-spin'></i>
            <span>Loading corridor shipments from database...</span>
          </div>

          <!-- Empty state -->
          <div class="empty-state" *ngIf="!isLoadingShipments() && shipments().length === 0">
            <i class='bx bx-package'></i>
            <p>No corridor shipments created yet.</p>
            <button class="create-shipment-btn" (click)="openCreateShipmentModal()">
              <i class='bx bx-plus-circle'></i> Create First Shipment
            </button>
          </div>

          <!-- Shipments Table -->
          <div class="table-container" *ngIf="shipments().length > 0">
            <table class="manifest-table">
              <thead>
                <tr>
                  <th>Shipment Code</th>
                  <th>Cargo & Priority</th>
                  <th>Corridor Route</th>
                  <th>Weight</th>
                  <th>AI Risk Score</th>
                  <th>Status</th>
                  <th>Driver QR Badge</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of shipments()">
                  <td>
                    <div class="code-col">
                      <span class="code-tag">{{ s.shipment_code }}</span>
                      <small class="date-tag">{{ s.created_at | date:'shortTime' }}</small>
                    </div>
                  </td>
                  <td>
                    <div class="cargo-col">
                      <span class="cargo-title">{{ formatCargo(s.cargo_type) }}</span>
                      <span class="priority-badge" [ngClass]="s.cargo_priority.toLowerCase()">
                        {{ s.cargo_priority }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div class="route-col">
                      <div class="route-point"><i class='bx bxs-circle origin-dot'></i> {{ s.origin }}</div>
                      <div class="route-arrow"><i class='bx bx-right-arrow-alt'></i></div>
                      <div class="route-point"><i class='bx bxs-map dest-dot'></i> {{ s.destination }}</div>
                    </div>
                  </td>
                  <td>
                    <span class="weight-tag">{{ s.weight_kg }} kg</span>
                  </td>
                  <td>
                    <div class="risk-badge" [ngClass]="s.risk_level.toLowerCase()">
                      <i class='bx' [ngClass]="getRiskIcon(s.risk_level)"></i>
                      <span>{{ s.risk_score }}/100 • {{ s.risk_level }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="status-pill" [ngClass]="s.status.toLowerCase()">
                      {{ formatStatus(s.status) }}
                    </span>
                  </td>
                  <td>
                    <button class="qr-badge-btn" (click)="viewShipmentQR(s)">
                      <i class='bx bx-qr-scan'></i> View QR Badge
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Account Profile Details -->
        <div class="cards-grid">
          <div class="card">
            <div class="card-icon"><i class='bx bxs-user-account'></i></div>
            <h4>Account Profile</h4>
            <p class="val">{{ user()?.username }}</p>
            <span class="tag">{{ user()?.email }}</span>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-map-pin'></i></div>
            <h4>Assigned Region</h4>
            <p class="val">{{ user()?.customer_profile?.district || 'Kamrup Metropolitan' }}</p>
            <span class="tag">{{ user()?.customer_profile?.state || 'Assam' }}</span>
          </div>

          <div class="card">
            <div class="card-icon"><i class='bx bxs-phone'></i></div>
            <h4>Official Contact</h4>
            <p class="val">{{ user()?.phone_number || '+91 98765 43210' }}</p>
            <span class="tag">Verified Officer</span>
          </div>

          <div class="card security-card">
            <div class="card-icon lock"><i class='bx bx-shield-quarter'></i></div>
            <h4>Account Security</h4>
            <p class="val">Password Protected</p>
            <button class="action-link-btn" (click)="openPasswordModal()">
              <i class='bx bx-key'></i> Update Password
            </button>
          </div>
        </div>
      </main>

      <!-- Create Shipment Modal -->
      <div class="modal-backdrop" *ngIf="showCreateModal()" (click)="closeCreateModal()">
        <div class="modal-dialog requisition-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i class='bx bx-box text-primary'></i>
              <div>
                <h3>Requisition Corridor Shipment</h3>
                <p class="modal-subtitle">AI-powered terrain route calculation & Field Driver QR dispatch generation</p>
              </div>
            </div>
            <button class="close-x" (click)="closeCreateModal()">×</button>
          </div>

          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Corridor Origin Hub <span class="req">*</span></label>
                <select [(ngModel)]="newOrigin" class="form-control" (change)="onRouteChanged()">
                  <option value="Guwahati Central Medical Hub">Guwahati Central Medical Hub (Assam)</option>
                  <option value="Siliguri Food Relief Base">Siliguri Food Relief Base (West Bengal/Sikkim)</option>
                  <option value="Shillong Emergency Store">Shillong Emergency Store (Meghalaya)</option>
                  <option value="Dimapur Logistics Point">Dimapur Logistics Point (Nagaland)</option>
                  <option value="Agartala Supply Depot">Agartala Supply Depot (Tripura)</option>
                  <option value="Aizawl Distribution Hub">Aizawl Distribution Hub (Mizoram)</option>
                  <option value="Imphal Relief Headquarters">Imphal Relief Headquarters (Manipur)</option>
                  <option value="Itanagar Field Base">Itanagar Field Base (Arunachal)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Corridor Destination Base <span class="req">*</span></label>
                <select [(ngModel)]="newDestination" class="form-control" (change)="onRouteChanged()">
                  <option value="Silchar Civil Hospital">Silchar Civil Hospital (Assam - Barak Valley)</option>
                  <option value="Gangtok District Emergency Store">Gangtok District Emergency Store (Sikkim)</option>
                  <option value="Aizawl Civil Hospital">Aizawl Civil Hospital (Mizoram)</option>
                  <option value="Kohima Relief Center">Kohima Relief Center (Nagaland)</option>
                  <option value="Tawang District Hospital">Tawang District Hospital (Arunachal Pradesh)</option>
                  <option value="Churachandpur Emergency Depot">Churachandpur Emergency Depot (Manipur)</option>
                  <option value="Dharmanagar Sub-Divisional Base">Dharmanagar Sub-Divisional Base (Tripura)</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Cargo Type <span class="req">*</span></label>
                <select [(ngModel)]="newCargoType" class="form-control">
                  <option value="MEDICINE">Critical Medicine & Vaccines (Cold-Chain)</option>
                  <option value="FOOD">Emergency Rations & Potable Drinking Water</option>
                  <option value="RELIEF">Disaster Relief Supplies & Tents</option>
                  <option value="DISASTER_AID">Rescue Equipment & High-Output Generators</option>
                  <option value="GENERAL">General Operational Supplies</option>
                </select>
              </div>

              <div class="form-group">
                <label>Priority Clearance <span class="req">*</span></label>
                <select [(ngModel)]="newPriority" class="form-control">
                  <option value="CRITICAL">Critical Priority (Life-Saving Emergency)</option>
                  <option value="HIGH">High Priority (Expedited Corridor Clearance)</option>
                  <option value="NORMAL">Standard Priority</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Cargo Weight (kg) <span class="req">*</span></label>
                <input type="number" [(ngModel)]="newWeight" min="1" max="25000" class="form-control" placeholder="e.g. 750" />
              </div>

              <div class="form-group">
                <label>Specific Delivery Address / Facility</label>
                <input type="text" [(ngModel)]="newAddress" class="form-control" placeholder="e.g. Medical Depot, NH-6 Junction" />
              </div>
            </div>

            <div class="form-group">
              <label>Special Transit Instructions</label>
              <input type="text" [(ngModel)]="newInstructions" class="form-control" placeholder="e.g. Fragile vials; Maintain temperature below 8°C; Escort required." />
            </div>

            <!-- Live AI Route Risk Pre-Evaluator -->
            <div class="ai-preview-box">
              <div class="ai-preview-header">
                <div class="ai-title">
                  <i class='bx bx-brain text-purple'></i>
                  <strong>AI Logic Risk Engine (Live Simulation)</strong>
                </div>
                <button class="simulate-btn" (click)="simulateRisk()" [disabled]="isSimulatingRisk()">
                  <i class='bx bx-pulse' [class.bx-spin]="isSimulatingRisk()"></i>
                  {{ isSimulatingRisk() ? 'Evaluating Corridors...' : 'Analyze Route Risk' }}
                </button>
              </div>

              <div *ngIf="simulatedRisk()" class="ai-result-panel" [ngClass]="simulatedRisk()!.risk_level.toLowerCase()">
                <div class="ai-score-row">
                  <span class="score-pill">Risk Score: {{ simulatedRisk()!.risk_score }}/100</span>
                  <span class="level-pill">{{ simulatedRisk()!.risk_level }}</span>
                  <span class="engine-tag"><i class='bx bx-check'></i> {{ simulatedRisk()!.engine || 'OpenAI GPT-4o-mini' }}</span>
                </div>
                <p class="ai-summary">{{ simulatedRisk()!.risk_summary }}</p>
                <div class="ai-route" *ngIf="simulatedRisk()!.recommended_route">
                  <i class='bx bx-navigation'></i> <strong>Recommended Route:</strong> {{ simulatedRisk()!.recommended_route }}
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="cancel-btn" (click)="closeCreateModal()" [disabled]="isSubmittingShipment()">
              Cancel
            </button>
            <button class="submit-btn" (click)="submitShipment()" [disabled]="isSubmittingShipment()">
              <i class='bx bx-loader-alt bx-spin' *ngIf="isSubmittingShipment()"></i>
              <i class='bx bx-check-double' *ngIf="!isSubmittingShipment()"></i>
              {{ isSubmittingShipment() ? 'Generating QR Badge...' : 'Submit Requisition & Issue Driver QR' }}
            </button>
          </div>
        </div>
      </div>

      <!-- QR Badge & AI Assessment Display Modal -->
      <div class="modal-backdrop" *ngIf="selectedShipmentForQR()" (click)="closeQRModal()">
        <div class="modal-dialog qr-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i class='bx bx-qr-scan text-primary'></i>
              <div>
                <h3>Field Driver Dispatch Badge</h3>
                <p class="modal-subtitle">Present or transmit this secure QR token to field driver for instant trip activation</p>
              </div>
            </div>
            <button class="close-x" (click)="closeQRModal()">×</button>
          </div>

          <div class="modal-body qr-modal-body" *ngIf="selectedShipmentForQR() as s">
            <div class="qr-badge-card">
              <div class="badge-head">
                <span class="badge-shipment-id">{{ s.shipment_code }}</span>
                <span class="priority-badge" [ngClass]="s.cargo_priority.toLowerCase()">{{ s.cargo_priority }}</span>
              </div>

              <!-- Vector SVG QR Display -->
              <div class="qr-svg-container" [innerHTML]="getSanitizedSvg(s.qr_svg)"></div>

              <div class="qr-token-wrap">
                <small class="token-lbl">CRYPTOGRAPHIC QR TOKEN</small>
                <div class="token-code-row">
                  <code>{{ s.qr_token }}</code>
                  <button class="copy-btn" (click)="copyToken(s.qr_token)">
                    <i class='bx' [ngClass]="isCopied() ? 'bx-check' : 'bx-copy'"></i>
                    {{ isCopied() ? 'Copied!' : 'Copy' }}
                  </button>
                </div>
              </div>

              <div class="badge-meta">
                <div><strong>Origin:</strong> {{ s.origin }}</div>
                <div><strong>Destination:</strong> {{ s.destination }}</div>
                <div><strong>Cargo:</strong> {{ formatCargo(s.cargo_type) }} ({{ s.weight_kg }} kg)</div>
              </div>
            </div>

            <!-- AI Risk Details Card -->
            <div class="ai-details-card">
              <h4><i class='bx bx-brain text-purple'></i> Route Safety Assessment</h4>
              <div class="risk-badge-large" [ngClass]="s.risk_level.toLowerCase()">
                <i class='bx' [ngClass]="getRiskIcon(s.risk_level)"></i>
                <span>Hazard Rating: {{ s.risk_score }}/100 • {{ s.risk_level }}</span>
              </div>
              <p class="ai-desc">{{ s.risk_summary }}</p>

              <div class="risk-factors" *ngIf="s.risk_factors && s.risk_factors.length > 0">
                <h5>Terrain & Weather Hazards:</h5>
                <ul>
                  <li *ngFor="let f of s.risk_factors">{{ f }}</li>
                </ul>
              </div>

              <div class="rec-route" *ngIf="s.recommended_route">
                <i class='bx bxs-directions'></i>
                <div>
                  <strong>Recommended Mountain Corridor:</strong>
                  <p>{{ s.recommended_route }}</p>
                </div>
              </div>

              <div class="driver-instructions-alert">
                <i class='bx bx-info-circle'></i>
                <span>The driver can open their Driver PWA, click <strong>Activate Trip</strong>, and scan this QR code or input code <strong>{{ s.shipment_code }}</strong> to commence dispatch.</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="submit-btn" (click)="closeQRModal()">
              <i class='bx bx-check'></i> Done
            </button>
          </div>
        </div>
      </div>

      <!-- Change Password Modal -->
      <div class="modal-backdrop" *ngIf="showPasswordModal()" (click)="closePasswordModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <i class='bx bx-lock-alt text-primary'></i>
              <h3>Update Account Password</h3>
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
      color: #2563eb;
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
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #3b82f6 100%);
      color: #ffffff;
      padding: 28px 32px;
      border-radius: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.25);
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
    .create-shipment-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      color: #1e40af;
      border: none;
      padding: 12px 22px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      transition: all 0.2s;
    }
    .create-shipment-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
      background: #f8fafc;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .kpi-card {
      background: #ffffff;
      border-radius: 14px;
      padding: 18px 20px;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    .kpi-icon.blue { background: #eff6ff; color: #2563eb; }
    .kpi-icon.amber { background: #fef3c7; color: #d97706; }
    .kpi-icon.green { background: #ecfdf5; color: #059669; }
    .kpi-icon.purple { background: #f5f3ff; color: #7c3aed; }
    .kpi-data { display: flex; flex-direction: column; }
    .kpi-num { font-size: 24px; font-weight: 700; color: #0f172a; line-height: 1.1; }
    .kpi-label { font-size: 12px; color: #64748b; font-weight: 500; }

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
    .section-desc {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
    .section-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
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
      transition: all 0.2s;
    }
    .refresh-btn:hover { background: #e2e8f0; }
    .btn-sm-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s;
    }
    .btn-sm-primary:hover { background: #1d4ed8; }

    /* Table Styles */
    .table-container {
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }
    .manifest-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }
    .manifest-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    .manifest-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .manifest-table tr:hover {
      background: #f8fafc;
    }
    .code-col { display: flex; flex-direction: column; gap: 2px; }
    .code-tag { font-family: monospace; font-weight: 700; color: #1e40af; font-size: 13.5px; }
    .date-tag { font-size: 11px; color: #94a3b8; }
    .cargo-col { display: flex; flex-direction: column; gap: 4px; }
    .cargo-title { font-weight: 600; color: #1e293b; }
    .priority-badge {
      display: inline-block;
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      width: fit-content;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .priority-badge.critical { background: #fee2e2; color: #b91c1c; }
    .priority-badge.high { background: #fef3c7; color: #b45309; }
    .priority-badge.normal { background: #f1f5f9; color: #475569; }

    .route-col {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      color: #334155;
    }
    .origin-dot { color: #2563eb; font-size: 10px; }
    .dest-dot { color: #16a34a; font-size: 14px; }
    .route-arrow { color: #94a3b8; font-size: 16px; }

    .weight-tag {
      background: #f8fafc;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      font-family: monospace;
      font-size: 12px;
      font-weight: 600;
    }

    .risk-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
    }
    .risk-badge.safe { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .risk-badge.caution { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    .risk-badge.blocked { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

    .status-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11.5px;
      font-weight: 700;
    }
    .status-pill.ready { background: #eff6ff; color: #1d4ed8; }
    .status-pill.in_transit { background: #fef3c7; color: #b45309; }
    .status-pill.delivered { background: #ecfdf5; color: #047857; }

    .qr-badge-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .qr-badge-btn:hover {
      background: #2563eb;
      color: #ffffff;
    }

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

    /* Standard Cards Grid */
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
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      margin-bottom: 12px;
    }
    .card-icon.lock { background: #f0fdf4; color: #16a34a; }
    .card h4 {
      font-size: 13px;
      color: #64748b;
      margin: 0 0 6px;
      font-weight: 500;
    }
    .card .val {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 10px;
    }
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
      color: #2563eb;
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
    .requisition-dialog { max-width: 720px; }
    .qr-dialog { max-width: 780px; }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
    }
    .modal-title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .modal-title-wrap i { font-size: 24px; color: #2563eb; }
    .modal-title-wrap h3 { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; }
    .modal-subtitle { margin: 2px 0 0; font-size: 12px; color: #64748b; }
    .close-x {
      background: none;
      border: none;
      font-size: 24px;
      color: #94a3b8;
      cursor: pointer;
    }
    .close-x:hover { color: #0f172a; }

    .modal-body {
      padding: 20px 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group label {
      font-size: 12.5px;
      font-weight: 600;
      color: #334155;
    }
    .req { color: #dc2626; }
    .form-control {
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13.5px;
      color: #0f172a;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-control:focus { border-color: #2563eb; }

    /* AI Live Preview Box */
    .ai-preview-box {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .ai-preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ai-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #6b21a8;
    }
    .simulate-btn {
      background: #7c3aed;
      color: #ffffff;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .simulate-btn:hover { background: #6d28d9; }
    .ai-result-panel {
      background: #ffffff;
      border-radius: 8px;
      padding: 12px;
      border-left: 4px solid #7c3aed;
    }
    .ai-result-panel.safe { border-left-color: #10b981; }
    .ai-result-panel.caution { border-left-color: #f59e0b; }
    .ai-result-panel.blocked { border-left-color: #ef4444; }
    .ai-score-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .score-pill { font-size: 11px; font-weight: 700; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
    .level-pill { font-size: 11px; font-weight: 700; color: #2563eb; }
    .engine-tag { font-size: 10.5px; color: #64748b; margin-left: auto; }
    .ai-summary { font-size: 12.5px; color: #334155; margin: 4px 0 6px; line-height: 1.4; }
    .ai-route { font-size: 12px; color: #1e40af; }

    /* QR Modal Specifics */
    .qr-modal-body {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 20px;
    }
    .qr-badge-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
    }
    .badge-head {
      display: flex;
      justify-content: space-between;
      width: 100%;
      align-items: center;
    }
    .badge-shipment-id { font-size: 16px; font-weight: 700; color: #1e40af; font-family: monospace; }
    .qr-svg-container {
      background: #ffffff;
      padding: 12px;
      border-radius: 12px;
      border: 2px dashed #cbd5e1;
      width: 200px;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-svg-container ::ng-deep svg {
      width: 100%;
      height: 100%;
    }
    .qr-token-wrap {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .token-lbl { font-size: 10px; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
    .token-code-row {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      border-radius: 6px;
    }
    .token-code-row code {
      font-size: 12px;
      color: #0f172a;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .copy-btn {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .badge-meta {
      width: 100%;
      text-align: left;
      font-size: 11.5px;
      color: #475569;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
    }

    .ai-details-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .ai-details-card h4 {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .risk-badge-large {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      width: fit-content;
    }
    .risk-badge-large.safe { background: #ecfdf5; color: #065f46; }
    .risk-badge-large.caution { background: #fffbeb; color: #92400e; }
    .risk-badge-large.blocked { background: #fef2f2; color: #991b1b; }
    .ai-desc { font-size: 13px; color: #334155; line-height: 1.5; margin: 0; }
    .risk-factors h5 { font-size: 12px; color: #475569; margin: 0 0 4px; font-weight: 600; }
    .risk-factors ul { margin: 0; padding-left: 18px; font-size: 12.5px; color: #334155; }
    .rec-route {
      display: flex;
      gap: 10px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 10px;
      font-size: 12.5px;
      color: #1e40af;
    }
    .rec-route i { font-size: 20px; }
    .rec-route p { margin: 2px 0 0; }
    .driver-instructions-alert {
      background: #f8fafc;
      border-left: 4px solid #2563eb;
      padding: 10px 12px;
      font-size: 12px;
      color: #334155;
      display: flex;
      gap: 8px;
      align-items: flex-start;
      border-radius: 4px;
    }

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
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .submit-btn:hover { background: #1d4ed8; }
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

    .password-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
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
      .qr-modal-body { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .hero-card { flex-direction: column; align-items: flex-start; }
      .navbar { padding: 14px 16px; }
      .content { padding: 16px; }
    }
  `]
})
export class CustomerDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private logisticsService = inject(LogisticsService);
  private sanitizer = inject(DomSanitizer);

  public user = this.authService.currentUser;

  // Shipments state
  public shipments = signal<Shipment[]>([]);
  public isLoadingShipments = signal<boolean>(false);
  public actionSuccess = signal<string | null>(null);
  public actionError = signal<string | null>(null);

  // Create Requisition Modal
  public showCreateModal = signal<boolean>(false);
  public isSubmittingShipment = signal<boolean>(false);
  public isSimulatingRisk = signal<boolean>(false);
  public simulatedRisk = signal<AIRiskEvaluation | null>(null);

  public newOrigin = 'Guwahati Central Medical Hub';
  public newDestination = 'Silchar Civil Hospital';
  public newCargoType: CargoType = 'MEDICINE';
  public newPriority: CargoPriority = 'CRITICAL';
  public newWeight = 650;
  public newAddress = 'Barak Valley District Civil Hospital Complex';
  public newInstructions = 'Critical emergency vaccines. Maintain 2-8°C cold-chain.';

  // QR Modal
  public selectedShipmentForQR = signal<Shipment | null>(null);
  public isCopied = signal<boolean>(false);

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
    this.loadShipments();
  }

  public inTransitCount(): number {
    return this.shipments().filter(s => s.status === 'IN_TRANSIT').length;
  }

  public deliveredCount(): number {
    return this.shipments().filter(s => s.status === 'DELIVERED').length;
  }

  public loadShipments(): void {
    this.isLoadingShipments.set(true);
    this.logisticsService.getShipments(true).subscribe({
      next: (res) => {
        this.isLoadingShipments.set(false);
        this.shipments.set(res.shipments || []);
      },
      error: () => {
        this.isLoadingShipments.set(false);
      }
    });
  }

  public openCreateShipmentModal(): void {
    this.showCreateModal.set(true);
    this.simulatedRisk.set(null);
  }

  public closeCreateModal(): void {
    if (!this.isSubmittingShipment()) {
      this.showCreateModal.set(false);
    }
  }

  public onRouteChanged(): void {
    this.simulatedRisk.set(null);
  }

  public simulateRisk(): void {
    this.isSimulatingRisk.set(true);
    this.logisticsService.assessRouteRisk({
      origin: this.newOrigin,
      destination: this.newDestination,
      cargo_type: this.newCargoType,
      cargo_priority: this.newPriority,
      weight_kg: this.newWeight
    }).subscribe({
      next: (res) => {
        this.isSimulatingRisk.set(false);
        this.simulatedRisk.set(res);
      },
      error: () => {
        this.isSimulatingRisk.set(false);
      }
    });
  }

  public submitShipment(): void {
    if (!this.newOrigin || !this.newDestination || !this.newWeight) {
      this.actionError.set('Please fill in all required shipment requisition fields.');
      return;
    }

    this.isSubmittingShipment.set(true);
    this.actionError.set(null);

    this.logisticsService.createShipment({
      cargo_type: this.newCargoType,
      cargo_priority: this.newPriority,
      origin: this.newOrigin,
      destination: this.newDestination,
      weight_kg: Number(this.newWeight),
      delivery_address: this.newAddress,
      special_instructions: this.newInstructions,
      is_emergency_relief: true
    }).subscribe({
      next: (res) => {
        this.isSubmittingShipment.set(false);
        this.showCreateModal.set(false);
        this.actionSuccess.set(`Shipment ${res.shipment.shipment_code} requisitioned! AI Risk assessed at ${res.shipment.risk_score}/100.`);
        this.loadShipments();
        // Immediately present the generated QR badge to the requisitioner
        this.selectedShipmentForQR.set(res.shipment);
      },
      error: (err) => {
        this.isSubmittingShipment.set(false);
        const msg = err.error?.detail || 'Failed to requisition shipment. Please try again.';
        this.actionError.set(msg);
      }
    });
  }

  public viewShipmentQR(s: Shipment): void {
    this.selectedShipmentForQR.set(s);
  }

  public closeQRModal(): void {
    this.selectedShipmentForQR.set(null);
    this.isCopied.set(false);
  }

  public copyToken(token: string): void {
    navigator.clipboard.writeText(token).then(() => {
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 3000);
    });
  }

  public getSanitizedSvg(svg: string): SafeHtml {
    if (!svg) return '';
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  public formatCargo(type: string): string {
    switch (type) {
      case 'MEDICINE': return 'Critical Medicine & Vaccines';
      case 'FOOD': return 'Emergency Food & Water';
      case 'RELIEF': return 'Disaster Relief Tents';
      case 'DISASTER_AID': return 'Rescue Gear & Generators';
      default: return 'General Cargo';
    }
  }

  public formatStatus(status: string): string {
    switch (status) {
      case 'READY': return 'Ready for Dispatch';
      case 'IN_TRANSIT': return 'In-Transit on Corridor';
      case 'DELIVERED': return 'Delivered & Offloaded';
      default: return status;
    }
  }

  public getRiskIcon(level: string): string {
    switch (level) {
      case 'SAFE': return 'bx-check-shield';
      case 'CAUTION': return 'bx-error-alt';
      case 'BLOCKED': return 'bx-x-circle';
      default: return 'bx-info-circle';
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
