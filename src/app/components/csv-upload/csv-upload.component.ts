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
  quantity: string; // Changed from number to string
}

interface CsvError {
  rowNumber: number;
  barcode: string;
  quantity: string;
  errorMessages: string[];
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
    this.orderDetails = [];
    this.totalAmount = 0;

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
        dynamicTyping: false, // Disable dynamic typing to keep quantities as strings
        complete: (result) => {
          const data: CsvData[] = result.data as CsvData[];

          // Validate CSV headers
          if (!this.validateHeaders(result.meta.fields || [])) {
            this.errorMessage =
              'Invalid CSV headers. Please ensure the CSV has "barcode" and "quantity" columns.';
            return;
          }

          // Validate all rows
          this.validateCsvData(data).then((validationPassed) => {
            this.csvProcessed = true;
            if (validationPassed) {
              // Second Pass: Process and add to cart
              this.processCsvData(data).then((processingPassed) => {
                if (processingPassed) {
                  this.toastr.success(
                    'CSV uploaded and cart populated successfully.',
                    'Success'
                  );
                  this.calculateTotal();
                }
              });
            } else {
              this.toastr.error('Errors found in CSV file.', 'Error');
            }
          });
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

  // Validate all CSV data
  async validateCsvData(data: CsvData[]): Promise<boolean> {
    this.errorDetails = [];
    this.hasErrors = false;

    let rowNumber = 2; // Assuming headers are on row 1

    for (const row of data) {
      const barcode = String(row.barcode).trim();
      const quantityStr = String(row.quantity).trim();
      let errorInRow = false;
      let errorMessages: string[] = [];

      // Validate Barcode
      if (!barcode) {
        errorInRow = true;
        errorMessages.push('Barcode is empty.');
      } else {
        try {
          const product = await this.productService
            .getProductByBarcode(barcode)
            .toPromise();

          if (!product) {
            errorInRow = true;
            errorMessages.push(`Product with barcode "${barcode}" not found.`);
          }
        } catch (error) {
          console.error('Error fetching product:', error);
          errorInRow = true;
          errorMessages.push(
            `Error fetching product with barcode "${barcode}".`
          );
        }
      }

      // Validate Quantity
      if (!quantityStr) {
        errorInRow = true;
        errorMessages.push('Quantity is empty.');
      } else {
        // Check for exponential notation using regex
        const exponentialRegex = /^[+-]?(\d+\.?\d*|\.\d+)[eE][+-]?\d+$/;
        if (exponentialRegex.test(quantityStr)) {
          errorInRow = true;
          errorMessages.push('Quantity should not be in exponential notation.');
        }

        // Check if quantity is a valid integer
        const quantity = Number(quantityStr);
        if (isNaN(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
          errorInRow = true;
          errorMessages.push('Quantity must be a positive integer.');
        }
      }

      if (errorInRow) {
        this.hasErrors = true;
        this.errorDetails.push({
          rowNumber: rowNumber,
          barcode: row.barcode,
          quantity: row.quantity,
          errorMessages: errorMessages,
        });
      }

      rowNumber++;
    }

    return !this.hasErrors;
  }

  // Process and add to cart
  async processCsvData(data: CsvData[]): Promise<boolean> {
    this.orderDetails = [];
    this.totalAmount = 0;

    for (const row of data) {
      const barcode = String(row.barcode).trim();
      const quantity = Number(row.quantity);

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
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        this.errorMessage = `Unexpected error processing barcode "${barcode}".`;
        return false;
      }
    }

    return true;
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
    // Check if the user is logged in
    if (!this.authService.isLoggedIn()) {
      this.toastr.warning(
        'Please log in to proceed to checkout.',
        'Login Required'
      );
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/checkout']);
    }
  }

  // Download Error Report
  downloadErrorReport(): void {
    if (this.errorDetails.length === 0) {
      this.toastr.info('No errors to download.', 'Info');
      return;
    }

    const csv = Papa.unparse(this.errorDetails, {
      header: true,
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'error_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
