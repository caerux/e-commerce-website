import { Component, OnInit, OnDestroy } from '@angular/core';
import { CartService, CartItem } from '../../services/cart.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  totalAmount: number = 0;
  private cartSubscription: Subscription | undefined;

  constructor(
    private cartService: CartService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to cart items observable
    this.cartSubscription = this.cartService.cartItems$.subscribe(
      (items: CartItem[]) => {
        this.cartItems = items;
        this.calculateTotal();
      },
      (error) => {
        console.error('Error fetching cart items:', error);
      }
    );
  }

  //Increases the quantity of a cart item.
  increaseQuantity(item: CartItem): void {
    this.cartService.increaseQuantity(item.product);
    // No need to manually refresh cartItems; subscription handles it
  }

  //Decreases the quantity of a cart item.
  decreaseQuantity(item: CartItem): void {
    this.cartService.decreaseQuantity(item.product);
  }

  //Removes a cart item.
  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item.product);
  }

  //Calculates the total amount of the cart.
  calculateTotal(): void {
    this.totalAmount = this.cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }

  //Navigates the user to the checkout page. If the user is not logged in, redirects to the login page.
  proceedToCheckout(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/checkout']);
    } else {
      alert('Please log in to proceed to checkout.');
      this.router.navigate(['/login']);
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }
}
