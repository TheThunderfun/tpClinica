import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NavBarComponent } from "../nav-bar/nav-bar.component";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NavBarComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  constructor(private authSv: AuthService, private router: Router) {}

  email: string = '';
  password: string = '';

  goToRegistro() {
    this.router.navigate(['/registro']);
  }

  async login() {
    await this.authSv.signIn(this.email, this.password);
  }

  paciente() {
    this.email = 'fhulej27@gmail.com';
    this.password = 'Franchu10';
  }

  especialista() {
    this.email = 'franuleg@gmail.com';
    this.password = 'Franchu10';
  }

  admin() {
    this.email = '@gmail.com';
    this.password = 'Franchu10';
  }
}
