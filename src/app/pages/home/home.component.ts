import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';

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

  private saveFiltersSubject = new Subject<void>();

  constructor(private productService: ProductService) {
    this.saveFiltersSubject
      .pipe(debounceTime(300))
      .subscribe(() => this.saveFiltersToSessionStorage());
  }

  ngOnInit(): void {
    this.loadFiltersFromSessionStorage();

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

      this.validateSelectedFilters();

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
    this.saveFiltersSubject.next();
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
    this.saveFiltersSubject.next();
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

  // Returns an array of applied filters as objects with type and value
  getAppliedFilters(): { type: string; value: string }[] {
    const filters: { type: string; value: string }[] = [];
    for (const [type, values] of Object.entries(this.selectedFilters) as [
      string,
      string[]
    ][]) {
      values.forEach((value: string) => {
        filters.push({ type: type, value: value });
      });
    }
    return filters;
  }

  // Removes a specific filter based on type and value
  removeFilter(filterType: string, filterValue: string): void {
    const key = filterType.toLowerCase() as keyof SelectedFilters;
    const index = this.selectedFilters[key].indexOf(filterValue);

    if (index !== -1) {
      this.selectedFilters[key].splice(index, 1);
      this.applyFilters();
      this.saveFiltersSubject.next();
    } else {
      console.warn('Filter not found:', filterValue);
    }
  }

  capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Load filters from sessionStorage
  private loadFiltersFromSessionStorage(): void {
    const savedFilters = sessionStorage.getItem('selectedFilters');
    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters);

        if (this.isValidSelectedFilters(parsedFilters)) {
          this.selectedFilters = parsedFilters;
        } else {
          console.warn(
            'Invalid filter structure in sessionStorage. Resetting filters.'
          );
          this.selectedFilters = {
            brand: [],
            category: [],
            color: [],
            gender: [],
          };
          this.saveFiltersToSessionStorage();
        }
      } catch (e) {
        console.error('Error parsing saved filters from sessionStorage:', e);
        this.selectedFilters = {
          brand: [],
          category: [],
          color: [],
          gender: [],
        };
        this.saveFiltersToSessionStorage();
      }
    }
  }

  // Save filters to sessionStorage
  private saveFiltersToSessionStorage(): void {
    sessionStorage.setItem(
      'selectedFilters',
      JSON.stringify(this.selectedFilters)
    );
  }

  // Validate the structure of loaded filters
  private isValidSelectedFilters(obj: any): obj is SelectedFilters {
    const requiredKeys = ['brand', 'category', 'color', 'gender'];
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    for (const key of requiredKeys) {
      if (!Array.isArray(obj[key])) {
        return false;
      }
      for (const value of obj[key]) {
        if (typeof value !== 'string') {
          return false;
        }
      }
    }

    return true;
  }

  // Validate loaded filters against available filter options
  private validateSelectedFilters(): void {
    const initialSelectedFilters = { ...this.selectedFilters };
    let filtersChanged = false;

    // Validate each filter type and its values
    for (const filterType of Object.keys(this.selectedFilters) as Array<
      keyof SelectedFilters
    >) {
      const availableOptions = this.getAvailableOptions(filterType);
      const validValues = this.selectedFilters[filterType].filter((value) =>
        availableOptions.includes(value)
      );

      if (validValues.length !== this.selectedFilters[filterType].length) {
        this.selectedFilters[filterType] = validValues;
        filtersChanged = true;
        console.warn(
          `Some invalid values were removed from the '${filterType}' filters.`
        );
      }
    }

    // Check for any invalid filter types (extra keys)
    const allowedFilterTypes = ['brand', 'category', 'color', 'gender'];
    for (const key of Object.keys(initialSelectedFilters)) {
      if (!allowedFilterTypes.includes(key)) {
        delete this.selectedFilters[key as keyof SelectedFilters];
        filtersChanged = true;
        console.warn(`Invalid filter type '${key}' was removed.`);
      }
    }

    if (filtersChanged) {
      this.saveFiltersToSessionStorage();
    }
  }

  // Get available filter options based on filter type
  private getAvailableOptions(filterType: keyof SelectedFilters): string[] {
    switch (filterType) {
      case 'brand':
        return this.availableBrands;
      case 'category':
        return this.availableCategories;
      case 'color':
        return this.availableColors;
      case 'gender':
        return this.availableGenders;
      default:
        return [];
    }
  }
}
