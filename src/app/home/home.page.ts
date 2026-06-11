import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Data } from '../services';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonCardHeader,
  IonButton,
  IonIcon,
  IonFooter,
  IonButtons,
  IonFab,
  IonFabButton,
  IonLabel, IonTabs, IonTabBar, IonTabButton } from '@ionic/angular/standalone';
import { AudioService } from '../audio';
import lottie from 'lottie-web';
import { Router } from '@angular/router';



@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonTabButton, IonTabBar, IonTabs, 
    IonLabel,
    IonIcon,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    CommonModule,
    FormsModule,
    IonButton,
    IonFooter,
    IonToolbar,
    IonFab,
    IonFabButton,
    RouterLink,
    IonButtons,
    IonHeader,
    IonTitle,
  ],
})
export class HomePage implements OnInit {
  @ViewChild('lottieContainer', { static: true })
  lottieContainer!: ElementRef<HTMLDivElement>;
  constructor(
    private audioservice: AudioService,
    private router: Router,
    private _services: Data,
  ) {}

  ngOnInit() {
    // this.PlayAudio();  Play Once but when i make reload again not play sound in background
  }

  async logout() {
    try {
      await this._services.logout();
      this.router.navigate(['/Login']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

}
