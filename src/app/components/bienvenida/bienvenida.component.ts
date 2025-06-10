import { Component } from '@angular/core';
import { RegistroComponent } from '../registro/registro.component';
import { LoginComponent } from '../login/login.component';
import { FooterComponent } from '../footer/footer.component';
import { NavBarComponent } from "../nav-bar/nav-bar.component";

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [FooterComponent, NavBarComponent],
  templateUrl: './bienvenida.component.html',
  styleUrl: './bienvenida.component.scss',
})
export class BienvenidaComponent {}
