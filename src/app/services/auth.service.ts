import { Injectable } from '@angular/core';
import { User, AuthError, Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: User | null = null;

  constructor(private supabase: SupabaseService) {
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.userSubject.next(session?.user ?? null);
    });

    // Recuperar usuario al refrescar
    this.supabase.auth.getSession().then(({ data }) => {
      this.userSubject.next(data.session?.user ?? null);
    });
  }

  private userSubject = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null> = this.userSubject.asObservable();

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

    if (data.user?.email_confirmed_at) {
      this.userSubject.next(data.user);
      return data.user;
    } else {
      return Promise.reject(
        'Debes vererficar tu correo electrónico para ingresar'
      );
    }
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
  }

  getUser(): User | null {
    return this.userSubject.value;
  }
}
