import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rolVisual',
  standalone: true,
})
export class RolVisualPipe implements PipeTransform {
  transform(value: string | undefined): string {
    if (!value) return '';

    switch (value.toLowerCase()) {
      case 'administrador':
        return '🛡️ Administrador 🛡️'; // escudo para admin
      case 'especialista':
        return '👩‍⚕️ Especialista 👩‍⚕️'; // icono de especialista
      case 'paciente':
        return '🧑 Paciente 🧑'; // icono paciente
      default:
        return value;
    }
  }
}
