import { Usuario } from './usuario';

export class Admin implements Usuario {
  id?: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'administrador';
  dni: number;
  edad: number;
  imagenPerfil: string;

  constructor(
    id: string | null = null,
    nombre: string,
    apellido: string,
    email: string,
    dni: number,
    edad: number,
    imagenPerfil: string
  ) {
    this.id = id ?? undefined;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.rol = 'administrador';
    this.dni = dni;
    this.edad = edad;
    this.imagenPerfil = imagenPerfil;
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
    };
  }
}
