import { Component, OnInit } from '@angular/core';
import { Usuario } from '../../class/usuario';
import { ToastrService } from 'ngx-toastr';
import { Especialista } from '../../class/especialista';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { AutorizacionTextoPipe } from '../../pipes/autorizacion-texto.pipe';
import { RolVisualPipe } from '../../pipes/rol-visual.pipe';
import { AutorizacionVisualPipe } from '../../pipes/autorizacion-visual.pipe';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { UsuariosService } from '../../services/usuarios.service';
import { Admin } from '../../class/admin';
import * as bootstrap from 'bootstrap';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-s-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AutorizacionTextoPipe,
    RolVisualPipe,
    AutorizacionVisualPipe,
    NavBarComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './s-usuarios.component.html',
  styleUrl: './s-usuarios.component.scss',
})
export class SUsuariosComponent implements OnInit {
  formAdmin: FormGroup;
  imagenAdmin: File | null = null;
  usuarios: any[] = [];
  nuevoUsuario!: any;
  historiasClinicas: any[] = [];
  historiaSeleccionada: any = null;
  mostrarTabla: boolean = false;

  constructor(
    private supabase: SupabaseService,
    private toastr: ToastrService,
    private usuariosService: UsuariosService,
    private fb: FormBuilder
  ) {
    this.formAdmin = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(18), Validators.max(99)]],
      dni: [
        '',
        [Validators.required, Validators.minLength(8), Validators.maxLength(8)],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    this.obtenerUsuarios();
    this.obtenerHistoriasClinicas();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.imagenAdmin = file ?? null;
  }
  async obtenerUsuarios() {
    const { data, error } = await this.supabase.client
      .from('usuarios')
      .select('*');

    if (error) {
      console.error('Error al obtener usuarios:', error.message);
      return;
    }

    this.usuarios = data as Usuario[];
  }
  async cambiarAutorizacion(especialista: Especialista) {
    const actualizado = !especialista.autorizado;

    const { error } = await this.supabase.client
      .from('usuarios')
      .update({ autorizado: actualizado })
      .eq('id', especialista.id);

    if (!error) {
      especialista.autorizado = actualizado;
      this.toastr.success(
        `Usuario ${
          actualizado ? 'autorizado' : 'desautorizado'
        } correctamente.`,
        'Éxito'
      );
    } else {
      this.toastr.error(error.message, 'Error');
    }
  }

  async registrarAdministrador() {
    const { nombre, apellido, edad, dni, email, password } =
      this.formAdmin.value;

    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      });

      if (error || !data.user) {
        this.toastr.error(error?.message || 'Error al registrar en Auth');
        return;
      }

      const admin = new Admin(
        data.user.id,
        nombre,
        apellido,
        email,
        dni,
        edad,
        ''
      );

      await this.usuariosService.agregarUsuarioConImagen(
        admin,
        this.imagenAdmin ? [this.imagenAdmin] : []
      );

      this.toastr.success('Administrador creado correctamente');
      this.formAdmin.reset();
      this.imagenAdmin = null;
      const modalElement = document.getElementById('registroAdminModal');
      if (modalElement) {
        const modal =
          bootstrap.Modal.getInstance(modalElement) ||
          new bootstrap.Modal(modalElement);
        modal.hide();

        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();

        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
      }
    } catch (err: any) {
      this.toastr.error(err.message || 'Error al registrar');
    }
  }

  exportarUsuariosAExcel() {
    const nombreArchivo = 'usuarios.xlsx';

    const datos = this.usuarios.map((u) => ({
      Nombre: u.nombre,
      Apellido: u.apellido,
      Email: u.email,
      Rol: u.rol,
      Edad: u.edad,
      DNI: u.dni,
      Jornada:
        u.jornada && Array.isArray(u.jornada)
          ? u.jornada
              .map(
                (j: any) =>
                  `${j.dia} (${j.horaInicio} - ${j.horaFinal}) [${j.especialidad}]`
              )
              .join(', ')
          : '',
      Autorizado: u.autorizado ? 'Sí' : 'No',
      ObraSocial: u.obraSocial || '',
      Especialidades: Array.isArray(u.especialidad)
        ? u.especialidad.join(', ')
        : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(datos);
    console.log(
      this.usuarios.map((u) => ({ nombre: u.nombre, jornada: u.jornada }))
    );
    // Creamos el libro
    const workbook = {
      Sheets: { Usuarios: worksheet },
      SheetNames: ['Usuarios'],
    };

    // Convertimos el libro a un archivo binario
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    // Guardamos el archivo
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });

    FileSaver.saveAs(blob, nombreArchivo);
  }

  async obtenerHistoriasClinicas() {
    this.historiasClinicas =
      await this.usuariosService.obtenerTodasLasHistoriasClinicas();
  }

  verDetalles(historia: any) {
    this.historiaSeleccionada = historia;
  }
  cerrarDetalles() {
    this.historiaSeleccionada = null;
  }
  toggleTabla() {
    this.mostrarTabla = !this.mostrarTabla;
  }
}
