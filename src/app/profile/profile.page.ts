import { Data } from './../services';
import { RouterLink } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonFooter,
  IonButtons,
  IonLabel,
  IonTabs,
  IonTabBar,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonTabBar,
    IonTabs,
    IonLabel,
    IonButtons,
    IonFooter,
    IonIcon,
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    RouterLink,
  ],
})
export class ProfilePage implements OnInit {
  userData: any = null;

  // ✅ Toast state
  toastVisible = false;
  toastMessage = '';
  toastSubMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  // ✅ Confirm dialog state
  confirmVisible = false;
  confirmLoading = false;

  constructor(
    private _services: Data,
    private router: Router,
  ) {}

  ngOnInit() {
    this._services
      .getUser()
      .then((res: any) => {
        console.log('✅ User data fetched', res);
        this.userData = res;
      })
      .catch((err) => {
        console.error('❌ Error', err);
      });
  }

  // ✅ Custom toast
  showToast(message: string, sub: string, type: 'success' | 'error') {
    clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastSubMessage = sub;
    this.toastType = type;
    this.toastVisible = true;
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  async logout() {
    try {
      await this._services.logout();
      this.showToast('تم تسجيل الخروج', 'إلى اللقاء!', 'success');
      setTimeout(() => this.router.navigate(['/Login']), 1500);
    } catch (error) {
      console.error('Logout failed:', error);
      this.showToast('فشل تسجيل الخروج', 'حاول مرة أخرى', 'error');
    }
  }

  // ✅ Show custom confirm dialog instead of confirm()
  deleteAccount() {
    this.confirmVisible = true;
  }

  cancelDelete() {
    this.confirmVisible = false;
  }

  async confirmDelete() {
    this.confirmLoading = true;
    try {
      const res = await this._services.Delete_Account();
      console.log('✔️', res);
      localStorage.clear();
      this.confirmVisible = false;
      this.confirmLoading = false;
      this.showToast('تم حذف الحساب', 'نأسف لرؤيتك تغادر', 'success');
      setTimeout(() => this.router.navigate(['/register']), 2000);
    } catch (err) {
      console.error('❌', err);
      this.confirmLoading = false;
      this.confirmVisible = false;
      this.showToast('فشل حذف الحساب', 'حاول مرة أخرى', 'error');
    }
  }
}
