import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput } from '@ionic/angular/standalone';
import lottie from 'lottie-web';
import { Router } from '@angular/router';
import { Data } from '../services';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-create-conversation',
  templateUrl: './create-conversation.page.html',
  styleUrls: ['./create-conversation.page.scss'],
  standalone: true,
  imports: [IonInput, IonButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,RouterLink]
})
export class CreateConversationPage implements OnInit, AfterViewInit {

  @ViewChild('lottieContainer', { static: true }) lottieContainer!: ElementRef<HTMLDivElement>;

  title: string = '';

  constructor(private router: Router, private _services: Data) { }

  ngOnInit() {}

  ngAfterViewInit() {
    if (!this.lottieContainer) return;

    try {
      lottie.loadAnimation({
        container: this.lottieContainer.nativeElement,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'assets/animation/Cute chatbot greeting people with computer.json',
      });
    } catch (err) {
      console.error('Error loading Lottie:', err);
    }
  }

  // createConversation() {

  //   if (!this.title.trim()) {
  //     alert("اكتب عنوان المحادثة");
  //     return;
  //   }

  //   this._services.newConversation(this.title).subscribe({

  //     next: (res: any) => {
  //       console.log("✅ Conversation Created", res);

  //       const newId = res.conversationId;

  //       // حفظه لو حبيت
  //       localStorage.setItem("conversationId", newId);

  //       // فتح المحادثة الجديدة
  //       this.router.navigate(['/chatbot']);
  //     },

  //     error: (err) => {
  //       console.error("❌ Error creating conversation", err);
  //     }

  //   });
  // }

}