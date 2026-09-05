export type CargoType = 'MEDICINE' | 'FOOD' | 'RELIEF' | 'DISASTER_AID' | 'GENERAL';
export type CargoPriority = 'CRITICAL' | 'HIGH' | 'NORMAL';
export type ShipmentStatus = 'READY' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
export type RiskLevel = 'SAFE' | 'CAUTION' | 'BLOCKED';
export type TripStatus = 'READY' | 'ACTIVE' | 'IN_TRANSIT' | 'COMPLETED';

export interface AIRiskEvaluation {
  risk_score: number;
  risk_level: RiskLevel;
  risk_summary: string;
  risk_factors: string[];
  weather_condition?: string;
  recommended_route: string;
  safety_advisory?: string;
  engine?: string;
}

export interface Trip {
  id: number;
  trip_code: string;
  vehicle_number: string;
  vehicle_type: string;
  status: TripStatus;
  current_corridor_segment: string;
  activated_at: string | null;
  completed_at: string | null;
  last_ping_at: string | null;
  route_advisory: string;
  driver_name?: string;
  driver?: {
    id: number;
    username: string;
    email: string;
    role: string;
    full_name: string;
  };
  shipment?: Shipment;
  created_at?: string;
  updated_at?: string;
}

export interface Shipment {
  id: number;
  shipment_code: string;
  cargo_type: CargoType;
  cargo_priority: CargoPriority;
  origin: string;
  destination: string;
  weight_kg: number;
  delivery_address: string;
  special_instructions: string;
  status: ShipmentStatus;
  is_emergency_relief: boolean;
  risk_score: number;
  risk_level: RiskLevel;
  risk_summary: string;
  risk_factors: string[];
  recommended_route: string;
  qr_token: string;
  qr_svg: string;
  trip?: Trip;
  customer?: {
    id: number;
    username: string;
    email: string;
    role: string;
    full_name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateShipmentPayload {
  cargo_type: CargoType;
  cargo_priority: CargoPriority;
  origin: string;
  destination: string;
  weight_kg: number;
  delivery_address?: string;
  special_instructions?: string;
  is_emergency_relief?: boolean;
}

export interface ActivateTripPayload {
  qr_token: string;
  vehicle_number?: string;
}

export interface ShipmentCreateResponse {
  message: string;
  shipment: Shipment;
  ai_evaluation: AIRiskEvaluation;
}

export interface TripActivateResponse {
  message: string;
  trip: Trip;
}
