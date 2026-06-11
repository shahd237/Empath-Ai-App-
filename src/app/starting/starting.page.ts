import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Data } from '../services';
import lottie from 'lottie-web';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-starting',
  templateUrl: './starting.page.html',
  styleUrls: ['./starting.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, RouterLink],
})
export class StartingPage implements AfterViewInit {
  constructor(
    private router: Router,
    private _services: Data,
  ) {}

  ngAfterViewInit() {
    const container = document.getElementById('lottie-container');

    if (container) {
      try {
        lottie.loadAnimation({
          container: container,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: '/assets/animation/online doctor.json',
        });

        // Navigate after animation (3 seconds)
        setTimeout(() => {
          if (this._services.isLoggedIn()) {
            this.router.navigate(['/home']);
          } else {
            this.router.navigate(['/Login']);
          }
        }, 3000);
      } catch (error) {
        console.error('Error loading Lottie animation:', error);
        // If animation fails, navigate to home immediately
        // this.router.navigate(['/home']);
      }
    } else {
      // If container not found, navigate to home
      // this.router.navigate(['/home']);
    }
  }
}
