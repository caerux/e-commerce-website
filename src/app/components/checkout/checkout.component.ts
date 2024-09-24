// checkout.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { Subscription, forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

interface CartDisplayItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit, OnDestroy {
  cartItems: CartDisplayItem[] = [];
  totalAmount: number = 0;
  isOrderPlaced: boolean = false;
  orderId: string = '';
  confirmedTotal: number = 0;
  private cartSubscription: Subscription | undefined;
  private cartItemsSubscription: Subscription | undefined;

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCartItems();

    // Subscribe to cart items in case they change before checkout
    this.cartSubscription = this.cartService.cartItems$.subscribe(
      () => {
        this.loadCartItems();
      },
      (error) => {
        console.error('Error fetching cart items:', error);
        this.toastr.error('Failed to load cart items.', 'Error');
      }
    );
  }

  private loadCartItems(): void {
    const cartItems = this.cartService.getCartItems();
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

  // Calculates the total amount from the cart.
  calculateTotal(): void {
    this.totalAmount = this.cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }

  // Handles order submission.
  submitOrder(): void {
    if (this.cartItems.length === 0) {
      this.toastr.warning('Your cart is empty.', 'Warning');
      return;
    }

    try {
      this.orderId = this.generateOrderId();

      const orderData = {
        items: this.cartItems,
        total: this.totalAmount,
        orderDate: new Date().toISOString(),
        orderId: this.orderId,
      };

      // Generate and download the CSV
      this.downloadCSV(orderData);

      // Capture the total amount before resetting
      this.confirmedTotal = this.totalAmount;

      // Display the confirmation message
      this.isOrderPlaced = true;

      // Clear the cart
      this.cartService.clearCart();
      this.totalAmount = 0;
      this.cartItems = [];
    } catch (error) {
      console.error('Error placing order:', error);
      this.toastr.error(
        'There was an issue placing your order. Please try again.',
        'Error'
      );
    }
  }

  // Generates a unique order ID.
  generateOrderId(): string {
    const timestamp = new Date().getTime();
    const randomNum = Math.floor(Math.random() * 1000);
    return `ORDER-${timestamp}-${randomNum}`;
  }

  // Generates a CSV string from the order data.
  generateCSV(orderData: any): string {
    const headers = [
      'Product Barcode',
      'Product Name',
      'Quantity',
      'Unit Price',
      'Subtotal',
    ];

    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const rows = orderData.items.map((item: CartDisplayItem) => [
      escapeCSV(item.product.barcode),
      escapeCSV(item.product.name),
      escapeCSV(item.quantity.toString()),
      escapeCSV(item.product.price.toFixed(2)),
      escapeCSV((item.product.price * item.quantity).toFixed(2)),
    ]);

    // Summary row with Total Quantity and Total Amount
    rows.push([
      '', // Product Barcode
      'Total', // Product Name
      escapeCSV(this.getTotalQuantity().toString()), // Quantity
      '', // Unit Price
      escapeCSV(this.totalAmount.toFixed(2)), // Subtotal
    ]);

    const csvRows = [headers, ...rows];

    // Convert array of arrays to CSV string
    return csvRows.map((row) => row.join(',')).join('\n');
  }

  // Initiates the CSV download.
  downloadCSV(orderData: any): void {
    const csvContent = this.generateCSV(orderData);
    // console.log('Generated CSV Content:\n', csvContent);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `${orderData.orderId}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Calculates the total quantity of items in the cart.
  getTotalQuantity(): number {
    return this.cartItems.reduce(
      (sum: number, item: CartDisplayItem) => sum + item.quantity,
      0
    );
  }

  // Handles navigation to the home page.
  navigateToHome(): void {
    this.router.navigate(['/home']);
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
