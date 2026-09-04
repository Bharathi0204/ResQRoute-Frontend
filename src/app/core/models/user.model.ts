export type UserRole = 'CUSTOMER' | 'DRIVER' | 'ADMIN';

export type AreaType = 'CITY' | 'VILLAGE';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DriverProfile {
  id?: number;
  vehicle_type?: string;
  vehicle_number: string;
  license_number: string;
  license_issuing_state?: string;
  license_expiry?: string | null;
  state?: string;
  district?: string;
  is_available: boolean;
  is_verified: boolean;
}

export interface CustomerProfile {
  id?: number;
  area_type?: AreaType;
  locality_name?: string;
  district?: string;
  pincode?: string;
  state?: string;
  department?: string;
  delivery_address?: string;
}

export interface AuthorityProfile {
  id?: number;
  official_id: string;
  designation: string;
  department_name: string;
  jurisdiction_state: string;
  district_office?: string;
  office_address?: string;
  approval_status: ApprovalStatus;
  approved_by?: string | null;
  approved_at?: string | null;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number?: string;
  organization?: string;
  driver_profile?: DriverProfile;
  customer_profile?: CustomerProfile;
  authority_profile?: AuthorityProfile;
  date_joined?: string;
}

export interface AuthorityRequestItem {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  official_id: string;
  designation: string;
  department_name: string;
  jurisdiction_state: string;
  office_address?: string;
  approval_status: ApprovalStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
}

export interface StateRerouteReport {
  state: string;
  reroute_count: number;
  primary_cause: string;
  districts_affected: string[];
  active_trucks: number;
}

export interface CorridorRerouteLog {
  log_id: string;
  from_location: string;
  to_location: string;
  state: string;
  district: string;
  original_route: string;
  rerouted_via: string;
  cause: string;
  timestamp: string;
  authority_in_charge: string;
  status: 'IN_TRANSIT' | 'REROUTED_SUCCESS' | 'ALERT';
}

export interface RerouteReportsData {
  total_reroutes_today: number;
  active_corridors: number;
  critical_weather_alerts: number;
  state_wise_reports: StateRerouteReport[];
  daily_trends: { day: string; reroutes: number }[];
  corridor_logs?: CorridorRerouteLog[];
}

export interface AuthResponse {
  message: string;
  user: User;
  access: string;
  refresh: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  database: string;
  database_engine?: string;
  database_host?: string;
}

export interface ForgotPasswordPayload {
  role: UserRole;
  phone_number?: string;
  email?: string;
  official_id?: string;
  reason?: string;
}

export interface ForgotPasswordResponse {
  status: 'success' | 'pending_superadmin';
  role: UserRole;
  target?: string;
  channel?: 'SMS' | 'EMAIL' | 'SUPERADMIN';
  temp_password?: string;
  message: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

export interface OfficialResetRequestItem {
  id: number;
  username: string;
  full_name: string;
  official_id: string;
  email?: string;
  designation: string;
  department: string;
  state: string;
  reason: string;
  status: ApprovalStatus;
  temp_password?: string;
  requested_at: string;
  resolved_at?: string;
}

export const NE_STATE_DISTRICTS_MAP: Record<string, string[]> = {
  'Assam': [
    'Kamrup Metropolitan',
    'Kamrup Rural',
    'Dima Hasao (Haflong)',
    'Cachar (Silchar)',
    'Dibrugarh',
    'Jorhat',
    'Nagaon',
    'Sonitpur (Tezpur)',
    'Tinsukia',
    'Barpeta',
    'Karbi Anglong',
    'Karimganj',
    'Hailakandi',
    'Bongaigaon',
    'Dhubri',
    'Golaghat',
    'Sivasagar',
    'Goalpara',
    'Morigaon',
    'Darrang',
    'Udalguri',
    'Baksa',
    'Chirang',
    'Kokrajhar'
  ],
  'Sikkim': [
    'Gangtok (East Sikkim)',
    'Mangan (North Sikkim)',
    'Pakyong',
    'Namchi (South Sikkim)',
    'Gyalshing / Geyzing (West Sikkim)',
    'Soreng'
  ],
  'Arunachal Pradesh': [
    'Tawang',
    'West Kameng (Bomdila)',
    'East Kameng',
    'Papum Pare (Itanagar)',
    'Lower Subansiri (Ziro)',
    'Upper Subansiri',
    'West Siang',
    'East Siang (Pasighat)',
    'Lohit (Tezu)',
    'Changlang',
    'Tirap',
    'Namsai'
  ],
  'Meghalaya': [
    'East Khasi Hills (Shillong)',
    'West Khasi Hills',
    'Ri-Bhoi (Nongpoh)',
    'West Jaintia Hills (Jowai)',
    'East Jaintia Hills',
    'West Garo Hills (Tura)',
    'East Garo Hills',
    'South Garo Hills'
  ],
  'Manipur': [
    'Imphal East',
    'Imphal West',
    'Bishnupur',
    'Thoubal',
    'Churachandpur',
    'Senapati',
    'Ukhrul',
    'Chandel',
    'Tamenglong',
    'Jiribam',
    'Noney',
    'Kangpokpi',
    'Tengnoupal'
  ],
  'Nagaland': [
    'Kohima',
    'Dimapur',
    'Mokokchung',
    'Tuensang',
    'Mon',
    'Wokha',
    'Zunheboto',
    'Phek',
    'Peren',
    'Kiphire',
    'Longleng',
    'Chümoukedima',
    'Niuland'
  ],
  'Mizoram': [
    'Aizawl',
    'Lunglei',
    'Saiha',
    'Champhai',
    'Kolasib',
    'Serchhip',
    'Lawngtlai',
    'Mamit',
    'Hnahthial',
    'Khawzawl',
    'Saitual'
  ],
  'Tripura': [
    'West Tripura (Agartala)',
    'North Tripura (Dharmanagar)',
    'South Tripura',
    'Dhalai (Ambassa)',
    'Unakoti (Kailashahar)',
    'Khowai',
    'Sepahijala',
    'Gomati (Udaipur)'
  ]
};

