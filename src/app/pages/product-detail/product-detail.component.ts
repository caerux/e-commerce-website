import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';

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

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const barcode = this.route.snapshot.paramMap.get('barcode');
    if (barcode) {
      this.productService.getProductByBarcode(barcode).subscribe(
        (data) => {
          this.product = data;
          this.initializeQuantity();
          this.extractSizes();
          this.calculateStars();
        },
        (error) => {
          console.error('Error fetching product:', error);
          this.errorMessage =
            'Failed to load product details. Please try again later.';
        }
      );
    }
  }

  // Extracts available sizes from the product's sizes string.
  extractSizes(): void {
    if (this.product) {
      this.sizesArray = this.product.sizes.split(',');
      this.selectedSize = this.sizesArray[0]; // Default to the first size
    }
  }

  // Initializes the quantity based on existing cart data.
  initializeQuantity(): void {
    if (this.product) {
      const cartItem = this.cartService.getCartItem(this.product.barcode);
      if (cartItem) {
        this.quantity = cartItem.quantity;
      }
    }
  }

  // Adds the product to the cart.
  addToCart(): void {
    if (this.product) {
      this.cartService.addToCart(this.product);
      this.quantity = 1;
      alert(
        `${this.product.name} has been added to your cart in size ${this.selectedSize}.`
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
      this.quantity -= 1;
      if (this.quantity > 0) {
        this.cartService.updateQuantity(this.product, this.quantity);
      } else {
        this.cartService.removeFromCart(this.product);
        this.quantity = 0;
      }
    }
  }

  // Navigates the user to the cart page.
  viewCart(): void {
    this.router.navigate(['/cart']);
  }

  // Calculates the full and half stars for product rating.
  calculateStars(): void {
    if (this.product) {
      const fullStars = Math.floor(this.product.rating);
      this.fullStars = Array(fullStars).fill(1);
      this.halfStar = this.product.rating % 1 >= 0.5;
    }
  }
}
