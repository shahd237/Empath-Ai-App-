import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { Data } from '../services';
import {
  IonContent, IonButton, IonList, IonItem, IonLabel,
  IonIcon, IonRadioGroup, IonRadio, IonTextarea,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-disease',
  templateUrl: './disease.component.html',
  styleUrls: ['./disease.component.scss'],
  imports: [
    IonTextarea, IonIcon, IonLabel, IonButton, IonContent,
    IonList, IonItem, IonRadioGroup, IonRadio,
    RouterLink, CommonModule, FormsModule,
  ],
})
export class DiseaseComponent implements OnInit {

  disabute:       string | null = null;
  hypertension:   string | null = null;
  heartdisease:   string | null = null;
  mental_illness: string | null = null;
  smoking:        string | null = null;
  notes:          string | null = null;

  // ✅ Toast state
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(
    private router: Router,
    private _services: Data,
  ) {}

  async ngOnInit() {
    // const reportDone = localStorage.getItem('medical_report_done');
    // if (reportDone === 'true') {
    //   this.router.navigate(['/welcome-lottie']);
    // }
  }

  // ✅ Show custom toast instead of alert()
  showToast(message: string, type: 'success' | 'error') {
    clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType    = type;
    this.toastVisible = true;

    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  allanswered(): boolean {
    return (
      this.disabute       !== null &&
      this.hypertension   !== null &&
      this.heartdisease   !== null &&
      this.mental_illness !== null &&
      this.smoking        !== null
    );
  }

  async submitmedicalReport() {
    if (!this.allanswered()) return;

    const body = {
      HasDiabetes:       this.disabute       === 'yes',
      HasBloodPressure:  this.hypertension   === 'yes',
      HasHeartProblem:   this.heartdisease   === 'yes',
      HasAMentalIllness: this.mental_illness === 'yes',
      IsSmoker:          this.smoking        === 'yes',
      Notes:             this.notes || '',
    };

    try {
      const res = await this._services.medicalReport(body);
      console.log('✅ Medical report saved:', res);

      localStorage.setItem('medical_report_done', 'true');

      // ✅ Custom toast instead of alert()
      this.showToast('تم حفظ التقرير بنجاح', 'success');

      setTimeout(() => {
        this.router.navigate(['/welcome-lottie']);
      }, 2000);

    } catch (err: any) {
      console.error('❌ Error sending report:', err);
      this.showToast('حدث خطأ أثناء حفظ التقرير. حاول مرة أخرى', 'error');
    }
  }
}