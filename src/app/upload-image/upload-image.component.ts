import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonButton, IonProgressBar } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-upload-image',
  templateUrl: './upload-image.component.html',
  styleUrls: ['./upload-image.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon, IonContent, RouterLink, IonProgressBar],
})
export class UploadImageComponent implements OnInit {
  image: string | null = null;
  uploadProgress = 0;
  isUploading    = false;

  // ✅ Toast state
  toastVisible    = false;
  toastMessage    = '';
  toastSubMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  // ✅ Upload status steps
  uploadStatus: 'idle' | 'compressing' | 'uploading' | 'success' | 'error' = 'idle';

  constructor(
    private alertController: AlertController,
    private router: Router,
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('auth_token');
    console.log('🔑 Token:', token ? token.substring(0, 30) + '...' : 'NO TOKEN');
  }

  // ✅ Custom toast
  showToast(message: string, sub: string, type: 'success' | 'error') {
    clearTimeout(this.toastTimer);
    this.toastMessage    = message;
    this.toastSubMessage = sub;
    this.toastType       = type;
    this.toastVisible    = true;
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 4000);
  }

  async SelectImage() {
    const alert = await this.alertController.create({
      header: 'اختر الصورة',
      buttons: [
        { text: 'الكاميرا',  handler: () => this.openCamera(CameraSource.Camera) },
        { text: 'الاستوديو', handler: () => this.openCamera(CameraSource.Photos) },
        { text: 'إلغاء', role: 'cancel' },
      ],
    });
    await alert.present();
  }

  async openCamera(source: CameraSource) {
    try {
      const photo = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source,
      });

      this.image        = `data:image/jpeg;base64,${photo.base64String}`;
      this.uploadStatus = 'compressing';
      this.uploadProgress = 0;

      let file = this.base64ToFile(photo.base64String!, 'profile.jpg');
      console.log('📸 Before compress:', file.size);

      if (file.size > 2 * 1024 * 1024) {
        file = await this.compressImage(file);
        console.log('📸 After compress:', file.size);
      }

      await this.uploadImage(file);

    } catch (error) {
      console.error('❌ Camera error', error);
      this.uploadStatus = 'error';
      this.showToast('فشل فتح الكاميرا', 'حاول مرة أخرى', 'error');
    }
  }

  base64ToFile(base64: string, filename: string): File {
    const byteString  = atob(base64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray    = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }
    return new File([intArray], filename, { type: 'image/jpeg' });
  }

  async compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1024;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width  = Math.round(width  * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(new File([blob!], 'profile.jpg', { type: 'image/jpeg' })),
          'image/jpeg', 0.75
        );
      };
      img.src = URL.createObjectURL(file);
    });
  }

  async uploadImage(file: File) {
    const token = localStorage.getItem('auth_token') || '';

    if (!token) {
      this.uploadStatus = 'error';
      this.showToast('غير مسجل دخول', 'يرجى تسجيل الدخول أولاً', 'error');
      setTimeout(() => this.router.navigate(['/Login']), 1800);
      return;
    }

    const formData = new FormData();
    formData.append('Image', file, file.name);

    try {
      this.isUploading    = true;
      this.uploadStatus   = 'uploading';
      this.uploadProgress = 0;

      // ✅ Animate progress bar while uploading
      const progressInterval = setInterval(() => {
        if (this.uploadProgress < 0.85) {
          this.uploadProgress += 0.05;
        }
      }, 200);

      const response = await fetch(
        `${environment.apiUrl}/User/upload-profile-picture`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      clearInterval(progressInterval);
      this.uploadProgress = 1;
      this.isUploading    = false;

      const responseText = await response.text();
      console.log('📥 Server response:', response.status, responseText);

      if (response.status === 401) {
        this.uploadStatus = 'error';
        this.showToast('انتهت الجلسة', 'يرجى تسجيل الدخول مجدداً', 'error');
        setTimeout(() => this.router.navigate(['/Login']), 1800);
        return;
      }

      if (!response.ok) {
        this.uploadStatus = 'error';
        this.showToast('فشل الرفع', `كود الخطأ: ${response.status}`, 'error');
        return;
      }

      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch {
        this.uploadStatus = 'error';
        this.showToast('خطأ في السيرفر', 'رد غير متوقع', 'error');
        return;
      }

      if (result.imageUrl) {
        localStorage.setItem('profile_image', result.imageUrl);
        this.uploadStatus = 'success';
        this.showToast('تم رفع الصورة بنجاح', 'جاري الانتقال...', 'success');
        setTimeout(() => this.router.navigate(['/create_success']), 2000);
      } else {
        this.uploadStatus = 'error';
        this.showToast('لم تُحفظ الصورة', 'حاول مرة أخرى', 'error');
      }

    } catch (err) {
      this.isUploading  = false;
      this.uploadStatus = 'error';
      console.error('❌ Upload failed:', err);
      this.showToast('فشل الاتصال', 'تحقق من الإنترنت', 'error');
    }
  }

  async skip() {
    const token = localStorage.getItem('auth_token') || '';
    try {
      await fetch(`${environment.apiUrl}/User/update-profile-picture`, {
        method: 'PUT',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: null }),
      });
    } catch (error) {
      console.error('❌ Failed to set image null:', error);
    } finally {
      this.router.navigate(['/create_success']);
    }
  }

  previous() {
    this.router.navigate(['/register']);
  }
}