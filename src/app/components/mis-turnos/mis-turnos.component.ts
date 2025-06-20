import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  FormGroup,
  FormsModule,
} from '@angular/forms';
import { UsuariosService } from '../../services/usuarios.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { Usuario } from '../../class/usuario';
import { Paciente } from '../../class/paciente';
import { Especialista } from '../../class/especialista';
import { Modal } from 'bootstrap';

interface Turno {
  id: string;
  fecha_turno: string;
  hora_turno: string;
  estado: string;
  especialidad: string;
  especialista: { id: string; nombre: string; apellido: string };
  paciente: { id: string; nombre: string; apellido: string; email: string };
  resena?: string;
  comentario?: string;
}

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.scss',
})
export class MisTurnosComponent implements OnInit {
  usuario!: Usuario;
  rol: 'paciente' | 'especialista' = 'paciente';
  turnos: any[] = [];
  turnosFiltrados: any[] = [];
  filtroForm: FormGroup;
  cargando = false;

  modalTurno!: any;
  modalAccion: 'cancelar' | 'rechazar' | 'finalizar' = 'cancelar';
  modalTitulo = '';
  modalLabel = '';
  modalComentario = '';
  modalDiagnostico = '';
  modalMostrarDiagnostico = false;
  constructor(
    private toastr: ToastrService,
    private authSv: AuthService,
    private usuariosSv: UsuariosService,
    private fb: FormBuilder
  ) {
    this.filtroForm = this.fb.group({
      especialidad: [''],
      filtroTexto: [''], // especialista o paciente según el rol
    });
  }

  async ngOnInit() {
    this.cargando = true;
    this.authSv.usuario$.subscribe(async (usuario) => {
      if (!usuario) return;

      this.usuario = usuario;
      this.rol = usuario.rol as 'paciente' | 'especialista';

      await this.cargarTurnos();

      this.filtroForm.valueChanges.subscribe(() => this.aplicarFiltros());
    });
    this.cargando = false;
  }

  async cargarTurnos() {
    this.cargando = true;
    try {
      const todos = await this.usuariosSv.obtenerTodosLosTurnos();

      // Convertimos paciente y especialista de arrays a objetos (o null si no hay)
      const turnosConvertidos = todos.map((t: any) => ({
        ...t,
        paciente: Array.isArray(t.paciente)
          ? t.paciente[0] ?? null
          : t.paciente,
        especialista: Array.isArray(t.especialista)
          ? t.especialista[0] ?? null
          : t.especialista,
      }));

      // Ahora filtramos según el rol y usuario actual
      this.turnos = turnosConvertidos.filter((t) => {
        if (this.rol === 'paciente') {
          //console.log(t.paciente?.[0]?.id === this.usuario.id);
          //console.log('user', this.usuario.id);
          //console.log('paciente', t.paciente?.id);
          return t.paciente?.id === this.usuario.id;
        } else if (this.rol === 'especialista') {
          return t.especialista?.id === this.usuario.id;
        }
        return false;
      });

      this.aplicarFiltros();
    } catch (error) {
      this.toastr.error('Error al cargar turnos');
      console.error(error);
    } finally {
      this.cargando = false;
    }
  }

  aplicarFiltros() {
    const especialidad = this.filtroForm.value.especialidad.toLowerCase();
    const texto = this.filtroForm.value.filtroTexto.toLowerCase();

    this.turnosFiltrados = this.turnos.filter((t) => {
      const espMatch = t.especialidad.toLowerCase().includes(especialidad);
      const textoMatch =
        this.rol === 'paciente'
          ? `${t.especialista.nombre} ${t.especialista.apellido}`
              .toLowerCase()
              .includes(texto)
          : `${t.paciente.nombre} ${t.paciente.apellido}`
              .toLowerCase()
              .includes(texto);

      return espMatch && textoMatch;
    });
  }

  puedeCancelar(turno: any): boolean {
    const estado = turno.estado.toLowerCase();
    return this.rol === 'paciente'
      ? estado !== 'realizado'
      : !['realizado', 'finalizado', 'cancelado', 'pendiente'].includes(estado);
  }

  puedeRechazar(turno: any): boolean {
    const estado = turno.estado.toLowerCase();
    return (
      this.rol === 'especialista' &&
      !['aceptado', 'finalizado', 'cancelado'].includes(estado)
    );
  }

  puedeAceptar(turno: any): boolean {
    const estado = turno.estado.toLowerCase();
    return (
      this.rol === 'especialista' &&
      !['finalizado', 'cancelado', 'rechazado', 'aceptado'].includes(estado)
    );
  }

  puedeFinalizar(turno: any): boolean {
    return (
      this.rol === 'especialista' && turno.estado.toLowerCase() === 'aceptado'
    );
  }

  puedeVerResena(turno: any): boolean {
    //console.log(turno);
    return !!turno.reseña;
  }

  verCancelacion(turno: any): boolean {
    return turno.estado.toLowerCase() === 'cancelado';
  }

  puedeCompletarEncuesta(turno: any): boolean {
    return (
      this.rol === 'paciente' && turno.estado === 'realizado' && turno.resena
    );
  }

  puedeCalificar(turno: any): boolean {
    return this.rol === 'paciente' && turno.estado === 'realizado';
  }

  async cancelarTurno(turno: any) {
    const motivo = prompt('Ingrese el motivo de la cancelación:');
    if (!motivo?.trim()) {
      this.toastr.warning('Debe ingresar un comentario.');
      return;
    }
    try {
      await this.usuariosSv.cancelarTurno(turno.id, motivo.trim());
      this.toastr.success('Turno cancelado.');
      await this.cargarTurnos();
    } catch (err) {
      this.toastr.error('Error al cancelar el turno.');
    }
  }
  async rechazarTurno(turno: any) {
    const motivo = prompt('Ingrese el motivo para rechazar el turno:');
    if (!motivo?.trim()) {
      this.toastr.warning('Debe ingresar un comentario para rechazar.');
      return;
    }
    try {
      await this.usuariosSv.cancelarTurno(turno.id, motivo.trim());
      this.toastr.success('Turno rechazado con éxito.');
      await this.cargarTurnos();
    } catch (err) {
      this.toastr.error('Error al rechazar el turno.');
      console.error(err);
    }
  }

  async verMotivoCancelacion(turno: any) {
    try {
      const mensaje = await this.usuariosSv.verMotivoCancelacionTurno(turno.id);
      //console.log(mensaje);
      this.toastr.info(mensaje, 'Motivo');
    } catch (err) {
      this.toastr.error('Error al visualizar la cancelacion del turno .');
    }
  }

  async finalizarTurno(turno: any) {
    const diagnostico = prompt('Ingrese el diagnostico del turno:');
    const reseña = prompt('Ingrese reseña del turno:');
    if (!reseña?.trim()) {
      this.toastr.warning('Debe ingresar una reseña .');
      return;
    }
    if (!diagnostico?.trim()) {
      this.toastr.warning('Debe ingresar un diagnostico .');
      return;
    }
    try {
      await this.usuariosSv.finalizarTurno(
        turno.id,
        reseña.trim(),
        diagnostico.trim()
      );
      this.toastr.success('Turno finalizado rechazado con éxito.');
      await this.cargarTurnos();
    } catch (err) {
      this.toastr.error('Error al finalizar el turno.');
      console.error(err);
    }
  }

  async aceptarTurno(turno: any) {
    try {
      await this.usuariosSv.aceptarTurno(turno.id);
      this.toastr.success('Turno aceptado con éxito.');
      await this.cargarTurnos();
    } catch (err) {
      this.toastr.error('Error al aceptar el turno.');
      console.error(err);
    }
  }

  async verResena(turno: any) {
    try {
      const mensaje = await this.usuariosSv.verResena(turno.id);
      if (mensaje) {
        this.toastr.info(mensaje, 'Reseña');
      }
    } catch (err) {
      this.toastr.error('Error al cancelar el turno.');
    }
  }

  abrirModal(turno: any, accion: 'cancelar' | 'rechazar' | 'finalizar') {
    this.modalTurno = turno;
    this.modalAccion = accion;
    this.modalComentario = '';
    this.modalDiagnostico = '';
    this.modalMostrarDiagnostico = accion === 'finalizar';

    switch (accion) {
      case 'cancelar':
        this.modalTitulo = 'Cancelar turno';
        this.modalLabel = 'Motivo de cancelación';
        break;
      case 'rechazar':
        this.modalTitulo = 'Rechazar turno';
        this.modalLabel = 'Motivo del rechazo';
        break;
      case 'finalizar':
        this.modalTitulo = 'Finalizar turno';
        this.modalLabel = 'Reseña de la atención';
        break;
    }

    const modal = new Modal(document.getElementById('modalAccion')!);
    modal.show();
  }

  async confirmarModal() {
    if (
      !this.modalComentario.trim() ||
      (this.modalMostrarDiagnostico && !this.modalDiagnostico.trim())
    ) {
      this.toastr.warning('Debe completar todos los campos requeridos.');
      return;
    }

    try {
      if (this.modalAccion === 'cancelar') {
        await this.usuariosSv.cancelarTurno(
          this.modalTurno.id,
          this.modalComentario
        );
        this.toastr.success('Turno cancelado.');
      } else if (this.modalAccion === 'rechazar') {
        await this.usuariosSv.cancelarTurno(
          this.modalTurno.id,
          this.modalComentario
        );
        this.toastr.success('Turno rechazado.');
      } else if (this.modalAccion === 'finalizar') {
        await this.usuariosSv.finalizarTurno(
          this.modalTurno.id,
          this.modalComentario,
          this.modalDiagnostico
        );
        this.toastr.success('Turno finalizado.');
      }

      Modal.getInstance(document.getElementById('modalAccion')!)?.hide();
      await this.cargarTurnos();
    } catch (err) {
      this.toastr.error('Error al procesar la acción.');
      console.error(err);
    }
  }

  async verDiagnostico(turno: any) {
    try {
      const mensaje = await this.usuariosSv.verDiagnostico(turno.id);
      if (mensaje) {
        this.toastr.warning(mensaje, 'Diagnostico');
      }
    } catch (err) {
      this.toastr.error('Error al cancelar el turno.');
    }
  }
}
