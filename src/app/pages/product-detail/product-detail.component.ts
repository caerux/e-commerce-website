import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  product: Product | undefined;
  quantity: number = 0;
  errorMessage: string = '';
  fullStars: number[] = [];
  halfStar: boolean = false;
  sizesArray: string[] = [];
  selectedSize: string | null = null;
  showConfirmModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const barcode = this.route.snapshot.paramMap.get('barcode');
    if (barcode) {
      this.productService.getProductByBarcode(barcode).subscribe(
        (data) => {
          this.product = data;
          this.initializeQuantity();
        },
        (error) => {
          console.error('Error fetching product:', error);
          this.errorMessage =
            'Failed to load product details. Please try again later.';
        }
      );
    }
  }

  // Initializes the quantity based on existing cart data.
  initializeQuantity(): void {
    if (this.product) {
      const quantity = this.cartService.getCartItem(this.product.barcode);
      if (quantity) {
        this.quantity = quantity;
      }
    }
  }

  // Adds the product to the cart.
  addToCart(): void {
    if (this.product) {
      this.cartService.addToCart(this.product);
      this.quantity = 1;
      this.toastr.success(
        `${this.product.name} has been added to your cart`,
        'Success'
      );
    }
  }

  // Increases the quantity of the product in the cart.
  increaseQuantity(): void {
    if (this.product) {
      this.quantity += 1;
      this.cartService.updateQuantity(this.product, this.quantity);
    }
  }

  // Decreases the quantity of the product in the cart.
  decreaseQuantity(): void {
    if (this.product) {
      if (this.quantity > 1) {
        this.quantity -= 1;
        this.cartService.updateQuantity(this.product, this.quantity);
      } else {
        this.showConfirmModal = true;
      }
    }
  }

  // Navigates the user to the cart page.
  viewCart(): void {
    this.router.navigate(['/cart']);
  }

  // Handles the confirmation from the modal
  onConfirmRemove(): void {
    if (this.product) {
      this.cartService.removeFromCart(this.product);
    }
    this.quantity = 0;
    this.showConfirmModal = false;
  }

  //Remove item from the cart
  removeItem(): void {
    this.showConfirmModal = true;
    if (this.product) {
      this.cartService.removeFromCart(this.product);
    }
  }

  // Handles the cancellation from the modal
  onCancelRemove(): void {
    this.showConfirmModal = false;
  }
}
