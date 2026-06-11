import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private audio?: HTMLAudioElement;
  private started = false;

  init(src: string) {
    if (!this.audio) {
      this.audio = new Audio(src);
      this.audio.loop = true;
      this.audio.volume = 0.3;
    }
  }

  playOnce() {
    if (this.started || !this.audio) return;

    this.audio.play()
      .then(() => this.started = true)
      .catch(() => {});
  }

  playLoop() {
    if (!this.audio) return;
    this.audio.play().catch(err => console.log('Audio play error:', err));
  }

  stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.started = false;
  }
}

