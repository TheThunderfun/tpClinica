import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';
import { Usuario } from '../../class/usuario';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.scss',
})
export class PacientesComponent implements OnInit {
  usuarioActual: Usuario | null = null;
  historiasClinicas: any[] = [];
  historiaSeleccionada: any = null;


  constructor(
    private authService: AuthService,
    private usuariosService: UsuariosService
  ) {}
  ngOnInit(): void {
    this.authService.usuario$.subscribe(async (usuario) => {
      if (!usuario) return;

      if (usuario?.rol === 'especialista') {
        const usuarioCompleto = await this.usuariosService.obtenerUsuario(
          usuario.email
        );
        this.usuarioActual = usuarioCompleto;
        await this.obtenerHistoriasClinicas();
      } else {
        this.usuarioActual = usuario;
      }
    });
  }

  async obtenerHistoriasClinicas() {
    const id = this.usuarioActual?.id;
    if (!id) return;

    this.historiasClinicas =
      await this.usuariosService.obtenerHistoriasClinicasPorEspecialista(id);
  }
  verDetalles(historia: any) {
    this.historiaSeleccionada = historia;
  }
  cerrarDetalles() {
    this.historiaSeleccionada = null;
  }
}
