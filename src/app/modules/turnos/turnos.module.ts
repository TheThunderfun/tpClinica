import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { authGuardGuard } from '../../guards/auth-guard.guard';
import { SacarTurnoComponent } from '../../components/sacar-turno/sacar-turno.component';
import { MisTurnosComponent } from '../../components/mis-turnos/mis-turnos.component';
import { TurnosAdminComponent } from '../../components/turnos-admin/turnos-admin.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: 'misTurnos',
        component: MisTurnosComponent,
      },
      {
        path: 'solicitarTurno',
        component: SacarTurnoComponent,
      },
      {
        path: 'turnosAdmin',
        component: TurnosAdminComponent,
        canActivate: [authGuardGuard],
      },
    ]),
  ],
  providers: [],
})
export class TurnosModule {}
