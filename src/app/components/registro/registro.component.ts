import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { EspecialidadesService } from '../../services/especialidades.service';
import { UsuariosService } from '../../services/usuarios.service';
import { AuthService } from '../../services/auth.service';
import { Especialista } from '../../class/especialista';
import { Paciente } from '../../class/paciente';
import { Subscription } from 'rxjs';
import { Usuario } from '../../class/usuario';
import { trigger, transition, style, animate } from '@angular/animations';
import { CaptchaComponent } from '../captcha/captcha.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    CaptchaComponent,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ]),
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss',
})
export class RegistroComponent implements OnInit {
  especialidades: string[] = [];
  nuevaEspecialidad: string = '';
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
  userType: string | null = null;

  formulario!: FormGroup;

  constructor(
    private svEspcecialidades: EspecialidadesService,
    private svUsuarios: UsuariosService,
    private svAuth: AuthService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.subs = this.svEspcecialidades.especialidades$.subscribe((data) => {
      this.especialidades = data.map((e) => e.nombre);
    });

    this.formulario = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: [
        null,
        [Validators.required, Validators.min(18), Validators.max(99)],
      ],
      dni: [null, [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      obraSocial: ['', Validators.required],
      especialidadSeleccionadas: [[]],
      otraEspecialidad: [''],
      otraSeleccionada: [false],
      imagenPerfil: [null],
      imagenPerfil2: [null],
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

  setUserType(tipo: 'paciente' | 'especialista') {
    this.userType = tipo;

    if (tipo === 'paciente') {
      this.formulario.get('obraSocial')?.setValidators(Validators.required);
      this.formulario.get('especialidadSeleccionadas')?.clearValidators();
    } else if (tipo === 'especialista') {
      this.formulario.get('obraSocial')?.clearValidators();
      this.formulario
        .get('especialidadSeleccionadas')
        ?.setValidators([Validators.required, Validators.minLength(1)]);
    }

    this.formulario.get('obraSocial')?.updateValueAndValidity();
    this.formulario.get('especialidadSeleccionadas')?.updateValueAndValidity();
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
        this.toastr.error('Debe seleccionar un tipo de usuario');
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
        this.toastr.error('Por favor complete todos los campos obligatorios');
        return;
      }

      // Variable usuario y arreglo de imágenes
      let usuario: Usuario;
      let imagenes: File[] = [];

      if (this.userType === 'paciente') {
        // Validar campos de paciente
        if (!this.obraSocial) {
          this.toastr.error('Por favor ingrese la obra social');
          return;
        }
        if (!this.archivos['imagenPerfil'] || !this.archivos['imagenPerfil2']) {
          this.toastr.error('Debe seleccionar ambas imágenes para el perfil');
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

        console.log(this.especialidadSeleccionadas);
        if (
          (!this.especialidadSeleccionadas ||
            this.especialidadSeleccionadas.length === 0) &&
          !this.otraEspecialidad
        ) {
          this.toastr.error('Debe seleccionar o agregar una especialidad');
          return;
        }

        // Si está marcada "otra", agregarla a especialidadSeleccionadas
        let especialidadesFinales = [...(this.especialidadSeleccionadas || [])];
        if (this.otraSeleccionada && this.otraEspecialidad.trim()) {
          especialidadesFinales.push(this.otraEspecialidad.trim());
        }

        if (!this.archivos['imagenPerfil1']) {
          this.toastr.error(
            'Debe seleccionar una imagen de perfil para especialista'
          );
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
          false // autorizado
        );

        imagenes = [this.archivos['imagenPerfil1']];
      } else {
        this.toastr.error('Tipo de usuario inválido');
        return;
      }

      const user = await this.svAuth.signUp(this.email, this.password);
      usuario.id = user.id;

      await new Promise((resolve) => setTimeout(resolve, 500));

      await this.svUsuarios.agregarUsuarioConImagen(
        usuario,
        imagenes.filter((f) => f)
      );

      this.toastr.error('Usuario registrado con éxito');

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
      this.toastr.error('Ocurrió un error al registrar el usuario.');
    }
  }

  captchaValido = false;
}
