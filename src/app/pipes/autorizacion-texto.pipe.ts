import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'autorizacionTexto',
  standalone: true,
})
export class AutorizacionTextoPipe implements PipeTransform {
  transform(value: boolean | undefined): string {
    if (value === undefined || value === null) return '--';
    return value ? 'Sí' : 'No';
  }
}
