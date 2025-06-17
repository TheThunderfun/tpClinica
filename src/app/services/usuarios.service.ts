import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { Usuario } from '../class/usuario';
import { Paciente } from '../class/paciente';
import { Especialista } from '../class/especialista';
import { SupabaseService } from './supabase.service';
import { Admin } from '../class/admin';
import dayjs from 'dayjs';
type UsuarioCompleto = Paciente | Especialista | Admin;
@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  constructor(private supabase: SupabaseService) {}

  private async subirImagenPerfil(file: File, userId: string): Promise<string> {
    const filePath = `perfiles/${userId}-${file.name}`;

    const { error: uploadError } = await this.supabase.client.storage
      .from('perfiles')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error('Error al subir la imagen: ' + uploadError.message);
    }

    const { data } = this.supabase.client.storage
      .from('perfiles')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async agregarUsuarioConImagen(
    usuario: Usuario,
    imagenes: File[] = [] // puede contener 1 o más imágenes
  ): Promise<void> {
    const userId = `${usuario.email}-${Date.now()}`;

    const insertData: any = {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      dni: usuario.dni,
      edad: usuario.edad,
      rol: usuario.rol,
    };

    if (usuario.rol === 'paciente') {
      insertData.obraSocial = (usuario as Paciente).obraSocial;

      if (imagenes[0]) {
        insertData.imagenPerfil = await this.subirImagenPerfil(
          imagenes[0],
          userId
        );
      }

      if (imagenes[1]) {
        insertData.imagenPerfil2 = await this.subirImagenPerfil(
          imagenes[1],
          userId
        );
      }
    }

    if (usuario.rol === 'especialista') {
      insertData.especialidad = (usuario as Especialista).especialidad;
      insertData.jornada = (usuario as Especialista).jornada;
      insertData.autorizado = (usuario as Especialista).autorizado ?? false;

      if (imagenes[0]) {
        insertData.imagenPerfil = await this.subirImagenPerfil(
          imagenes[0],
          userId
        );
      }
    }

    if (usuario.rol === 'administrador') {
      if (imagenes[0]) {
        insertData.imagenPerfil = await this.subirImagenPerfil(
          imagenes[0],
          userId
        );
      }
    }

    const { error } = await this.supabase.client
      .from('usuarios')
      .insert(insertData);

    if (error) {
      throw new Error('Error al guardar el usuario: ' + error.message);
    }
  }

  // Obtener todos los usuarios (devuelve una promesa con array)
  async obtenerUsuarios(): Promise<UsuarioCompleto[]> {
    const { data, error } = await this.supabase.client
      .from('usuarios')
      .select('*');

    if (error) {
      throw new Error('Error al obtener usuarios: ' + error.message);
    }

    const usuariosConvertidos: UsuarioCompleto[] = data.map((u: any) => {
      switch (u.rol) {
        case 'paciente':
          return new Paciente(
            u.id,
            u.nombre,
            u.apellido,
            u.email,
            u.dni,
            u.edad,
            u.imagenPerfil1,
            u.obraSocial,
            u.imagenPerfil2
          );

        case 'especialista':
          const jornadaParseada = u.jornada
            ? u.jornada.map((j: any) => ({
                dia: j.dia,
                horaInicio: dayjs(j.horaInicio),
                horaFinal: dayjs(j.horaFinal),
              }))
            : null;

          return new Especialista(
            u.id,
            u.nombre,
            u.apellido,
            u.email,
            u.dni,
            u.edad,
            u.imagenPerfil,
            u.especialidad,
            jornadaParseada,
            u.autorizado
          );

        case 'administrador':
          return new Admin(
            u.id,
            u.nombre,
            u.apellido,
            u.email,
            u.dni,
            u.edad,
            u.imagenPerfil
          );

        default:
          throw new Error('Rol desconocido: ' + u.rol);
      }
    });

    return usuariosConvertidos;
  }
}
