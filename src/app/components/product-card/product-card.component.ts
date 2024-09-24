import { Component, Input, OnInit } from '@angular/core';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent implements OnInit {
  @Input() product!: Product;
  quantity: number = 0;
  isHovering: boolean = false;
  showConfirmModal: boolean = false;

  constructor(
    private cartService: CartService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const cartItem = this.cartService.getCartItem(this.product.barcode);
    if (cartItem) {
      this.quantity = cartItem.quantity;
    }
  }

  // Adds the product to the cart with a quantity of 1.
  addToCart(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.quantity = 1;
    this.cartService.addToCart(this.product);
    this.toastr.success('Item got added to cart successfully.', 'Success');
  }

  // Increases the quantity of the product in the cart.
  increaseQuantity(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.quantity += 1;
    this.cartService.updateQuantity(this.product, this.quantity);
  }

  // Decreases the quantity of the product in the cart.
  decreaseQuantity(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.quantity > 1) {
      this.quantity -= 1;
      this.cartService.updateQuantity(this.product, this.quantity);
    } else {
      // Show confirmation modal before removing the item
      this.showConfirmModal = true;
    }
  }

  // Handles the confirmation from the modal
  onConfirmRemove(): void {
    this.cartService.removeFromCart(this.product);
    this.quantity = 0;
    this.showConfirmModal = false;
  }

  // Handles the cancellation from the modal
  onCancelRemove(): void {
    this.showConfirmModal = false;
  }
}
