import { Component, OnInit } from '@angular/core';
import { NavbarService } from '../../services/navbar.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { Usuario } from '../../class/usuario';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
})
export class NavBarComponent {
  usuario$: Observable<Usuario | null>;
  constructor(
    public navBarService: NavbarService,
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.usuario$ = this.auth.usuario$;
  }

  async logout() {
    try {
      await this.auth.signOut();
      this.toastr.success('Sesión cerrada correctamente');
      this.router.navigate(['/login']); // O cambiar a '/' si preferís
    } catch (err) {
      this.toastr.error('Error al cerrar sesión');
      console.error(err);
    }
  }

  irLogin() {
    this.router.navigate(['login']);
  }
}
