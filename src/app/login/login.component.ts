import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, CommonModule } from '@angular/common';
import {
  IonContent, IonItem, IonInput, IonButton, IonIcon,
  IonList, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  eye, eyeOff, logoFacebook, logoGoogle,
  mailOutline, lockClosedOutline, leafOutline,
  personOutline, logoApple, checkmarkCircleOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { Data } from '../services';
import { AudioService } from '../audio';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    IonCardContent, IonCardTitle, IonCardHeader, IonCard,
    FormsModule, IonItem, IonInput, IonButton, IonIcon,
    IonContent, IonList, RouterLink, NgClass, CommonModule,
  ],
})
export class LoginComponent implements OnInit {

  login = { Email: '', Password: '' };
  showPassword = false;
  loginError   = false;

  // ✅ Toast state
  toastVisible = false;
  toastMessage = '';
  toastSubMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(
    private alertCtrl: AlertController,
    private _services: Data,
    private router: Router,
    private audioService: AudioService,
  ) {
    addIcons({
      leafOutline, mailOutline, personOutline, lockClosedOutline,
      logoFacebook, logoApple, logoGoogle, eye, eyeOff,
      checkmarkCircleOutline, alertCircleOutline,
    });
  }

  ngOnInit() {
    const token = localStorage.getItem('auth_token');
  }

  ionViewWillLeave() { this.audioService.stop(); }
  Startaudio()       { this.audioService.playOnce(); }
  togglePassword()   { this.showPassword = !this.showPassword; }
  clearError()       { this.loginError = false; }

  // openfacebook() { window.open('https://www.facebook.com', '_blank'); }
  // openGoogle()   { window.open('https://accounts.google.com', '_blank'); }

  // ✅ Custom toast
  showToast(message: string, sub: string, type: 'success' | 'error') {
    clearTimeout(this.toastTimer);
    this.toastMessage    = message;
    this.toastSubMessage = sub;
    this.toastType       = type;
    this.toastVisible    = true;
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  async alertEmail() {
    const alert = await this.alertCtrl.create({
      header: 'استعادة كلمة المرور',
      mode: 'md',
      inputs: [
        { type: 'email', name: 'email', placeholder: 'ادخل البريد الالكتروني' },
      ],
      buttons: [
        { text: 'ارسال',  handler: (data) => console.log(data) },
        { text: 'الغاء',  role: 'cancel' },
      ],
    });
    await alert.present();
  }

  async Login() {
    this.loginError = false;

    if (!this.login.Email || !this.login.Password) {
      this.loginError = true;
      this.showToast('بيانات ناقصة', 'يرجى إدخال البريد وكلمة المرور', 'error');
      return;
    }

    try {
      const response = await this._services.LoginData(this.login);

      if (response?.token) {
        localStorage.setItem('auth_token', response.token);

        const userId = this._services.getUserIdFromToken();
        if (userId) localStorage.setItem('userId', userId.toString());

        this.showToast('تم تسجيل الدخول بنجاح', 'مرحباً بعودتك!', 'success');

        setTimeout(async () => {

       const hasReport = await this._services.CheckMedicalReport();
       if (hasReport) {
       this.router.navigate(['/welcome-lottie']);
       } else {
       this.router.navigate(['/disease']);
       }

       }, 1500);

      } else {
        this.loginError = true;
        this.showToast('فشل تسجيل الدخول', 'يرجى التحقق من البريد وكلمة المرور', 'error');
      }

    } catch (err) {
      console.error(err);
      this.showToast('خطأ في الاتصال', 'تحقق من اتصالك بالإنترنت', 'error');
    }
  }


}