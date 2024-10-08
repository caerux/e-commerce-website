import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

interface SelectedFilters {
  brand: string[];
  category: string[];
  color: string[];
  gender: string[];
}

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

  selectedFilters: SelectedFilters = {
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
      this.filteredProducts = [...this.originalProducts];

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
  }

  // Handles filter changes emitted by the FilterSidebarComponent.
  onFilterChange(filterType: string, filterValue: string): void {
    const selectedIndex =
      this.selectedFilters[filterType as keyof SelectedFilters].indexOf(
        filterValue
      );

    // Add or remove the filter from the selected filters
    if (selectedIndex === -1) {
      this.selectedFilters[filterType as keyof SelectedFilters].push(
        filterValue
      );
    } else {
      this.selectedFilters[filterType as keyof SelectedFilters].splice(
        selectedIndex,
        1
      );
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
      this.filteredProducts = [...this.filteredProducts].sort((a, b) => {
        return (
          this.originalProducts.indexOf(a) - this.originalProducts.indexOf(b)
        );
      });
      return;
    }

    if (this.sortOption === 'priceLowToHigh') {
      this.filteredProducts.sort((a, b) => a.price - b.price);
      return;
    }

    if (this.sortOption === 'priceHighToLow') {
      this.filteredProducts.sort((a, b) => b.price - a.price);
      return;
    }

    if (this.sortOption === 'rating') {
      this.filteredProducts.sort((a, b) => b.rating - a.rating);
      return;
    }
  }

  // Returns the display text for the selected sort option
  getSortOptionDisplayText(): string {
    switch (this.sortOption) {
      case 'priceLowToHigh':
        return 'Price: Low to High';
      case 'priceHighToLow':
        return 'Price: High to Low';
      case 'rating':
        return 'Rating';
      case 'featured':
      default:
        return 'Featured';
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

  // Checks if any filter is currently applied.
  hasActiveFilters(): boolean {
    return (
      this.selectedFilters.brand.length > 0 ||
      this.selectedFilters.category.length > 0 ||
      this.selectedFilters.color.length > 0 ||
      this.selectedFilters.gender.length > 0
    );
  }

  // Returns an array of applied filters as strings
  getAppliedFilters(): string[] {
    const filters: string[] = [];
    for (const [, values] of Object.entries(this.selectedFilters) as [
      string,
      string[]
    ][]) {
      values.forEach((value: string) => {
        filters.push(`${value}`);
      });
    }
    return filters;
  }

  // Removes a specific filter
  removeFilter(filter: string): void {
    const [type, value] = filter.split(': ');

    const key = type.toLowerCase() as keyof SelectedFilters;
    const index = this.selectedFilters[key].indexOf(value);

    if (index !== -1) {
      this.selectedFilters[key].splice(index, 1);
      this.applyFilters();
      console.log('Filter removed. Updated filters:', this.selectedFilters); // Debugging
    } else {
      console.warn('Filter not found:', filter);
    }
  }

  capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
