import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appResaltarEstado]',
  standalone: true,
})
export class ResaltarEstadoDirective {
  @Input('appResaltarEstado') estado: string = '';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(): void {
    const estadoLower = this.estado?.toLowerCase();

    let color = '';
    switch (estadoLower) {
      case 'pendiente':
        color = '#ffc107'; // amarillo
        break;
      case 'aceptado':
        color = '#28a745'; // verde
        break;
      case 'rechazado':
      case 'cancelado':
        color = '#dc3545'; // rojo
        break;
      case 'finalizado':
        color = '#17a2b8'; // cyan
        break;
      default:
        color = '#6c757d'; // gris
    }

    this.renderer.setStyle(this.el.nativeElement, 'color', 'white');
    this.renderer.setStyle(this.el.nativeElement, 'background-color', color);
    this.renderer.setStyle(this.el.nativeElement, 'padding', '0.25rem 0.5rem');
    this.renderer.setStyle(this.el.nativeElement, 'border-radius', '0.25rem');
  }
}
