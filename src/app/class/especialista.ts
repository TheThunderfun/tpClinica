import dayjs from 'dayjs';
import { Usuario } from './usuario';
type JornadaItem = {
  dia: string;
  especialidad: string;
  horaInicio: string;
  horaFinal: string;
};
export class Especialista implements Usuario {
  id?: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'especialista';
  dni: number;
  edad: number;
  imagenPerfil: string;
  especialidad: string[];
  jornada: JornadaItem[] | null;
  autorizado: boolean;

  constructor(
    id: string | null = null,
    nombre: string,
    apellido: string,
    email: string,
    dni: number,
    edad: number,
    imagenPerfil: string,
    especialidad: string[],
    jornada: JornadaItem[] | null,
    autorizado: boolean
  ) {
    this.id = id ?? undefined;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.rol = 'especialista';
    this.dni = dni;
    this.edad = edad;
    this.imagenPerfil = imagenPerfil;
    this.especialidad = especialidad;
    this.jornada = jornada
      ? jornada.map((j: JornadaItem) => ({
          dia: j.dia,
          especialidad: j.especialidad || '',
          horaInicio: j.horaInicio || '',
          horaFinal: j.horaFinal || '',
        }))
      : null;

    this.autorizado = autorizado;
  }

  // toPlainObject() {
  //   return {
  //     nombre: this.nombre,
  //     apellido: this.apellido,
  //     email: this.email,
  //     rol: this.rol,
  //     dni: this.dni,
  //     edad: this.edad,
  //     imagenPerfil: this.imagenPerfil,
  //     especialidad: this.especialidad,
  //     jornada: this.jornada
  //       ? this.jornada.map((j) => ({
  //           dia: j.dia,
  //           especialidad: j.especialidad,
  //           horaInicio: j.horaInicio.format('HH:mm'),
  //           horaFinal: j.horaFinal.format('HH:mm'),
  //         }))
  //       : null,
  //     autorizado: this.autorizado,
  //   };
  // }

  static fromJson(json: any): Especialista {
    return new Especialista(
      json.id ?? null,
      json.nombre,
      json.apellido,
      json.email,
      json.dni,
      json.edad,
      json.imagenPerfil,
      json.especialidad || [],
      (json.jornada || []).map((j: any) => ({
        dia: j.dia,
        especialidad: j.especialidad || '',
        horaInicio: typeof j.horaInicio === 'string' ? j.horaInicio : '',
        horaFinal: typeof j.horaFinal === 'string' ? j.horaFinal : '',
      })),
      json.autorizado ?? false
    );
  }
}
