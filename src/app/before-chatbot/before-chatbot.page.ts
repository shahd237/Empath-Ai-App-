import { AfterViewInit, Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import lottie from 'lottie-web';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {NavController } from "@ionic/angular";

@Component({
  selector: 'app-before-chatbot',
  templateUrl: './before-chatbot.page.html',
  styleUrls: ['./before-chatbot.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class BeforeChatbotPage implements AfterViewInit {

  @ViewChild('lottieContainer', { static: true }) lottieContainer!: ElementRef<HTMLDivElement>;

  constructor(private router: Router, private navCtrl: NavController) { }

  ngAfterViewInit() {
    // نتأكد من وجود العنصر
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
        path: 'assets/animation/Hello Chat Bot.json', // تأكدي إن الاسم صحيح تماماً
      });

      // Navigate after 4 seconds
      setTimeout(() => {
        this.navCtrl.navigateRoot('/chatbot');
      }, 4000);

    } catch (err) {
      console.error('Error loading Lottie:', err);
      // this.router.navigate(['/chatbot']);
    }
  }
  
}