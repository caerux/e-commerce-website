import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { Product } from '../models/product.model';
import { AuthService, User } from './auth.service';
import { map } from 'rxjs/operators';

export interface CartItem {
  product: Product;
  quantity: number;
}
@Injectable({
  providedIn: 'root',
})
export class CartService implements OnDestroy {
  private cartItems: CartItem[] = [];
  private cartItemsSubject: BehaviorSubject<CartItem[]> = new BehaviorSubject<
    CartItem[]
  >([]);
  public cartItems$: Observable<CartItem[]> =
    this.cartItemsSubject.asObservable();
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
  getCartItems(): CartItem[] {
    return this.cartItems;
  }

  // Retrieves a specific cart item by product barcode
  getCartItem(barcode: string): CartItem | undefined {
    return this.cartItems.find((item) => item.product.barcode === barcode);
  }

  // Returns an observable of the cart items
  getCartItemsObservable(): Observable<CartItem[]> {
    return this.cartItems$;
  }

  // Adds a product to the cart
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

  // Removes a product from the cart
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

  // Clears all items from the cart
  clearCart(): void {
    this.cartItems = [];
    this.updateCartItemCount();
    this.saveCart();
  }

  // Increases the quantity of a specific product in the cart
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

  // Decreases the quantity of a specific product in the cart
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

  // Updates the quantity of a specific product in the cart
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

  // Constructs a unique cart key based on the authenticated user. If no user is authenticated, uses a guest cart
  private getCartKey(): string {
    if (this.currentUser) {
      return `cartItems_${this.currentUser.id}`;
    } else {
      return 'cartItems_guest';
    }
  }

  // Saves the current cart to localStorage
  private saveCart(): void {
    const cartKey = this.getCartKey();
    localStorage.setItem(cartKey, JSON.stringify(this.cartItems));
    this.cartItemsSubject.next(this.cartItems);
  }

  // Loads the cart from localStorage based on the authenticated user
  private loadCart(): void {
    const cartKey = this.getCartKey();
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      this.cartItems = JSON.parse(savedCart) as CartItem[];
    } else {
      this.cartItems = [];
    }
    this.cartItemsSubject.next(this.cartItems);
  }

  // Merges the guest cart with the user's existing cart upon login
  private mergeCarts(): void {
    const guestCartKey = 'cartItems_guest';
    const userCartKey = this.getCartKey();

    // Load guest cart
    const guestCartData = localStorage.getItem(guestCartKey);
    let guestCart: CartItem[] = [];
    if (guestCartData) {
      guestCart = JSON.parse(guestCartData) as CartItem[];
    }

    // Load user cart
    const userCartData = localStorage.getItem(userCartKey);
    let userCart: CartItem[] = [];
    if (userCartData) {
      userCart = JSON.parse(userCartData) as CartItem[];
    }

    // Merge carts
    guestCart.forEach((guestItem) => {
      const existingUserItem = userCart.find(
        (userItem) => userItem.product.barcode === guestItem.product.barcode
      );
      if (existingUserItem) {
        existingUserItem.quantity += guestItem.quantity;
      } else {
        userCart.push(guestItem);
      }
    });

    // Update the user's cart
    this.cartItems = userCart;
    this.cartItemsSubject.next(this.cartItems);
    this.saveCart();

    // Clear the guest cart
    localStorage.removeItem(guestCartKey);
  }

  // Updates the cart items subject to emit current cart state
  private updateCartItemCount(): void {
    this.cartItemsSubject.next(this.cartItems);
  }

  // Cleans up subscriptions to prevent memory leaks
  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
