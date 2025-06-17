import { Component, OnInit } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
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
      // Registrar en Auth de Supabase
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
        '' // imagen se carga después
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

        // ⚠️ Esto remueve el backdrop por si no se elimina solo
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();

        // ⚠️ También quitamos la clase del body si quedó
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
      }
    } catch (err: any) {
      this.toastr.error(err.message || 'Error al registrar');
    }
  }
}
