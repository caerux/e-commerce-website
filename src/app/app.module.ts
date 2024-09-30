import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { HomeComponent } from './pages/home/home.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { HttpClientModule } from '@angular/common/http';
import { CartComponent } from './pages/cart/cart.component';
import { NumberSuffixPipe } from './pipes/number-suffix.pipe';
import { LoginComponent } from './pages/login/login.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { CsvUploadComponent } from './components/csv-upload/csv-upload.component';
import { FilterSidebarComponent } from './components/filter-sidebar/filter-sidebar.component';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';
import { ProductNotFoundComponent } from './pages/product-not-found/product-not-found.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    ProductCardComponent,
    ProductDetailComponent,
    CartComponent,
    NumberSuffixPipe,
    LoginComponent,
    CheckoutComponent,
    CsvUploadComponent,
    FilterSidebarComponent,
    ConfirmModalComponent,
    ProductNotFoundComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      timeOut: 2000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      closeButton: true,
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
