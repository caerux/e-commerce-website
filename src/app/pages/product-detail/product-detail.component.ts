import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
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

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
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

  //Initializes the quantity based on existing cart data.
  initializeQuantity(): void {
    if (this.product) {
      const cartItem = this.cartService.getCartItem(this.product.barcode);
      if (cartItem) {
        this.quantity = cartItem.quantity;
      }
    }
  }

  //Adds the product to the cart.
  addToCart(): void {
    if (this.product) {
      this.cartService.addToCart(this.product);
      this.quantity = 1;
      alert(`${this.product.name} has been added to your cart.`);
      // Alternatively, implement a better user feedback mechanism like toast notifications
    }
  }

  //Increases the quantity of the product in the cart.
  increaseQuantity(): void {
    if (this.product) {
      this.quantity += 1;
      this.cartService.updateQuantity(this.product, this.quantity);
    }
  }

  //Decreases the quantity of the product in the cart.
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

  //Navigates the user to the cart page.
  viewCart(): void {
    this.router.navigate(['/cart']);
  }

  //Navigates the user to another product's detail page.
  viewProductDetails(barcode: string): void {
    this.router.navigate(['/product', barcode]);
  }
}
