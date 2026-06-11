import { Component, AfterViewInit, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonToggle,
  IonList, IonItem, IonLabel, IonIcon, IonTabs, IonTabBar } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BluetoothLe } from '@capacitor-community/bluetooth-le';
import { CapacitorHttp } from '@capacitor/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
  standalone: true,
  imports: [IonTabBar, IonTabs, IonIcon,
    IonContent, IonHeader, IonToolbar, IonTitle, IonToggle,
    IonList, IonItem, IonLabel, FormsModule, RouterLink, CommonModule,
  ],
})
export class SettingPage implements AfterViewInit {

  private SERVICE_UUID    = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
  private ACCEL_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
  private GSR_CHAR_UUID   = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';
  private HR_CHAR_UUID    = 'beb5483e-36e1-4688-b7f5-ea07361b26aa'; // ✅ Heart Rate

  darkMode = false;
  lightMode = true;
  connectedDevice: any = null;
  deviceName: string | null = null;
  isBluetoothOn = false;
  sensorData: { [key: string]: any } = {};

  constructor(private zone: NgZone) {
    this.loadTheme();
  }

  ngAfterViewInit() {
    this.loadTheme();
  }

  toggleTheme(isDark: boolean) {
    this.darkMode = isDark;
    this.lightMode = !isDark;
    const mode = isDark ? 'dark' : 'light';
    document.body.setAttribute('data-theme', mode);
    localStorage.setItem('theme', mode);
  }

  loadTheme() {
    const saved = localStorage.getItem('theme');
    const mode = saved === 'dark' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', mode);
    this.darkMode = mode === 'dark';
    this.lightMode = mode === 'light';
  }

  async handleToggle(event: any) {
    const isChecked = event.detail.checked;
    this.isBluetoothOn = isChecked;
    if (isChecked) {
      await this.connectBLEDevice();
    } else {
      await this.disconnectDevice();
    }
  }

  async connectBLEDevice() {
    try {
      await BluetoothLe.initialize();

      const isEnabled = await BluetoothLe.isEnabled();
      if (!isEnabled.value) {
        alert('افتحي البلوتوث 🔵');
        this.isBluetoothOn = false;
        return;
      }

      const device = await BluetoothLe.requestDevice({
        services: [this.SERVICE_UUID],
      });

      this.connectedDevice = device;
      this.deviceName = device.name ?? 'Device';

      await BluetoothLe.connect({ deviceId: device.deviceId });
      alert('تم الاتصال ✅');

      await this.startNotifications();

    } catch (error) {
      console.error(error);
      this.isBluetoothOn = false;
    }
  }

  async disconnectDevice() {
    if (!this.connectedDevice) return;

    // Stop all three characteristics
    const charsToStop = [
      this.ACCEL_CHAR_UUID,
      this.GSR_CHAR_UUID,
      this.HR_CHAR_UUID,  // ✅ Heart Rate
    ];

    for (const uuid of charsToStop) {
      try {
        await BluetoothLe.stopNotifications({
          deviceId: this.connectedDevice.deviceId,
          service: this.SERVICE_UUID,
          characteristic: uuid,
        });
      } catch (e) {
        console.warn(`Could not stop notifications for ${uuid}:`, e);
      }
    }

    await BluetoothLe.disconnect({ deviceId: this.connectedDevice.deviceId });

    this.connectedDevice = null;
    this.deviceName = null;
    this.sensorData = {};
  }

  async startNotifications() {
    if (!this.connectedDevice) return;

    const characteristics: { uuid: string; type: 'accel' | 'gsr' | 'hr' }[] = [
      { uuid: this.ACCEL_CHAR_UUID, type: 'accel' },
      { uuid: this.GSR_CHAR_UUID,   type: 'gsr'   },
      { uuid: this.HR_CHAR_UUID,    type: 'hr'    }, // ✅ Heart Rate
    ];

    for (const char of characteristics) {
      await BluetoothLe.startNotifications({
        deviceId: this.connectedDevice.deviceId,
        service: this.SERVICE_UUID,
        characteristic: char.uuid,
      });

      BluetoothLe.addListener(
        `notification|${this.connectedDevice.deviceId}|${this.SERVICE_UUID}|${char.uuid}`,
        (event: any) => {
          console.log('RAW EVENT:', JSON.stringify(event.value));

          const data = this.parseBleValue(event.value);
          console.log('PARSED DATA:', JSON.stringify(data));

          this.zone.run(async () => {
            this.sensorData = { ...this.sensorData, ...data };

            // ── Send Accelerometer data to API ──
            if (char.type === 'accel' && data.behavioralState !== undefined) {
              try {
                const result = await this.sendAccelerometer({
                  accelX:        data.accelX          ?? 0,
                  accelY:        data.accelY          ?? 0,
                  accelZ:        data.accelZ          ?? 0,
                  stepCount:     data.stepCount       ?? 0,
                  activityLevel: data.behavioralState ?? 'unknown',
                  fallDetected:  data.fallDetected    ?? false,
                });
                console.log('✅ Accelerometer sent:', result.status);
              } catch (e) {
                console.error('❌ Accelerometer API error:', e);
              }
            }

            // ── Send GSR data to API ──
            if (char.type === 'gsr' && data.stressLevel !== undefined) {
              try {
                const result = await this.sendGSR({
                  rawGSRValue:     data.rawGSRValue     ?? 0,
                  skinConductance: data.skinConductance ?? 0,
                  stressLevel:     data.stressLevel     ?? 0,
                  stressScore:     data.stressScore     ?? 0,
                });
                console.log('✅ GSR sent:', result.status);
              } catch (e) {
                console.error('❌ GSR API error:', e);
              }
            }

            // ── Send Heart Rate data to API ─────────────────────
            if (char.type === 'hr' && data.bpm !== undefined) {
              try {
                const result = await this.sendHeartRate({
                  bpm:    data.bpm    ?? 0,
                  avgBpm: data.avgBpm ?? 0,
                });
                console.log('✅ Heart Rate sent:', result.status);
              } catch (e) {
                console.error('❌ Heart Rate API error:', e);
              }
            }
          });
        }
      );
    }
  }

  // ✅ Send Accelerometer to backend
  async sendAccelerometer(data: {
    accelX: number;
    accelY: number;
    accelZ: number;
    stepCount: number;
    activityLevel: string;
    fallDetected: boolean;
  }) {
    const token = localStorage.getItem('auth_token') || '';
    return await CapacitorHttp.post({
      url: `${environment.apiUrl}/Accelerometer/add`,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      data: JSON.stringify({
        accelX:        data.accelX,
        accelY:        data.accelY,
        accelZ:        data.accelZ,
        stepCount:     data.stepCount,
        activityLevel: data.activityLevel,
        fallDetected:  data.fallDetected,
      }),
    });
  }

  // ✅ Send GSR to backend
  async sendGSR(data: {
    rawGSRValue: number;
    skinConductance: number;
    stressLevel: string;
    stressScore: number;
  }) {
    const token = localStorage.getItem('auth_token') || '';
    return await CapacitorHttp.post({
      url: `${environment.apiUrl}/GSR/add`,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      data: JSON.stringify({
        rawGSRValue:     data.rawGSRValue,
        skinConductance: data.skinConductance,
        stressLevel:     data.stressLevel,
        stressScore:     data.stressScore,
      }),
    });
  }

  // ✅ Send Heart Rate to backend
 async sendHeartRate(data: {
  bpm: number;
  avgBpm: number;
}) {

  console.log('📤 Sending Heart Rate:', {
    bpm: data.bpm,
    avgBpm: data.avgBpm
  });

  const token = localStorage.getItem('auth_token') || '';

  try {

    const response = await CapacitorHttp.post({
      url: `${environment.apiUrl}/HeartRateRecord/add`,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      data: {
        bpm: Number(data.bpm),
        avgBpm: Number(data.avgBpm),
      },
    });

    console.log('✅ Heart Rate API Response:', response);

    return response;

  } catch (error) {

    console.error('❌ Heart Rate API Error:', error);
    throw error;

  }
}

  // ✅ Decode hex string from BLE → JSON
  private parseBleValue(value: any): any {
    try {
      let text = '';

      // Format 1: HEX string (Android)
      if (typeof value === 'string' && /^[0-9A-Fa-f]+$/.test(value)) {
        const bytes = new Uint8Array(value.length / 2);
        for (let i = 0; i < value.length; i += 2) {
          bytes[i / 2] = parseInt(value.substring(i, i + 2), 16);
        }
        text = new TextDecoder('utf-8').decode(bytes);
      }
      // Format 2: Base64 string (iOS)
      else if (typeof value === 'string') {
        const binary = atob(value);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        text = new TextDecoder('utf-8').decode(bytes);
      }
      // Format 3: DataView (some Android versions)
      else if (value instanceof DataView) {
        text = new TextDecoder('utf-8').decode(new Uint8Array(value.buffer));
      }
      // Format 4: Plain object with numeric keys
      else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const keys = Object.keys(value)
          .filter(k => !isNaN(Number(k)))
          .sort((a, b) => Number(a) - Number(b));
        const bytes = new Uint8Array(keys.map(k => value[k]));
        text = new TextDecoder('utf-8').decode(bytes);
      }

      console.log('DECODED TEXT:', text);

      const start = text.indexOf('{');
      const end   = text.lastIndexOf('}');
      if (start === -1 || end === -1) {
        console.warn('No JSON found in:', text);
        return {};
      }

      return JSON.parse(text.substring(start, end + 1));

    } catch (e) {
      console.error('Parse error:', e);
      return {};
    }
  }
}