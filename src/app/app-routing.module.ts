import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CartComponent } from './pages/cart/cart.component';
import { LoginComponent } from './pages/login/login.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { CsvUploadComponent } from './components/csv-upload/csv-upload.component';
import { ProductNotFoundComponent } from './pages/product-not-found/product-not-found.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'product/:barcode', component: ProductDetailComponent },
  { path: 'product-not-found', component: ProductNotFoundComponent },
  { path: 'cart', component: CartComponent },
  { path: 'login', component: LoginComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'csv-upload', component: CsvUploadComponent },
  { path: '**', redirectTo: '/', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
