import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {  IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonButton, IonInput } from '@ionic/angular/standalone';
import { Data } from '../services';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
@Component({
  selector: 'app-change',
  templateUrl: './change.page.html',
  styleUrls: ['./change.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
      // 🔥 مهم جدًا عشان ngModel يشتغل مع ion-input
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonButton,
    IonInput,
  ],
})
export class ChangePage implements OnInit {
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(
    private _services: Data,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {}

async presentToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top',
    });
    await toast.present();
  }

  // Success animation placeholder
  successAnimation() {
    // هنا حطي الكود الخاص بالـ Lottie animation أو أي animation عند النجاح
    console.log('✨ Success animation triggered');
  }

  // Error animation placeholder
  errorAnimation() {
    // هنا حطي الكود الخاص بالـ Lottie animation أو أي animation عند الخطأ
    console.log('💥 Error animation triggered');
  }

  // Function to change password
  async changePassword() {
    const oldPass = this.currentPassword?.trim();
    const newPass = this.newPassword?.trim();
    const confirmPass = this.confirmPassword?.trim();

    if (!oldPass || !newPass || !confirmPass) {
      this.errorAnimation();
      this.presentToast('كل الحقول مطلوبة', 'danger');
      return;
    }

    if (newPass !== confirmPass) {
      this.errorAnimation();
      this.presentToast('كلمة المرور الجديدة غير متطابقة', 'danger');
      return;
    }

    try {
      const response = await this._services.Change_Password(oldPass, newPass, confirmPass);
      console.log('✔️ Password changed:', response);
      // this.successAnimation();
      alert(' ✔️ تم تغيير كلمة المرور بنجاح');
      this.router.navigate(['/home']); 
    } catch (err: any) {
      console.error('❌ Error changing password:', err);
      // this.errorAnimation();
      alert('❌ فشل تغيير كلمة المرور');
    }
  }

}