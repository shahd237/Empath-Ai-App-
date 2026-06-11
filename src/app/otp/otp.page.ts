import {
  Component, OnInit, ViewChildren, QueryList, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonIcon,
} from '@ionic/angular/standalone';
import { Data } from '../services';
import { Router } from '@angular/router';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.page.html',
  styleUrls: ['./otp.page.scss'],
  standalone: true,
  imports: [
    IonIcon, IonContent, IonHeader, IonTitle, IonToolbar,
    CommonModule, FormsModule,
  ],
})
export class OTPPage implements OnInit {

  userEmail  = '';
  maskedEmail = '';
  isSuccess  = false;
  isError    = false;

  @ViewChildren('otpInput') inputs!: QueryList<ElementRef>;
  otpArray = new Array(6);
  otpCode: string[] = [];

  constructor(
    private _services: Data,
    private router: Router,
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.inputs.first?.nativeElement.focus();
    }, 300);
  }

  maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (name.length <= 2) return name[0] + '***@' + domain;
    return name.substring(0, 2) + '***@' + domain;
  }

  onInput(event: any, index: number) {
    const value = event.target.value.replace(/\D/g, '');
    event.target.value = value;
    this.otpCode[index] = value;

    if (value && index < 5) {
      this.inputs.toArray()[index + 1].nativeElement.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.otpCode[index] && index > 0) {
      this.inputs.toArray()[index - 1].nativeElement.focus();
    }
  }

  successAnimation() {
    this.isSuccess = true;
    setTimeout(() => {
      this.isSuccess = false;
      this.router.navigate(['/upload_image']);
    }, 2000);
  }

  errorAnimation() {
    this.isError = true;
    if (navigator.vibrate) navigator.vibrate(300);
    setTimeout(() => { this.isError = false; }, 2000);
  }

  clearInputs() {
    this.otpCode = [];
    this.inputs.forEach((input) => (input.nativeElement.value = ''));
    this.inputs.first?.nativeElement.focus();
  }

  async verifyOtp() {
    const code  = this.otpCode.join('');
    const email = localStorage.getItem('email');

    if (!email) {
      alert('❌ لا يوجد بريد إلكتروني');
      return;
    }

    if (code.length < 6) {
      this.errorAnimation();
      return;
    }

    try {
      const res = await this._services.OTP(code, email);

      console.log('🔥 FULL RESPONSE:', res);
      console.log('📦 DATA:', res?.data);

      const status = res?.status;
      const data   = res?.data;

      // 🔥 Handle server error
      if (status === 500) {
        console.error('🔥 Server Error');
        this.errorAnimation();
        alert('❌ السيرفر فيه مشكلة، جربي تاني بعد شوية');
        return;
      }

      // 🔍 Extract token from all possible formats
      const token =
        data?.token ||
        data?.accessToken ||
        data?.access_token ||
        data?.data?.token ||
        data?.jwt ||
        null;

      console.log('🔑 Token:', token ? token : 'NO TOKEN');

      // ✅ Success conditions
      const isSuccess =
        status === 200 && (
          data === true ||
          data === 'true' ||
          data?.success === true ||
          data?.message?.toLowerCase()?.includes('success') ||
          data?.message?.toLowerCase()?.includes('verified') ||
          token !== null
        );

      if (isSuccess) {
        console.log('✅ OTP verified');

        if (token) {
          localStorage.setItem('auth_token', token);
          console.log('💾 Token saved');
        } else {
          console.warn('⚠️ No token returned from API');
        }

        this.successAnimation();

      } else {
        console.log('❌ OTP incorrect');
        this.errorAnimation();
        alert('❌ الكود غير صحيح');
      }

    } catch (err: any) {
      console.error('❌ ERROR:', err);

      this.errorAnimation();

      // 🔥 Handle network/server crash
      if (err?.status === 500) {
        alert('❌ السيرفر واقع، جربي بعد شوية');
      } else {
        alert('❌ حصل خطأ، تأكدي من الإنترنت');
      }
    }
  }
}