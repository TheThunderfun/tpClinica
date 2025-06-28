import { Directive,HostListener } from '@angular/core';

@Directive({
  selector: '[appSoloNumeros]',
  standalone: true,
})
export class SoloNumerosDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const teclasPermitidas = [
      'Backspace',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
    ];

    if (teclasPermitidas.includes(event.key) || /^[0-9]$/.test(event.key)) {
      return;
    }

    event.preventDefault(); 
  }
}
