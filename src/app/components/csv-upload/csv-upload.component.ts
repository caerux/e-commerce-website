import { Component } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import * as Papa from 'papaparse';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

interface CsvData {
  barcode: string;
  quantity: string;
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
  totalMRP: number = 0;
  totalDiscount: number = 0;
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
    this.resetState();

    if (file) {
      this.csvFile = file;
    }
  }

  // Uploads and parses the CSV file
  uploadCsv(): void {
    this.resetState();

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
        dynamicTyping: false,
        complete: async (result) => {
          const data: CsvData[] = result.data as CsvData[];

          // Validate CSV headers
          if (!this.validateHeaders(result.meta.fields || [])) {
            this.errorMessage =
              'Invalid CSV headers. Please ensure the CSV has "barcode" and "quantity" columns.';
            return;
          }

          // Validate all rows
          const validationPassed = await this.validateCsvData(data);
          this.csvProcessed = true;

          if (!validationPassed) {
            return;
          }

          // Process and add to cart
          const processingPassed = await this.processCsvData(data);
          if (processingPassed) {
            this.toastr.success(
              'CSV uploaded and cart populated successfully.',
              'Success'
            );
            this.calculateTotal();
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          this.errorMessage = 'There was an error parsing the CSV file.';
        },
      });
    };

    reader.readAsText(this.csvFile);
  }

  // Resets the component state
  private resetState(): void {
    this.errorMessage = '';
    this.errorDetails = [];
    this.hasErrors = false;
    this.orderDetails = [];
    this.totalAmount = 0;
    this.totalMRP = 0;
    this.totalDiscount = 0;
    this.csvProcessed = false;
  }

  // Validates CSV headers
  private validateHeaders(headers: (string | undefined)[]): boolean {
    if (!headers) return false;
    const requiredHeaders = ['barcode', 'quantity'];
    const lowerCaseHeaders = headers.map((header) =>
      header?.toLowerCase().trim()
    );

    return requiredHeaders.every((header) => lowerCaseHeaders.includes(header));
  }

  // Validate all CSV data
  private async validateCsvData(data: CsvData[]): Promise<boolean> {
    this.errorDetails = [];
    this.hasErrors = false;

    let rowNumber = 2; // Assuming headers are on row 1

    for (const row of data) {
      const barcode = String(row.barcode).trim();
      const quantityStr = String(row.quantity).trim();
      const errorMessages: string[] = [];

      // Validate Barcode
      if (!barcode) {
        errorMessages.push('Barcode is empty.');
      } else {
        try {
          const product = await firstValueFrom(
            this.productService.getProductByBarcode(barcode)
          );

          if (!product) {
            errorMessages.push(`Product with barcode "${barcode}" not found.`);
          }
        } catch (error) {
          console.error('Error fetching product:', error);
          errorMessages.push(
            `Error fetching product with barcode "${barcode}".`
          );
        }
      }

      // Validate Quantity
      if (!quantityStr) {
        errorMessages.push('Quantity is empty.');
      } else {
        const exponentialRegex = /^[+-]?(\d+\.?\d*|\.\d+)[eE][+-]?\d+$/;
        if (exponentialRegex.test(quantityStr)) {
          errorMessages.push('Quantity should not be in exponential notation.');
        }

        const quantity = Number(quantityStr);
        if (isNaN(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
          errorMessages.push('Quantity must be a positive integer.');
        }
      }

      if (errorMessages.length > 0) {
        this.hasErrors = true;
        this.errorDetails.push({
          rowNumber,
          barcode: row.barcode,
          quantity: row.quantity,
          errorMessages,
        });
      }

      rowNumber++;
    }

    return !this.hasErrors;
  }

  // Process and add to cart
  private async processCsvData(data: CsvData[]): Promise<boolean> {
    this.orderDetails = [];
    this.totalAmount = 0;
    this.totalMRP = 0;
    this.totalDiscount = 0;

    for (const row of data) {
      const barcode = String(row.barcode).trim();
      const quantity = Number(row.quantity);

      try {
        const product = await firstValueFrom(
          this.productService.getProductByBarcode(barcode)
        );

        if (!product) {
          this.errorMessage = `Product with barcode "${barcode}" not found.`;
          return false;
        }

        // Add to cart
        this.cartService.addToCart(product);

        // Update the quantity in the cart to match the CSV
        this.cartService.updateQuantity(product, quantity);

        // Calculate totals
        const totalPrice = product.price * quantity;
        const totalMRP = product.mrp * quantity;
        const totalDiscount = totalMRP - totalPrice;

        // Add to order details for display
        this.orderDetails.push({
          barcode: product.barcode,
          name: product.name,
          description: product.additionalInfo,
          imageUrl: product.searchImage,
          quantity: quantity,
          price: product.price,
          mrp: product.mrp,
          totalPrice: totalPrice,
          totalMRP: totalMRP,
          totalDiscount: totalDiscount,
          discountDisplayLabel: product.discountDisplayLabel,
        });

        this.totalAmount += totalPrice;
        this.totalMRP += totalMRP;
        this.totalDiscount += totalDiscount;
      } catch (error) {
        console.error('Error fetching product:', error);
        this.errorMessage = `Unexpected error processing barcode "${barcode}".`;
        return false;
      }
    }

    return true;
  }

  // Calculates the total amounts from the order details
  private calculateTotal(): void {
    this.totalAmount = 0;
    this.totalMRP = 0;
    this.totalDiscount = 0;

    for (const item of this.orderDetails) {
      this.totalAmount += item.totalPrice;
      this.totalMRP += item.totalMRP;
      this.totalDiscount += item.totalDiscount;
    }
  }

  // Handles proceeding to checkout
  proceedToCheckout(): void {
    if (!this.authService.isLoggedIn()) {
      this.toastr.warning(
        'Please log in to proceed to checkout.',
        'Login Required'
      );
      this.router.navigate(['/login']);
      return;
    }

    this.router.navigate(['/checkout']);
  }
}
