import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonImg } from '@ionic/angular/standalone';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-create-successfully',
  templateUrl: './create-successfully.component.html',
  styleUrls: ['./create-successfully.component.scss'],
  imports: [IonImg, IonButton],
})
export class CreateSuccessfullyComponent implements AfterViewInit {
  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    const audio = new Audio(
      '/assets/Audio/833630__nomagician__success-sound-effect.mp3'
    );
    audio.volume = 0.25;
    audio.play().catch((err) => console.log('error playing audio:', err));
    console.log('Sound Played Successfully 👌');

    // Call  launchConfetti() Function
     setTimeout(()=>this.launchConfetti(), 500);
  }

  goLogin() {
    const card = document.querySelector('.success-card') as HTMLElement;
    card.classList.add('exit');
    setTimeout(() => this.router.navigate(['/Login']), 600);
    console.error();
  }

  initParticles() {
    const canvas = document.querySelector(
      '.particles-canvas'
    ) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; r: number; speed: number }[] = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
      });
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(255,255,255,0.6)';
        ctx!.fill();
        p.y -= p.speed;
        if (p.y < 0) p.y = canvas.height;
      });
      requestAnimationFrame(animate);
    }
    animate();
  }
   launchConfetti() {
   confetti({
  particleCount: 1000,
  spread: 100,
  origin: { y: 0.6 },
  scalar: 1.5, // أكبر من الحجم الطبيعي
});
  }
}
