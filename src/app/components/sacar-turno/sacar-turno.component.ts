import { Component, OnInit } from '@angular/core';
import { Especialista } from '../../class/especialista';
import { Paciente } from '../../class/paciente';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormBuilder,
} from '@angular/forms';
import dayjs from 'dayjs';
import { UsuariosService } from '../../services/usuarios.service';
import { ToastrService } from 'ngx-toastr';
import { EspecialidadesService } from '../../services/especialidades.service';
import { AuthService } from '../../services/auth.service';
import 'dayjs/locale/es';
import { Admin } from '../../class/admin';
import { Usuario } from '../../class/usuario';
dayjs.locale('es');

@Component({
  selector: 'app-sacar-turno',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './sacar-turno.component.html',
  styleUrl: './sacar-turno.component.scss',
})
export class SacarTurnoComponent implements OnInit {
  formulario: FormGroup;
  especialidades: any[] = [];
  especialistas: any[] = [];
  diasDisponibles: { fecha: string; label: string }[] = [];
  horariosDisponibles: string[] = [];
  usuarioActual: any;
  esAdmin: boolean = false;
  pacientes: any[] = [];
  profesionales: any[] = [];
  especialidadesDelEspecialista: any[] = [];

  constructor(
    private fb: FormBuilder,
    private usuariosSv: UsuariosService,
    private toastr: ToastrService,
    private especialidadesSv: EspecialidadesService,
    private authService: AuthService
  ) {
    this.formulario = this.fb.group({
      //profesional: ['', Validators.required],
      especialidad: ['', Validators.required],
      especialista: ['', Validators.required],
      dia: ['', Validators.required],
      horario: ['', Validators.required],
      paciente: [''],
    });
  }

  ngOnInit(): void {
    this.cargarEspecialistas();
    this.cargarEspecialidades();

    this.formulario.get('especialidad')?.valueChanges.subscribe((esp) => {
      if (!esp || typeof esp !== 'string') {
        this.especialistas = [];
        this.diasDisponibles = [];
        this.horariosDisponibles = [];
        return;
      }

      // Validar si el especialista seleccionado tiene esta especialidad
      const especialistaActual = this.formulario.get('especialista')?.value;
      const especialistaValido = this.profesionales.some(
        (e) => e.id === especialistaActual && e.especialidad?.includes(esp)
      );

      this.diasDisponibles = [];
      this.horariosDisponibles = [];
    });

    this.formulario.get('dia')?.valueChanges.subscribe((fecha) => {
      if (!fecha || fecha.trim() === '') return;
      this.cargarHorariosDisponibles(fecha);
      this.formulario.patchValue({ horario: '' });
    });

    this.authService.usuario$.subscribe(async (usuario) => {
      if (!usuario?.email) return;

      const usuarioCompleto = await this.usuariosSv.obtenerUsuario(
        usuario.email
      );
      this.usuarioActual = usuarioCompleto;
      this.esAdmin = this.usuarioActual.rol === 'administrador';

      console.log('Usuario actual:', this.usuarioActual);

      if (this.esAdmin) {
        const pacientes = await this.usuariosSv.obtenerPacientes();
        this.pacientes = pacientes;


        this.formulario.get('paciente')?.setValidators(Validators.required);
        this.formulario.get('paciente')?.updateValueAndValidity();
      } else {

        this.formulario.get('paciente')?.clearValidators();
        this.formulario.get('paciente')?.updateValueAndValidity();
      }
    });
  }

  isAdministrador(usuario: Usuario | null): usuario is Admin {
    return !!usuario && usuario.rol === 'administrador';
  }

  async cargarEspecialidades() {
    try {
      this.especialidades = await this.especialidadesSv.obtenerEspecialidades();
    } catch (error) {
      this.toastr.error('Error al cargar especialidades');
    }
  }

  async generarDiasDisponibles(especialistaId: string): Promise<void> {
    const especialidadSeleccionada =
      this.formulario.get('especialidad')?.value?.trim() ?? '';

    const disponibilidad =
      await this.usuariosSv.obtenerDisponibilidadEspecialistaPorEspecialidad(
        especialistaId,
        especialidadSeleccionada
      );

    const dias: { fecha: string; label: string }[] = [];

    for (let i = 0; i < 15; i++) {
      const fecha = dayjs().add(i, 'day');
      const diaSemana = fecha.format('dddd').toLowerCase();

      const trabajaEseDia = disponibilidad.some((d) => {
        const diaDisp = d.dia_semana?.toLowerCase() ?? '';
        const espDisp = d.especialidad?.toLowerCase().trim() ?? '';
        const espSel = especialidadSeleccionada.toLowerCase();
        return diaDisp === diaSemana && espDisp === espSel;
      });

      if (trabajaEseDia) {
        dias.push({
          fecha: fecha.format('YYYY-MM-DD'),
          label: fecha.format('dddd D [de] MMMM'),
        });
      }
    }

    this.diasDisponibles = dias;
  }
  async cargarHorariosDisponibles(fecha: string): Promise<void> {
    if (!fecha || fecha.trim() === '') {
      console.warn('Fecha inválida para cargar horarios.');
      return;
    }
    const especialistaId = this.formulario.get('especialista')?.value;
    const especialidadSeleccionada =
      this.formulario.get('especialidad')?.value?.trim() ?? '';
    console.log(
      'ID:',
      especialistaId,
      'Especialidad:',
      especialidadSeleccionada
    );

    if (!especialistaId || !especialidadSeleccionada) return;

    const diaSemana = dayjs(fecha).format('dddd').toLowerCase();

    const disponibilidad =
      await this.usuariosSv.obtenerDisponibilidadEspecialistaPorEspecialidad(
        especialistaId,
        especialidadSeleccionada
      );

    const bloques = disponibilidad
      .filter((d) => d.dia_semana?.toLowerCase() === diaSemana)
      .map((d) => d.horario_inicio);

    const ocupados = await this.usuariosSv.obtenerTurnosPorEspecialistaYFecha(
      especialistaId,
      fecha
    );

    const disponibles = bloques.filter((hora) => !ocupados.includes(hora));

    this.horariosDisponibles = disponibles;
  }

  async enviarTurno() {
    if (this.formulario.invalid) {
      this.toastr.error('Por favor completá todos los campos requeridos.');
      return;
    }

    const { especialidad, especialista, dia, horario, paciente } =
      this.formulario.value;

    const turnoData = {
      especialidad,
      especialista_id: especialista,
      paciente_id: this.esAdmin
        ? this.formulario.get('paciente')?.value
        : this.usuarioActual?.id,
      fecha_turno: dia,
      hora_turno: horario,
      estado: 'pendiente',
    };

    try {
      await this.usuariosSv.insertarTurno(turnoData);

      this.toastr.success('Turno reservado con éxito.');
      this.formulario.reset();
      this.horariosDisponibles = [];
      this.diasDisponibles = [];
    } catch (err) {
      this.toastr.error('Ocurrió un error al reservar el turno.');
      console.error('Error al guardar turno:', err);
    }
  }

  async cargarEspecialistas() {
    try {
      this.profesionales = await this.usuariosSv.obtenerTodosLosEspecialistas();
    } catch {
      this.toastr.error('Error al cargar especialistas');
      this.profesionales = [];
    }
  }

  seleccionarEspecialista(especialista: any) {
    this.formulario.patchValue({
      especialista: especialista.id,
      dia: '',
      horario: '',
    });

    // Actualizamos las especialidades del especialista seleccionado
    this.especialidadesDelEspecialista = especialista.especialidad || [];

    this.diasDisponibles = [];
    this.horariosDisponibles = [];
  }

  getImagenEspecialidad(nombreEspecialidad: string): string {
    const esp = this.especialidades.find(
      (e) => e.nombre === nombreEspecialidad
    );
    return esp?.imagen || 'assets/images/default-specialty.png';
  }

  async seleccionarEspecialidad(esp: string) {
    this.formulario.patchValue({ especialidad: esp, dia: '', horario: '' });
    const especialistaId = this.formulario.get('especialista')?.value;
    if (especialistaId) {
      await this.generarDiasDisponibles(especialistaId);
    }
  }
}
