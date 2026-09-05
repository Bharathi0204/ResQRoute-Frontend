import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class LogisticsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Fetch all shipments or customer-filtered shipments.
   */
  public getShipments(all: boolean = false): Observable<{ count: number; shipments: Shipment[] }> {
    const query = all ? '?all=true' : '';
    return this.http.get<{ count: number; shipments: Shipment[] }>(
      `${this.apiUrl}/api/logistics/shipments/${query}`
    );
  }

  /**
   * Fetch a single shipment by shipment_code or qr_token.
   */
  public getShipment(code: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${this.apiUrl}/api/logistics/shipments/${encodeURIComponent(code)}/`);
  }

  /**
   * Requisition a new shipment with live AI route risk scoring and QR code generation.
   */
  public createShipment(payload: CreateShipmentPayload): Observable<ShipmentCreateResponse> {
    return this.http.post<ShipmentCreateResponse>(`${this.apiUrl}/api/logistics/shipments/`, payload);
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
    return this.http.post<AIRiskEvaluation>(`${this.apiUrl}/api/logistics/risk-engine/assess/`, payload);
  }

  /**
   * Fetch all active trips for field drivers.
   */
  public getActiveTrips(): Observable<{ count: number; trips: Trip[] }> {
    return this.http.get<{ count: number; trips: Trip[] }>(`${this.apiUrl}/api/logistics/trips/active/`);
  }

  /**
   * Activate a trip using the scanned or entered QR token or shipment code.
   */
  public activateTrip(payload: ActivateTripPayload): Observable<TripActivateResponse> {
    return this.http.post<TripActivateResponse>(`${this.apiUrl}/api/logistics/trips/activate/`, payload);
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
    );
  }
}
