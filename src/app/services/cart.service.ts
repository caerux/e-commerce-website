import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../models/product.model';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartItemCount = new BehaviorSubject<number>(0);

  constructor() {
    // Load cart from local storage if available
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      this.cartItems = JSON.parse(savedCart) as CartItem[];
      this.updateCartItemCount();
    }
  }

  getCartItems(): CartItem[] {
    return this.cartItems;
  }

  getCartItem(barcode: string): CartItem | undefined {
    return this.cartItems.find((item) => item.product.barcode === barcode);
  }

  getCartItemCount(): Observable<number> {
    return this.cartItemCount.asObservable();
  }

  addToCart(product: Product): void {
    const item = this.cartItems.find(
      (item) => item.product.barcode === product.barcode
    );
    if (item) {
      item.quantity += 1;
    } else {
      this.cartItems.push({ product, quantity: 1 });
    }
    this.updateCartItemCount();
    this.saveCart();
  }

  removeFromCart(product: Product): void {
    const index = this.cartItems.findIndex(
      (item) => item.product.barcode === product.barcode
    );
    if (index > -1) {
      this.cartItems.splice(index, 1);
      this.updateCartItemCount();
      this.saveCart();
    }
  }

  clearCart(): void {
    this.cartItems = [];
    this.cartItemCount.next(0);
    this.saveCart();
  }

  increaseQuantity(product: Product): void {
    const item = this.cartItems.find(
      (item) => item.product.barcode === product.barcode
    );
    if (item) {
      item.quantity += 1;
      this.updateCartItemCount();
      this.saveCart();
    }
  }

  decreaseQuantity(product: Product): void {
    const item = this.cartItems.find(
      (item) => item.product.barcode === product.barcode
    );
    if (item) {
      if (item.quantity > 1) {
        item.quantity -= 1;
        this.updateCartItemCount();
        this.saveCart();
      } else {
        this.removeFromCart(product);
      }
    }
  }

  updateQuantity(product: Product, quantity: number): void {
    const item = this.cartItems.find(
      (item) => item.product.barcode === product.barcode
    );
    if (item) {
      item.quantity = quantity;
      if (item.quantity <= 0) {
        this.removeFromCart(product);
      } else {
        this.updateCartItemCount();
        this.saveCart();
      }
    }
  }

  private saveCart(): void {
    localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
  }

  private updateCartItemCount(): void {
    const count = this.cartItems.reduce(
      (total, item) => total + item.quantity,
      0
    );
    this.cartItemCount.next(count);
  }
}
