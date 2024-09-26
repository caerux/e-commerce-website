import { Component, HostListener, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  products: Product[] = [];
  originalProducts: Product[] = [];
  filteredProducts: Product[] = [];

  availableBrands: string[] = [];
  availableCategories: string[] = [];
  availableColors: string[] = [];
  availableGenders: string[] = [];

  selectedFilters: any = {
    brand: [],
    category: [],
    color: [],
    gender: [],
  };

  showFilters: boolean = false;
  sortOption: string = 'featured';

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getProducts().subscribe((products: Product[]) => {
      this.products = products;
      this.originalProducts = [...products];

      // Extract unique filter options
      this.availableBrands = [
        ...new Set(products.map((product) => product.brand)),
      ];
      this.availableCategories = [
        ...new Set(products.map((product) => product.category)),
      ];
      this.availableColors = [
        ...new Set(products.map((product) => product.color)),
      ];
      this.availableGenders = [
        ...new Set(products.map((product) => product.gender)),
      ];

      // Apply initial filters and sorting
      this.applyFilters();
    });

    this.updateScreenSize();
  }

  // Handles filter changes emitted by the FilterSidebarComponent.
  onFilterChange(filterType: string, filterValue: string): void {
    const selectedIndex = this.selectedFilters[filterType].indexOf(filterValue);

    // Add or remove the filter from the selected filters
    if (selectedIndex === -1) {
      this.selectedFilters[filterType].push(filterValue);
    } else {
      this.selectedFilters[filterType].splice(selectedIndex, 1);
    }

    this.applyFilters();
  }

  // Clears all selected filters.
  onClearFilters(): void {
    this.selectedFilters = {
      brand: [],
      category: [],
      color: [],
      gender: [],
    };
    this.applyFilters();
  }

  // Applies the selected filters to the product list.
  applyFilters(): void {
    this.filteredProducts = this.products.filter((product) => {
      const matchesBrand =
        this.selectedFilters.brand.length === 0 ||
        this.selectedFilters.brand.includes(product.brand);
      const matchesCategory =
        this.selectedFilters.category.length === 0 ||
        this.selectedFilters.category.includes(product.category);
      const matchesColor =
        this.selectedFilters.color.length === 0 ||
        this.selectedFilters.color.includes(product.color);
      const matchesGender =
        this.selectedFilters.gender.length === 0 ||
        this.selectedFilters.gender.includes(product.gender);

      return matchesBrand && matchesCategory && matchesColor && matchesGender;
    });

    // Apply sorting after filtering
    this.applySorting();
  }

  // Handles sorting option change
  onSortChange(sortOption: string): void {
    this.sortOption = sortOption;
    this.applySorting();
  }

  // Applies sorting to the filtered products
  applySorting(): void {
    if (this.sortOption === 'featured') {
      // this.filteredProducts = [...this.originalProducts];
    } else if (this.sortOption === 'priceLowToHigh') {
      this.filteredProducts.sort((a, b) => a.price - b.price);
    } else if (this.sortOption === 'priceHighToLow') {
      this.filteredProducts.sort((a, b) => b.price - a.price);
    } else if (this.sortOption === 'rating') {
      this.filteredProducts.sort((a, b) => b.rating - a.rating);
    }
  }

  // Returns the display text for the selected sort option
  getSortOptionDisplayText(): string {
    if (this.sortOption === 'priceLowToHigh') {
      return 'Price: Low to High';
    } else if (this.sortOption === 'priceHighToLow') {
      return 'Price: High to Low';
    } else if (this.sortOption === 'rating') {
      return 'Rating';
    } else if (this.sortOption === 'featured') {
      return 'Featured';
    } else {
      return 'Select';
    }
  }

  // Toggles the visibility of the mobile sidebar.
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    if (this.showFilters) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
  }

  // Detects window resize events to adjust the sidebar state.
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.updateScreenSize();
  }

  // Updates the screen size state and adjusts the sidebar visibility.
  updateScreenSize(): void {
    const isLarge = window.innerWidth >= 768;
    if (isLarge) {
      this.showFilters = false;
      document.body.classList.remove('no-scroll');
    }
  }
}
