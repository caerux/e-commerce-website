import { Component, OnInit, OnDestroy } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { Subscription, forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

interface CartDisplayItem {
  product: Product;
  quantity: number;
  isEditingQuantity?: boolean;
  editedQuantity?: string;
  inputErrorMessage?: string;
}

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartDisplayItem[] = [];
  totalAmount: number = 0;
  totalMRP: number = 0;
  discountAmount: number = 0;
  showConfirmModal: boolean = false;
  showItemRemoveModal: boolean = false;
  selectedItem: CartDisplayItem | null = null;

  private cartSubscription?: Subscription;
  private cartItemsSubscription?: Subscription;
  private adjustedItemsSubscription?: Subscription;

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

    // Subscribe to adjusted items to handle quantity caps
    this.adjustedItemsSubscription = this.cartService.adjustedItems$.subscribe(
      (adjustedProducts: Product[]) => {
        adjustedProducts.forEach((product) => {
          const cartItem = this.cartItems.find(
            (item) => item.product.barcode === product.barcode
          );
          if (cartItem) {
            cartItem.inputErrorMessage = 'Maximum quantity allowed is 100.';
          }
        });

        const adjustedNames = adjustedProducts.map((p) => p.name).join(', ');

        this.toastr.warning(
          `Quantity for the following items has been adjusted to 100: ${adjustedNames}.`,
          'Quantity Capped'
        );
      },
      (error) => {
        console.error('Error receiving adjusted items:', error);
      }
    );
  }

  private loadCartItems(cartItems: { [barcode: string]: number }): void {
    const barcodes = Object.keys(cartItems);
    if (barcodes.length === 0) {
      this.cartItems = [];
      this.calculateTotal();
      return;
    }

    this.cartItemsSubscription?.unsubscribe();

    const requests = barcodes.map((barcode) =>
      this.productService.getProductByBarcode(barcode)
    );

    this.cartItemsSubscription = forkJoin(requests).subscribe(
      (products: (Product | undefined)[]) => {
        this.cartItems = products
          .filter((product): product is Product => product !== undefined)
          .map((product) => ({
            product,
            quantity: cartItems[product.barcode],
          }));
        this.calculateTotal(); // Ensure totals are recalculated
      },
      (error) => {
        console.error('Error fetching products:', error);
        this.toastr.error('Failed to load products.', 'Error');
      }
    );
  }

  // Calculates the total amounts of the cart.
  calculateTotal(): void {
    this.totalAmount = this.cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );

    this.totalMRP = this.cartItems.reduce(
      (total, item) => total + item.product.mrp * item.quantity,
      0
    );

    this.discountAmount = this.calculateDiscount();
  }

  calculateDiscount(): number {
    return this.cartItems.reduce(
      (totalDiscount, item) =>
        totalDiscount + (item.product.mrp - item.product.price) * item.quantity,
      0
    );
  }

  // Starts the editing mode for a specific cart item
  startEditingQuantity(item: CartDisplayItem): void {
    item.isEditingQuantity = true;
    item.editedQuantity = item.quantity.toString();
    item.inputErrorMessage = '';
  }

  // Confirms and saves the edited quantity for a specific cart item
  async confirmQuantityEdit(item: CartDisplayItem): Promise<void> {
    if (!item.product) return;

    const exponentialRegex = /^[+-]?(\d+\.?\d*|\.\d+)[eE][+-]?\d+$/;

    // Trim the input to remove any leading/trailing whitespace
    const trimmedQuantity = item.editedQuantity?.trim() || '';

    // Check for exponential notation
    if (exponentialRegex.test(trimmedQuantity)) {
      item.inputErrorMessage =
        'Quantity should not be in exponential notation.';
      return;
    }

    const parsedQuantity = Number(trimmedQuantity);

    if (
      isNaN(parsedQuantity) ||
      parsedQuantity <= 0 ||
      !Number.isInteger(parsedQuantity)
    ) {
      item.inputErrorMessage = 'Please enter a valid positive integer.';
      return;
    }

    if (parsedQuantity > 100) {
      item.inputErrorMessage = 'Maximum quantity allowed is 100.';
      return;
    }

    // Valid input; update the quantity
    item.quantity = parsedQuantity;
    this.cartService.updateQuantity(item.product, item.quantity);
    item.isEditingQuantity = false;
    item.inputErrorMessage = '';
  }

  // Increases the quantity of a cart item
  increaseQuantity(item: CartDisplayItem): void {
    if (!item.product) return;

    if (item.quantity >= 100) {
      item.inputErrorMessage = 'Maximum quantity allowed is 100.';
      return;
    }

    item.quantity += 1;
    this.cartService.updateQuantity(item.product, item.quantity);
    item.inputErrorMessage = '';
  }

  // Decreases the quantity of a cart item
  decreaseQuantity(item: CartDisplayItem): void {
    if (!item.product) return;

    if (item.quantity <= 1) {
      this.confirmRemoveItem(item);
      return;
    }

    item.quantity -= 1;
    this.cartService.updateQuantity(item.product, item.quantity);
    item.inputErrorMessage = '';
  }

  // Shows the modal to confirm removing an item
  confirmRemoveItem(item: CartDisplayItem): void {
    this.selectedItem = item;
    this.showItemRemoveModal = true;
  }

  // Called when the user confirms removing an item
  onConfirmRemoveItem(): void {
    if (!this.selectedItem) return;

    this.removeItem(this.selectedItem);
    this.selectedItem = null;
    this.showItemRemoveModal = false;
  }

  // Called when the user cancels removing an item
  onCancelRemoveItem(): void {
    this.selectedItem = null;
    this.showItemRemoveModal = false;
  }

  // Removes a cart item.
  removeItem(item: CartDisplayItem): void {
    this.cartService.removeFromCart(item.product);
    this.toastr.success(
      `${item.product.name} has been removed from your cart.`,
      'Item Removed'
    );
    // Refresh the cart items
    this.loadCartItems(this.cartService.getCartItems());
  }

  // Shows the modal to confirm clearing the cart
  confirmClearCart(): void {
    this.showConfirmModal = true;
  }

  // Called when the user confirms clearing the cart
  onConfirmClearCart(): void {
    this.clearCart();
    this.showConfirmModal = false;
  }

  // Called when the user cancels clearing the cart
  onCancelClearCart(): void {
    this.showConfirmModal = false;
  }

  // Clears all items from the cart.
  clearCart(): void {
    this.cartService.clearCart();
    this.totalAmount = 0;
    this.totalMRP = 0;
    this.discountAmount = 0;
    this.cartItems = [];
    this.toastr.success('Your cart has been cleared.', 'Cart Cleared');
  }

  // Navigates the user to the checkout page. If the user is not logged in, redirects to the login page with returnUrl.
  proceedToCheckout(): void {
    if (!this.authService.isLoggedIn()) {
      // Redirect to login with returnUrl=/checkout
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/checkout' },
      });
      this.toastr.warning(
        'Please log in to proceed to checkout.',
        'Login Required'
      );
    }

    if (this.cartItems.length === 0) {
      this.toastr.info(
        'Your cart is empty. Add items to proceed to checkout.',
        'Empty Cart'
      );
      this.router.navigate(['/cart']);
      return;
    }

    this.router.navigate(['/checkout']);
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/No-Image-Placeholder.png';
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
    this.cartItemsSubscription?.unsubscribe();
    this.adjustedItemsSubscription?.unsubscribe();
  }
}
