import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Data } from './services';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private router: Router,
    private _services: Data,
  ) {
  const saved = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-theme', saved);
  }

  ngOnInit() {
    this.applySavedTheme();

    if (this._services.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  }

  private applySavedTheme(): void {
    const storedTheme = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = storedTheme !== null ? storedTheme === 'true' : prefersDark;
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }
}
