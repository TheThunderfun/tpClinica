import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { AutoFocusDirective } from '../../directives/auto-focus.directive';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NavBarComponent, CommonModule,AutoFocusDirective],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  constructor(
    private authSv: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  showFavs = false;
  email: string = '';
  password: string = '';

  goToRegistro() {
    this.router.navigate(['/registro']);
  }

  async login() {
    try {
      await this.authSv.signIn(this.email, this.password);
      this.toastr.success('Bienvenido', 'Ingreso exitoso');
      this.router.navigate(['bienvenida']);
    } catch (err) {
      const mensaje = typeof err === 'string' ? err : 'Ocurrió un error';
      this.toastr.error(mensaje, 'Error de autenticación', {
        positionClass: 'toast-top-center',
      });
      console.log('No Entre');
    }
  }

  paciente() {
    this.email = 'fhulej27@gmail.com';
    this.password = 'Franchu10';
  }

  especialista() {
    this.email = 'franuleg@gmail.com';
    this.password = 'Franchu10';
  }

  usuariosRapidos = [
    {
      nombre: 'Paciente 1',
      email: 'fhulej27@gmail.com',
      password: 'Franchu10',
      imagen: 'assets/users/p1.png',
    },
    {
      nombre: 'Paciente 2',
      email: '8hk9t7m0ju@qzueos.com',
      password: 'paciente',
      imagen: 'assets/users/p2.png',
    },
    {
      nombre: 'Paciente 3',
      email: 'insideou@btcmod.com',
      password: 'paciente',
      imagen: 'assets/users/p3.png',
    },
    {
      nombre: 'Especialista 1',
      email: 'franuleg@gmail.com',
      password: 'Franchu10',
      imagen: 'assets/users/e1.png',
    },
    {
      nombre: 'Especialista 2',
      email: 'bu49trhxuj@cmhvzylmfc.com',
      password: 'especialista',
      imagen: 'assets/users/e2.png',
    },
    {
      nombre: 'Administrador',
      email: '22o2in8faz@daouse.com',
      password: 'administrador',
      imagen: 'assets/users/admin.png',
    },
  ];

  admin() {
    this.email = '@gmail.com';
    this.password = 'Franchu10';
  }

  toggleFavs() {
    this.showFavs = !this.showFavs;
  }
  loginRapido(usuario: { email: string; password: string }) {
    this.email = usuario.email;
    this.password = usuario.password;
    this.login();
  }
}
