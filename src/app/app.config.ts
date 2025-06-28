import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
//import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideFirestore(() => getFirestore()),
    //provideAnimationsAsync(),
    provideToastr({
      timeOut: 1500,
      positionClass: 'toast-top-center',
      preventDuplicates: true,
    }),
  ],
};
