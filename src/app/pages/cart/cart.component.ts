// cart.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { Subscription, forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

interface CartDisplayItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartDisplayItem[] = [];
  totalAmount: number = 0;
  private cartSubscription: Subscription | undefined;
  private cartItemsSubscription: Subscription | undefined;

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Subscribe to cart items observable
    this.cartSubscription = this.cartService.cartItems$.subscribe(
      (items: { [barcode: string]: number }) => {
        this.loadCartItems(items);
      },
      (error) => {
        console.error('Error fetching cart items:', error);
        this.toastr.error('Failed to load cart items.', 'Error');
      }
    );
  }

  private loadCartItems(cartItems: { [barcode: string]: number }): void {
    const barcodes = Object.keys(cartItems);
    if (barcodes.length === 0) {
      this.cartItems = [];
      this.totalAmount = 0;
      return;
    }

    const requests = barcodes.map((barcode) =>
      this.productService.getProductByBarcode(barcode)
    );

    if (this.cartItemsSubscription) {
      this.cartItemsSubscription.unsubscribe();
    }

    this.cartItemsSubscription = forkJoin(requests).subscribe(
      (products: (Product | undefined)[]) => {
        this.cartItems = products
          .filter((product): product is Product => product !== undefined)
          .map((product) => ({
            product,
            quantity: cartItems[product.barcode],
          }));
        this.calculateTotal();
      },
      (error) => {
        console.error('Error fetching products:', error);
        this.toastr.error('Failed to load products.', 'Error');
      }
    );
  }

  // Increases the quantity of a cart item.
  increaseQuantity(item: CartDisplayItem): void {
    this.cartService.updateQuantity(item.product, item.quantity + 1);
  }

  // Decreases the quantity of a cart item.
  decreaseQuantity(item: CartDisplayItem): void {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.product, item.quantity - 1);
    } else {
      this.confirmRemoveItem(item);
    }
  }

  // Removes a cart item.
  removeItem(item: CartDisplayItem): void {
    this.cartService.removeFromCart(item.product);
    this.toastr.info(
      `${item.product.name} has been removed from your cart.`,
      'Item Removed'
    );
    // Refresh the cart items
    this.loadCartItems(this.cartService.getCartItems());
  }

  // Confirms before removing an item
  confirmRemoveItem(item: CartDisplayItem): void {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${item.product.name} from your cart?`
    );
    if (confirmed) {
      this.removeItem(item);
    }
  }

  // Calculates the total amount of the cart.
  calculateTotal(): void {
    this.totalAmount = this.cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }

  // Navigates the user to the checkout page. If the user is not logged in, redirects to the login page.
  proceedToCheckout(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/checkout']);
    } else {
      this.toastr.warning(
        'Please log in to proceed to checkout.',
        'Login Required'
      );
      this.router.navigate(['/login']);
    }
  }

  // Prompts the user to confirm clearing the cart.
  confirmClearCart(): void {
    const confirmed = window.confirm(
      'Are you sure you want to clear your cart? This action cannot be undone.'
    );
    if (confirmed) {
      this.clearCart();
    }
  }

  // Clears all items from the cart.
  clearCart(): void {
    this.cartService.clearCart();
    this.totalAmount = 0;
    this.cartItems = [];
    this.toastr.success('Your cart has been cleared.', 'Cart Cleared');
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.cartItemsSubscription) {
      this.cartItemsSubscription.unsubscribe();
    }
  }
}
