import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private productsUrl = 'assets/products.json';

  constructor(private http: HttpClient) {}

  // Fetch all products
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.productsUrl);
  }

  // Fetch a product by barcode
  getProductByBarcode(barcode: string): Observable<Product | undefined> {
    return this.getProducts().pipe(
      map((products: Product[]) =>
        products.find((product) => product.barcode === barcode)
      )
    );
  }
}
