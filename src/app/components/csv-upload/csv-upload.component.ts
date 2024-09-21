import { Component, OnInit } from '@angular/core';
import { CartService, CartItem } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service'; // Import AuthService
import * as Papa from 'papaparse';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

interface CsvData {
  barcode: string;
  quantity: number;
}

@Component({
  selector: 'app-csv-upload',
  templateUrl: './csv-upload.component.html',
  styleUrls: ['./csv-upload.component.scss'],
})
export class CsvUploadComponent implements OnInit {
  csvFile: File | null = null;
  orderDetails: any[] = [];
  totalAmount: number = 0;
  csvProcessed: boolean = false;

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    //load existing cart details if any
    // this.loadExistingOrderDetails();
  }

  //Handles file selection
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.csvFile = file;
    }
  }

  //Uploads and parses the CSV file
  uploadCsv(): void {
    this.csvProcessed = false;

    if (!this.csvFile) {
      this.toastr.warning('Please select a CSV file to upload.', 'Warning');
      return;
    }

    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      const csvData = e.target.result;
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const data: CsvData[] = result.data as CsvData[];

          // Validate CSV headers
          if (!this.validateHeaders(result.meta.fields || [])) {
            this.toastr.error(
              'Invalid CSV headers. Please ensure the CSV has "barcode" and "quantity" columns.',
              'Error'
            );
            return;
          }

          // Process each row
          this.processCsvData(data);
          this.csvProcessed = true; // Set flag to true after processing
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          this.toastr.error(
            'There was an error parsing the CSV file.',
            'Error'
          );
        },
      });
    };

    reader.readAsText(this.csvFile);
  }

  //Validates CSV headers
  validateHeaders(headers: (string | undefined)[]): boolean {
    if (!headers) return false;
    const requiredHeaders = ['barcode', 'quantity'];
    const lowerCaseHeaders = headers.map((header) =>
      header?.toLowerCase().trim()
    );

    return requiredHeaders.every((header) => lowerCaseHeaders.includes(header));
  }

  //Processes parsed CSV data
  async processCsvData(data: CsvData[]): Promise<void> {
    this.orderDetails = [];
    this.totalAmount = 0;

    const aggregatedData: { [barcode: string]: number } = {};

    data.forEach((row) => {
      const barcode = String(row.barcode).trim(); // Ensure barcode is a string
      const quantity = Number(row.quantity);
      if (barcode && !isNaN(quantity) && quantity > 0) {
        if (aggregatedData[barcode]) {
          aggregatedData[barcode] += quantity;
        } else {
          aggregatedData[barcode] = quantity;
        }
      }
    });

    for (const barcode in aggregatedData) {
      const quantity = aggregatedData[barcode];

      if (!barcode) {
        this.toastr.warning(
          `Empty barcode found. Skipping this entry.`,
          'Warning'
        );
        continue;
      }

      // Fetch product details by barcode
      const product = await this.productService
        .getProductByBarcode(barcode)
        .toPromise();

      if (product) {
        // Add to cart
        this.cartService.addToCart(product);

        // Update the quantity in the cart to match the CSV
        this.cartService.updateQuantity(product, quantity);

        // Add to order details for display
        this.orderDetails.push({
          barcode: product.barcode,
          name: product.name,
          quantity: quantity,
          price: product.price,
          subtotal: product.price * quantity,
        });

        // Calculate total
        this.totalAmount += product.price * quantity;
      } else {
        this.toastr.warning(
          `Product with barcode "${barcode}" not found. Skipping this entry.`,
          'Warning'
        );
      }
    }

    if (this.orderDetails.length > 0) {
      this.toastr.success(
        'CSV uploaded and cart populated successfully.',
        'Success'
      );
      this.calculateTotal();
    } else {
      this.toastr.info('No valid products found in the CSV.', 'Info');
    }
  }

  //Calculates the total amount from the order details
  calculateTotal(): void {
    this.totalAmount = this.orderDetails.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
  }

  //Handles proceeding to checkout
  proceedToCheckout(): void {
    if (this.orderDetails.length === 0) {
      this.toastr.warning(
        'Your cart is empty. Please upload a valid CSV file.',
        'Warning'
      );
      return;
    }

    // Check if the user is logged in
    if (!this.authService.isLoggedIn()) {
      // If not logged in, redirect to the login page
      this.toastr.warning('Please log in to proceed to checkout.', 'Warning');
      this.router.navigate(['/login']);
    } else {
      // If logged in, navigate to the checkout page
      this.router.navigate(['/checkout']);
    }
  }

  //Loads existing order details from the cart
  loadExistingOrderDetails(): void {
    const cartItems = this.cartService.getCartItems();
    if (cartItems.length > 0) {
      this.orderDetails = cartItems.map((item) => ({
        barcode: item.product.barcode,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity,
      }));
      this.calculateTotal();
    }
  }
}
