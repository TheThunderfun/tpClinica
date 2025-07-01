import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatear',
  standalone: true,
})
export class FormatearPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}
