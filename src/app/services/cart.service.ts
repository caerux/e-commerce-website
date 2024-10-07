import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, firstValueFrom } from 'rxjs';
import { Product } from '../models/product.model';
import { AuthService, User } from './auth.service';
import { ProductService } from './product.service';

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

  constructor(
    private authService: AuthService,
    private productService: ProductService
  ) {
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
  async addToCart(product: Product): Promise<void> {
    const barcode = product.barcode;
    if (this.cartItems[barcode]) {
      this.cartItems[barcode] += 1;
    } else {
      this.cartItems[barcode] = 1;
    }
    await this.saveCart();
  }

  // Removes a product from the cart
  async removeFromCart(product: Product): Promise<void> {
    const barcode = product.barcode;
    if (this.cartItems[barcode]) {
      delete this.cartItems[barcode];
      await this.saveCart();
    }
  }

  // Updates the quantity of a specific product in the cart
  async updateQuantity(product: Product, quantity: number): Promise<void> {
    const barcode = product.barcode;
    if (quantity <= 0) {
      await this.removeFromCart(product);
    } else {
      const adjustedQuantity = Math.floor(quantity);
      this.cartItems[barcode] = adjustedQuantity;
      await this.saveCart();
    }
  }

  // Clears all items from the cart
  async clearCart(): Promise<void> {
    this.cartItems = {};
    await this.saveCart();
  }

  // Constructs a unique cart key based on the authenticated user
  private getUserId(): string {
    return this.currentUser ? this.currentUser.id.toString() : 'guest';
  }

  // Saves the current cart to localStorage
  private async saveCart(): Promise<void> {
    this.cartItems = await this.cleanCartItems(this.cartItems);

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
  private async loadCart(): Promise<void> {
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
    let userCart = cart[userId] || {};

    // Clean cart items asynchronously
    userCart = await this.cleanCartItems(userCart);

    this.cartItems = userCart;
    this.cartItemsSubject.next(this.cartItems);
  }

  // Merges the guest cart with the user's existing cart upon login
  private async mergeCarts(): Promise<void> {
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

    // Clean cart items asynchronously
    const cleanedGuestCart = await this.cleanCartItems(guestCart);
    const cleanedUserCart = await this.cleanCartItems(userCart);

    // Merge carts
    for (const barcode in cleanedGuestCart) {
      if (cleanedUserCart[barcode]) {
        cleanedUserCart[barcode] += cleanedGuestCart[barcode];
      } else {
        cleanedUserCart[barcode] = cleanedGuestCart[barcode];
      }

      // If the resulting quantity is non-positive, remove the item
      if (cleanedUserCart[barcode] <= 0) {
        delete cleanedUserCart[barcode];
      }
    }

    // Update the user's cart
    this.cartItems = cleanedUserCart;
    cart[userId] = this.cartItems;
    delete cart['guest'];

    localStorage.setItem('cart', JSON.stringify(cart));
    this.cartItemsSubject.next(this.cartItems);
  }

  // Checks if a barcode corresponds to an existing product
  private async isValidBarcode(barcode: string): Promise<boolean> {
    // A valid barcode should be a non-empty string that is not 'undefined' or 'null'
    if (
      typeof barcode !== 'string' ||
      barcode.trim() === '' ||
      barcode === 'undefined' ||
      barcode === 'null'
    ) {
      return false;
    }

    try {
      const product = await firstValueFrom(
        this.productService.getProductByBarcode(barcode)
      );
      return !!product;
    } catch (error) {
      console.warn(`Product with barcode '${barcode}' does not exist.`, error);
      return false;
    }
  }

  // Removes items with invalid barcodes or non-positive quantities
  private async cleanCartItems(cartItems: {
    [barcode: string]: number;
  }): Promise<{ [barcode: string]: number }> {
    const cleanedCartItems: { [barcode: string]: number } = {};

    const products = await firstValueFrom(this.productService.getProducts());
    const validBarcodes = new Set(products.map((product) => product.barcode));

    for (const barcode of Object.keys(cartItems)) {
      const quantity = cartItems[barcode];

      if (
        typeof quantity !== 'number' ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        console.warn(
          `Removing item with invalid quantity (${quantity}): '${barcode}'`
        );
        continue;
      }

      if (!validBarcodes.has(barcode)) {
        console.warn(
          `Removing item with invalid or non-existent barcode ('${barcode}')`
        );
        continue;
      }

      cleanedCartItems[barcode] = quantity;
    }

    return cleanedCartItems;
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
