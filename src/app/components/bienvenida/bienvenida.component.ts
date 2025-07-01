import { Component } from '@angular/core';
import { FooterComponent } from '../footer/footer.component';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [FooterComponent, NavBarComponent],
  templateUrl: './bienvenida.component.html',
  styleUrl: './bienvenida.component.scss',
})
export class BienvenidaComponent  {
  constructor(private authService: AuthService, private router: Router) {}

  irASolicitarTurno() {
    const usuario = this.authService.getUsuario();
    if (usuario) {
      this.router.navigate(['/turnos/solicitarTurno']);
    } else {
      this.router.navigate(['/login'], {
        queryParams: { redirectTo: '/turnos/solicitarTurno' },
      });
    }
  }
}
