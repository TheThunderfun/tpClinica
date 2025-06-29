import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';
import { Usuario } from '../../class/usuario';
import { Paciente } from '../../class/paciente';
import { Especialista } from '../../class/especialista';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { ToastrService } from 'ngx-toastr';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Admin } from '../../class/admin';
dayjs.extend(isSameOrBefore);
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface HorarioPorDia {
  dia: string; // 'Lunes', 'Martes', etc.
  especialidad: string;
  horaInicio: string; // formato HH:mm
  horaFinal: string; // formato HH:mm
}

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-perfil.component.html',
  styleUrl: './mi-perfil.component.scss',
})
export class MiPerfilComponent {
  usuarioActual: Usuario | null = null;
  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  especialistas: any[] = [];
  especialistaSeleccionadoId: string | null = null;

  horarios: {
    [dia: string]: {
      [especialidad: string]: { horaInicio: string; horaFinal: string };
    };
  } = {};

  diasSeleccionados: Set<string> = new Set();
  horarioLaboral = { horaInicio: '', horaFinal: '' };
  errorValidacion: string = '';
  historiasClinicas: any[] = [];
  historiaSeleccionada: any = null;
  turnosPaciente: any[] = [];
  constructor(
    private authService: AuthService,
    private usuariosService: UsuariosService,
    private toastr: ToastrService
  ) {}
  async ngOnInit() {
    this.authService.usuario$.subscribe(async (usuario) => {
      if (!usuario) return;

      if (usuario?.rol === 'especialista') {
        const usuarioCompleto = await this.usuariosService.obtenerUsuario(
          usuario.email
        );
        this.usuarioActual = usuarioCompleto;
      } else {
        this.usuarioActual = usuario;
      }

      if (
        this.usuarioActual &&
        this.isPaciente(this.usuarioActual) &&
        this.usuarioActual.id
      ) {
        this.historiasClinicas =
          await this.usuariosService.mostrarHistoriaClinicaPaciente(
            this.usuarioActual.id
          );
      }

      if (this.isEspecialista(this.usuarioActual)) {
        this.inicializarHorarios();
      }
      if (this.isPaciente(this.usuarioActual)) {
        if (!this.usuarioActual.id) return;
        this.especialistas = await this.usuariosService.obtenerEspecialistas();
        this.turnosPaciente =
          await this.usuariosService.obtenerTurnosPorPaciente(
            this.usuarioActual.id
          );
      }
    });
  }

  toggleDia(dia: string) {
    if (this.diasSeleccionados.has(dia)) {
      this.diasSeleccionados.delete(dia);
      delete this.horarios[dia];
    } else {
      this.diasSeleccionados.add(dia);
      if (!this.horarios[dia]) {
        this.horarios[dia] = {};
        this.especialista?.especialidad.forEach((esp) => {
          this.horarios[dia][esp] = { horaInicio: '', horaFinal: '' };
        });
      }
    }
  }

  getDiasSeleccionados(): string[] {
    return Array.from(this.diasSeleccionados);
  }

  inicializarHorarios() {
    if (!this.usuarioActual || !this.isEspecialista(this.usuarioActual)) return;

    const especialista = this.usuarioActual;

    if (Array.isArray(especialista.jornada)) {
      // Ya está bien
    } else if (typeof especialista.jornada === 'string') {
      try {
        especialista.jornada = JSON.parse(especialista.jornada);
      } catch (error) {
        console.error('Error parsing jornada JSON:', error);
        especialista.jornada = [];
      }
    } else {
      especialista.jornada = [];
    }

    this.horarios = {};

    this.diasSemana.forEach((dia) => {
      this.horarios[dia] = {};
      especialista.especialidad.forEach((esp: string) => {
        this.horarios[dia][esp] = { horaInicio: '', horaFinal: '' };
      });
    });

    if (especialista.jornada && especialista.jornada.length > 0) {
      especialista.jornada.forEach((j) => {
        const dia = j.dia;
        const esp = j.especialidad;

        this.diasSeleccionados.add(dia);

        if (!this.horarios[dia]) this.horarios[dia] = {};
        if (!this.horarios[dia][esp])
          this.horarios[dia][esp] = { horaInicio: '', horaFinal: '' };

        this.horarios[dia][esp].horaInicio = j.horaInicio;
        this.horarios[dia][esp].horaFinal = j.horaFinal;
      });
    }
  }

  async guardarHorarios() {
    if (!this.especialista) {
      this.toastr.error('Usuario no autorizado o no válido');
      return;
    }

    if (this.diasSeleccionados.size === 0) {
      this.toastr.error('Por favor seleccioná al menos un día.');
      return;
    }

    this.validarHorarios();
    if (this.errorValidacion) return;

    const resultado: HorarioPorDia[] = [];

    for (const dia of this.getDiasSeleccionados()) {
      for (const esp of this.especialista.especialidad) {
        const horario = this.horarios[dia]?.[esp];
        if (horario && horario.horaInicio && horario.horaFinal) {
          resultado.push({
            dia,
            especialidad: esp,
            horaInicio: horario.horaInicio,
            horaFinal: horario.horaFinal,
          });
        }
      }
    }

    const disponibilidad: {
      especialista_id: string;
      dia_semana: string;
      horario_inicio: string;
      especialidad: string;
    }[] = [];

    for (const dia of this.getDiasSeleccionados()) {
      for (const esp of this.especialista.especialidad) {
        const horario = this.horarios[dia]?.[esp];
        if (horario && horario.horaInicio && horario.horaFinal) {
          const bloques = this.generarBloquesDe30Minutos(
            horario.horaInicio,
            horario.horaFinal
          );

          for (const hora of bloques) {
            disponibilidad.push({
              especialista_id: this.especialista.id!, // asegurate que tenga ID
              dia_semana: dia,
              horario_inicio: hora,
              especialidad: esp,
            });
          }
        }
      }
    }
    await this.usuariosService.actualizarDisponibilidad(
      this.especialista.id!,
      disponibilidad
    );

    await this.usuariosService.actualizarJornada(
      this.especialista.email,
      resultado
    );

    this.toastr.success('Horarios guardados correctamente.');
  }

  isPaciente(usuario: Usuario | null): usuario is Paciente {
    return !!usuario && usuario.rol === 'paciente';
  }

  isEspecialista(usuario: Usuario | null): usuario is Especialista {
    return !!usuario && usuario.rol === 'especialista';
  }
  isAdministrador(usuario: Usuario | null): usuario is Admin {
    return !!usuario && usuario.rol === 'administrador';
  }

  get especialista(): Especialista | null {
    if (this.isEspecialista(this.usuarioActual)) {
      return this.usuarioActual;
    }
    return null;
  }

  validarHorarios() {
    this.errorValidacion = '';

    const horariosAsignados: {
      dia: string;
      inicio: string;
      fin: string;
      esp: string;
    }[] = [];

    for (const dia of this.getDiasSeleccionados()) {
      for (const esp of this.especialista?.especialidad || []) {
        const horario = this.horarios[dia]?.[esp];
        if (horario && horario.horaInicio && horario.horaFinal) {
          // Validar que horaInicio < horaFinal
          if (horario.horaInicio >= horario.horaFinal) {
            this.errorValidacion = `En ${dia} para ${esp}, la hora de inicio debe ser menor a la hora final.`;
            return;
          }

          // Validar que no se solapen con otros horarios ya registrados
          for (const h of horariosAsignados) {
            if (h.dia === dia) {
              if (
                horario.horaInicio < h.fin &&
                horario.horaFinal > h.inicio // si se cruzan
              ) {
                this.errorValidacion = `El horario para ${esp} en ${dia} se solapa con ${h.esp}.`;
                return;
              }
            }
          }

          horariosAsignados.push({
            dia,
            inicio: horario.horaInicio,
            fin: horario.horaFinal,
            esp,
          });
        }
      }
    }
  }

  private generarBloquesDe30Minutos(inicio: string, fin: string): string[] {
    const bloques: string[] = [];
    let actual = dayjs(`2024-01-01T${inicio}`);
    const final = dayjs(`2024-01-01T${fin}`);

    while (actual.add(30, 'minute').isSameOrBefore(final)) {
      bloques.push(actual.format('HH:mm'));
      actual = actual.add(30, 'minute');
    }

    return bloques;
  }

  verDetalles(historia: any) {
    this.historiaSeleccionada = historia;
  }
  cerrarDetalles() {
    this.historiaSeleccionada = null;
  }

  async descargarHistoriaClinicaPDF() {
    if (!this.usuarioActual || !this.isPaciente(this.usuarioActual)) return;

    const logoBase64 = await this.convertirImagenABase64(
      'assets/images/favicon.ico'
    );
    const doc = new jsPDF();

    doc.addImage(logoBase64, 'PNG', 10, 10, 30, 30);
    doc.setFontSize(18);
    doc.text('Informe de Historia Clínica', 50, 20);
    doc.setFontSize(12);
    doc.text(
      `Paciente: ${this.usuarioActual.nombre} ${this.usuarioActual.apellido}`,
      50,
      30
    );
    doc.text(`Fecha de emisión: ${dayjs().format('DD/MM/YYYY')}`, 50, 37);

    const body = this.historiasClinicas.map((h) => [
      dayjs(h.fecha).format('DD/MM/YYYY'),
      `${h.altura} cm`,
      `${h.peso} kg`,
      `${h.temperatura} °C`,
      h.presion,
      `${h.especialista?.nombre ?? ''} ${h.especialista?.apellido ?? ''}`,
    ]);

    autoTable(doc, {
      startY: 50,
      head: [
        ['Fecha', 'Altura', 'Peso', 'Temperatura', 'Presión', 'Especialista'],
      ],
      body,
    });

    doc.save(`historia_clinica_${this.usuarioActual.apellido}.pdf`);
  }
  async descargarAtencionesPorEspecialista() {
    if (!this.usuarioActual || !this.especialistaSeleccionadoId) return;

    const filtradas = this.turnosPaciente.filter(
      (h) => h.especialista?.id === this.especialistaSeleccionadoId
    );

    if (filtradas.length === 0) {
      this.toastr.info('No hay atenciones para este profesional.');
      return;
    }

    const logoBase64 = await this.convertirImagenABase64(
      'assets/images/favicon.ico'
    );

    const doc = new jsPDF();

    // 🖼️ Logo
    doc.addImage(logoBase64, 'PNG', 10, 10, 20, 20);

    // 🧾 Título
    doc.setFontSize(16);
    doc.text('Informe de Historia Clínica', 105, 15, { align: 'center' });

    // 👤 Datos del paciente
    doc.setFontSize(11);
    doc.text(
      `Paciente: ${this.usuarioActual.nombre} ${this.usuarioActual.apellido}`,
      105,
      22,
      { align: 'center' }
    );
    doc.text(`Fecha de emisión: ${dayjs().format('DD/MM/YYYY')}`, 105, 28, {
      align: 'center',
    });

    // 📋 Subtítulo de sección
    doc.setFontSize(12);
    doc.text('Atenciones según Profesional', 14, 40);

    // 📊 Tabla
    const body = filtradas.map((h) => [
      dayjs(h.fecha_turno).format('DD/MM/YYYY'),
      h.estado,
      h.diagnostico || '-',
      h.calificacion?.toString() ?? '-',
    ]);

    autoTable(doc, {
      startY: 45, // más abajo para no tapar nada
      head: [['Fecha', 'Estado', 'Diagnóstico', 'Calificación']],
      body,
    });

    doc.save('atenciones_por_profesional.pdf');
  }

  convertirImagenABase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  }
}
