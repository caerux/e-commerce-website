import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberSuffix',
})
export class NumberSuffixPipe implements PipeTransform {
  transform(value: number, args?: any): string {
    if (value === null || value === undefined) return '';

    if (value < 1000) {
      return value.toString();
    } else {
      const result = (value / 1000).toFixed(1).replace(/\.0$/, '');
      return `${result}k`;
    }
  }
}
