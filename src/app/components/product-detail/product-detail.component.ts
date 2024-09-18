import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  product: Product | undefined;
  quantity: number = 0;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService
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
        }
      );
    }
  }

  initializeQuantity(): void {
    if (this.product) {
      const cartItem = this.cartService.getCartItem(this.product.barcode);
      if (cartItem) {
        this.quantity = cartItem.quantity;
      }
    }
  }

  addToCart(): void {
    if (this.product) {
      this.quantity = 1;
      this.cartService.addToCart(this.product);
    }
  }

  increaseQuantity(): void {
    if (this.product) {
      this.quantity += 1;
      this.cartService.updateQuantity(this.product, this.quantity);
    }
  }

  decreaseQuantity(): void {
    if (this.product) {
      this.quantity -= 1;
      if (this.quantity > 0) {
        this.cartService.updateQuantity(this.product, this.quantity);
      } else {
        this.cartService.removeFromCart(this.product);
      }
    }
  }
}
