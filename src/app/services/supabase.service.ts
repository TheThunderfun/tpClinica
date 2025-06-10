import { Injectable } from '@angular/core';
import { supaBase } from '../enviromentConfig';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  supBase: SupabaseClient;
  constructor() {
    this.supBase = createClient(supaBase.url, supaBase.apiKey);
  }

  get auth() {
    return this.supBase.auth;
  }

  get client() {
    return this.supBase;
  }
}
