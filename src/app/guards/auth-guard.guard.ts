import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';

export const authGuardGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.usuario$.pipe(
    filter((usuario) => usuario !== null), // 🔸 Esperar un usuario válido
    take(1), // 🔸 Tomar solo el primero válido
    map((usuario) => {
      console.log('Usuario desde el guard:', usuario);
      if (usuario?.rol === 'administrador') {
        return true;
      } else {
        router.navigate(['/bienvenida']);
        return false;
      }
    })
  );
};
