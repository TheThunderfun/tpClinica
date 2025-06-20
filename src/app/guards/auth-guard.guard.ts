import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { take, map } from 'rxjs/operators';

export const authGuardGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.usuario$.pipe(
    take(1), // toma el primer valor, incluso si es null
    map((usuario) => {
      if (usuario && usuario.rol === 'administrador') {
        return true;
      } else {
        router.navigate(['/bienvenida']); // redirige si no hay usuario o no es admin
        return false;
      }
    })
  );
};
