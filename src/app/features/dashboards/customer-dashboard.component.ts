import { Component, inject, signal, OnInit, computed } from '@angular/core';
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
    <div class="customer-portal">
      <!-- Navbar -->
      <header class="top-nav">
        <div class="nav-left">
          <img src="assets/resqroute-logo.jpg" alt="Logo" class="portal-logo" />
          <div class="portal-title-wrap">
            <span class="portal-brand">RESQROUTE</span>
            <span class="portal-sub">LOGISTICS & REQUISITION HUB • MDONER</span>
          </div>
        </div>

        <div class="nav-right">
          <span class="role-badge">
            <i class='bx bxs-user-pin'></i> REQUISITIONER
          </span>
          <button class="nav-btn" (click)="openPasswordModal()" title="Security Settings">
            <i class='bx bx-lock-alt'></i> Password
          </button>
          <button class="nav-btn logout" (click)="logout()" title="Logout">
            <i class='bx bx-log-out'></i> Logout
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="portal-content">
        <!-- Hero Banner -->
        <section class="hero-banner">
          <div class="hero-text">
            <span class="hero-tag">DISASTER RELIEF & SUPPLY CORRIDORS</span>
            <h1>Welcome, {{ user()?.first_name || user()?.username }}!</h1>
            <p>{{ user()?.organization || 'Guwahati Medical & Regional Emergency Logistics Authority' }}</p>
          </div>
          <div class="hero-actions">
            <button class="btn-create-requisition" (click)="openCreateShipmentModal()">
              <i class='bx bx-plus-circle'></i> Requisition Corridor Shipment
            </button>
          </div>
        </section>

        <!-- System Alerts -->
        <div class="system-alert success" *ngIf="actionSuccess()">
          <i class='bx bx-check-circle'></i>
          <span>{{ actionSuccess() }}</span>
          <button class="dismiss-btn" (click)="actionSuccess.set(null)">×</button>
        </div>
        <div class="system-alert error" *ngIf="actionError()">
          <i class='bx bx-error-circle'></i>
          <span>{{ actionError() }}</span>
          <button class="dismiss-btn" (click)="actionError.set(null)">×</button>
        </div>

        <!-- KPI Metrics Grid -->
        <section class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon blue"><i class='bx bxs-package'></i></div>
            <div class="kpi-data">
              <span class="kpi-value">{{ shipments().length }}</span>
              <span class="kpi-title">Total Requisitions</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon amber"><i class='bx bxs-truck'></i></div>
            <div class="kpi-data">
              <span class="kpi-value">{{ inTransitCount() }}</span>
              <span class="kpi-title">Active In-Transit</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon green"><i class='bx bx-check-shield'></i></div>
            <div class="kpi-data">
              <span class="kpi-value">{{ deliveredCount() }}</span>
              <span class="kpi-title">Delivered & Verified</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon purple"><i class='bx bx-brain'></i></div>
            <div class="kpi-data">
              <span class="kpi-value">100%</span>
              <span class="kpi-title">OpenAI Scored</span>
            </div>
          </div>
        </section>

        <!-- Manifests Section -->
        <section class="manifests-panel">
          <div class="panel-header">
            <div>
              <h2><i class='bx bx-transfer-alt text-primary'></i> Corridor Logistics Manifests</h2>
              <p>Requisitions equipped with live OpenAI hazard assessment and driver QR dispatch tokens.</p>
            </div>

            <div class="panel-controls">
              <!-- Search Input -->
              <div class="search-wrap">
                <i class='bx bx-search search-icon'></i>
                <input 
                  type="text" 
                  class="search-input" 
                  [(ngModel)]="searchQuery" 
                  placeholder="Filter by code, route, or cargo..." 
                />
              </div>

              <!-- Refresh Button -->
              <button class="btn-refresh" (click)="loadShipments()" [disabled]="isLoadingShipments()">
                <i class='bx bx-refresh' [class.bx-spin]="isLoadingShipments()"></i>
                <span>Refresh</span>
              </button>

              <!-- New Requisition Button -->
              <button class="btn-new-req" (click)="openCreateShipmentModal()">
                <i class='bx bx-plus'></i> New Requisition
              </button>
            </div>
          </div>

          <!-- Loading state -->
          <div class="state-message loading" *ngIf="isLoadingShipments() && shipments().length === 0">
            <i class='bx bx-loader-alt bx-spin'></i>
            <span>Connecting to Highland Logistics Hub...</span>
          </div>

          <!-- Empty state -->
          <div class="state-message empty" *ngIf="!isLoadingShipments() && filteredShipments().length === 0">
            <i class='bx bx-package'></i>
            <p *ngIf="searchQuery.trim()">No shipments match your filter "{{ searchQuery }}".</p>
            <p *ngIf="!searchQuery.trim()">No corridor shipments found in database.</p>
            <button class="btn-create-requisition" (click)="openCreateShipmentModal()">
              <i class='bx bx-plus-circle'></i> Requisition First Shipment
            </button>
          </div>

          <!-- Manifests Table -->
          <div class="table-responsive" *ngIf="filteredShipments().length > 0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Shipment Code</th>
                  <th>Cargo Type & Weight</th>
                  <th>Corridor Path</th>
                  <th>AI Hazard Score</th>
                  <th>Current Status</th>
                  <th>Driver Dispatch Badge</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of filteredShipments()">
                  <td>
                    <div class="code-cell">
                      <strong class="code-text">{{ s.shipment_code }}</strong>
                      <small class="time-text">{{ s.created_at | date:'short' }}</small>
                    </div>
                  </td>
                  <td>
                    <div class="cargo-cell">
                      <strong>{{ formatCargo(s.cargo_type) }}</strong>
                      <div class="meta-row">
                        <span class="priority-chip" [ngClass]="s.cargo_priority.toLowerCase()">{{ s.cargo_priority }}</span>
                        <span class="weight-chip">{{ s.weight_kg }} kg</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="path-cell">
                      <span class="origin-tag"><i class='bx bxs-circle origin-icon'></i> {{ s.origin }}</span>
                      <i class='bx bx-right-arrow-alt arrow-icon'></i>
                      <span class="dest-tag"><i class='bx bxs-map-pin dest-icon'></i> {{ s.destination }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="risk-chip" [ngClass]="s.risk_level.toLowerCase()">
                      <i class='bx' [ngClass]="getRiskIcon(s.risk_level)"></i>
                      <span>{{ s.risk_score }}/100 • {{ s.risk_level }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="status-badge" [ngClass]="s.status.toLowerCase()">
                      {{ formatStatus(s.status) }}
                    </span>
                  </td>
                  <td>
                    <button class="view-qr-btn" (click)="viewShipmentQR(s)">
                      <i class='bx bx-qr-scan'></i>
                      <span>View QR Badge</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Officer Details Grid -->
        <section class="officer-grid">
          <div class="officer-card">
            <div class="card-icon"><i class='bx bxs-user-detail'></i></div>
            <h4>Officer Identity</h4>
            <p class="card-val">{{ user()?.username }}</p>
            <span class="card-sub">{{ user()?.email }}</span>
          </div>

          <div class="officer-card">
            <div class="card-icon"><i class='bx bxs-map-pin'></i></div>
            <h4>Jurisdiction</h4>
            <p class="card-val">{{ user()?.customer_profile?.district || 'Kamrup Metropolitan' }}</p>
            <span class="card-sub">{{ user()?.customer_profile?.state || 'Assam' }}</span>
          </div>

          <div class="officer-card">
            <div class="card-icon"><i class='bx bxs-phone-call'></i></div>
            <h4>Official Contact</h4>
            <p class="card-val">{{ user()?.phone_number || '+91 98765 43210' }}</p>
            <span class="card-sub">Emergency Dispatch Ready</span>
          </div>

          <div class="officer-card security">
            <div class="card-icon lock"><i class='bx bx-shield-quarter'></i></div>
            <h4>Account Security</h4>
            <p class="card-val">Encrypted Access</p>
            <button class="btn-text-action" (click)="openPasswordModal()">
              <i class='bx bx-key'></i> Update Password
            </button>
          </div>
        </section>
      </main>

      <!-- CREATE REQUISITION MODAL -->
      <div class="modal-backdrop" *ngIf="showCreateModal()" (click)="closeCreateModal()">
        <div class="modal-card req-modal" (click)="$event.stopPropagation()">
          <div class="modal-top">
            <div class="title-block">
              <i class='bx bx-box text-primary'></i>
              <div>
                <h3>Requisition Corridor Shipment</h3>
                <p>Live OpenAI route safety analysis & driver QR activation generation</p>
              </div>
            </div>
            <button class="btn-close" (click)="closeCreateModal()">×</button>
          </div>

          <div class="modal-body">
            <!-- 1-Click Preset Demonstration Buttons -->
            <div class="presets-box">
              <small><i class='bx bx-bolt-circle'></i> 1-CLICK DEMO CORRIDOR PRESETS:</small>
              <div class="preset-chips">
                <button type="button" class="preset-chip" (click)="applyPreset('silchar')">
                  Vaccines: Guwahati → Silchar (Critical, 650kg)
                </button>
                <button type="button" class="preset-chip" (click)="applyPreset('gangtok')">
                  Rations: Siliguri → Gangtok (High, 1200kg)
                </button>
                <button type="button" class="preset-chip" (click)="applyPreset('aizawl')">
                  Tents: Shillong → Aizawl (Relief, 800kg)
                </button>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Origin Hub <span class="req">*</span></label>
                <select [(ngModel)]="newOrigin" class="input-ctrl" (change)="onRouteChanged()">
                  <option value="Guwahati Central Medical Hub">Guwahati Central Medical Hub (Assam)</option>
                  <option value="Siliguri Food Relief Base">Siliguri Food Relief Base (West Bengal)</option>
                  <option value="Shillong Emergency Store">Shillong Emergency Store (Meghalaya)</option>
                  <option value="Dimapur Logistics Point">Dimapur Logistics Point (Nagaland)</option>
                  <option value="Agartala Supply Depot">Agartala Supply Depot (Tripura)</option>
                  <option value="Aizawl Distribution Hub">Aizawl Distribution Hub (Mizoram)</option>
                  <option value="Imphal Relief Headquarters">Imphal Relief Headquarters (Manipur)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Destination Base <span class="req">*</span></label>
                <select [(ngModel)]="newDestination" class="input-ctrl" (change)="onRouteChanged()">
                  <option value="Silchar Civil Hospital">Silchar Civil Hospital (Assam - Barak Valley)</option>
                  <option value="Gangtok District Emergency Store">Gangtok District Emergency Store (Sikkim)</option>
                  <option value="Aizawl Civil Hospital">Aizawl Civil Hospital (Mizoram)</option>
                  <option value="Kohima Relief Center">Kohima Relief Center (Nagaland)</option>
                  <option value="Tawang District Hospital">Tawang District Hospital (Arunachal Pradesh)</option>
                  <option value="Churachandpur Emergency Depot">Churachandpur Emergency Depot (Manipur)</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Cargo Type <span class="req">*</span></label>
                <select [(ngModel)]="newCargoType" class="input-ctrl">
                  <option value="MEDICINE">Critical Medicine & Vaccines (Cold-Chain)</option>
                  <option value="FOOD">Emergency Rations & Potable Drinking Water</option>
                  <option value="RELIEF">Disaster Relief Supplies & Tents</option>
                  <option value="DISASTER_AID">Rescue Equipment & High-Output Generators</option>
                  <option value="GENERAL">General Operational Supplies</option>
                </select>
              </div>

              <div class="form-group">
                <label>Priority Clearance <span class="req">*</span></label>
                <select [(ngModel)]="newPriority" class="input-ctrl">
                  <option value="CRITICAL">Critical Priority (Life-Saving Emergency)</option>
                  <option value="HIGH">High Priority (Expedited Corridor Clearance)</option>
                  <option value="NORMAL">Standard Priority</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Cargo Weight (kg) <span class="req">*</span></label>
                <input type="number" [(ngModel)]="newWeight" min="1" max="25000" class="input-ctrl" placeholder="e.g. 750" />
              </div>

              <div class="form-group">
                <label>Specific Delivery Facility / Street</label>
                <input type="text" [(ngModel)]="newAddress" class="input-ctrl" placeholder="e.g. Civil Hospital Compound, NH-6" />
              </div>
            </div>

            <div class="form-group">
              <label>Special Handling Instructions</label>
              <input type="text" [(ngModel)]="newInstructions" class="input-ctrl" placeholder="e.g. Cold-chain storage 2-8°C; Fragile ampoules." />
            </div>

            <!-- Live OpenAI Route Risk Simulation -->
            <div class="ai-simulator-box">
              <div class="sim-top">
                <div class="sim-title">
                  <i class='bx bx-brain text-purple'></i>
                  <strong>OpenAI Route Risk Engine (Pre-Scan)</strong>
                </div>
                <button type="button" class="btn-simulate" (click)="simulateRisk()" [disabled]="isSimulatingRisk()">
                  <i class='bx bx-pulse' [class.bx-spin]="isSimulatingRisk()"></i>
                  <span>{{ isSimulatingRisk() ? 'Evaluating Corridors...' : 'Analyze Route Risk' }}</span>
                </button>
              </div>

              <div class="sim-result" *ngIf="simulatedRisk()" [ngClass]="simulatedRisk()!.risk_level.toLowerCase()">
                <div class="score-line">
                  <span class="score-pill">Risk Score: {{ simulatedRisk()!.risk_score }}/100</span>
                  <span class="level-pill">{{ simulatedRisk()!.risk_level }}</span>
                  <span class="engine-note"><i class='bx bx-check'></i> {{ simulatedRisk()!.engine || 'OpenAI GPT-4o-mini' }}</span>
                </div>
                <p class="summary-text">{{ simulatedRisk()!.risk_summary }}</p>
                <div class="route-note" *ngIf="simulatedRisk()!.recommended_route">
                  <i class='bx bx-navigation'></i> <strong>Recommended Route:</strong> {{ simulatedRisk()!.recommended_route }}
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-dialog-cancel" (click)="closeCreateModal()" [disabled]="isSubmittingShipment()">Cancel</button>
            <button class="btn-dialog-submit" (click)="submitShipment()" [disabled]="isSubmittingShipment()">
              <i class='bx bx-loader-alt bx-spin' *ngIf="isSubmittingShipment()"></i>
              <i class='bx bx-check-double' *ngIf="!isSubmittingShipment()"></i>
              <span>{{ isSubmittingShipment() ? 'Generating Dispatch Badge...' : 'Submit Requisition & Issue Driver QR' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- DRIVER DISPATCH QR BADGE MODAL -->
      <div class="modal-backdrop" *ngIf="selectedShipmentForQR()" (click)="closeQRModal()">
        <div class="modal-card qr-modal" (click)="$event.stopPropagation()">
          <div class="modal-top">
            <div class="title-block">
              <i class='bx bx-qr-scan text-primary'></i>
              <div>
                <h3>Field Driver Dispatch Badge</h3>
                <p>Present or transmit this QR badge to field driver for instantaneous PWA trip activation</p>
              </div>
            </div>
            <button class="btn-close" (click)="closeQRModal()">×</button>
          </div>

          <div class="modal-body qr-modal-grid" *ngIf="selectedShipmentForQR() as s">
            <!-- QR Card -->
            <div class="qr-visual-card">
              <div class="badge-head">
                <span class="shipment-code-title">{{ s.shipment_code }}</span>
                <span class="priority-chip" [ngClass]="s.cargo_priority.toLowerCase()">{{ s.cargo_priority }}</span>
              </div>

              <!-- Pure SVG Vector QR -->
              <div class="qr-svg-holder" [innerHTML]="getSanitizedSvg(s.qr_svg)"></div>

              <!-- Token with 1-click Copy -->
              <div class="token-container">
                <small>DISPATCH VERIFICATION TOKEN</small>
                <div class="token-input-row">
                  <code>{{ s.qr_token }}</code>
                  <button class="copy-token-btn" (click)="copyToken(s.qr_token)">
                    <i class='bx' [ngClass]="isCopied() ? 'bx-check' : 'bx-copy'"></i>
                    <span>{{ isCopied() ? 'Copied!' : 'Copy' }}</span>
                  </button>
                </div>
              </div>

              <div class="badge-manifest-info">
                <div><strong>Origin:</strong> {{ s.origin }}</div>
                <div><strong>Destination:</strong> {{ s.destination }}</div>
                <div><strong>Cargo:</strong> {{ formatCargo(s.cargo_type) }} ({{ s.weight_kg }} kg)</div>
              </div>

              <div class="qr-download-actions">
                <button class="btn-download-action" (click)="downloadQrSvg(s)">
                  <i class='bx bx-download'></i> Download QR Badge
                </button>
                <button class="btn-download-action manifest" (click)="downloadManifest(s)">
                  <i class='bx bx-file'></i> Download Dispatch Packet
                </button>
              </div>
            </div>

            <!-- AI Risk Breakdown -->
            <div class="ai-report-card">
              <h4><i class='bx bx-brain text-purple'></i> Route Safety Assessment</h4>
              <div class="risk-badge-large" [ngClass]="s.risk_level.toLowerCase()">
                <i class='bx' [ngClass]="getRiskIcon(s.risk_level)"></i>
                <span>Hazard Rating: {{ s.risk_score }}/100 • {{ s.risk_level }}</span>
              </div>
              <p class="risk-desc">{{ s.risk_summary }}</p>

              <div class="hazard-list" *ngIf="s.risk_factors && s.risk_factors.length > 0">
                <h5>Terrain & Weather Hazards:</h5>
                <ul>
                  <li *ngFor="let f of s.risk_factors">{{ f }}</li>
                </ul>
              </div>

              <div class="route-advisory-box" *ngIf="s.recommended_route">
                <i class='bx bxs-directions'></i>
                <div>
                  <strong>Recommended Mountain Corridor:</strong>
                  <p>{{ s.recommended_route }}</p>
                </div>
              </div>

              <div class="driver-help-alert">
                <i class='bx bx-info-circle'></i>
                <span>The driver can open their Driver PWA, click <strong>Activate Mission with QR</strong>, and scan this QR code or input code <strong>{{ s.shipment_code }}</strong> to commence dispatch.</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-dialog-submit" (click)="closeQRModal()">
              <i class='bx bx-check'></i> Done
            </button>
          </div>
        </div>
      </div>

      <!-- PASSWORD CHANGE MODAL -->
      <div class="modal-backdrop" *ngIf="showPasswordModal()" (click)="closePasswordModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-top">
            <div class="title-block">
              <i class='bx bx-lock-alt text-primary'></i>
              <h3>Update Account Password</h3>
            </div>
            <button class="btn-close" (click)="closePasswordModal()">×</button>
          </div>

          <div class="modal-body">
            <div class="system-alert error" *ngIf="passwordError()">
              <i class='bx bx-error-circle'></i>
              <span>{{ passwordError() }}</span>
            </div>

            <div class="form-group">
              <label>Current Password</label>
              <div class="pass-input-wrap">
                <input 
                  [type]="showCurrentPassword() ? 'text' : 'password'" 
                  class="input-ctrl" 
                  [(ngModel)]="currentPassword" 
                  placeholder="Enter current password" 
                />
                <button type="button" class="eye-toggle" (click)="showCurrentPassword.update(v => !v)">
                  <i class='bx' [ngClass]="showCurrentPassword() ? 'bx-hide' : 'bx-show'"></i>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>New Password (min 8 characters)</label>
              <div class="pass-input-wrap">
                <input 
                  [type]="showNewPassword() ? 'text' : 'password'" 
                  class="input-ctrl" 
                  [(ngModel)]="newPassword" 
                  placeholder="Enter new password" 
                />
                <button type="button" class="eye-toggle" (click)="showNewPassword.update(v => !v)">
                  <i class='bx' [ngClass]="showNewPassword() ? 'bx-hide' : 'bx-show'"></i>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Confirm New Password</label>
              <input 
                type="password" 
                class="input-ctrl" 
                [(ngModel)]="confirmNewPassword" 
                placeholder="Repeat new password" 
              />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-dialog-cancel" (click)="closePasswordModal()" [disabled]="passwordLoading()">Cancel</button>
            <button class="btn-dialog-submit" (click)="submitPasswordChange()" [disabled]="passwordLoading()">
              <span *ngIf="!passwordLoading()"><i class='bx bx-check-shield'></i> Update Password</span>
              <span *ngIf="passwordLoading()"><i class='bx bx-loader-alt bx-spin'></i> Saving...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .customer-portal {
      min-height: 100vh;
      background: #f8fafc;
      color: #0f172a;
      font-family: 'Poppins', system-ui, -apple-system, sans-serif;
    }

    /* Navbar */
    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 28px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .nav-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .portal-logo {
      height: 38px;
      width: auto;
      border-radius: 8px;
    }
    .portal-title-wrap {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }
    .portal-brand {
      font-size: 16px;
      font-weight: 800;
      color: #1e40af;
      letter-spacing: 0.5px;
    }
    .portal-sub {
      font-size: 10.5px;
      color: #64748b;
      font-weight: 600;
    }
    .nav-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .role-badge {
      font-size: 11.5px;
      font-weight: 700;
      color: #1e40af;
      background: #eff6ff;
      padding: 6px 12px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      transition: all 0.2s;
    }
    .nav-btn:hover { background: #f1f5f9; }
    .nav-btn.logout:hover { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }

    /* Content Area */
    .portal-content {
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px 20px 60px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    /* Hero Banner */
    .hero-banner {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%);
      color: #ffffff;
      padding: 26px 30px;
      border-radius: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.25);
      flex-wrap: wrap;
      gap: 18px;
    }
    .hero-tag {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      padding: 4px 10px;
      border-radius: 12px;
    }
    .hero-text h1 {
      margin: 8px 0 4px;
      font-size: 24px;
      font-weight: 800;
    }
    .hero-text p {
      margin: 0;
      font-size: 13.5px;
      opacity: 0.9;
    }
    .btn-create-requisition {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      color: #1e3a8a;
      border: none;
      padding: 12px 22px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      transition: all 0.2s;
    }
    .btn-create-requisition:hover {
      transform: translateY(-2px);
      background: #f8fafc;
    }

    /* System Alert */
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
    .dismiss-btn {
      margin-left: auto;
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: inherit;
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
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .kpi-icon {
      width: 46px;
      height: 46px;
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
    .kpi-value { font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1.1; }
    .kpi-title { font-size: 12px; color: #64748b; font-weight: 500; }

    /* Manifests Panel */
    .manifests-panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 22px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.02);
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 18px;
      flex-wrap: wrap;
      gap: 14px;
    }
    .panel-header h2 {
      margin: 0 0 4px;
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .panel-header p { margin: 0; font-size: 13px; color: #64748b; }

    .panel-controls {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .search-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      color: #94a3b8;
      font-size: 16px;
    }
    .search-input {
      padding: 8px 12px 8px 32px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 12.5px;
      width: 220px;
      outline: none;
    }
    .search-input:focus { border-color: #2563eb; }
    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #475569;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-new-req {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
    }

    /* Table Styles */
    .table-responsive {
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }
    .data-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    .data-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .data-table tr:hover { background: #f8fafc; }

    .code-cell { display: flex; flex-direction: column; gap: 2px; }
    .code-text { font-family: monospace; font-size: 14px; color: #1e40af; font-weight: 700; }
    .time-text { font-size: 11px; color: #94a3b8; }

    .cargo-cell { display: flex; flex-direction: column; gap: 4px; }
    .cargo-cell strong { color: #1e293b; }
    .meta-row { display: flex; gap: 6px; align-items: center; }
    .priority-chip {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .priority-chip.critical { background: #fee2e2; color: #b91c1c; }
    .priority-chip.high { background: #fef3c7; color: #b45309; }
    .priority-chip.normal { background: #f1f5f9; color: #475569; }
    .weight-chip { font-size: 11px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }

    .path-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      color: #334155;
    }
    .origin-tag, .dest-tag { display: inline-flex; align-items: center; gap: 4px; }
    .origin-icon { color: #2563eb; font-size: 10px; }
    .dest-icon { color: #16a34a; font-size: 13px; }
    .arrow-icon { color: #94a3b8; font-size: 16px; }

    .risk-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
    }
    .risk-chip.safe { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .risk-chip.caution { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    .risk-chip.blocked { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
    }
    .status-badge.ready { background: #eff6ff; color: #1d4ed8; }
    .status-badge.in_transit { background: #fef3c7; color: #b45309; }
    .status-badge.delivered { background: #ecfdf5; color: #047857; }

    .view-qr-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .view-qr-btn:hover { background: #2563eb; color: #ffffff; }

    .state-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 16px;
      gap: 12px;
      color: #64748b;
    }
    .state-message i { font-size: 36px; color: #94a3b8; }

    /* Officer Grid */
    .officer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
    }
    .officer-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
    }
    .card-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      margin-bottom: 10px;
    }
    .card-icon.lock { background: #f0fdf4; color: #16a34a; }
    .officer-card h4 { font-size: 12px; color: #64748b; margin: 0 0 4px; font-weight: 500; }
    .card-val { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
    .card-sub { font-size: 11px; color: #64748b; }
    .btn-text-action {
      background: none;
      border: none;
      color: #2563eb;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
    }

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
    .modal-card {
      background: #ffffff;
      border-radius: 16px;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      max-height: 90vh;
    }
    .req-modal { max-width: 720px; }
    .qr-modal { max-width: 780px; }

    .modal-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 18px 22px;
      border-bottom: 1px solid #e2e8f0;
    }
    .title-block { display: flex; align-items: center; gap: 10px; }
    .title-block i { font-size: 24px; }
    .title-block h3 { margin: 0; font-size: 17px; font-weight: 700; color: #0f172a; }
    .title-block p { margin: 2px 0 0; font-size: 12px; color: #64748b; }
    .btn-close { background: none; border: none; font-size: 22px; color: #94a3b8; cursor: pointer; }

    .modal-body {
      padding: 18px 22px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* Preset Chips */
    .presets-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .presets-box small { font-size: 10.5px; font-weight: 700; color: #166534; }
    .preset-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .preset-chip {
      background: #ffffff;
      border: 1px solid #86efac;
      color: #15803d;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
    }
    .preset-chip:hover { background: #dcfce7; }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .form-group { display: flex; flex-direction: column; gap: 5px; }
    .form-group label { font-size: 12px; font-weight: 600; color: #334155; }
    .req { color: #dc2626; }
    .input-ctrl {
      padding: 9px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
      color: #0f172a;
      outline: none;
    }
    .input-ctrl:focus { border-color: #2563eb; }

    /* AI Simulator */
    .ai-simulator-box {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .sim-top { display: flex; justify-content: space-between; align-items: center; }
    .sim-title { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #6b21a8; }
    .btn-simulate {
      background: #7c3aed;
      color: #ffffff;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .sim-result {
      background: #ffffff;
      border-radius: 6px;
      padding: 10px;
      border-left: 4px solid #7c3aed;
    }
    .sim-result.safe { border-left-color: #10b981; }
    .sim-result.caution { border-left-color: #f59e0b; }
    .sim-result.blocked { border-left-color: #ef4444; }
    .score-line { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .score-pill { font-size: 11px; font-weight: 700; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
    .level-pill { font-size: 11px; font-weight: 700; color: #2563eb; }
    .engine-note { font-size: 10px; color: #64748b; margin-left: auto; }
    .summary-text { font-size: 12px; color: #334155; margin: 4px 0; line-height: 1.4; }
    .route-note { font-size: 11.5px; color: #1e40af; }

    /* QR Modal Grid */
    .qr-modal-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 18px;
    }
    .qr-visual-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 10px;
    }
    .badge-head { display: flex; justify-content: space-between; width: 100%; align-items: center; }
    .shipment-code-title { font-size: 16px; font-weight: 800; color: #1e40af; font-family: monospace; }
    .qr-svg-holder {
      background: #ffffff;
      padding: 10px;
      border-radius: 10px;
      border: 2px dashed #cbd5e1;
      width: 190px;
      height: 190px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-svg-holder ::ng-deep svg { width: 100%; height: 100%; }

    .token-container { width: 100%; display: flex; flex-direction: column; gap: 4px; }
    .token-container small { font-size: 9.5px; color: #64748b; font-weight: 700; }
    .token-input-row {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      border-radius: 6px;
    }
    .token-input-row code {
      font-size: 11.5px;
      color: #0f172a;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .copy-token-btn {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .badge-manifest-info {
      width: 100%;
      text-align: left;
      font-size: 11px;
      color: #475569;
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
    }
    .qr-download-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
      margin-top: 4px;
    }
    .btn-download-action {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
      padding: 7px 10px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-download-action:hover { background: #dbeafe; }
    .btn-download-action.manifest {
      background: #f0fdf4;
      color: #166534;
      border-color: #bbf7d0;
    }
    .btn-download-action.manifest:hover { background: #dcfce7; }

    .ai-report-card { display: flex; flex-direction: column; gap: 10px; }
    .ai-report-card h4 { margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px; }
    .risk-badge-large {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12.5px;
      font-weight: 700;
      width: fit-content;
    }
    .risk-badge-large.safe { background: #ecfdf5; color: #065f46; }
    .risk-badge-large.caution { background: #fffbeb; color: #92400e; }
    .risk-badge-large.blocked { background: #fef2f2; color: #991b1b; }
    .risk-desc { font-size: 12.5px; color: #334155; line-height: 1.45; margin: 0; }
    .hazard-list h5 { font-size: 11.5px; color: #475569; margin: 0 0 3px; font-weight: 600; }
    .hazard-list ul { margin: 0; padding-left: 16px; font-size: 12px; color: #334155; }
    .route-advisory-box {
      display: flex;
      gap: 8px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 12px;
      color: #1e40af;
    }
    .route-advisory-box i { font-size: 18px; }
    .route-advisory-box p { margin: 2px 0 0; }
    .driver-help-alert {
      background: #f8fafc;
      border-left: 3px solid #2563eb;
      padding: 8px 10px;
      font-size: 11.5px;
      color: #334155;
      display: flex;
      gap: 6px;
      border-radius: 4px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 22px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }
    .btn-dialog-cancel {
      padding: 8px 16px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-dialog-submit {
      padding: 8px 18px;
      background: #2563eb;
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
    .btn-dialog-submit:hover { background: #1d4ed8; }
    .btn-dialog-submit:disabled { opacity: 0.6; cursor: not-allowed; }

    .pass-input-wrap { position: relative; display: flex; align-items: center; }
    .eye-toggle {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-size: 18px;
    }

    @media (max-width: 768px) {
      .qr-modal-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .hero-banner { flex-direction: column; align-items: flex-start; }
      .top-nav { padding: 12px 16px; }
      .portal-content { padding: 16px; }
    }
  `]
})
export class CustomerDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private logisticsService = inject(LogisticsService);
  private sanitizer = inject(DomSanitizer);

  public user = this.authService.currentUser;

  // Shipments State
  public shipments = signal<Shipment[]>([]);
  public isLoadingShipments = signal<boolean>(false);
  public searchQuery = '';
  public actionSuccess = signal<string | null>(null);
  public actionError = signal<string | null>(null);

  // Filtered shipments computed from searchQuery
  public filteredShipments = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    const list = this.shipments();
    if (!q) return list;
    return list.filter(s =>
      s.shipment_code.toLowerCase().includes(q) ||
      s.origin.toLowerCase().includes(q) ||
      s.destination.toLowerCase().includes(q) ||
      s.cargo_type.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    );
  });

  // Requisition Modal State
  public showCreateModal = signal<boolean>(false);
  public isSubmittingShipment = signal<boolean>(false);
  public isSimulatingRisk = signal<boolean>(false);
  public simulatedRisk = signal<AIRiskEvaluation | null>(null);

  public newOrigin = 'Guwahati Central Medical Hub';
  public newDestination = 'Silchar Civil Hospital';
  public newCargoType: CargoType = 'MEDICINE';
  public newPriority: CargoPriority = 'CRITICAL';
  public newWeight = 650;
  public newAddress = 'Civil Hospital Complex, Barak Valley';
  public newInstructions = 'Critical vaccines. Maintain 2-8°C cold-chain.';

  // QR Modal State
  public selectedShipmentForQR = signal<Shipment | null>(null);
  public isCopied = signal<boolean>(false);

  // Password Modal State
  public showPasswordModal = signal<boolean>(false);
  public showCurrentPassword = signal<boolean>(false);
  public showNewPassword = signal<boolean>(false);
  public passwordLoading = signal<boolean>(false);
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

  public applyPreset(presetKey: string): void {
    if (presetKey === 'silchar') {
      this.newOrigin = 'Guwahati Central Medical Hub';
      this.newDestination = 'Silchar Civil Hospital';
      this.newCargoType = 'MEDICINE';
      this.newPriority = 'CRITICAL';
      this.newWeight = 650;
      this.newAddress = 'Barak Valley District Civil Hospital Complex';
      this.newInstructions = 'Temperature-sensitive anti-venom & cholera vaccines. Cold-chain storage 2-8°C.';
    } else if (presetKey === 'gangtok') {
      this.newOrigin = 'Siliguri Food Relief Base';
      this.newDestination = 'Gangtok District Emergency Store';
      this.newCargoType = 'FOOD';
      this.newPriority = 'HIGH';
      this.newWeight = 1200;
      this.newAddress = 'District Disaster Relief Store, Development Area, Gangtok';
      this.newInstructions = 'High-energy dry rations & potable drinking water packets.';
    } else if (presetKey === 'aizawl') {
      this.newOrigin = 'Shillong Emergency Store';
      this.newDestination = 'Aizawl Civil Hospital';
      this.newCargoType = 'RELIEF';
      this.newPriority = 'HIGH';
      this.newWeight = 800;
      this.newAddress = 'Aizawl District Emergency Response Depot, Mizoram';
      this.newInstructions = 'Weatherproof relief tents and bedding kits for flood-displaced families.';
    }
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
      this.actionError.set('Please provide origin, destination, and cargo weight.');
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
        this.actionSuccess.set(`Corridor Requisition ${res.shipment.shipment_code} Created! AI Risk assessed at ${res.shipment.risk_score}/100.`);
        this.loadShipments();
        // Immediately display the Driver QR Badge modal
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
      case 'FOOD': return 'Emergency Rations & Water';
      case 'RELIEF': return 'Disaster Relief Tents';
      case 'DISASTER_AID': return 'Rescue Gear & Generators';
      default: return 'General Cargo';
    }
  }

  public formatStatus(status: string): string {
    switch (status) {
      case 'READY': return 'Ready for Dispatch';
      case 'IN_TRANSIT': return 'In-Transit on Corridor';
      case 'DELIVERED': return 'Delivered & Verified';
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

  public downloadQrSvg(s: Shipment): void {
    const blob = new Blob([s.qr_svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${s.shipment_code}-Dispatch-QR.svg`;
    a.click();
    URL.revokeObjectURL(url);
    this.actionSuccess.set(`Downloaded vector QR badge for ${s.shipment_code}`);
    setTimeout(() => this.actionSuccess.set(null), 4000);
  }

  public downloadManifest(s: Shipment): void {
    const packet = {
      manifest_title: 'ResQRoute Highland Logistics Dispatch Manifest',
      issued_at: new Date().toISOString(),
      shipment_code: s.shipment_code,
      verification_token: s.qr_token,
      priority: s.cargo_priority,
      status: s.status,
      cargo_spec: {
        cargo_type: s.cargo_type,
        weight_kg: s.weight_kg,
        delivery_address: s.delivery_address,
        special_instructions: s.special_instructions
      },
      corridor_route: {
        origin_hub: s.origin,
        destination_facility: s.destination,
        recommended_mountain_pass: s.recommended_route
      },
      ai_hazard_evaluation: {
        composite_score: s.risk_score,
        risk_level: s.risk_level,
        summary: s.risk_summary,
        terrain_factors: s.risk_factors
      },
      emergency_protocols: {
        command_hub: '+91 361 2237000 (Guwahati Central)',
        bro_road_control: '1800-11-2026',
        disaster_helpline: '1070 / 112'
      }
    };
    const blob = new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${s.shipment_code}-Dispatch-Manifest.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.actionSuccess.set(`Downloaded full dispatch manifest for ${s.shipment_code}`);
    setTimeout(() => this.actionSuccess.set(null), 4000);
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
        this.actionSuccess.set(res.message || 'Password updated successfully!');
        setTimeout(() => this.actionSuccess.set(null), 5000);
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
