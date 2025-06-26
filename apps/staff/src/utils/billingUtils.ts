/**
 * Billing calculation utilities for staff app
 */

// API order item structure with pricing
export interface ApiOrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: string; // Base menu price only (incomplete in backend)
  totalPrice: string; // Base total only (incomplete in backend)
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  options?: Array<{
    id: number;
    orderItemId: number;
    name: string;
    price: string;
  }>;
  toppings?: Array<{
    id: number;
    orderItemId: number;
    name: string;
    price: string;
  }>;
}

// API order structure with pricing
export interface ApiOrder {
  id: number;
  storeId: number;
  tableId: number;
  status: string;
  totalItems: number;
  subtotalAmount?: string;
  taxAmount?: string;
  totalAmount?: string;
  createdAt: string;
  updatedAt: string;
  table: {
    id: number;
    number: number;
  };
  items: ApiOrderItem[];
}

/**
 * Calculate the correct total price for an order item including options and toppings
 */
export function calculateItemActualPrice(item: ApiOrderItem): {
  unitPrice: number;
  totalPrice: number;
} {
  // Base price from menu item
  const basePrice = parseFloat(item.unitPrice || "0");
  
  // Calculate options total
  const optionsTotal = (item.options || []).reduce((sum, option) => {
    return sum + parseFloat(option.price || "0");
  }, 0);
  
  // Calculate toppings total
  const toppingsTotal = (item.toppings || []).reduce((sum, topping) => {
    return sum + parseFloat(topping.price || "0");
  }, 0);
  
  // Actual unit price includes base + options + toppings
  const actualUnitPrice = basePrice + optionsTotal + toppingsTotal;
  
  // Total price for this item (unit price × quantity)
  const actualTotalPrice = actualUnitPrice * item.quantity;
  
  return {
    unitPrice: actualUnitPrice,
    totalPrice: actualTotalPrice
  };
}

/**
 * Calculate the total bill amount for an order (all prices are tax-inclusive)
 */
export function calculateOrderTotal(order: ApiOrder): {
  total: number;
} {
  // Calculate total by summing all item totals (already tax-inclusive)
  const total = order.items.reduce((sum, item) => {
    const { totalPrice } = calculateItemActualPrice(item);
    return sum + totalPrice;
  }, 0);
  
  return {
    total
  };
}

/**
 * Calculate total billing amount for multiple orders (per table, all tax-inclusive)
 */
export function calculateTableBillingTotal(orders: ApiOrder[]): {
  total: number;
  orderCount: number;
} {
  let totalAmount = 0;
  
  orders.forEach(order => {
    const orderTotal = calculateOrderTotal(order);
    totalAmount += orderTotal.total;
  });
  
  return {
    total: totalAmount,
    orderCount: orders.length
  };
}

/**
 * Format price for display (Japanese Yen)
 */
export function formatPrice(amount: number): string {
  return `¥${Math.round(amount).toLocaleString()}`;
}

/**
 * Format price breakdown for display (tax-inclusive pricing)
 */
export function formatPriceBreakdown(breakdown: {
  total: number;
}): {
  totalFormatted: string;
} {
  return {
    totalFormatted: formatPrice(breakdown.total)
  };
}