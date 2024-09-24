import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Product } from '../models/product.model';
import { AuthService, User } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CartService implements OnDestroy {
  private cartItems: { [barcode: string]: number } = {};
  private cartItemsSubject = new BehaviorSubject<{ [barcode: string]: number }>(
    {}
  );
  public cartItems$ = this.cartItemsSubject.asObservable();
  private currentUser: User | null = null;
  private authSubscription: Subscription;

  constructor(private authService: AuthService) {
    // Subscribe to authentication state changes
    this.authSubscription = this.authService.currentUser$.subscribe((user) => {
      const previousUser = this.currentUser;
      this.currentUser = user;

      if (!previousUser && user) {
        // User has just logged in, merge the guest cart with user cart
        this.mergeCarts();
      } else if (previousUser && !user) {
        // User has just logged out, load guest cart
        this.loadCart();
      }
    });

    // Load cart from localStorage when the service is initialized
    this.loadCart();
  }

  // Retrieves all cart items
  getCartItems(): { [barcode: string]: number } {
    return this.cartItems;
  }

  // Retrieves the quantity of a specific product by barcode
  getCartItem(barcode: string): number {
    return this.cartItems[barcode] || 0;
  }

  // Adds a product to the cart
  addToCart(product: Product): void {
    const barcode = product.barcode;
    if (this.cartItems[barcode]) {
      this.cartItems[barcode] += 1;
    } else {
      this.cartItems[barcode] = 1;
    }
    this.saveCart();
  }

  // Removes a product from the cart
  removeFromCart(product: Product): void {
    const barcode = product.barcode;
    if (this.cartItems[barcode]) {
      delete this.cartItems[barcode];
      this.saveCart();
    }
  }

  // Updates the quantity of a specific product in the cart
  updateQuantity(product: Product, quantity: number): void {
    const barcode = product.barcode;
    if (quantity <= 0) {
      this.removeFromCart(product);
    } else {
      this.cartItems[barcode] = quantity;
      this.saveCart();
    }
  }

  // Clears all items from the cart
  clearCart(): void {
    this.cartItems = {};
    this.saveCart();
  }

  // Constructs a unique cart key based on the authenticated user
  private getUserId(): string {
    return this.currentUser ? this.currentUser.id.toString() : 'guest';
  }

  // Saves the current cart to localStorage
  private saveCart(): void {
    const cartData = localStorage.getItem('cart');
    let cart: { [userId: string]: { [barcode: string]: number } } = {};

    if (cartData) {
      try {
        cart = JSON.parse(cartData);
      } catch (e) {
        console.error('Invalid cart data in localStorage:', e);
        cart = {};
      }
    }

    const userId = this.getUserId();
    cart[userId] = this.cartItems;

    localStorage.setItem('cart', JSON.stringify(cart));
    this.cartItemsSubject.next(this.cartItems);
  }

  // Loads the cart from localStorage based on the authenticated user
  private loadCart(): void {
    const cartData = localStorage.getItem('cart');
    let cart: { [userId: string]: { [barcode: string]: number } } = {};

    if (cartData) {
      try {
        cart = JSON.parse(cartData);
      } catch (e) {
        console.error('Invalid cart data in localStorage:', e);
        cart = {};
      }
    }

    const userId = this.getUserId();
    const userCart = cart[userId] || {};

    // Validate that userCart is an object with string keys and number values
    if (this.isValidCartItems(userCart)) {
      this.cartItems = userCart;
    } else {
      console.error('Invalid cart items for user:', userId);
      this.cartItems = {};
    }

    this.cartItemsSubject.next(this.cartItems);
  }

  // Merges the guest cart with the user's existing cart upon login
  private mergeCarts(): void {
    const cartData = localStorage.getItem('cart');
    let cart: { [userId: string]: { [barcode: string]: number } } = {};

    if (cartData) {
      try {
        cart = JSON.parse(cartData);
      } catch (e) {
        console.error('Invalid cart data in localStorage:', e);
        cart = {};
      }
    }

    const guestCart = cart['guest'] || {};
    const userId = this.getUserId();
    const userCart = cart[userId] || {};

    // Merge carts
    for (const barcode in guestCart) {
      if (userCart[barcode]) {
        userCart[barcode] += guestCart[barcode];
      } else {
        userCart[barcode] = guestCart[barcode];
      }
    }

    // Update the user's cart
    this.cartItems = userCart;
    cart[userId] = userCart;
    delete cart['guest'];

    localStorage.setItem('cart', JSON.stringify(cart));
    this.cartItemsSubject.next(this.cartItems);
  }

  // Validates the cart items structure
  private isValidCartItems(
    cartItems: any
  ): cartItems is { [barcode: string]: number } {
    if (typeof cartItems !== 'object' || cartItems === null) {
      return false;
    }

    for (const barcode in cartItems) {
      if (
        typeof barcode !== 'string' ||
        typeof cartItems[barcode] !== 'number'
      ) {
        return false;
      }
    }

    return true;
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
