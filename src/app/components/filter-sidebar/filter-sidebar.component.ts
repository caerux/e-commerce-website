import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

type FilterType = 'brand' | 'category' | 'color' | 'gender';

@Component({
  selector: 'app-filter-sidebar',
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.scss'],
})
export class FilterSidebarComponent implements OnInit {
  @Input() availableBrands: string[] = [];
  @Input() availableCategories: string[] = [];
  @Input() availableColors: string[] = [];
  @Input() availableGenders: string[] = [];

  @Input() selectedFilters: {
    brand: string[];
    category: string[];
    color: string[];
    gender: string[];
  } = {
    brand: [],
    category: [],
    color: [],
    gender: [],
  };

  @Output() filterChange = new EventEmitter<{
    filterType: FilterType;
    filterValue: string;
  }>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() closeSidebar = new EventEmitter<void>();

  showAllFilters: Record<FilterType, boolean> = {
    brand: false,
    category: false,
    color: false,
    gender: false,
  };

  readonly MAX_VISIBLE_FILTERS = 5;

  constructor() {}

  ngOnInit(): void {}

  // Toggles the visibility of filters for a specific type.
  toggleFilterVisibility(filterType: FilterType): void {
    if (this.showAllFilters.hasOwnProperty(filterType)) {
      this.showAllFilters[filterType] = !this.showAllFilters[filterType];
    }
  }

  // Returns the list of filters to be displayed based on the current visibility state.
  getVisibleFilters(filterType: FilterType, filters: string[]): string[] {
    return this.showAllFilters[filterType]
      ? filters
      : filters.slice(0, this.MAX_VISIBLE_FILTERS);
  }

  // Emits filter changes to the parent component.
  onFilterChange(
    filterType: FilterType,
    filterValue: string,
    event: any
  ): void {
    this.filterChange.emit({ filterType, filterValue });
  }

  // Emits an event to clear all filters.
  onClearFilters(): void {
    this.clearFilters.emit();
  }

  // Emits an event to close the sidebar.
  onCloseSidebar(): void {
    this.closeSidebar.emit();
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
}
