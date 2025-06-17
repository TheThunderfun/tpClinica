import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'autorizacionVisual',
  standalone: true,
})
export class AutorizacionVisualPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: boolean | undefined): SafeHtml {
    if (value === undefined || value === null) {
      return this.sanitizer.bypassSecurityTrustHtml(
        `<span style="color: gray;">--</span>`
      );
    }
    if (value) {
      return this.sanitizer.bypassSecurityTrustHtml(
        `<span style="color: green;">✔️ Sí</span>`
      );
    } else {
      return this.sanitizer.bypassSecurityTrustHtml(
        `<span style="color: red;">❌ No</span>`
      );
    }
  }
}
