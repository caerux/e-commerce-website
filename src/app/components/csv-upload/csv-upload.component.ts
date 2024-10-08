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

interface OrderItem {
  barcode: string;
  name: string;
  description: string;
  imageUrl: string;
  quantity: number;
  price: number;
  mrp: number;
  totalPrice: number;
  totalMRP: number;
  totalDiscount: number;
}

@Component({
  selector: 'app-csv-upload',
  templateUrl: './csv-upload.component.html',
  styleUrls: ['./csv-upload.component.scss'],
})
export class CsvUploadComponent {
  csvFile: File | null = null;
  csvOrderDetails: OrderItem[] = []; // Holds CSV items for display
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

          // Process and add to csvOrderDetails based on CSV only
          const processingPassed = await this.processCsvData(data);
          if (processingPassed) {
            this.toastr.success(
              'CSV uploaded and order details populated successfully.',
              'Success'
            );
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
    this.csvOrderDetails = [];
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

    let rowNumber = 2;

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

  // Process and set csvOrderDetails based on CSV only
  private async processCsvData(data: CsvData[]): Promise<boolean> {
    this.csvOrderDetails = [];
    this.totalAmount = 0;
    this.totalMRP = 0;
    this.totalDiscount = 0;

    // Aggregate quantities for duplicate barcodes
    const barcodeQuantityMap: { [barcode: string]: number } = {};

    for (const row of data) {
      const barcode = String(row.barcode).trim();
      const quantity = Number(row.quantity);

      if (barcodeQuantityMap[barcode]) {
        barcodeQuantityMap[barcode] += quantity;
      } else {
        barcodeQuantityMap[barcode] = quantity;
      }
    }

    // Now process each unique barcode
    for (const barcode in barcodeQuantityMap) {
      const quantity = barcodeQuantityMap[barcode];

      try {
        const product = await firstValueFrom(
          this.productService.getProductByBarcode(barcode)
        );

        if (!product) {
          this.errorMessage = `Product with barcode "${barcode}" not found.`;
          return false;
        }

        // Get current quantity from the cart
        const currentQuantity = this.cartService.getCartItem(barcode);

        // Calculate new quantity
        let newQuantity = currentQuantity + quantity;

        // Cap the quantity at 100
        if (newQuantity > 100) {
          newQuantity = 100;
          this.toastr.warning(
            `Quantity for "${product.name}" capped at 100.`,
            'Quantity Limit Reached'
          );
        }

        // Update the cart with the new quantity
        await this.cartService.updateQuantity(product, newQuantity);

        // Calculate totals based on the CSV quantities added
        const addedPrice = product.price * quantity;
        const addedMRP = product.mrp * quantity;
        const addedDiscount = (product.mrp - product.price) * quantity;

        // Add to csvOrderDetails for display
        this.csvOrderDetails.push({
          barcode: product.barcode,
          name: product.name,
          description: product.additionalInfo,
          imageUrl: product.searchImage,
          quantity: quantity,
          price: product.price,
          mrp: product.mrp,
          totalPrice: addedPrice,
          totalMRP: addedMRP,
          totalDiscount: addedDiscount,
        });

        // Update totals based on the CSV quantities
        this.totalAmount += addedPrice;
        this.totalMRP += addedMRP;
        this.totalDiscount += addedDiscount;
      } catch (error) {
        console.error('Error fetching product:', error);
        this.errorMessage = `Unexpected error processing barcode "${barcode}".`;
        return false;
      }
    }

    return true;
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
