import * as dayjs from 'dayjs';

export interface Usuario {
  id?: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'especialista' | 'paciente' | 'administrador';
  dni: number;
  edad: number;
  imagenPerfil: string;
}
