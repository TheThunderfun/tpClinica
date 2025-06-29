import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';
import { Usuario } from '../../class/usuario';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

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
  pacientes: any[] = [];
  pacienteSeleccionado: any = null;
  turnosDelPaciente: any[] = [];

  constructor(
    private authService: AuthService,
    private usuariosService: UsuariosService,
    private toastr: ToastrService // Asumiendo que tienes un servicio de toast para notificaciones
  ) {}
  ngOnInit(): void {
    this.authService.usuario$.subscribe(async (usuario) => {
      if (!usuario || !usuario.email) return;

      if (usuario.rol === 'especialista') {
        const usuarioCompleto = await this.usuariosService.obtenerUsuario(
          usuario.email
        );
        if (!usuarioCompleto) return;

        this.usuarioActual = usuarioCompleto;
        if (this.usuarioActual.id) {
          this.pacientes =
            await this.usuariosService.obtenerPacientesAtendidosPorEspecialista(
              this.usuarioActual.id
            );
        }
        await this.obtenerHistoriasClinicas();
      } else {
        this.usuarioActual = usuario;
      }
    });
  }
  async seleccionarPaciente(paciente: any) {
    if (!this.usuarioActual?.id) {
      return;
    }

    this.pacienteSeleccionado = paciente;
    this.historiaSeleccionada = null;

    this.turnosDelPaciente =
      await this.usuariosService.obtenerTurnosDePacienteConEspecialista(
        paciente.id,
        this.usuarioActual.id
      );
    console.log('Turnos del paciente:', this.turnosDelPaciente);

    this.historiasClinicas =
      await this.usuariosService.obtenerHistoriasClinicasDePacienteConEspecialista(
        paciente.id,
        this.usuarioActual.id
      );
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

  verResena(resena: any) {
    this.toastr.info(resena); 
  }
}
