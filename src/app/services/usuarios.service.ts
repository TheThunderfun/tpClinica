import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { Usuario } from '../class/usuario';
import { Paciente } from '../class/paciente';
import { Especialista } from '../class/especialista';
import { SupabaseService } from './supabase.service';
import { Admin } from '../class/admin';
import dayjs from 'dayjs';

export interface HorarioPorDia {
  dia: string; // 'Lunes', 'Martes', etc.
  especialidad: string;
  horaInicio: string; // formato HH:mm
  horaFinal: string; // formato HH:mm
}

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

  async actualizarJornada(
    email: string,
    jornada: HorarioPorDia[]
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from('usuarios')
      .update({ jornada })
      .eq('email', email);

    if (error) throw new Error('Error al guardar jornada: ' + error.message);
  }
  async obtenerUsuario(email: string): Promise<Usuario | null> {
    const { data, error } = await this.supabase.client
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error al obtener usuario:', error);
      return null;
    }

    if (!data) {
      console.warn('Usuario no encontrado para email:', email);
      return null;
    }

    // Según el rol, devolvemos la instancia correcta
    if (data.rol === 'especialista') {
      return new Especialista(
        data.id,
        data.nombre,
        data.apellido,
        data.email,
        data.dni,
        data.edad,
        data.imagenPerfil,
        data.especialidad || [],
        data.jornada || [],
        data.autorizado || false
      );
    } else if (data.rol === 'paciente') {
      return new Paciente(
        data.id,
        data.nombre,
        data.apellido,
        data.email,
        data.dni,
        data.edad,
        data.imagenPerfil,
        data.obraSocial || '',
        data.imagenPerfil2 || ''
      );
    } else {
      // Usuario genérico, si tenés clase base o solo devolver el objeto
      return data;
    }
  }

  async actualizarDisponibilidad(
    especialistaId: string,
    bloques: {
      especialista_id: string;
      dia_semana: string;
      horario_inicio: string;
    }[]
  ): Promise<void> {
    // 1. Borrar los anteriores
    await this.supabase.client
      .from('disponibilidad_especialistas')
      .delete()
      .eq('especialista_id', especialistaId);

    // 2. Insertar nuevos
    const { error } = await this.supabase.client
      .from('disponibilidad_especialistas')
      .insert(bloques);

    if (error) {
      throw new Error('Error al guardar disponibilidad: ' + error.message);
    }
  }

  async obtenerDisponibilidadEspecialistaPorEspecialidad(
    especialistaId: string,
    especialidad: string
  ): Promise<
    { dia_semana: string; horario_inicio: string; especialidad: string }[]
  > {
    const { data, error } = await this.supabase.client
      .from('disponibilidad_especialistas')
      .select('dia_semana, horario_inicio, especialidad')
      .eq('especialista_id', especialistaId)
      .eq('especialidad', especialidad);

    if (error) {
      throw new Error('Error al obtener disponibilidad: ' + error.message);
    }

    return data || [];
  }

  async obtenerEspecialistasPorEspecialidad(especialidad: string) {
    const { data, error } = await this.supabase.client
      .from('usuarios')
      .select('*')
      .eq('rol', 'especialista')
      .contains('especialidad', [especialidad]);

    if (error) throw error;
    return data;
  }

  async obtenerTurnosPorEspecialistaYFecha(
    especialistaId: string,
    fecha: string
  ): Promise<string[]> {
    const { data, error } = await this.supabase.client
      .from('turnos')
      .select('hora_turno')
      .eq('especialista_id', especialistaId)
      .eq('fecha_turno', fecha)
      .in('estado', ['pendiente', 'confirmado']); // opcional: filtrar por estado

    if (error) {
      throw new Error('Error al obtener turnos: ' + error.message);
    }

    // Devuelve un array de strings como ['10:00', '10:30']
    return data.map((t) => t.hora_turno);
  }

  async insertarTurno(turno: any) {
    const { error } = await this.supabase.client.from('turnos').insert([turno]);

    if (error) {
      throw error;
    }
  }

  async obtenerPacientes() {
    const { data, error } = await this.supabase.client
      .from('usuarios')
      .select('*')
      .eq('rol', 'paciente');

    if (error) {
      throw new Error('Error al obtener pacientes: ' + error.message);
    }

    return data;
  }

  async obtenerTodosLosTurnos() {
    const { data, error } = await this.supabase.client.from('turnos').select(`
      id,
      fecha_turno,
      hora_turno,
      estado,
      especialidad,
      reseña,
      comentario_cancelacion,
      especialista:especialista_id (
        id,
        nombre,
        apellido
      ),
      paciente:paciente_id (
        id,
        nombre,
        apellido,
        email
      )
    `);

    if (error) {
      throw new Error('Error al obtener turnos: ' + error.message);
    }

    return data;
  }

  async cancelarTurno(turnoId: string, comentario: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('turnos')
      .update({ estado: 'cancelado', comentario_cancelacion: comentario })
      .eq('id', turnoId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async verMotivoCancelacionTurno(turnoId: string) {
    const { data, error } = await this.supabase.client
      .from('turnos')
      .select('comentario_cancelacion')
      .eq('id', turnoId)
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data?.comentario_cancelacion ?? null;
  }

  async finalizarTurno(turnoId: string, reseña: string, diagnostico: string) {
    const { error } = await this.supabase.client
      .from('turnos')
      .update({
        estado: 'finalizado',
        reseña: reseña,
        diagnostico: diagnostico,
      })
      .eq('id', turnoId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async aceptarTurno(turnoId: string) {
    const { error } = await this.supabase.client
      .from('turnos')
      .update({
        estado: 'aceptado',
      })
      .eq('id', turnoId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async verResena(turnoId: string): Promise<string | null> {
    const { data, error } = await this.supabase.client
      .from('turnos')
      .select('reseña')
      .eq('id', turnoId)
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return (data as any)['reseña'] ?? null;
  }

  async verDiagnostico(turnoId: string) {
    const { data, error } = await this.supabase.client
      .from('turnos')
      .select('diagnostico')
      .eq('id', turnoId)
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data?.diagnostico ?? null;
  }

  async enviarEncuesta(turnoId: string, encuesta: string[]) {
    const { error } = await this.supabase.client
      .from('turnos')
      .update({ encuesta: encuesta, encuesta_completada: true })
      .eq('id', turnoId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async enviarCalificacion(turnoId: string, calificacion: number) {
    const { error } = await this.supabase.client
      .from('turnos')
      .update({ calificacion: calificacion })
      .eq('id', turnoId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async obtenerTodosLosEspecialistas() {
    const { data, error } = await this.supabase.client
      .from('usuarios')
      .select('*')
      .eq('rol', 'especialista');

    if (error) {
      throw new Error('Error al obtener especialistas: ' + error.message);
    }

    return data;
  }

  async obtenerEspecialidadesDelEspecialista(espeId: string) {
    const { data, error } = await this.supabase.client
      .from('usuarios')
      .select('especialidades')
      .eq('rol', 'especialidad');

    if (error) {
      throw new Error('Error al obtener especialidades: ' + error.message);
    }
  }

  private async subirImagenEspecialidades(
    file: File,
    userId: string
  ): Promise<string> {
    const filePath = `especialidades/${userId}-${file.name}`;

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

  async cargarHistoriaClinica(
    turnoid: string,
    historiaClinica: any,
    pacienteId: string,
    especialistaId: string
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from('historias_clinicas')
      .insert({
        turno_id: turnoid,
        altura: historiaClinica.altura,
        peso: historiaClinica.peso,
        temperatura: historiaClinica.temperatura,
        presion: historiaClinica.presion,
        dinamicos: historiaClinica.dinamicos,
        paciente_id: pacienteId,
        especialista_id: especialistaId,
      });

    if (error) {
      throw new Error('Error al cargar historia clínica: ' + error.message);
    }
  }

  async mostrarHistoriaClinicaPaciente(pacienteId: string): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('historias_clinicas')
      .select(
        '*, especialista:usuarios!historias_clinicas_especialista_id_fkey(nombre, apellido)'
      )
      .eq('paciente_id', pacienteId);

    if (error) {
      throw new Error('Error al obtener historia clínica: ' + error.message);
    }

    return data;
  }

  async obtenerHistoriasClinicasPorEspecialista(especialistaId: string) {
    const { data, error } = await this.supabase.client
      .from('historias_clinicas')
      .select(
        `
  *,
  especialista:usuarios!historias_clinicas_especialista_id_fkey(nombre, apellido),
  paciente:usuarios!historias_clinicas_paciente_id_fkey(nombre, apellido)
`
      )
      .eq('especialista_id', especialistaId);
    if (error) {
      throw new Error('Error al obtener historia clínica: ' + error.message);
    }
    return data;
  }

  async obtenerTodasLasHistoriasClinicas(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('historias_clinicas')
      .select(
        `
  *,
  especialista:usuarios!historias_clinicas_especialista_id_fkey(nombre, apellido),
  paciente:usuarios!historias_clinicas_paciente_id_fkey(nombre, apellido)
`
      );
    if (error) {
      throw new Error('Error al obtener historias clínicas: ' + error.message);
    }
    return data;
  }

  async obtenerHistoriaClinicaPorTurno(turnoId: string): Promise<any> {
    const { data, error } = await this.supabase.client
      .from('historias_clinicas')
      .select('*')
      .eq('turno_id', turnoId)
      .single();

    if (error) {
      console.error('Error al obtener historia clínica', error);
      return null;
    }
    return data;
  }
  //logs
  async obtenerLogIngresos(fechaDesde?: string, fechaHasta?: string) {
    let query = this.supabase.client.from('logs_ingresos').select(`
    usuario:usuario_id (
      nombre,
      apellido,
      email
    ),
    fecha_hora_ingreso
  `);

    if (fechaDesde) {
      const desdeISO = dayjs(fechaDesde).startOf('day').toISOString();
      query = query.gte('fecha_hora_ingreso', desdeISO);
    }

    if (fechaHasta) {
      const hastaISO = dayjs(fechaHasta).endOf('day').toISOString();
      query = query.lte('fecha_hora_ingreso', hastaISO);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Error al obtener log de ingresos: ' + error.message);
    }

    return data;
  }
  //turnos por especialidad
  async obtenerCantidadTurnosPorEspecialidad() {
    const { data, error } = await this.supabase.client
      .from('turnos')
      .select('especialidad');

    if (error) {
      throw new Error('Error al obtener turnos: ' + error.message);
    }

    const conteo: Record<string, number> = {};

    for (const turno of data) {
      const esp = turno.especialidad || 'Sin especialidad';
      conteo[esp] = (conteo[esp] || 0) + 1;
    }
    console.log('Conteo de turnos por especialidad:', conteo);
    return conteo;
  }

  //turnos por dia
  async cantidadTurnosPorDia() {
    const { data, error } = await this.supabase.client
      .from('turnos')
      .select('fecha_turno');

    if (error) throw new Error('Error al obtener turnos: ' + error.message);

    const conteo: Record<string, number> = {};

    for (const turno of data) {
      const fecha = turno.fecha_turno;
      conteo[fecha] = (conteo[fecha] || 0) + 1;
    }
    console.log('Conteo de turnos por día:', conteo);
    return conteo; // Ej: { '2025-06-27': 4, '2025-06-28': 2 }
  }
  //turnos por medico en x rango de fechas
  async turnosPorMedicoEnRango(fechaInicio: string, fechaFin: string) {
    const { data, error } = await this.supabase.client
      .from('turnos')
      .select(
        `
      especialista:especialista_id (
        id,
        nombre,
        apellido
      ),
      fecha_turno
    `
      )
      .gte('fecha_turno', fechaInicio)
      .lte('fecha_turno', fechaFin);

    if (error) throw new Error('Error al obtener turnos: ' + error.message);

    const conteo: Record<string, number> = {};

    for (const turno of data) {
      const especialista = Array.isArray(turno.especialista)
        ? turno.especialista[0]
        : turno.especialista;

      if (!especialista) continue;

      const medico = `${especialista.nombre} ${especialista.apellido}`;
      conteo[medico] = (conteo[medico] || 0) + 1;
    }
    console.log('Conteo de turnos por médico:', conteo);
    return conteo;
  }
  //turnos finalizados por medico en x rango de fechas
  async turnosFinalizadosPorMedicoEnRango(
    fechaInicio: string,
    fechaFin: string
  ) {
    const { data, error } = await this.supabase.client
      .from('turnos')
      .select(
        `
      especialista:especialista_id (
        id,
        nombre,
        apellido
      ),
      fecha_turno,
      estado
    `
      )
      .eq('estado', 'finalizado')
      .gte('fecha_turno', fechaInicio)
      .lte('fecha_turno', fechaFin);

    if (error) throw new Error('Error al obtener turnos: ' + error.message);

    const conteo: Record<string, number> = {};

    for (const turno of data) {
      const especialista = Array.isArray(turno.especialista)
        ? turno.especialista[0]
        : turno.especialista;

      if (!especialista) continue;

      const medico = `${especialista.nombre} ${especialista.apellido}`;
      conteo[medico] = (conteo[medico] || 0) + 1;
    }
    console.log('Conteo de turnos finalizados por médico:', conteo);
    return conteo; // Ej: { 'Juan Pérez': 3 }
  }

  async obtenerPacientesAtendidosPorEspecialista(especialistaId: string) {
    const { data, error } = await this.supabase.client
      .from('turnos')
      .select('paciente:paciente_id (id, nombre, apellido, imagenPerfil)')
      .eq('especialista_id', especialistaId)
      .eq('estado', 'finalizado'); // o los estados que consideres válidos

    if (error) throw error;

    // Evita repetidos por ID
    const pacientesUnicos = Object.values(
      data.reduce((acc: { [id: string]: any }, turno: any) => {
        if (turno.paciente?.id && !acc[turno.paciente.id]) {
          acc[turno.paciente.id] = turno.paciente;
        }
        return acc;
      }, {})
    );
    return pacientesUnicos;
  }

  async obtenerTurnosDePacienteConEspecialista(
    pacienteId: string | null | undefined,
    especialistaId: string
  ) {
    if (!pacienteId) {
      // Manejar el caso cuando pacienteId no está definido
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('turnos')
      .select('*,paciente:paciente_id(id,nombre,apellido,imagenPerfil)')
      .eq('paciente_id', pacienteId)
      .eq('especialista_id', especialistaId)
      .eq('estado', 'finalizado');

    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  }

  async obtenerHistoriasClinicasDePacienteConEspecialista(
    pacienteId: string,
    especialistaId: string
  ) {
    const { data, error } = await this.supabase.client
      .from('historias_clinicas')
      .select(
        `
      *,
      paciente:paciente_id (id, nombre, apellido, imagenPerfil)
    `
      )
      .eq('paciente_id', pacienteId)
      .eq('especialista_id', especialistaId)
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error al obtener historias clínicas:', error.message);
      return [];
    }

    return data || [];
  }

  async obtenerTurnosPorPaciente(pacienteId: string): Promise<any[]> {
    if (!pacienteId) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('turnos')
      .select(
        'fecha_turno, hora_turno, especialidad, estado, diagnostico, comentario_cancelacion, especialista:especialista_id(id,nombre,apellido,imagenPerfil)'
      )
      .eq('paciente_id', pacienteId);

    if (error) {
      console.error('Error al obtener turnos del paciente:', error.message);
      return [];
    }

    return data || [];
  }

  async obtenerEspecialistas() {
    const { data, error } = await this.supabase.client
      .from('usuarios')
      .select('*')
      .eq('rol', 'especialista');

    if (error) throw error;
    return data;
  }
}
