import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { authGuardGuard } from '../../guards/auth-guard.guard';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: 'misTurnos',
      },
      {
        path: 'solicitarTurno',
      },
      {
        path: 'turnosAdmin',
        canActivate: [authGuardGuard],
      },
    ]),
  ],
  providers: [],
})
export class TurnosModule {}
