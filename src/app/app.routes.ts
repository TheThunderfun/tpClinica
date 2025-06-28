import { Routes } from '@angular/router';
import { BienvenidaComponent } from './components/bienvenida/bienvenida.component';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';
import { UsuariosService } from './services/usuarios.service';
import { SUsuariosComponent } from './components/s-usuarios/s-usuarios.component';
import { authGuardGuard } from './guards/auth-guard.guard';
import { TurnosModule } from './modules/turnos/turnos.module';
import { MiPerfilComponent } from './components/mi-perfil/mi-perfil.component';
import { animation } from '@angular/animations';
import { PacientesComponent } from './components/pacientes/pacientes.component';
import { EstadisticasComponent } from './components/estadisticas/estadisticas.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: { animation: 'FadeIn' },
  },
  {
    path: 'registro',
    component: RegistroComponent,
  },
  {
    path: 'bienvenida',
    component: BienvenidaComponent,
    data: {
      animation: 'SlideIn',
    },
  },
  {
    path: 'usuarios',
    component: SUsuariosComponent,
    canActivate: [authGuardGuard],
  },
  {
    path: 'turnos',
    loadChildren: () =>
      import('./modules/turnos/turnos.module').then((m) => m.TurnosModule),
  },
  {
    path: 'miPerfil',
    component: MiPerfilComponent,
  },
  {
    path: 'estadisticas',
    component: EstadisticasComponent,
  },
  {
    path: 'pacientes',
    component: PacientesComponent,
  },
  {
    path: '',
    component: BienvenidaComponent,
    data: {
      animation: 'SlideIn',
    },
  },
];
