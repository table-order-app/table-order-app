// オプションの型定義
export interface Option {
  id: number;
  name: string;
  price: number;
}

// トッピングの型定義
export interface Topping {
  id: number;
  name: string;
  price: number;
}

// メニューアイテムの型定義
export interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  image: string;
  description: string;
  options: Option[];
  toppings: Topping[];
  allergens: string[];
}

// カートアイテムの型定義
export interface CartItem {
  menuItem: MenuItem;
  options: Option[];
  toppings: Topping[];
  notes: string;
  quantity: number;
}
