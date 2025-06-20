import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UsuariosService } from '../../services/usuarios.service';
import { CommonModule } from '@angular/common';

interface Turno {
  id: string;
  fecha_turno: string;
  hora_turno: string;
  estado: string;
  especialidad: string;
  especialista: { id: string; nombre: string; apellido: string };
  paciente: { id: string; nombre: string; apellido: string };
}

@Component({
  selector: 'app-turnos-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './turnos-admin.component.html',
  styleUrl: './turnos-admin.component.scss',
})
export class TurnosAdminComponent implements OnInit {
  turnos: any[] = [];
  turnosFiltrados: Turno[] = [];
  filtroForm: FormGroup;
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private usuariosSv: UsuariosService
  ) {
    this.filtroForm = this.fb.group({
      especialidad: [''],
      especialista: [''],
    });
  }

  ngOnInit(): void {
    this.cargarTurnos();
    this.filtroForm.valueChanges.subscribe(() => {
      this.aplicarFiltros();
    });
  }

  async cargarTurnos() {
    this.cargando = true;
    try {
      this.turnos = await this.usuariosSv.obtenerTodosLosTurnos();
      this.aplicarFiltros();
    } catch (error) {
      this.toastr.error('Error al cargar turnos');
      console.error(error);
    } finally {
      this.cargando = false;
    }
  }
  aplicarFiltros() {
    const filtroEspecialidad =
      this.filtroForm.get('especialidad')?.value.toLowerCase() ?? '';
    const filtroEspecialista =
      this.filtroForm.get('especialista')?.value.toLowerCase() ?? '';

    this.turnosFiltrados = this.turnos.filter((t) => {
      const espMatch = t.especialidad
        .toLowerCase()
        .includes(filtroEspecialidad);
      const especialistaNombre =
        `${t.especialista.nombre} ${t.especialista.apellido}`.toLowerCase();
      const espMatchEspecialista =
        especialistaNombre.includes(filtroEspecialista);

      return espMatch && espMatchEspecialista;
    });
  }

  puedeCancelar(turno: Turno): boolean {
    return !['aceptado', 'realizado', 'rechazado'].includes(
      turno.estado.toLowerCase()
    );
  }

  async cancelarTurno(turno: Turno) {
    const comentario = prompt('Ingrese el motivo de la cancelación:');
    if (!comentario || comentario.trim() === '') {
      this.toastr.warning(
        'Debe ingresar un comentario para cancelar el turno.'
      );
      return;
    }
    try {
      await this.usuariosSv.cancelarTurno(turno.id, comentario.trim());
      this.toastr.success('Turno cancelado con éxito.');
      await this.cargarTurnos(); // recargar lista
    } catch (err) {
      this.toastr.error('Error al cancelar el turno.');
      console.error(err);
    }
  }
}
