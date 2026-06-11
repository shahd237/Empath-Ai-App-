import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { IonHeader, IonIcon, IonContent } from '@ionic/angular/standalone';
import { Data } from '../services';
import { Camera, CameraResultType } from '@capacitor/camera';

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  emergencyPhone: string;
  photoUrl?: string;
}

@Component({
  selector: 'app-edit',
  standalone: true,
  imports: [IonHeader, IonIcon, IonContent, CommonModule, FormsModule],
  templateUrl: './edit.page.html',
  styleUrls: ['./edit.page.scss'],
})
export class EditProfilePage implements OnInit {
  profile: UserProfile = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    emergencyPhone: '',
    photoUrl: '',
  };

  private readonly fieldLabels: Record<keyof UserProfile, string> = {
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    phone: 'رقم الهاتف',
    email: 'البريد الإلكتروني',
    emergencyPhone: 'رقم الطوارئ',
    photoUrl: 'الصورة الشخصية',
  };

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private _services: Data,
  ) {}

 async ngOnInit(): Promise<void> {
  this.loadProfile(); // localStorage fallback first

  try {
    const res: any = await this._services.getUser();
    console.log('✅ User data fetched', res);

    this.profile = {
      firstName:      res.first_Name          || '',
      lastName:       res.last_Name           || '',
      phone:          res.phone               || '',
      email:          res.email               || '',
      emergencyPhone: res.emergancy_Contact   || '',  // ← correct API key
      photoUrl:       res.image_URl           || '',
    };

  } catch (err) {
    console.error('❌ Error fetching user', err);
  }
}

  // ── Load profile from localStorage as fallback ────────
 private loadProfile(): void {
  const stored = localStorage.getItem('userProfile');
  if (stored) {
    try {
      this.profile = { ...this.profile, ...JSON.parse(stored) };
    } catch {
      localStorage.removeItem('userProfile'); // 👈 clear corrupted/stale data
    }
  }
}

  goBack(): void {
    this.router.navigate(['/profile']);
  }

  save(): void {
    this.saveChanges();
  }

  async changePhoto(): Promise<void> {
    const image = await Camera.getPhoto({ resultType: CameraResultType.Uri });
    // 3️⃣ Guard against undefined webPath
    if (image.webPath) {
      this.profile.photoUrl = image.webPath;
    }
    await this.showToast('سيتم فتح الكاميرا أو المعرض');
  }

 async editField(field: keyof UserProfile): Promise<void> {
  const label   = this.fieldLabels[field];
  const current = this.profile[field] as string;

  const alert = await this.alertCtrl.create({
    header: `تعديل ${label}`,
    inputs: [
      {
        name: 'value',
        type: field === 'email' ? 'email' : 'text',
        value: current,
        placeholder: label,
        attributes: { dir: 'auto' },
      },
    ],
    buttons: [
      { text: 'إلغاء', role: 'cancel' },
      {
        text: 'حفظ',
        handler: (data: { value: string }) => {
          const trimmed = data.value?.trim();
          if (!trimmed) return false;

          // ✅ Replace the whole object so Angular detects the change
          this.profile = {
            ...this.profile,
            [field]: trimmed,
          };

          return true;
        },
      },
    ],
    cssClass: 'rtl-alert',
  });

  await alert.present();
}

  private validate(): string | null {
    if (!this.profile.firstName.trim())     return 'الاسم الأول مطلوب';
    if (!this.profile.lastName.trim())      return 'اسم العائلة مطلوب';
    if (!this.profile.phone.trim())         return 'رقم الهاتف مطلوب';
    if (!this.profile.email.trim())         return 'البريد الإلكتروني مطلوب';
    if (!/\S+@\S+\.\S+/.test(this.profile.email))
                                            return 'البريد الإلكتروني غير صحيح';
    if (!this.profile.emergencyPhone.trim()) return 'رقم الطوارئ مطلوب';
    return null;
  }

async saveChanges(): Promise<void> {
  const error = this.validate();
  if (error) {
    await this.showToast(error, 'danger');
    return;
  }

  const userId = this._services.getUserIdFromToken();
  console.log('👤 Sending userId in payload:', userId);

  const payload = {
   user_id:  userId,             // ← add the ID in the body
    First_Name:        this.profile.firstName,
    Last_Name:         this.profile.lastName,
    Phone:             this.profile.phone,
    Email:             this.profile.email,
    Emergancy_Contact: this.profile.emergencyPhone,
    Image_URl:         this.profile.photoUrl,
    Age:               0,
    Gender:            'string',
    Password:          'string',
    Confirm_Password:  'string',
  };

  try {
    const res = await this._services.EditUser(payload);
    console.log('✅ Edit response', res);

    if (res.status === 200 || res.status === 204) {
      localStorage.setItem('userProfile', JSON.stringify(this.profile));
      await this.showToast('تم حفظ التغييرات بنجاح ✓', 'success');
      this.router.navigate(['/profile']);
    } else {
      console.error('❌ Unexpected status', res.status, res.data);
      await this.showToast('فشل حفظ التغييرات', 'danger');
    }
  } catch (err) {
    console.error('❌ Edit failed', err);
    await this.showToast('فشل حفظ التغييرات', 'danger');
  }
}

  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' | 'medium' = 'medium',
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom',
      cssClass: `toast-${color}`,
    });
    await toast.present();
  }
}