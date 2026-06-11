import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonIcon,
  IonButton,
  IonInput
} from '@ionic/angular/standalone';
import {Data} from '../services';

@Component({
  selector: 'app-forget',
  templateUrl: './forget.page.html',
  styleUrls: ['./forget.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonIcon,
    IonButton,
    IonInput
  ]
})
export class ForgetPage implements OnInit {

  email: string = '';

  constructor(private _services: Data) {}

  ngOnInit() {}

async sendEmail() {

  if (!this.email) {
    alert('من فضلك أدخل البريد الإلكتروني');
    return;
  }

  try {

    const res = await this._services.Forget_Password(this.email);

    console.log('✅', res);

    alert('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك');

  } catch (err: any) {

    console.error('❌ Error sending email', err);

    alert('البريد الإلكتروني غير صحيح أو حدث خطأ');

  }

  console.log('Email:', this.email);
}
}