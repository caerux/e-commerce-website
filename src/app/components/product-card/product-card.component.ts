import { Component, Input, OnInit, HostListener } from '@angular/core';
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
  isSmallScreen: boolean = false;
  showConfirmModal: boolean = false;

  constructor(
    private cartService: CartService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    const quantity = this.cartService.getCartItem(this.product.barcode);
    if (!quantity) return;
    this.quantity = quantity;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isSmallScreen = window.innerWidth <= 768;
  }

  onMouseEnter(): void {
    this.isHovering = true;
  }

  onMouseLeave(): void {
    this.isHovering = false;
  }

  // Adds the product to the cart with a quantity of 1.
  addToCart(event: Event): void {
    event.preventDefault();
    this.quantity = 1;
    this.cartService.addToCart(this.product);
    this.toastr.success('Item added to cart successfully.', 'Success');
  }

  // Increases the quantity of the product in the cart.
  increaseQuantity(): void {
    this.quantity += 1;
    this.cartService.updateQuantity(this.product, this.quantity);
  }

  // Decreases the quantity of the product in the cart.
  decreaseQuantity(): void {
    if (this.quantity <= 1) {
      this.showConfirmModal = true;
      return;
    }

    this.quantity -= 1;
    this.cartService.updateQuantity(this.product, this.quantity);
    this.toastr.info('Quantity decreased.', 'Info');
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
