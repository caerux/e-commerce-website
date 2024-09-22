import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

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
    filterType: string;
    filterValue: string;
  }>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() closeSidebar = new EventEmitter<void>();

  constructor() {}

  ngOnInit(): void {}

  // Emits filter changes to the parent component.
  onFilterChange(filterType: string, filterValue: string, event: any): void {
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
