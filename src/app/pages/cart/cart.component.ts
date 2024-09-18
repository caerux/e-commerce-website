import { Component, OnInit } from '@angular/core';
import { CartService, CartItem } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  totalAmount: number = 0;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.cartItems = this.cartService.getCartItems();
    this.calculateTotal();
  }

  increaseQuantity(item: CartItem): void {
    this.cartService.increaseQuantity(item.product);
    this.cartItems = this.cartService.getCartItems(); // Refresh the cart items
    this.calculateTotal();
  }

  decreaseQuantity(item: CartItem): void {
    this.cartService.decreaseQuantity(item.product);
    this.cartItems = this.cartService.getCartItems(); // Refresh the cart items
    this.calculateTotal();
  }

  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item.product);
    this.cartItems = this.cartService.getCartItems();
    this.calculateTotal();
  }

  calculateTotal(): void {
    this.totalAmount = this.cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }
}
