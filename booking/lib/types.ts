export interface Business {
  id: string;
  name: string;
  category: string;
  location: string;
  description?: string;
}

export interface Booking {
  id: string;
  businessId: string;
  name: string;
  email: string;
  date: string;
  time: string;
}
