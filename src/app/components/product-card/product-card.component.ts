import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent implements OnInit, OnDestroy {
  @Input() product!: Product;
  quantity: number = 0;
  showConfirmModal: boolean = false;
  private cartSubscription?: Subscription;

  constructor(
    private cartService: CartService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.quantity = this.cartService.getCartItem(this.product.barcode);

    // Subscribe to cart changes
    this.cartSubscription = this.cartService.cartItems$.subscribe(
      (cartItems) => {
        const updatedQuantity = cartItems[this.product.barcode] || 0;
        if (updatedQuantity !== this.quantity) {
          this.quantity = updatedQuantity;
        }
      }
    );
  }

  // Adds the product to the cart with a quantity of 1.
  addToCart(event: Event): void {
    event.preventDefault();
    this.cartService.addToCart(this.product).then(() => {
      this.toastr.success('Item added to cart successfully.', 'Success');
    });
  }

  // Increases the quantity of the product in the cart.
  increaseQuantity(): void {
    this.cartService.updateQuantity(this.product, this.quantity + 1);
  }

  // Decreases the quantity of the product in the cart.
  decreaseQuantity(): void {
    if (this.quantity <= 1) {
      this.showConfirmModal = true;
      return;
    }

    this.cartService.updateQuantity(this.product, this.quantity - 1);
  }

  // Handles the confirmation from the modal
  onConfirmRemove(): void {
    this.cartService.removeFromCart(this.product).then(() => {
      this.quantity = 0;
      this.showConfirmModal = false;
      this.toastr.success('Item removed from cart.', 'Removed');
    });
  }

  // Handles the cancellation from the modal
  onCancelRemove(): void {
    this.showConfirmModal = false;
  }

  // Handles image loading errors by setting the fallback image.
  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/No-Image-Placeholder.png';
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
  }
}
