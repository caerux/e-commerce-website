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

  //Adds the product to the cart with a quantity of 1.
  addToCart(): void {
    this.quantity = 1;
    this.cartService.addToCart(this.product);
    alert(`${this.product.name} has been added to your cart.`);
    // Alternatively, implement a better user feedback mechanism like toast notifications
  }

  //Increases the quantity of the product in the cart.
  increaseQuantity(): void {
    this.quantity += 1;
    this.cartService.updateQuantity(this.product, this.quantity);
  }

  //Decreases the quantity of the product in the cart.
  decreaseQuantity(): void {
    this.quantity -= 1;
    if (this.quantity > 0) {
      this.cartService.updateQuantity(this.product, this.quantity);
    } else {
      this.cartService.removeFromCart(this.product);
      this.quantity = 0;
    }
  }
}
