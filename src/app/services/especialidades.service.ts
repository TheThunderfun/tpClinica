import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EspecialidadesService {
  private especialidadesSubject = new BehaviorSubject<any[]>([]);
  especialidades$: Observable<any[]> =
    this.especialidadesSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    this.cargarEspecialidades();
    this.suscribirseCambios();
  }

  private async cargarEspecialidades() {
    const { data, error } = await this.supabase.client
      .from('especialidades')
      .select('nombre');
    if (error) throw error;
    this.especialidadesSubject.next(data || []);
  }

  private suscribirseCambios() {
    this.supabase.client
      .channel('especialidades')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'especialidades' },
        (payload) => {
          this.cargarEspecialidades(); // recarga al haber cambios
        }
      )
      .subscribe();
  }

  async agregarEspecialidad(especialidad: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('especialidades')
      .insert({ nombre: especialidad });
    if (error) throw error;
  }
}
