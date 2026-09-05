import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from, catchError, map, tap, switchMap } from 'rxjs';
import * as QRCode from 'qrcode';
import { environment } from '../../../environments/environment';
import {
  Shipment,
  Trip,
  CreateShipmentPayload,
  ActivateTripPayload,
  ShipmentCreateResponse,
  TripActivateResponse,
  AIRiskEvaluation,
  TripStatus
} from '../models/logistics.model';
import { evaluateOfflineRouteRisk } from '../utils/offline-risk-engine.util';

const CACHE_SHIPMENTS_KEY = 'resqroute_cached_shipments';
const CACHE_TRIPS_KEY = 'resqroute_cached_trips';

@Injectable({
  providedIn: 'root'
})
export class LogisticsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  constructor() {
    this.seedDefaultShipmentsIfEmpty();
  }

  /**
   * Seed demonstration shipments into local cache if empty.
   */
  private seedDefaultShipmentsIfEmpty(): void {
    const existing = this.getLocalShipments();
    if (existing.length === 0) {
      const demo1 = this.createMockShipment(
        'RSQ-101',
        'Guwahati Central Medical Hub',
        'Silchar Civil Hospital',
        'MEDICINE',
        'CRITICAL',
        650,
        'Civil Hospital Complex, Premtala, Silchar',
        'Temperature-sensitive anti-venom & cholera vaccines. Cold-chain storage 2-8°C.'
      );
      const demo2 = this.createMockShipment(
        'RSQ-102',
        'Siliguri Food Relief Base',
        'Gangtok District Emergency Store',
        'FOOD',
        'HIGH',
        1200,
        'District Disaster Relief Store, Development Area, Gangtok',
        'High-energy dry rations & potable drinking water packets.'
      );
      this.saveLocalShipments([demo1, demo2]);

      const trip1 = this.createMockTrip(demo1, 'TRIP-101', 'AS-01-GC-4921 (TR-101)', 'READY');
      const trip2 = this.createMockTrip(demo2, 'TRIP-102', 'SK-01-D-9982 (TR-102)', 'ACTIVE');
      this.saveLocalTrips([trip1, trip2]);
    }
  }

  private getLocalShipments(): Shipment[] {
    try {
      const raw = localStorage.getItem(CACHE_SHIPMENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveLocalShipments(list: Shipment[]): void {
    try {
      localStorage.setItem(CACHE_SHIPMENTS_KEY, JSON.stringify(list));
    } catch {}
  }

  private getLocalTrips(): Trip[] {
    try {
      const raw = localStorage.getItem(CACHE_TRIPS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveLocalTrips(list: Trip[]): void {
    try {
      localStorage.setItem(CACHE_TRIPS_KEY, JSON.stringify(list));
    } catch {}
  }

  /**
   * Fetch all shipments (Tries backend API first, seamlessly falls back and merges with offline cache).
   */
  public getShipments(all: boolean = false): Observable<{ count: number; shipments: Shipment[] }> {
    const query = all ? '?all=true' : '';
    return this.http.get<{ count: number; shipments: Shipment[] }>(
      `${this.apiUrl}/api/logistics/shipments/${query}`
    ).pipe(
      map(res => {
        const remote = res.shipments || [];
        const local = this.getLocalShipments();
        const mergedMap = new Map<string, Shipment>();
        
        // Remote takes precedence, local fills any locally-created shipments
        local.forEach(s => mergedMap.set(s.shipment_code, s));
        remote.forEach(s => mergedMap.set(s.shipment_code, s));
        
        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        this.saveLocalShipments(merged);
        return { count: merged.length, shipments: merged };
      }),
      catchError(() => {
        const local = this.getLocalShipments();
        return of({ count: local.length, shipments: local });
      })
    );
  }

  /**
   * Fetch a single shipment by shipment_code or qr_token.
   */
  public getShipment(code: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${this.apiUrl}/api/logistics/shipments/${encodeURIComponent(code)}/`).pipe(
      catchError(() => {
        const local = this.getLocalShipments();
        const found = local.find(s => s.shipment_code.toLowerCase() === code.toLowerCase() || s.qr_token === code);
        if (found) return of(found);
        throw new Error('Shipment not found in local cache');
      })
    );
  }

  /**
   * Requisition a new shipment with live AI route risk scoring and QR code generation.
   * Fully offline-resilient: if the backend server is unreachable, it generates SVG QR and saves locally!
   */
  public createShipment(payload: CreateShipmentPayload): Observable<ShipmentCreateResponse> {
    return this.http.post<ShipmentCreateResponse>(`${this.apiUrl}/api/logistics/shipments/`, payload).pipe(
      tap(res => {
        if (res.shipment) {
          const list = this.getLocalShipments();
          list.unshift(res.shipment);
          this.saveLocalShipments(list);

          if (res.shipment.trip) {
            const trips = this.getLocalTrips();
            trips.unshift(res.shipment.trip);
            this.saveLocalTrips(trips);
          }
        }
      }),
      catchError(() => {
        // Build resilient local shipment
        return from(this.generateResilientLocalShipment(payload));
      })
    );
  }

  private async generateResilientLocalShipment(payload: CreateShipmentPayload): Promise<ShipmentCreateResponse> {
    const list = this.getLocalShipments();
    const count = list.length + 104;
    const shipment_code = `RSQ-${count}`;
    const token = `${shipment_code}-${Math.random().toString(16).substring(2, 10).toUpperCase()}`;

    // 1. Evaluate Route Risk with Highland Heuristic Engine
    const ai_eval = evaluateOfflineRouteRisk(
      payload.origin,
      payload.destination,
      payload.cargo_type,
      payload.cargo_priority,
      payload.weight_kg
    );

    // 2. Generate pure vector SVG QR code natively in browser
    const qrPayload = `RESQROUTE:TRIP:${token}:${shipment_code}`;
    let qr_svg = '';
    try {
      qr_svg = await QRCode.toString(qrPayload, {
        type: 'svg',
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
    } catch {
      qr_svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><text x="10" y="50">${shipment_code}</text></svg>`;
    }

    // 3. Construct Shipment object
    const shipment: Shipment = {
      id: Date.now(),
      shipment_code,
      cargo_type: payload.cargo_type,
      cargo_priority: payload.cargo_priority,
      origin: payload.origin,
      destination: payload.destination,
      weight_kg: payload.weight_kg,
      delivery_address: payload.delivery_address || '',
      special_instructions: payload.special_instructions || '',
      status: 'READY',
      is_emergency_relief: payload.is_emergency_relief ?? true,
      risk_score: ai_eval.risk_score,
      risk_level: ai_eval.risk_level,
      risk_summary: ai_eval.risk_summary,
      risk_factors: ai_eval.risk_factors,
      recommended_route: ai_eval.recommended_route,
      qr_token: token,
      qr_svg,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 4. Pre-create associated Trip
    const trip: Trip = {
      id: Date.now() + 1,
      trip_code: `TRIP-${count}`,
      vehicle_number: 'TR-102 (Demonstration)',
      vehicle_type: 'Heavy Highland Carrier',
      status: 'READY',
      current_corridor_segment: `${payload.origin} (Base Standby)`,
      activated_at: null,
      completed_at: null,
      last_ping_at: null,
      route_advisory: ai_eval.safety_advisory || 'Drive with caution.',
      shipment
    };

    shipment.trip = trip;

    // 5. Store locally
    list.unshift(shipment);
    this.saveLocalShipments(list);

    const trips = this.getLocalTrips();
    trips.unshift(trip);
    this.saveLocalTrips(trips);

    return {
      message: `Corridor Requisition ${shipment_code} generated with AI Risk Assessment (Resilient Mode).`,
      shipment,
      ai_evaluation: ai_eval
    };
  }

  /**
   * Run standalone AI risk simulation for a route corridor without saving.
   */
  public assessRouteRisk(payload: {
    origin: string;
    destination: string;
    cargo_type?: string;
    cargo_priority?: string;
    weight_kg?: number;
  }): Observable<AIRiskEvaluation> {
    return this.http.post<AIRiskEvaluation>(`${this.apiUrl}/api/logistics/risk-engine/assess/`, payload).pipe(
      catchError(() => {
        return of(
          evaluateOfflineRouteRisk(
            payload.origin,
            payload.destination,
            payload.cargo_type || 'MEDICINE',
            payload.cargo_priority || 'CRITICAL',
            payload.weight_kg || 500
          )
        );
      })
    );
  }

  /**
   * Fetch all active trips for field drivers.
   */
  public getActiveTrips(): Observable<{ count: number; trips: Trip[] }> {
    return this.http.get<{ count: number; trips: Trip[] }>(`${this.apiUrl}/api/logistics/trips/active/`).pipe(
      map(res => {
        const remote = res.trips || [];
        const local = this.getLocalTrips();
        const map = new Map<string, Trip>();

        local.forEach(t => map.set(t.trip_code, t));
        remote.forEach(t => map.set(t.trip_code, t));

        const merged = Array.from(map.values());
        this.saveLocalTrips(merged);
        return { count: merged.length, trips: merged };
      }),
      catchError(() => {
        const local = this.getLocalTrips();
        return of({ count: local.length, trips: local });
      })
    );
  }

  /**
   * Activate a trip using the scanned or entered QR token or shipment code.
   */
  public activateTrip(payload: ActivateTripPayload): Observable<TripActivateResponse> {
    return this.http.post<TripActivateResponse>(`${this.apiUrl}/api/logistics/trips/activate/`, payload).pipe(
      tap(res => {
        if (res.trip) {
          const trips = this.getLocalTrips();
          const idx = trips.findIndex(t => t.trip_code === res.trip.trip_code);
          if (idx !== -1) trips[idx] = res.trip;
          else trips.unshift(res.trip);
          this.saveLocalTrips(trips);
        }
      }),
      catchError(() => {
        // Offline activation
        const token = payload.qr_token.trim().toUpperCase();
        const trips = this.getLocalTrips();
        const shipments = this.getLocalShipments();

        const trip = trips.find(t =>
          t.trip_code.toUpperCase() === token ||
          t.shipment?.shipment_code.toUpperCase() === token ||
          t.shipment?.qr_token.toUpperCase() === token ||
          token.includes(t.trip_code.toUpperCase()) ||
          (t.shipment && token.includes(t.shipment.shipment_code.toUpperCase()))
        );

        if (!trip) {
          throw new Error(`Unrecognized dispatch QR token: ${payload.qr_token}`);
        }

        trip.status = 'ACTIVE';
        trip.vehicle_number = payload.vehicle_number || trip.vehicle_number || 'TR-102';
        trip.activated_at = new Date().toISOString();
        trip.last_ping_at = new Date().toISOString();

        if (trip.shipment) {
          trip.shipment.status = 'IN_TRANSIT';
          const sIdx = shipments.findIndex(s => s.shipment_code === trip.shipment!.shipment_code);
          if (sIdx !== -1) {
            shipments[sIdx].status = 'IN_TRANSIT';
            this.saveLocalShipments(shipments);
          }
        }

        this.saveLocalTrips(trips);

        return of({
          message: `Trip ${trip.trip_code} successfully activated for Corridor Mission!`,
          trip
        });
      })
    );
  }

  /**
   * Update the transit status of an active trip.
   */
  public updateTripStatus(
    tripCode: string,
    status: TripStatus,
    segment?: string
  ): Observable<{ message: string; trip: Trip }> {
    return this.http.post<{ message: string; trip: Trip }>(
      `${this.apiUrl}/api/logistics/trips/${encodeURIComponent(tripCode)}/status/`,
      { status, current_corridor_segment: segment }
    ).pipe(
      tap(res => {
        if (res.trip) {
          const trips = this.getLocalTrips();
          const idx = trips.findIndex(t => t.trip_code === res.trip.trip_code);
          if (idx !== -1) trips[idx] = res.trip;
          this.saveLocalTrips(trips);
        }
      }),
      catchError(() => {
        const trips = this.getLocalTrips();
        const trip = trips.find(t => t.trip_code.toLowerCase() === tripCode.toLowerCase());
        if (!trip) throw new Error(`Trip ${tripCode} not found`);

        trip.status = status;
        trip.last_ping_at = new Date().toISOString();
        if (segment) trip.current_corridor_segment = segment;

        if (status === 'COMPLETED') {
          trip.completed_at = new Date().toISOString();
          if (trip.shipment) trip.shipment.status = 'DELIVERED';
        } else if (status === 'IN_TRANSIT') {
          if (trip.shipment) trip.shipment.status = 'IN_TRANSIT';
        }

        this.saveLocalTrips(trips);

        return of({
          message: `Trip ${trip.trip_code} status updated to ${status}.`,
          trip
        });
      })
    );
  }

  private createMockShipment(
    code: string,
    origin: string,
    dest: string,
    cargo: any,
    priority: any,
    weight: number,
    address: string,
    instructions: string
  ): Shipment {
    const ai = evaluateOfflineRouteRisk(origin, dest, cargo, priority, weight);
    const token = `${code}-DEMO8912`;
    return {
      id: Math.floor(Math.random() * 10000),
      shipment_code: code,
      cargo_type: cargo,
      cargo_priority: priority,
      origin,
      destination: dest,
      weight_kg: weight,
      delivery_address: address,
      special_instructions: instructions,
      status: 'READY',
      is_emergency_relief: true,
      risk_score: ai.risk_score,
      risk_level: ai.risk_level,
      risk_summary: ai.risk_summary,
      risk_factors: ai.risk_factors,
      recommended_route: ai.recommended_route,
      qr_token: token,
      qr_svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f8fafc"/><text x="50" y="55" font-family="monospace" font-weight="bold" font-size="12" text-anchor="middle" fill="#1e40af">${code}</text></svg>`,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private createMockTrip(shipment: Shipment, tripCode: string, vehicle: string, status: TripStatus): Trip {
    return {
      id: Math.floor(Math.random() * 10000),
      trip_code: tripCode,
      vehicle_number: vehicle,
      vehicle_type: 'Heavy 8W Refrigerated Truck',
      status,
      current_corridor_segment: `${shipment.origin} (Base)`,
      activated_at: status !== 'READY' ? new Date().toISOString() : null,
      completed_at: null,
      last_ping_at: new Date().toISOString(),
      route_advisory: shipment.risk_summary,
      shipment
    };
  }
}
