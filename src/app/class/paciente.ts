import dayjs from 'dayjs';
import { Usuario } from './usuario';

export class Paciente implements Usuario {
  id?: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'paciente';
  dni: number;
  edad: number;
  obraSocial: string;
  imagenPerfil: string;
  imagenPerfil2: string;

  constructor(
    id: string | null = null,
    nombre: string,
    apellido: string,
    email: string,
    dni: number,
    edad: number,
    imagenPerfil: string,
    obraSocial: string,
    imagenPerfil2: string
  ) {
    this.id = id ?? undefined;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.rol = 'paciente';
    this.dni = dni;
    this.edad = edad;
    this.obraSocial = obraSocial;
    this.imagenPerfil = imagenPerfil;
    this.imagenPerfil2 = imagenPerfil2;
  }

  toPlainObject() {
    return {
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      rol: this.rol,
      dni: this.dni,
      edad: this.edad,
      obraSocial: this.obraSocial,
      imagenPerfil: this.imagenPerfil,
      imagenPerfil2: this.imagenPerfil2,
    };
  }
}
