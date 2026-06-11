import {
  Component, OnInit, OnDestroy, NgZone, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, BarController, LineController, Title, Tooltip, Legend
} from 'chart.js';

Chart.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, BarController, LineController, Title, Tooltip, Legend
);

interface HrvState {
  label:    string;
  sub:      string;
  color:    string;
  faceFill: string;
  browL:    { x1: number; y1: number; x2: number; y2: number };
  browR:    { x1: number; y1: number; x2: number; y2: number };
  eyeL:     { cx: number; cy: number };
  eyeR:     { cx: number; cy: number };
  mouth:    string;
  tears:    boolean;
  emotion:  'happy' | 'neutral' | 'sad' | 'angry';
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    CommonModule, FormsModule, BaseChartDirective,
  ],
})
export class DashboardPage implements OnInit, OnDestroy {

  // ── Dashboard data ────────────────────────────────────────────
  lastReading = { bpm: 82, time: '10 mins ago' };
  currentHeartRate = 78;
  heartRateStatus  = 'NORMAL';
  stressLevel = { level: 'High', description: 'Elevated Stress', emoji: '😟' };
  healthScore = { score: 86, status: 'Good' };
  hrv = { value: 54, status: 'Moderate' };

  // ── HRV States definition ─────────────────────────────────────
  hrvStates: HrvState[] = [
    {
      label: 'Happy', sub: 'Excellent HRV', color: '#00c864',
      faceFill: 'rgba(0,200,100,0.07)', emotion: 'happy',
      browL: { x1: 52, y1: 60, x2: 68, y2: 60 },
      browR: { x1: 92, y1: 60, x2: 108, y2: 60 },
      eyeL: { cx: 62, cy: 75 }, eyeR: { cx: 98, cy: 75 },
      mouth: 'M 50 100 Q 80 124 110 100', tears: false,
    },
    {
      label: 'Neutral', sub: 'Moderate HRV', color: '#00b8d9',
      faceFill: 'rgba(0,184,217,0.07)', emotion: 'neutral',
      browL: { x1: 52, y1: 60, x2: 68, y2: 60 },
      browR: { x1: 92, y1: 60, x2: 108, y2: 60 },
      eyeL: { cx: 62, cy: 75 }, eyeR: { cx: 98, cy: 75 },
      mouth: 'M 52 102 Q 80 104 108 102', tears: false,
    },
    {
      label: 'Sad', sub: 'Low HRV', color: '#ff9500',
      faceFill: 'rgba(255,149,0,0.07)', emotion: 'sad',
      browL: { x1: 52, y1: 56, x2: 68, y2: 62 },
      browR: { x1: 92, y1: 62, x2: 108, y2: 56 },
      eyeL: { cx: 62, cy: 76 }, eyeR: { cx: 98, cy: 76 },
      mouth: 'M 52 108 Q 80 90 108 108', tears: true,
    },
    {
      label: 'Angry', sub: 'Very low HRV', color: '#ff3d3d',
      faceFill: 'rgba(255,61,61,0.07)', emotion: 'angry',
      browL: { x1: 50, y1: 63, x2: 68, y2: 56 },
      browR: { x1: 92, y1: 56, x2: 110, y2: 63 },
      eyeL: { cx: 62, cy: 76 }, eyeR: { cx: 98, cy: 76 },
      mouth: 'M 50 110 Q 80 92 110 110', tears: false,
    },
  ];

  // ── Live interpolated values bound to template ────────────────
  currentStateIndex = 0;
  hrvColor          = '#00c864';
  hrvFaceFill       = 'rgba(0,200,100,0.07)';
  hrvLabel          = 'Happy';
  hrvSub            = 'Excellent HRV';
  hrvEmotion: 'happy' | 'neutral' | 'sad' | 'angry' = 'happy';

  brow = {
    left:  { x1: 52, y1: 60, x2: 68,  y2: 60 },
    right: { x1: 92, y1: 60, x2: 108, y2: 60 },
  };
  eyes = {
    left:  { cx: 62, cy: 75 },
    right: { cx: 98, cy: 75 },
  };
  mouthD = 'M 50 100 Q 80 124 110 100';

  private autoTimer:  any;
  private animFrame:  any;
  private DURATION  = 600;

  // ── Charts ────────────────────────────────────────────────────
  @ViewChild(BaseChartDirective) stressChart?: BaseChartDirective;

  public stressChartType: ChartType = 'line';
  public stressChartData: ChartData<'line'> = {
    labels: ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM', '12 AM'],
    datasets: [{
      data: [65, 45, 70, 85, 95, 60, 55],
      borderColor: '#ff9500',
      backgroundColor: 'rgba(255,149,0,0.1)',
      borderWidth: 3,
      pointBackgroundColor: '#ff9500',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
      fill: true,
      tension: 0.4,
    }],
  };
  public stressChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 12 } },
      },
      y: { display: false, min: 0, max: 100 },
    },
  };

  public heartRateChartType: ChartType = 'bar';
  public heartRateChartData: ChartData<'bar'> = {
    labels: ['Rest', '', 'Activity', '', 'Sleep'],
    datasets: [{
      data: [75, 85, 95, 70, 80, 90, 65, 85, 95, 110, 120, 100],
      backgroundColor: [
        '#4fc3f7', '#4fc3f7', '#4fc3f7', '#4fc3f7',
        '#29b6f6', '#29b6f6', '#29b6f6', '#29b6f6',
        '#039be5', '#039be5', '#039be5', '#039be5',
      ],
      borderRadius: 4,
      borderSkipped: false,
    }],
  };
  public heartRateChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.8)', font: { size: 14, weight: 'bold' } },
      },
      y: { display: false, min: 0, max: 140 },
    },
  };

  constructor(private zone: NgZone) {}

  ngOnInit() {
    this.updateHrvFromValue();
    this.startAutoTimer();
  }

  ngOnDestroy() {
    clearInterval(this.autoTimer);
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }

  // ── Called when hrv.value updates from BLE/API ────────────────
  updateHrvFromValue() {
    let idx = 0;
    if      (this.hrv.value >= 70) idx = 0;
    else if (this.hrv.value >= 50) idx = 1;
    else if (this.hrv.value >= 30) idx = 2;
    else                            idx = 3;
    this.transitionTo(idx);
  }

  // ── Dot click ─────────────────────────────────────────────────
  setHrvState(idx: number) {
    clearInterval(this.autoTimer);
    this.transitionTo(idx);
    this.startAutoTimer();
  }

  private startAutoTimer() {
    this.autoTimer = setInterval(() => {
      this.zone.run(() => {
        this.transitionTo((this.currentStateIndex + 1) % this.hrvStates.length);
      });
    }, 2800);
  }

  // ── Smooth morphing transition ────────────────────────────────
  private transitionTo(idx: number) {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);

    const to        = this.hrvStates[idx];
    const startTime = performance.now();

    const fromColor  = this.hexToRgb(this.hrvColor);
    const toColor    = this.hexToRgb(to.color);
    const fromBrowL  = { ...this.brow.left };
    const fromBrowR  = { ...this.brow.right };
    const fromEyeL   = { ...this.eyes.left };
    const fromEyeR   = { ...this.eyes.right };
    const fromMouth  = this.mouthD;
    const fromMNums  = fromMouth.match(/-?[\d.]+/g)!.map(Number);
    const toMNums    = to.mouth.match(/-?[\d.]+/g)!.map(Number);
    const mTemplate  = fromMouth.replace(/-?[\d.]+/g, '{}');

    this.currentStateIndex = idx;

    const animate = (now: number) => {
      const p    = Math.min((now - startTime) / this.DURATION, 1);
      const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;

      this.hrvColor    = this.lerpColor(fromColor, toColor, ease);
      this.hrvFaceFill = to.faceFill;

      this.brow.left  = this.lerpPt4(fromBrowL, to.browL, ease);
      this.brow.right = this.lerpPt4(fromBrowR, to.browR, ease);

      this.eyes.left  = {
        cx: this.lerp(fromEyeL.cx, to.eyeL.cx, ease),
        cy: this.lerp(fromEyeL.cy, to.eyeL.cy, ease),
      };
      this.eyes.right = {
        cx: this.lerp(fromEyeR.cx, to.eyeR.cx, ease),
        cy: this.lerp(fromEyeR.cy, to.eyeR.cy, ease),
      };

      let i = 0;
      this.mouthD = mTemplate.replace(/\{\}/g, () => {
        const v = this.lerp(fromMNums[i], toMNums[i], ease);
        i++;
        return v.toFixed(2);
      });

      if (p >= 0.5) {
        this.hrvLabel   = to.label;
        this.hrvSub     = to.sub;
        this.hrvEmotion = to.emotion;
      }

      if (p < 1) {
        this.animFrame = requestAnimationFrame(animate);
      }
    };

    this.animFrame = requestAnimationFrame(animate);
  }

  // ── Helpers ───────────────────────────────────────────────────
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private lerpPt4(
    a: { x1: number; y1: number; x2: number; y2: number },
    b: { x1: number; y1: number; x2: number; y2: number },
    t: number
  ) {
    return {
      x1: this.lerp(a.x1, b.x1, t), y1: this.lerp(a.y1, b.y1, t),
      x2: this.lerp(a.x2, b.x2, t), y2: this.lerp(a.y2, b.y2, t),
    };
  }

  private hexToRgb(hex: string): [number, number, number] {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }

  private lerpColor(
    a: [number, number, number],
    b: [number, number, number],
    t: number
  ): string {
    const r  = Math.round(this.lerp(a[0], b[0], t)).toString(16).padStart(2, '0');
    const g  = Math.round(this.lerp(a[1], b[1], t)).toString(16).padStart(2, '0');
    const bv = Math.round(this.lerp(a[2], b[2], t)).toString(16).padStart(2, '0');
    return `#${r}${g}${bv}`;
  }
}