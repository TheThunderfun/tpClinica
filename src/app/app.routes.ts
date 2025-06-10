import { Routes } from '@angular/router';
import { BienvenidaComponent } from './components/bienvenida/bienvenida.component';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';

export const routes: Routes = [
  {
    path: '',
    component: BienvenidaComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'registro',
    component: RegistroComponent,
  },
];
