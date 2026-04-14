export interface Category {
  id: string;
  name: string;
  name_en?: string | null;
  slug: string;
  created_at: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  name_en?: string | null;
  description: string | null;
  description_en?: string | null;
  ingredients: string | null;
  ingredients_en?: string | null;
  how_to_use: string | null;
  how_to_use_en?: string | null;
  price: number;
  compare_price: number | null;
  images: string[];
  category_id: string | null;
  category?: Category;
  in_stock: boolean;
  volume: string | null;
  hair_type: string[];
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  status: OrderStatus;
  customer_id: string | null;
  customer?: Customer;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  city: string;
  nova_poshta_ref: string;
  nova_poshta_address: string;
  total: number;
  payment_id: string | null;
  payment_status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  price: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  volume?: string;
}

export interface NovaPoshtaCity {
  Ref: string;
  Description: string;
  DescriptionRu: string;
  AreaDescription: string;
}

export interface NovaPoshtaWarehouse {
  Ref: string;
  Description: string;
  Number: string;
  CityRef: string;
  CityDescription: string;
}
