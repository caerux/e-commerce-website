import { Component, Input, OnInit } from '@angular/core';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent implements OnInit {
  @Input() product!: Product;
  quantity: number = 0;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    const cartItem = this.cartService.getCartItem(this.product.barcode);
    if (cartItem) {
      this.quantity = cartItem.quantity;
    }
  }

  addToCart(): void {
    this.quantity = 1;
    this.cartService.addToCart(this.product);
  }

  increaseQuantity(): void {
    this.quantity += 1;
    this.cartService.updateQuantity(this.product, this.quantity);
  }

  decreaseQuantity(): void {
    this.quantity -= 1;
    if (this.quantity > 0) {
      this.cartService.updateQuantity(this.product, this.quantity);
    } else {
      this.cartService.removeFromCart(this.product);
    }
  }
}
