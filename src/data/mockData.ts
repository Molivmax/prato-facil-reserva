
import { Restaurant, Table, MenuItem, Order } from './types';

export const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Boteco Tal',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    cuisine: 'Comida de Boteco',
    distance: '1.2 km',
    address: 'Rua das Flores, 123',
    openingHours: '12:00 - 00:00',
    description: 'Um boteco tradicional com ótimas opções de petiscos e cervejas artesanais.',
    phoneNumber: '(11) 9999-8888'
  },
  {
    id: '2',
    name: 'Bar Tal',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
    cuisine: 'Bar e Petiscos',
    distance: '0.8 km',
    address: 'Av. Paulista, 1000',
    openingHours: '16:00 - 02:00',
    description: 'Bar com ambiente descontraído, música ao vivo e os melhores petiscos da região.',
    phoneNumber: '(11) 8888-7777'
  },
  {
    id: '3',
    name: 'Restaurante Tal',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    cuisine: 'Italiana',
    distance: '2.0 km',
    address: 'Rua Augusta, 500',
    openingHours: '11:30 - 23:00',
    description: 'Restaurante italiano com ambiente aconchegante e pratos preparados com ingredientes frescos.',
    phoneNumber: '(11) 7777-6666'
  },
  {
    id: '4',
    name: 'Pizzaria Tal',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    cuisine: 'Pizzaria',
    distance: '1.5 km',
    address: 'Rua Consolação, 250',
    openingHours: '18:00 - 00:00',
    description: 'Pizzas artesanais com massa fina e crocante, feitas em forno a lenha.',
    phoneNumber: '(11) 6666-5555'
  }
];

export const tables: Table[] = [
  { id: '1', restaurantId: '1', number: 1, seats: 2, available: true },
  { id: '2', restaurantId: '1', number: 2, seats: 4, available: true },
  { id: '3', restaurantId: '1', number: 3, seats: 4, available: false },
  { id: '4', restaurantId: '1', number: 4, seats: 6, available: true },
  { id: '5', restaurantId: '1', number: 5, seats: 2, available: true },
  { id: '6', restaurantId: '1', number: 6, seats: 2, available: false },
  { id: '7', restaurantId: '2', number: 1, seats: 2, available: true },
  { id: '8', restaurantId: '2', number: 2, seats: 4, available: true },
  { id: '9', restaurantId: '3', number: 1, seats: 2, available: true },
  { id: '10', restaurantId: '3', number: 2, seats: 4, available: false },
  { id: '11', restaurantId: '4', number: 1, seats: 2, available: true },
  { id: '12', restaurantId: '4', number: 2, seats: 4, available: true },
];

export const menuItems: MenuItem[] = [
  // Restaurante 1 - Boteco Tal
  {
    id: '1',
    restaurantId: '1',
    name: 'Isca de Tilápia',
    description: 'Iscas de filé de tilápia empanadas e fritas, acompanha molho tártaro.',
    price: 45.90,
    image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Entrada'
  },
  {
    id: '2',
    restaurantId: '1',
    name: 'Porção de Pastéis',
    description: 'Pastéis fritos na hora, com recheios de carne, queijo e palmito.',
    price: 38.90,
    image: 'https://images.unsplash.com/photo-1599492406315-e9a787f681c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Entrada'
  },
  {
    id: '3',
    restaurantId: '1',
    name: 'Feijoada Completa',
    description: 'Tradicional feijoada com arroz, couve, laranja, farofa e torresmo.',
    price: 79.90,
    image: 'https://images.unsplash.com/photo-1548280699-bcde0b4e0269?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Prato Principal'
  },
  {
    id: '4',
    restaurantId: '1',
    name: 'Picanha na Chapa',
    description: 'Picanha grelhada na chapa com alho, acompanha arroz, farofa e vinagrete.',
    price: 89.90,
    image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Prato Principal'
  },
  {
    id: '5',
    restaurantId: '1',
    name: 'Pudim de Leite',
    description: 'Tradicional pudim de leite condensado com calda de caramelo.',
    price: 18.90,
    image: 'https://images.unsplash.com/photo-1639744093864-202a723a884e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Sobremesa'
  },
  {
    id: '6',
    restaurantId: '1',
    name: 'Chopp Artesanal',
    description: 'Chopp artesanal da casa, cremoso e refrescante.',
    price: 14.90,
    image: 'https://images.unsplash.com/photo-1513189737554-3f16985d0c5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Bebida'
  },
  {
    id: '7',
    restaurantId: '1',
    name: 'Caipirinha',
    description: 'Clássica caipirinha de limão com cachaça artesanal.',
    price: 22.90,
    image: 'https://images.unsplash.com/photo-1541591425126-4a033cb976cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Bebida'
  },
  // Outros restaurantes teriam itens semelhantes
];

export const orders: Order[] = [
  {
    id: '1',
    restaurantId: '1',
    restaurantName: 'Boteco Tal',
    tableId: '1',
    tableNumber: 1,
    items: [
      { menuItemId: '1', name: 'Isca de Tilápia', price: 45.90, quantity: 1 },
      { menuItemId: '6', name: 'Chopp Artesanal', price: 14.90, quantity: 2 }
    ],
    status: 'pending',
    totalAmount: 75.70
  },
  {
    id: '2',
    restaurantId: '2',
    restaurantName: 'Bar Tal',
    tableId: '7',
    tableNumber: 1,
    items: [
      { menuItemId: '8', name: 'Batata Frita', price: 32.90, quantity: 1 },
      { menuItemId: '12', name: 'Refrigerante', price: 8.90, quantity: 2 }
    ],
    status: 'confirmed',
    totalAmount: 50.70,
    paymentMethod: 'app',
    checkInTime: new Date('2023-10-15T19:30:00')
  }
];

export const getRestaurantById = (id: string): Restaurant | undefined => {
  return restaurants.find(restaurant => restaurant.id === id);
};

export const getTablesByRestaurantId = (restaurantId: string): Table[] => {
  return tables.filter(table => table.restaurantId === restaurantId);
};

export const getMenuItemsByRestaurantId = (restaurantId: string): MenuItem[] => {
  return menuItems.filter(item => item.restaurantId === restaurantId);
};

export const getOrderById = (id: string): Order | undefined => {
  return orders.find(order => order.id === id);
};

export const getLatestOrder = (): Order | undefined => {
  return orders[orders.length - 1];
};

export let currentUser = {
  id: '1',
  name: 'João Silva',
  email: 'joao@example.com',
  phone: '(11) 99999-8888'
};
