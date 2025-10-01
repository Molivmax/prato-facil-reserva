
import { Restaurant, Table, MenuItem, Order } from './types';

// Mock data removido - dados reais são buscados do Supabase
export const restaurants: Restaurant[] = [];
export const tables: Table[] = [];
export const menuItems: MenuItem[] = [];
export const orders: Order[] = [];

export const getRestaurantById = (id: string): Restaurant | undefined => {
  return undefined;
};

export const getTablesByRestaurantId = (restaurantId: string): Table[] => {
  return [];
};

export const getMenuItemsByRestaurantId = (restaurantId: string): MenuItem[] => {
  return [];
};

export const getOrderById = (id: string): Order | undefined => {
  return undefined;
};

export const getLatestOrder = (): Order | undefined => {
  return undefined;
};

export let currentUser = {
  id: '',
  name: '',
  email: '',
  phone: ''
};
