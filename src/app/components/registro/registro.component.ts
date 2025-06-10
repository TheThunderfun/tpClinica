import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EspecialidadesService } from '../../services/especialidades.service';
import { UsuariosService } from '../../services/usuarios.service';
import { AuthService } from '../../services/auth.service';
import { Especialista } from '../../class/especialista';
import { Paciente } from '../../class/paciente';
import { Subscription } from 'rxjs';
import { Usuario } from '../../class/usuario';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss',
})
export class RegistroComponent implements OnInit {
  especialidades: string[] = [];
  nuevaEspecialidad: string = '';
  userType: string = 'paciente';
  speciality: string = '';
  archivos: { [key: string]: File } = {};
  private subs: Subscription = new Subscription();
  nombre: string = '';
  apellido: string = '';
  email: string = '';
  dni: number | null = null;
  edad!: number;
  password: string = '';
  obraSocial: string = '';
  especialidadSeleccionadas: string[] = [];
  otraSeleccionada: boolean = false;
  otraEspecialidad: string = '';

  constructor(
    private svEspcecialidades: EspecialidadesService,
    private svUsuarios: UsuariosService,
    private svAuth: AuthService
  ) {}

  ngOnInit(): void {
    this.subs = this.svEspcecialidades.especialidades$.subscribe((data) => {
      this.especialidades = data.map((e) => e.nombre);
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  async agregarEspecialidad(): Promise<void> {
    if (this.nuevaEspecialidad.trim()) {
      try {
        await this.svEspcecialidades.agregarEspecialidad(
          this.nuevaEspecialidad.trim()
        );
        this.nuevaEspecialidad = '';
        // No hace falta recargar manualmente porque el servicio se suscribe a cambios
      } catch (error) {
        console.error('Error agregando especialidad:', error);
      }
    }
  }

  setUserType(type: string) {
    this.userType = type;
    this.speciality = '';
  }

  setSpeciality(event: any) {
    this.speciality = event.target.value;
  }

  onFileChange(event: any, key: string) {
    if (event.target.files && event.target.files.length > 0) {
      this.archivos[key] = event.target.files[0];
    }
  }

  async agregarUsuario(): Promise<void> {
    try {
      // Validar que userType esté definido
      if (!this.userType) {
        alert('Debe seleccionar un tipo de usuario');
        return;
      }

      // Validaciones básicas de campos obligatorios
      if (
        !this.nombre ||
        !this.apellido ||
        !this.email ||
        !this.dni ||
        !this.edad ||
        !this.password
      ) {
        alert('Por favor complete todos los campos obligatorios');
        return;
      }

      // Variable usuario y arreglo de imágenes
      let usuario: Usuario;
      let imagenes: File[] = [];

      if (this.userType === 'paciente') {
        // Validar campos de paciente
        if (!this.obraSocial) {
          alert('Por favor ingrese la obra social');
          return;
        }
        if (!this.archivos['imagenPerfil'] || !this.archivos['imagenPerfil2']) {
          alert('Debe seleccionar ambas imágenes para el perfil');
          return;
        }

        usuario = new Paciente(
          null, // id, se genera en backend
          this.nombre,
          this.apellido,
          this.email,
          this.dni,
          this.edad,
          this.obraSocial,
          '',
          ''
        );

        imagenes = [
          this.archivos['imagenPerfil'],
          this.archivos['imagenPerfil2'],
        ];
      } else if (this.userType === 'especialista') {
        // Validar especialidad

        console.log(this.especialidadSeleccionadas)
        if (
          (!this.especialidadSeleccionadas ||
            this.especialidadSeleccionadas.length === 0) &&
          !this.otraEspecialidad
        ) {
          alert('Debe seleccionar o agregar una especialidad');
          return;
        }

        // Si está marcada "otra", agregarla a especialidadSeleccionadas
        let especialidadesFinales = [...(this.especialidadSeleccionadas || [])];
        if (this.otraSeleccionada && this.otraEspecialidad.trim()) {
          especialidadesFinales.push(this.otraEspecialidad.trim());
        }

        if (!this.archivos['imagenPerfil1']) {
          alert('Debe seleccionar una imagen de perfil para especialista');
          return;
        }

        usuario = new Especialista(
          null,
          this.nombre,
          this.apellido,
          this.email,
          this.dni,
          this.edad,
          '', // imagenPerfil URL será guardado en backend luego de subir la imagen
          especialidadesFinales,
          [], // jornada (puede agregar si corresponde)
          true // autorizado
        );

        imagenes = [this.archivos['imagenPerfil1']];
      } else {
        alert('Tipo de usuario inválido');
        return;
      }

      const user = await this.svAuth.signUp(this.email, this.password);
      usuario.id = user.id;

      await new Promise((resolve) => setTimeout(resolve, 500));

      await this.svUsuarios.agregarUsuarioConImagen(
        usuario,
        imagenes.filter((f) => f)
      );

      alert('Usuario registrado con éxito');

      // Limpiar formulario (opcional)
      this.nombre = '';
      this.apellido = '';
      this.email = '';
      this.dni = null!;
      this.edad = null!;
      this.password = '';
      this.obraSocial = '';
      this.especialidadSeleccionadas = [];
      this.otraSeleccionada = false;
      this.otraEspecialidad = '';
      this.archivos = {};
    } catch (error) {
      console.error('Error registrando usuario:', error);
      alert('Ocurrió un error al registrar el usuario.');
    }
  }
}
