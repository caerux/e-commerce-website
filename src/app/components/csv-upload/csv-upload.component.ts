import { Component, ViewChild, ElementRef } from '@angular/core';
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
  rowNumber: number;
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
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  csvFile: File | null = null;
  csvOrderDetails: OrderItem[] = []; // Holds CSV items for display
  totalAmount: number = 0;
  totalMRP: number = 0;
  totalDiscount: number = 0;
  csvProcessed: boolean = false;
  errorMessage: string = '';
  errorDetails: CsvError[] = [];
  hasErrors: boolean = false;
  isAddingToCart: boolean = false;

  private barcodeToRowNumber: { [barcode: string]: number } = {};

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

            this.resetFileInput();
            return;
          }

          // Validate all rows
          const validationPassed = await this.validateCsvData(data);
          this.csvProcessed = true;

          if (!validationPassed) {
            this.resetFileInput();
            return;
          }

          // Process and prepare csvOrderDetails without adding to cart
          const processingPassed = await this.processCsvData(data);
          if (processingPassed) {
            this.toastr.success(
              'CSV processed successfully. You can now add items to your cart.',
              'Success'
            );
          }

          this.resetFileInput();
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          this.errorMessage = 'There was an error parsing the CSV file.';

          this.resetFileInput();
        },
      });
    };

    reader.readAsText(this.csvFile);
  }

  // Resets the component state and the file input
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

  // Resets the file input value to allow re-uploading the same file
  private resetFileInput(): void {
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
    this.csvFile = null;
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
    this.barcodeToRowNumber = {};

    let rowNumber = 2;

    for (const row of data) {
      const barcode = String(row.barcode).trim();
      const quantityStr = String(row.quantity).trim();
      const errorMessages: string[] = [];

      if (barcode && !(barcode in this.barcodeToRowNumber)) {
        this.barcodeToRowNumber[barcode] = rowNumber;
      }

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
        } else if (quantity > 100) {
          errorMessages.push('Quantity exceeds the maximum limit of 100.');
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
      const rowNumber = this.barcodeToRowNumber[barcode];

      try {
        const product = await firstValueFrom(
          this.productService.getProductByBarcode(barcode)
        );

        if (!product) {
          this.errorMessage = `Product with barcode "${barcode}" not found.`;
          return false;
        }

        // Calculate totals based on the CSV quantities
        const addedPrice = product.price * quantity;
        const addedMRP = product.mrp * quantity;
        const addedDiscount = (product.mrp - product.price) * quantity;

        // Add to csvOrderDetails for display
        this.csvOrderDetails.push({
          rowNumber: rowNumber,
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

  // Adds the processed CSV items to the cart
  async addToCart(): Promise<void> {
    if (this.csvOrderDetails.length === 0) {
      this.toastr.warning('No items to add to the cart.', 'Warning');
      return;
    }

    this.isAddingToCart = true;
    this.hasErrors = false;
    const exceededItems: CsvError[] = [];

    // First, check all items to ensure none exceed the limit when added
    for (const item of this.csvOrderDetails) {
      try {
        const product = await firstValueFrom(
          this.productService.getProductByBarcode(item.barcode)
        );

        if (!product) {
          exceededItems.push({
            rowNumber: item.rowNumber,
            barcode: item.barcode,
            quantity: item.quantity.toString(),
            errorMessages: [
              `Product with barcode "${item.barcode}" not found.`,
            ],
          });
          continue;
        }

        // Get current quantity from the cart
        const currentQuantity = this.cartService.getCartItem(item.barcode) || 0;

        // Calculate new quantity
        const newQuantity = currentQuantity + item.quantity;

        // Check if new quantity exceeds 100
        if (newQuantity > 100) {
          exceededItems.push({
            rowNumber: item.rowNumber,
            barcode: item.barcode,
            quantity: item.quantity.toString(),
            errorMessages: [
              `Total quantity for "${product.name}" exceeds the maximum limit of 100. Current in cart: ${currentQuantity}. Requested: ${item.quantity}.`,
            ],
          });
        }
      } catch (error) {
        console.error('Error checking product:', error);
        exceededItems.push({
          rowNumber: item.rowNumber,
          barcode: item.barcode,
          quantity: item.quantity.toString(),
          errorMessages: [
            `Unexpected error checking product "${item.barcode}".`,
          ],
        });
      }
    }

    // If any items exceed the limit, display errors and do not add to cart
    if (exceededItems.length > 0) {
      this.hasErrors = true;
      this.errorDetails = [...this.errorDetails, ...exceededItems];

      this.isAddingToCart = false;
      return;
    }

    // If all items are within limits, proceed to add them to the cart
    for (const item of this.csvOrderDetails) {
      try {
        const product = await firstValueFrom(
          this.productService.getProductByBarcode(item.barcode)
        );

        if (!product) {
          continue;
        }

        // Get current quantity from the cart
        const currentQuantity = this.cartService.getCartItem(item.barcode) || 0;

        // Calculate new quantity
        const newQuantity = currentQuantity + item.quantity;

        // Update the cart with the new quantity
        await this.cartService.updateQuantity(product, newQuantity);
      } catch (error) {
        console.error('Error adding to cart:', error);
        this.toastr.error(
          `Unexpected error adding "${item.name}" to the cart.`,
          'Error'
        );
      }
    }

    this.isAddingToCart = false;
    this.toastr.success('Items added to the cart successfully.', 'Success');
    this.resetState();
  }
}
