import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { filter, take, map } from 'rxjs/operators';

export const authGuardGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.usuario$.pipe(
    filter((usuario) => usuario !== null), // espera a que usuario no sea null
    take(1), // solo toma el primer valor no null
    map((usuario) => {
      if (usuario && usuario.rol === 'administrador') {
        return true;
      } else {
        router.navigate(['/']);
        return false;
      }
    })
  );
};
