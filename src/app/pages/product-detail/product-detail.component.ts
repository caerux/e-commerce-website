import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  product: Product | undefined;
  quantity: number = 0;
  isEditingQuantity: boolean = false;
  editedQuantity: string = '';
  showConfirmModal: boolean = false;
  inputErrorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const barcode = this.route.snapshot.paramMap.get('barcode');
    if (!barcode) {
      this.router.navigate(['/product-not-found']);
      this.toastr.error('Invalid product barcode.', 'Error');
      return;
    }

    this.productService.getProductByBarcode(barcode).subscribe(
      (data) => {
        if (!data) {
          this.router.navigate(['/product-not-found']);
          this.toastr.error('Product not found.', 'Error');
          return;
        }

        this.product = data;
        this.initializeQuantity();
      },
      (error) => {
        console.error('Error fetching product:', error);
        this.router.navigate(['/product-not-found']);
        this.toastr.error('Failed to load product details.', 'Error');
      }
    );
  }

  initializeQuantity(): void {
    if (!this.product) {
      return;
    }

    const currentQuantity = this.cartService.getCartItem(this.product.barcode);
    if (currentQuantity) {
      if (currentQuantity > 100) {
        this.quantity = 100;
        this.inputErrorMessage = 'Maximum quantity allowed is 100.';
        this.cartService.updateQuantity(this.product, 100);
        this.toastr.warning(
          `Quantity for "${this.product.name}" has been adjusted to 100.`,
          'Quantity Capped'
        );
      } else {
        this.quantity = currentQuantity;
      }
    }
  }

  // Starts the editing mode for quantity
  startEditingQuantity(): void {
    this.isEditingQuantity = true;
    this.editedQuantity = this.quantity.toString();
    this.inputErrorMessage = '';
  }

  confirmQuantityEdit(): void {
    if (!this.product) return;

    const exponentialRegex = /^[+-]?(\d+\.?\d*|\.\d+)[eE][+-]?\d+$/;
    const trimmedQuantity = this.editedQuantity.trim();

    if (exponentialRegex.test(trimmedQuantity)) {
      this.inputErrorMessage =
        'Quantity should not be in exponential notation.';
      return;
    }

    // Attempt to parse the quantity as an integer
    const parsedQuantity = Number(trimmedQuantity);

    // Validate the parsed quantity
    if (
      isNaN(parsedQuantity) ||
      parsedQuantity <= 0 ||
      !Number.isInteger(parsedQuantity)
    ) {
      this.inputErrorMessage = 'Please enter a valid positive integer.';
      return;
    }

    if (parsedQuantity > 100) {
      this.inputErrorMessage = 'Maximum quantity allowed is 100.';
      return;
    }

    this.quantity = parsedQuantity;
    this.cartService.updateQuantity(this.product, this.quantity);
    this.toastr.success('Quantity updated.', 'Success');
    this.inputErrorMessage = '';
    this.isEditingQuantity = false;
  }

  // Cancels the editing mode without saving changes
  cancelQuantityEdit(): void {
    this.isEditingQuantity = false;
    this.editedQuantity = this.quantity.toString();
    this.inputErrorMessage = '';
  }

  // Increases the quantity by 1
  increaseQuantity(): void {
    if (!this.product) return;

    if (this.quantity >= 100) {
      this.inputErrorMessage = 'Maximum quantity allowed is 100.';
      return;
    }

    this.quantity += 1;
    this.cartService.updateQuantity(this.product, this.quantity);
  }

  // Decreases the quantity by 1
  decreaseQuantity(): void {
    if (!this.product) {
      return;
    }

    if (this.quantity > 1) {
      this.quantity -= 1;
      this.cartService.updateQuantity(this.product, this.quantity);
      this.toastr.success('Quantity decreased.', 'Success');
      this.inputErrorMessage = '';
      return;
    }

    this.showConfirmModal = true;
  }

  // Removes the item from the cart after confirmation
  removeItem(): void {
    if (!this.product) return;

    this.showConfirmModal = true;
  }

  // Handles confirmation to remove the item
  onConfirmRemove(): void {
    if (!this.product) return;

    this.cartService.removeFromCart(this.product);
    this.quantity = 0;
    this.showConfirmModal = false;
    this.toastr.success('Item removed from cart.', 'Removed');
  }

  // Handles cancellation of the removal
  onCancelRemove(): void {
    this.showConfirmModal = false;
  }

  // Adds the product to the cart
  addToCart(): void {
    if (!this.product) return;

    this.cartService.addToCart(this.product);
    this.quantity = 1;
    this.toastr.success(
      `${this.product.name} has been added to your cart.`,
      'Added'
    );
  }

  // Navigates the user to the cart page
  viewCart(): void {
    this.router.navigate(['/cart']);
  }
}
