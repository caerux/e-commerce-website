import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { CartService } from '../../services/cart.service'; // If you have a cart service

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  isLoggedIn: boolean = false;
  currentUser: User | null = null;
  cartItemCount: number = 0; // If using cart functionality

  constructor(
    private authService: AuthService
  ) // private cartService: CartService // If using cart functionality
  {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.currentUser = this.authService.getCurrentUser();

    // Subscribe to authentication changes
    this.authService.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
    });

    // Subscribe to cart item count if using cart functionality
    // this.cartItemCount = this.cartService.getCartItemCount();
    // this.cartService.getCartItemCountObservable().subscribe((count) => {
    //   this.cartItemCount = count;
    // });
  }

  logout(): void {
    this.authService.logout();
  }
}
