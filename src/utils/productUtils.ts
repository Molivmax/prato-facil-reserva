
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
};

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category: string;
  image_url: string | null;
}

export interface CategoryProducts {
  [category: string]: Product[];
}

export const groupProductsByCategory = (products: Product[]): CategoryProducts => {
  return products.reduce((acc: CategoryProducts, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});
};
