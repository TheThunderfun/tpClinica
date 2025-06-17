import { Injectable } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Usuario } from '../class/usuario';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null> = this.userSubject.asObservable();

  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  usuario$: Observable<Usuario | null> = this.usuarioSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    // Escucho cambios en el estado de autenticación
    this.supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      this.userSubject.next(user);

      if (user?.email) {
        this.cargarPerfilUsuario(user.email);
      } else {
        this.usuarioSubject.next(null);
      }
    });

    this.supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null;
      this.userSubject.next(user);

      if (user?.email) {
        this.cargarPerfilUsuario(user.email);
      }
    });
  }

  private async cargarPerfilUsuario(email: string) {
    const { data: usuarioData, error } = await this.supabase.client
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !usuarioData) {
      this.usuarioSubject.next(null);
    } else {
      this.usuarioSubject.next(usuarioData);
    }
  }

  async signIn(email: string, password: string): Promise<User | string> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      switch (error.message) {
        case 'Invalid login credentials':
          return Promise.reject('Credenciales inválidas.');
        case 'Email not confirmed':
          return Promise.reject('Por favor verifica tu correo electrónico.');
        default:
          return Promise.reject('Error al iniciar sesión: ' + error.message);
      }
    }

    const user = data.user;

    if (!user?.email_confirmed_at) {
      return Promise.reject(
        'Debes verificar tu correo electrónico para ingresar'
      );
    }

    const { data: usuarioData, error: usuarioError } =
      await this.supabase.client
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

    if (usuarioError || !usuarioData) {
      return Promise.reject('Error al obtener datos del usuario.');
    }

    if (usuarioData.rol === 'especialista' && !usuarioData.autorizado) {
      return Promise.reject(
        'Tu cuenta aún no fue autorizada por un administrador.'
      );
    }

    this.userSubject.next(user);
    this.usuarioSubject.next(usuarioData);
    return user;
  }

  async signUp(email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      switch (error.message) {
        case 'User already registered':
          return Promise.reject('El correo ya está en uso.');
        case 'Password should be at least 6 characters':
          return Promise.reject('Contraseña demasiado corta.');
        default:
          return Promise.reject('Error al registrarse: ' + error.message);
      }
    }

    this.userSubject.next(data.user ?? null);
    return data.user!;
  }

  async signOut() {
    await this.supabase.auth.signOut();
    this.userSubject.next(null);
    this.usuarioSubject.next(null);
  }

  getUser(): User | null {
    return this.userSubject.value;
  }

  getUsuario(): Usuario | null {
    return this.usuarioSubject.value;
  }
}
