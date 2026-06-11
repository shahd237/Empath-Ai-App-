import { AfterViewInit, Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import lottie from 'lottie-web';
import confetti from 'canvas-confetti';
import {NavController } from "@ionic/angular";

@Component({
  selector: 'app-welcome-lottie',
  templateUrl: './welcome-lottie.page.html',
  styleUrls: ['./welcome-lottie.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class WelcomeLottiePage implements AfterViewInit {

  @ViewChild('lottieContainer', { static: true }) lottieContainer!: ElementRef<HTMLDivElement>;

  constructor(private router: Router, private navCtrl: NavController) { }

  ngAfterViewInit() {
    // 🎉 Confetti
    setTimeout(() => this.launchConfetti(), 1000);

    // 🎬 Lottie Animation
    if (!this.lottieContainer) {
      console.error('Lottie container not found!');
      return;
    }

    try {
      lottie.loadAnimation({
        container: this.lottieContainer.nativeElement,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'assets/animation/Cat playing animation.json', 
      });

      // Navigate after 6 seconds
      setTimeout(() => this.navCtrl.navigateRoot('/home'), 6000);

    } catch (err) {
      console.error('Error loading Lottie animation:', err);
      this.navCtrl.navigateRoot('/home');
    }
  }

  launchConfetti() {
    confetti({
      particleCount: 1000,
      spread: 80,
      origin: { y: 0.6 }
    });
  }
}