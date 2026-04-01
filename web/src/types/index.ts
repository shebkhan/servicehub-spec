export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  createdAt: Date;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  service?: Service;
  user?: User;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  date: Date;
  time: string;
  notes?: string;
  createdAt: Date;
}

export interface Review {
  id: string;
  bookingId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}
