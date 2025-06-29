import { Component } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import {
  trigger,
  transition,
  style,
  animate,
  group,
} from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavBarComponent, RouterLink, RouterLinkActive],
  animations: [
    trigger('routeAnimations', [
      // Slide desde derecha a izquierda
      transition('* => SlideIn', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate(
          '400ms ease-out',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),

      // Fade in
      transition('* => FadeIn', [
        style({ opacity: 0 }),
        animate('400ms ease-in-out', style({ opacity: 1 })),
      ]),

      // Slide desde izquierda a derecha
      transition('* => SlideOut', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate(
          '400ms ease-out',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),

      // Zoom In
      transition('* => ZoomIn', [
        style({ transform: 'scale(0.5)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
    ]),
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'rutas';
  constructor(private router: Router) {}

  goTo(path: string) {
    this.router.navigate([path]);
  }
  prepareRoute(outlet: RouterOutlet) {
    return (
      outlet &&
      outlet.activatedRouteData &&
      outlet.activatedRouteData['animation']
    );
  }
}
