import dayjs from 'dayjs';
import { Usuario } from './usuario';

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
  jornada:
    | { dia: string; horaInicio: dayjs.Dayjs; horaFinal: dayjs.Dayjs }[]
    | null;
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
    jornada:
      | { dia: string; horaInicio: dayjs.Dayjs; horaFinal: dayjs.Dayjs }[]
      | null,
    autorizado: boolean
  ) {

    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.rol = 'especialista';
    this.dni = dni;
    this.edad = edad;
    this.imagenPerfil = imagenPerfil;
    this.especialidad = especialidad;
    this.jornada = jornada;
    this.autorizado = autorizado;
  }

  toPlainObject() {
    return {
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      rol: this.rol,
      dni: this.dni,
      edad: this.edad,
      imagenPerfil: this.imagenPerfil,
      especialidad: this.especialidad,
      jornada: this.jornada
        ? this.jornada.map((j) => ({
            dia: j.dia,
            horaInicio: j.horaInicio.format('HH:mm'),
            horaFinal: j.horaFinal.format('HH:mm'),
          }))
        : null,
      autorizado: this.autorizado,
    };
  }
}
