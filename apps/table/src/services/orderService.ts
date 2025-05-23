import { post, get } from "../utils/api";
import { CartItem } from "../types";

export interface OrderRequest {
  tableId: number;
  items: Array<{
    menuItemId: number;
    name: string;
    quantity: number;
    notes?: string;
    options?: Array<{
      name: string;
      price: number;
    }>;
    toppings?: Array<{
      name: string;
      price: number;
    }>;
  }>;
}

/**
 * 注文を作成
 */
export async function createOrder(tableId: number, cartItems: CartItem[]) {
  const orderItems = cartItems.map(item => ({
    menuItemId: item.menuItem.id,
    name: item.menuItem.name,
    quantity: item.quantity,
    notes: item.notes,
    options: item.options.map(opt => ({
      name: opt.name,
      price: opt.price
    })),
    toppings: item.toppings.map(top => ({
      name: top.name,
      price: top.price
    }))
  }));

  return post<any>("/order", {
    tableId,
    items: orderItems
  });
}

/**
 * テーブルの注文履歴を取得
 */
export async function getTableOrders(tableId: number) {
  return get<any[]>(`/order/table/${tableId}`);
}
