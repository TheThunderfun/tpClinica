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
import { ResaltarEstadoDirective } from '../../directives/resaltar-estado.directive';
import { AutoFocusDirective } from '../../directives/auto-focus.directive';

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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ResaltarEstadoDirective,
    AutoFocusDirective,
  ],
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

  modalHistoriaClinica = '';
  modalTurno!: any;
  modalAccion: 'cancelar' | 'rechazar' | 'finalizar' = 'cancelar';
  modalTitulo = '';
  modalLabel = '';
  modalComentario = '';
  modalDiagnostico = '';
  modalMostrarDiagnostico = false;
  encuestaForm!: FormGroup;
  historiaClinica = {
    altura: '',
    peso: '',
    temperatura: '',
    presion: '',
    dinamicos: [
      { clave: '', valor: '' },
      { clave: '', valor: '' },
      { clave: '', valor: '' },
    ],
  };

  mostrarEncuesta = false;
  constructor(
    private toastr: ToastrService,
    private authSv: AuthService,
    private usuariosSv: UsuariosService,
    private fb: FormBuilder
  ) {
    this.filtroForm = this.fb.group({
      filtroGeneral: [''],
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
    this.encuestaForm = this.fb.group({
      pregunta1: [''],
      pregunta2: [''],
      pregunta3: [''],
    });
  }

  async cargarTurnos() {
    this.cargando = true;
    try {
      const todos = await this.usuariosSv.obtenerTodosLosTurnos();

      const turnosConvertidos = todos.map((t: any) => ({
        ...t,
        paciente: Array.isArray(t.paciente)
          ? t.paciente[0] ?? null
          : t.paciente,
        especialista: Array.isArray(t.especialista)
          ? t.especialista[0] ?? null
          : t.especialista,
        historiaClinica: null, // Por ahora null, la vamos a llenar abajo
      }));

      // Traer historia clínica por turno
      for (const turno of turnosConvertidos) {
        const hc = await this.usuariosSv.obtenerHistoriaClinicaPorTurno(
          turno.id
        );
        turno.historiaClinica = hc ?? null;
        console.log(turno.historiaClinica);
      }

      this.turnos = turnosConvertidos.filter((t) => {
        if (this.rol === 'paciente') {
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
    const filtro = this.filtroForm.value.filtroGeneral.toLowerCase();

    this.turnosFiltrados = this.turnos.filter((t) => {
      if (!filtro) return true;

      // Datos básicos del turno
      const especialidad = t.especialidad?.toLowerCase() ?? '';
      const especialistaNombre = `${t.especialista?.nombre ?? ''} ${
        t.especialista?.apellido ?? ''
      }`.toLowerCase();
      const pacienteNombre = `${t.paciente?.nombre ?? ''} ${
        t.paciente?.apellido ?? ''
      }`.toLowerCase();
      const fecha = this.formatDateISOToDDMMYYYY(t.fecha_turno).toLowerCase();
      console.log('la fecha es', fecha);
      const hora = t.hora_turno?.toLowerCase() ?? '';
      const estado = t.estado?.toLowerCase() ?? '';

      // Datos historia clínica
      let hcTexto = '';
      if (t.historiaClinica) {
        const hc = t.historiaClinica;
        hcTexto += (hc.altura ?? '') + ' ';
        hcTexto += (hc.peso ?? '') + ' ';
        hcTexto += (hc.temperatura ?? '') + ' ';
        hcTexto += (hc.presion ?? '') + ' ';
        if (hc.dinamicos && Array.isArray(hc.dinamicos)) {
          for (const d of hc.dinamicos) {
            hcTexto += (d.clave ?? '') + ' ' + (d.valor ?? '') + ' ';
          }
        }
        hcTexto = hcTexto.toLowerCase();
      }

      // Buscar filtro en cualquiera de los campos
      return (
        especialidad.includes(filtro) ||
        especialistaNombre.includes(filtro) ||
        pacienteNombre.includes(filtro) ||
        fecha.includes(filtro) ||
        hora.includes(filtro) ||
        estado.includes(filtro) ||
        hcTexto.includes(filtro)
      );
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
    return !!turno.reseña;
  }

  verCancelacion(turno: any): boolean {
    return turno.estado?.trim().toLowerCase() === 'cancelado';
  }

  puedeCompletarEncuesta(turno: any): boolean {
    return (
      this.rol === 'paciente' &&
      turno.estado === 'finalizado' &&
      turno.reseña &&
      turno.encuesta
    );
  }

  puedeCalificar(turno: any): boolean {
    return (
      this.rol === 'paciente' &&
      turno.estado === 'finalizado' &&
      turno.calificacion
    );
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

  puedeCargarHistoriaClinica(turno: any) {
    return (
      turno.estado?.trim().toLowerCase() === 'finalizado' &&
      this.rol === 'especialista'
    );
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
    this.modalHistoriaClinica = '';
    this.modalMostrarDiagnostico = accion === 'finalizar';
    if (accion === 'finalizar') {
      this.historiaClinica = {
        altura: '',
        peso: '',
        temperatura: '',
        presion: '',
        dinamicos: [
          { clave: '', valor: '' },
          { clave: '', valor: '' },
          { clave: '', valor: '' },
        ],
      };
    }

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
        const hc = this.historiaClinica;

        if (!hc.altura || !hc.peso || !hc.temperatura || !hc.presion) {
          this.toastr.warning(
            'Debe completar todos los datos fijos de la historia clínica.'
          );
          return;
        }

        const dinamicosValidos = hc.dinamicos.filter(
          (d) => d.clave.trim() && d.valor.trim()
        );

        // Armar objeto historia clínica
        const historiaClinicaCompleta = {
          altura: hc.altura,
          peso: hc.peso,
          temperatura: hc.temperatura,
          presion: hc.presion,
          dinamicos: dinamicosValidos,
        };

        await this.usuariosSv.finalizarTurno(
          this.modalTurno.id,
          this.modalComentario,
          this.modalDiagnostico
        );
        const usuarioId = this.usuario?.id;
        if (!usuarioId) {
          this.toastr.error('Usuario no definido');
          return;
        }
        await this.usuariosSv.cargarHistoriaClinica(
          this.modalTurno.id,
          historiaClinicaCompleta,
          this.modalTurno.paciente.id,
          usuarioId
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

  modalEncuestaTurno!: any;
  preguntasEncuesta = [
    '¿Cómo calificarías la atención?',
    '¿Te sentiste cómodo/a durante la consulta?',
    '¿Recomendarías a este especialista?',
  ];
  respuestasEncuesta: string[] = [];

  abrirEncuesta(turno: any) {
    this.modalEncuestaTurno = turno;
    this.respuestasEncuesta = this.preguntasEncuesta.map(() => '');
    const modal = new Modal(document.getElementById('modalEncuesta')!);
    modal.show();
  }
  abrirModalEncuesta(turno: any) {
    this.modalEncuestaTurno = turno; // <- acá se guarda el turno actual
    this.respuestasEncuesta = this.preguntasEncuesta.map(() => '');
    const modal = new Modal(document.getElementById('modalEncuesta')!);
    modal.show();
  }

  async enviarEncuesta() {
    if (this.respuestasEncuesta.some((r) => !r.trim())) {
      this.toastr.warning('Completá todas las respuestas.');
      return;
    }

    try {
      await this.usuariosSv.enviarEncuesta(
        this.modalEncuestaTurno.id,
        this.respuestasEncuesta
      );
      this.toastr.success('Encuesta enviada. ¡Gracias por tu opinión!');
      Modal.getInstance(document.getElementById('modalEncuesta')!)?.hide();
      await this.cargarTurnos();
    } catch (err) {
      this.toastr.error('Error al enviar la encuesta.');
    }
  }

  modalCalificarTurno!: any;
  calificacion: number = 0;

  abrirModalCalificacion(turno: any) {
    this.modalCalificarTurno = turno;
    this.calificacion = 0;
    const modal = new Modal(document.getElementById('modalCalificar')!);
    modal.show();
  }

  async enviarCalificacion() {
    if (this.calificacion < 1 || this.calificacion > 5) {
      this.toastr.warning('Seleccioná una calificación entre 1 y 5.');
      return;
    }

    try {
      await this.usuariosSv.enviarCalificacion(
        this.modalCalificarTurno.id,
        this.calificacion
      );
      this.toastr.success('¡Gracias por calificar!');
      Modal.getInstance(document.getElementById('modalCalificar')!)?.hide();
      await this.cargarTurnos();
    } catch (err) {
      this.toastr.error('Error al enviar la calificación.');
      console.error(err);
    }
  }
  formatDateISOToDDMMYYYY(fechaISO: string): string {
    if (!fechaISO) return '';

    // Tomar solo la parte YYYY-MM-DD
    const fechaSolo = fechaISO.substring(0, 10); // "2025-06-28"

    const [year, month, day] = fechaSolo.split('-');

    return `${day}/${month}/${year}`;
  }
}
