// csv-upload.component.ts
import { Component } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import * as Papa from 'papaparse';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

interface CsvData {
  barcode: string;
  quantity: number;
}

interface CsvError {
  rowNumber: number;
  barcode: string;
  quantity: string;
  errorMessage: string;
}

@Component({
  selector: 'app-csv-upload',
  templateUrl: './csv-upload.component.html',
  styleUrls: ['./csv-upload.component.scss'],
})
export class CsvUploadComponent {
  csvFile: File | null = null;
  orderDetails: any[] = [];
  totalAmount: number = 0;
  csvProcessed: boolean = false;
  errorMessage: string = '';
  errorDetails: CsvError[] = [];
  hasErrors: boolean = false;

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  // Handles file selection
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    this.errorMessage = '';
    if (file) {
      this.csvFile = file;
    }
  }

  // Uploads and parses the CSV file
  uploadCsv(): void {
    this.csvProcessed = false;
    this.errorMessage = '';
    this.errorDetails = [];
    this.hasErrors = false;

    if (!this.csvFile) {
      this.errorMessage = 'Please select a CSV file to upload.';
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
            this.errorMessage =
              'Invalid CSV headers. Please ensure the CSV has "barcode" and "quantity" columns.';
            return;
          }

          // Process each row
          this.processCsvData(data);
          this.csvProcessed = true; // Set flag to true after processing
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          this.errorMessage = 'There was an error parsing the CSV file.'; // Error on page
        },
      });
    };

    reader.readAsText(this.csvFile);
  }

  // Validates CSV headers
  validateHeaders(headers: (string | undefined)[]): boolean {
    if (!headers) return false;
    const requiredHeaders = ['barcode', 'quantity'];
    const lowerCaseHeaders = headers.map((header) =>
      header?.toLowerCase().trim()
    );

    return requiredHeaders.every((header) => lowerCaseHeaders.includes(header));
  }

  // Processes parsed CSV data
  async processCsvData(data: CsvData[]): Promise<void> {
    this.orderDetails = [];
    this.totalAmount = 0;
    this.errorMessage = '';
    this.errorDetails = [];
    this.hasErrors = false;

    let rowNumber = 1;

    for (const row of data) {
      const barcode = String(row.barcode).trim();
      const quantity = Number(row.quantity);
      let errorInRow = false;
      let errorMessage = '';

      if (!barcode) {
        errorInRow = true;
        errorMessage = 'Empty barcode.';
      } else if (isNaN(quantity) || quantity <= 0) {
        errorInRow = true;
        errorMessage = 'Invalid quantity.';
      }

      if (!errorInRow) {
        try {
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
              description: product.additionalInfo,
              imageUrl: product.searchImage,
              quantity: quantity,
              price: product.price,
              subtotal: product.price * quantity,
            });

            // Calculate total
            this.totalAmount += product.price * quantity;
          } else {
            errorInRow = true;
            errorMessage = `Product with barcode "${barcode}" not found.`;
          }
        } catch (error) {
          console.error('Error fetching product:', error);
          errorInRow = true;
          errorMessage = `Error fetching product with barcode "${barcode}".`;
        }
      }

      if (errorInRow) {
        this.hasErrors = true;
        this.errorDetails.push({
          rowNumber: rowNumber,
          barcode: row.barcode,
          quantity: String(row.quantity),
          errorMessage: errorMessage,
        });
      }

      rowNumber++;
    }

    if (this.hasErrors) {
      // If there are errors, don't proceed to display order details
      this.orderDetails = [];
      this.toastr.error('Errors found in CSV file.', 'Error');
      return;
    }

    if (this.orderDetails.length > 0) {
      this.toastr.success(
        'CSV uploaded and cart populated successfully.',
        'Success'
      );
      this.calculateTotal();
    } else {
      this.errorMessage = 'No valid products found in the CSV.';
    }
  }

  // Calculates the total amount from the order details
  calculateTotal(): void {
    this.totalAmount = this.orderDetails.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
  }

  // Handles proceeding to checkout
  proceedToCheckout(): void {
    if (this.orderDetails.length === 0) {
      this.errorMessage = 'Your cart is empty. Please upload a valid CSV file.';
      return;
    }

    // Check if the user is logged in
    if (!this.authService.isLoggedIn()) {
      this.errorMessage = 'Please log in to proceed to checkout.';
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/checkout']);
    }
  }
}
