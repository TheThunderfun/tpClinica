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
    const nuevaEsp = this.formulario.get('otraEspecialidad')?.value?.trim();

    if (!nuevaEsp) {
      this.toastr.error('Ingrese una especialidad válida');
      return;
    }

    // Agregar localmente si no existe ya
    if (!this.especialidades.includes(nuevaEsp)) {
      this.especialidades.push(nuevaEsp);
    }

    // Actualizar especialidades seleccionadas del formulario
    const seleccionadas: string[] =
      this.formulario.get('especialidadSeleccionadas')?.value || [];
    if (!seleccionadas.includes(nuevaEsp)) {
      this.formulario
        .get('especialidadSeleccionadas')
        ?.setValue([...seleccionadas, nuevaEsp]);
    }

    // Llamar al servicio para guardar la especialidad globalmente
    try {
      await this.svEspcecialidades.agregarEspecialidad(nuevaEsp);
    } catch (error) {
      console.error('Error agregando especialidad al servicio:', error);
      this.toastr.error('Error al guardar la especialidad');
    }

    // Limpiar input y checkbox
    this.formulario.get('otraEspecialidad')?.setValue('');
    this.formulario.get('otraSeleccionada')?.setValue(false);

    this.toastr.success(`Especialidad "${nuevaEsp}" agregada`);
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
      if (!this.userType) {
        this.toastr.error('Debe seleccionar un tipo de usuario');
        return;
      }

      const {
        nombre,
        apellido,
        email,
        dni,
        edad,
        password,
        obraSocial,
        especialidadSeleccionadas,
        otraEspecialidad,
        otraSeleccionada,
      } = this.formulario.value;

      if (!nombre || !apellido || !email || !dni || !edad || !password) {
        this.toastr.error('Por favor complete todos los campos obligatorios');
        return;
      }

      let usuario: Usuario;
      let imagenes: File[] = [];

      if (this.userType === 'paciente') {
        if (!obraSocial) {
          this.toastr.error('Por favor ingrese la obra social');
          return;
        }
        if (!this.archivos['imagenPerfil'] || !this.archivos['imagenPerfil2']) {
          this.toastr.error('Debe seleccionar ambas imágenes para el perfil');
          return;
        }

        usuario = new Paciente(
          null,
          nombre,
          apellido,
          email,
          dni,
          edad,
          '',
          obraSocial,
          ''
        );

        imagenes = [
          this.archivos['imagenPerfil'],
          this.archivos['imagenPerfil2'],
        ];
      } else if (this.userType === 'especialista') {
        let especialidadesFinales = [...(especialidadSeleccionadas || [])];
        if (otraSeleccionada && otraEspecialidad.trim()) {
          especialidadesFinales.push(otraEspecialidad.trim());
        }

        if (!especialidadesFinales.length) {
          this.toastr.error('Debe seleccionar o agregar una especialidad');
          return;
        }

        if (!this.archivos['imagenPerfil1']) {
          this.toastr.error(
            'Debe seleccionar una imagen de perfil para especialista'
          );
          return;
        }

        usuario = new Especialista(
          null,
          nombre,
          apellido,
          email,
          dni,
          edad,
          '',
          especialidadesFinales,
          [],
          false
        );

        imagenes = [this.archivos['imagenPerfil1']];
      } else {
        this.toastr.error('Tipo de usuario inválido');
        return;
      }

      const user = await this.svAuth.signUp(email, password);
      usuario.id = user.id;

      await new Promise((resolve) => setTimeout(resolve, 500));

      await this.svUsuarios.agregarUsuarioConImagen(
        usuario,
        imagenes.filter((f) => f)
      );

      this.toastr.success('Usuario registrado con éxito');

      console.log('userType:', this.userType);
      console.log('formulario.value:', this.formulario.value);
      this.formulario.reset();
      this.userType = null;
      this.archivos = {};
    } catch (error) {
      console.error('Error registrando usuario:', error);
      this.toastr.error('Ocurrió un error al registrar el usuario.');
    }
  }
  captchaValido = false;
}
