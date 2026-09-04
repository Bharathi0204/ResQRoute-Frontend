export type UserRole = 'CUSTOMER' | 'DRIVER' | 'ADMIN';

export interface DriverProfile {
  vehicle_number: string;
  license_number: string;
  is_available: boolean;
  is_verified: boolean;
}

export interface CustomerProfile {
  department?: string;
  delivery_address?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number?: string;
  organization?: string;
  driver_profile?: DriverProfile;
  customer_profile?: CustomerProfile;
  date_joined?: string;
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
}
