
export interface Fare {
  id: string;
  region: string;
  destination: string;
  meterValue: number;
  counterValue: number;
}

export interface User {
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface LongTrip {
  id: string;
  city: string;
  kilometers: number;
}
