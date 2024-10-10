import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  cartItemCount: number = 0;
  isLoggedIn: boolean = false;
  currentUser: User | null = null;
  private cartSubscription?: Subscription;
  private authSubscription?: Subscription;
  showConfirmModal: boolean = false;

  constructor(
    private authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.updateCartItemCount();

    this.cartSubscription = this.cartService.cartItems$.subscribe(
      () => {
        this.updateCartItemCount();
      },
      (error) => {
        console.error('Error fetching cart items:', error);
      }
    );

    this.authSubscription = this.authService.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
    });
  }

  private updateCartItemCount(): void {
    const cartItems = this.cartService.getCartItems();
    this.cartItemCount = Object.values(cartItems).reduce(
      (sum, quantity) => sum + quantity,
      0
    );
  }

  logout(): void {
    this.showConfirmModal = true;
  }

  onConfirmLogout(): void {
    this.authService.logout();
    this.showConfirmModal = false;
  }

  onCancelLogout(): void {
    this.showConfirmModal = false;
    return;
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
  }
}
