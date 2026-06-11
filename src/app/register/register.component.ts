import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonRadio,
  IonButton,
  IonIcon,
  IonRadioGroup,
  IonImg,
} from '@ionic/angular/standalone';

import { Data } from '../services';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [
    IonRadioGroup,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonRadio,
    IonButton,
    IonIcon,
    FormsModule,
    IonImg,
    RouterLink,
    CommonModule,
  ],
})
export class RegisterComponent implements OnInit {
  // Object to hold user registration data
  user: any = {
    First_Name: '',
    Last_Name: '',
    Phone: '',
    Email: '',
    Password: '',
    Confirm_Password: '',
    Gender: '',
    Emergancy_Contact: '',
    Age: '',
  };
  constructor(
    private router: Router,
    private _services: Data,
  ) {}

  ngOnInit() {}

  // RegisterComponent.ts
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  showToast(message: string, type: 'success' | 'error') {
    clearTimeout(this.toastTimer);

    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;

    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 3000); // يظهر 3 ثواني
  }

  submitted: boolean = false;
  formError: string = '';
  passwordError: boolean = false;
  fieldsTouched: { [key: string]: boolean } = {};

  emailPattern = /^\S+@\S+\.\S+$/;
  phonePattern = /^\d{8,15}$/;

  setTouched(field: string) {
    this.fieldsTouched[field] = true;

    if (field === 'Password' || field === 'Confirm_Password') {
      this.checkPasswordMatch();
    }
  }

  isFieldRequiredError(field: string): boolean {
    return (this.submitted || this.fieldsTouched[field]) && !this.user[field];
  }

  isEmailInvalid(): boolean {
    return (
      (this.submitted || this.fieldsTouched['Email']) &&
      !!this.user.Email &&
      !this.emailPattern.test(this.user.Email)
    );
  }

  isPhoneInvalid(): boolean {
    return (
      (this.submitted || this.fieldsTouched['Phone']) &&
      !!this.user.Phone &&
      !this.phonePattern.test(this.user.Phone)
    );
  }

  checkPasswordMatch() {
    if (
      this.user.Confirm_Password &&
      this.user.Password !== this.user.Confirm_Password
    ) {
      this.passwordError = true;
    } else {
      this.passwordError = false;
    }
  }

  showpassword: boolean = false;
  showConfirmPassword: boolean = false;
  togglePassWord() {
    this.showpassword = !this.showpassword;
  }

  toggleConfirmPassWord() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Register Functionality
  async Register() {
    this.submitted = true;
    Object.keys(this.user).forEach((k) => (this.fieldsTouched[k] = true));
    this.checkPasswordMatch();

    if (this.passwordError) {
      this.formError = 'كلمة المرور وتأكيدها يجب أن يتطابقا.';
      return;
    }

    if (
      !this.user.First_Name ||
      !this.user.Last_Name ||
      !this.user.Phone ||
      !this.user.Email ||
      !this.user.Password ||
      !this.user.Confirm_Password ||
      !this.user.Gender ||
      !this.user.Emergancy_Contact ||
      !this.user.Age ||
      this.isEmailInvalid() ||
      this.isPhoneInvalid()
    ) {
      this.formError = 'يرجى تصحيح الأخطاء قبل المتابعة.';
      return;
    }

    this.formError = '';

    try {
      const response = await this._services.PostData(this.user);
      console.log('Registration successful:', response);
      localStorage.setItem('email', this.user.Email);
      this.router.navigate(['/otp']);
    } catch (error) {
      console.error('Registration failed:', error);
      this.formError = 'حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى.';
    }
  }
}
