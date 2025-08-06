
export interface Restaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  cuisine: string;
  distance: string;
  address: string;
  openingHours: string;
  description: string;
  phoneNumber: string;
}

export interface Table {
  id: string;
  restaurantId: string;
  number: number;
  seats: number;
  available: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'Entrada' | 'Prato Principal' | 'Sobremesa' | 'Bebida';
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  tableId: string;
  tableNumber: number;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalAmount: number;
  paymentMethod?: 'credit' | 'app' | 'local';
  checkInTime?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}
