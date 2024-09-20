import { Component, OnInit, OnDestroy } from '@angular/core';
import { CartService, CartItem } from '../../services/cart.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit, OnDestroy {
  totalAmount: number = 0;
  isOrderPlaced: boolean = false;
  orderId: string = '';
  private cartSubscription: Subscription | undefined;

  constructor(
    public cartService: CartService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.calculateTotal();

    // Subscribe to cart items in case they change before checkout
    this.cartSubscription = this.cartService.cartItems$.subscribe(
      (items: CartItem[]) => {
        this.calculateTotal();
      },
      (error) => {
        console.error('Error fetching cart items:', error);
        this.toastr.error('Failed to load cart items.', 'Error');
      }
    );
  }

  //Calculates the total amount from the cart.
  calculateTotal(): void {
    this.totalAmount = this.cartService
      .getCartItems()
      .reduce((total, item) => total + item.product.price * item.quantity, 0);
  }

  //Handles order submission.
  submitOrder(): void {
    const cartItems = this.cartService.getCartItems();
    if (cartItems.length === 0) {
      this.toastr.warning('Your cart is empty.', 'Warning');
      return;
    }

    this.orderId = this.generateOrderId();

    const orderData = {
      items: cartItems,
      total: this.totalAmount,
      orderDate: new Date().toISOString(),
      orderId: this.orderId,
    };

    // Generate and download the CSV
    this.downloadCSV(orderData);

    // Display the confirmation message
    this.isOrderPlaced = true;

    // Clear the cart
    this.cartService.clearCart();
    this.totalAmount = 0;
  }

  //Generates a unique order ID.
  generateOrderId(): string {
    const timestamp = new Date().getTime();
    const randomNum = Math.floor(Math.random() * 1000);
    return `ORDER-${timestamp}-${randomNum}`;
  }

  //generates a CSV string from the order data.
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

    const rows = orderData.items.map((item: CartItem) => [
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

  //Initiates the CSV download.
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

  //Calculates the total quantity of items in the cart.
  getTotalQuantity(): number {
    return this.cartService
      .getCartItems()
      .reduce((sum, item) => sum + item.quantity, 0);
  }

  //Handles navigation to the home page.
  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }
}
