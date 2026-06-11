import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { FacebookLogin } from '@capacitor-community/facebook-login';
import { CapacitorHttp } from '@capacitor/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Data {
  // private baseUrl = environment.apiUrl;
  private token: string = '';
  private hubConnection!: signalR.HubConnection; //✔️ Create variable hupconnection Type = SignalR !: promise takes Value After Connection
  public messages: any[] = []; //✔️ Empty Array to Store Messages Using Public to call this array in every Component

  constructor(private _HttpClient: HttpClient) {
    // ✔️Try to load token from localStorage on service initialization
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      this.token = savedToken;
    }

    // ✔️Store Messages SignalR in LocalStorage
    const savedMessages = localStorage.getItem('chatMessages'); // ✔️Store ChatMessages in LocalStorage
    if (savedMessages) {
      this.messages = JSON.parse(savedMessages); // ✔️Convert Messages from Text to Object to Can server Read
    }
  }

  //✔️ Function To convert Messages from Object to Text because user can't read Object
  private saveMessages() {
    localStorage.setItem('chatMessages', JSON.stringify(this.messages));
  }

  // ✔️ Start Connect to SignalR
  startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://empath-ai.runasp.net/hubs/Chat', {
        accessTokenFactory: () => localStorage.getItem('token') || '',
        skipNegotiation: true, // ✔️ Skip Negotiation allow "WebSocket" Protocol
        transport: signalR.HttpTransportType.WebSockets, // ✔️ Allow Only "WebSocket" Protocol
        withCredentials: true, // ✔️ Allow Cookies and Token to Connect
      }) //✔️ withUrl()=> Method in SignalR takes Url From hup server
      .configureLogging(signalR.LogLevel.Information) // ✔️ add Information during Connection
      .build();
    this.hubConnection
      .start()
      .then(() => console.log('✔️ SignalR Connection')) // ✔️ Start Connection
      .catch(() => console.log('❌ SignalR Not Connection'));

    // ✔️ Receive Messages from SignalR
    this.hubConnection.on('ReceiveMessage', (message) => {
      console.log('📩 messages Received ', message);
      this.messages.push(message); // Push messages to Array Message
      this.saveMessages(); // Save This Message in LocalStorage
    });
  }

  // Send Message To Back-End
  sendMessage(User_ID: Number, conversationId: Number, content: string) {
    // ✔️ Send Message From User To Bot
    if (this.hubConnection?.state == signalR.HubConnectionState.Connected) {
      const messageDTO = {
        user_ID: User_ID,
        conversation_ID: 88,
        content: content,
      };
      // hub expects primitive parameters: userId, conversationId, content
      this.hubConnection
        .invoke('SendMessage', messageDTO, content)
        .then(() => {
          console.log('✔️ Message Sent Successfully');
          const userMessage = {
            sender_Type: 'User',
            content,
            conversation_ID: conversationId,
          };
          this.messages.push(userMessage);
          this.saveMessages();
        })
        .catch((error: any) => {
          console.log('❌ Message Not Sent', error);
        });
    } else {
      console.warn(' ⚠️ SignalR Not Connected Yet');
    }
  }

  ClearChat() {
    this.messages = []; // Return Message Array Empty
    localStorage.removeItem('chatMessages');
  }

  async deleteConversation(conversationId: number) {
   const token = localStorage.getItem('auth_token');

    const options = {
      url: `${environment.apiUrl}/Conversation/delete`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: {
        conversationId: conversationId,
      },
    };

    return await CapacitorHttp.request({
      method: 'DELETE',
      ...options,
    });
  }

  getConversationIdFromToken(): number | null {
    const token = localStorage.getItem('auth_token') || this.token;

    if (!token) return null;

    const payload = this.parseJwt(token);

    const conversationId =
      payload.conversationId ||
      payload.Conversation_ID ||
      payload.conversation_id;

    return conversationId ? Number(conversationId) : null;
  }

  // New Conversation - create on backend and return observable

  async newConversation() {
    const token = localStorage.getItem('auth_token') || this.token;

    if (!token) {
      console.error('❌ newConversation: no auth token found');
      throw new Error('No auth token');
    }

    console.log('🔐 newConversation - sending with token', token);

    const options = {
      url: `${environment.apiUrl}/Conversation/create`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: {}, // لو في payload لاحقًا
    };

    return await CapacitorHttp.post(options);
  }

  // Post Data in Api (Back-End) Register
  async PostData(data: any) {
    const token = localStorage.getItem('auth_token') || this.token;

    const options = {
      url: `${environment.apiUrl}/User/create`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      data: data,
    };

    return await CapacitorHttp.post(options);
  }

  // Get Data From Api (Back-End) Login
  async LoginData(data: any) {
    const options = {
      url: `${environment.apiUrl}/User/Login`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };

    const response = await CapacitorHttp.post(options);

    if (response.data && response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }

    return response.data;
  }

  // Upload an image URL to backend (sends JSON { imageUrl })
  uploadImageUrl(imageUrl: string): Observable<any> {
    const token = localStorage.getItem('auth_token') || this.token;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    const payload = { imageUrl };
    console.log('📤 Uploading image URL to backend:', imageUrl);

    // Use a generic endpoint; adjust path to your backend route if needed
    return this._HttpClient.post('/api/Image', payload, { headers });
  }

  // Get the current auth token
  getToken(): string {
    return localStorage.getItem('auth_token') || this.token || '';
  }

  private isTokenValid(token: string): boolean {
    const payload = this.parseJwt(token);
    if (!payload?.exp) return false;
    return Math.floor(Date.now() / 1000) <= payload.exp;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    const token = localStorage.getItem('auth_token') || '';
    if (!token) return false;
    return this.isTokenValid(token);
  }

  // Logout user

  async logout() {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      console.warn('No auth token found');
      return;
    }

    try {
      await CapacitorHttp.post({
        url: `${environment.apiUrl}/User/logout`,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {},
      });

      // 🟢 مسح البيانات بعد النجاح
      this.token = '';
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');

      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  }

  // Create SignalR Chatbot

  // Medical Report

  async medicalReport(data: any) {
    const token =
      localStorage.getItem('auth_token') ||
      // localStorage.getItem('token') ||
      this.token;

    if (!token) {
      console.warn('🔒 medicalReport called without a token');
      throw new Error('No auth token');
    }

    console.log('Sending token for medicalReport:', token);

    const options = {
      url: `${environment.apiUrl}/MedicalReport/AddMedicalReport`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: data,
    };

    return await CapacitorHttp.post(options);
  }


 async CheckMedicalReport(): Promise<boolean> {
  try {
    const res = await CapacitorHttp.get({
      url: `${environment.apiUrl}/User/Check-for-Medical-Report`,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    return res.status === 200;

  } catch (err: any) {
    if (err.status === 404) return false;
    throw err;
  }
}
  // UpdateMedicalReport(data: any): Observable<any> {
  //   const token = localStorage.getItem('auth_token') || this.token;
  //   const headers = new HttpHeaders({
  //     'Content-Type': 'application/json',
  //     ...(token ? { Authorization: `Bearer ${token}` } : {}),
  //   });
  //   return this._HttpClient.put('/api/MedicalReport/update', data, {
  //     headers,
  //     responseType: 'text' as 'json',
  //   });
  // }

  private parseJwt(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = parts[1];
      // base64url -> base64
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      // atob may throw if malformed
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(json);
    } catch (e) {
      console.warn('❌ parseJwt failed', e);
      return null;
    }
  }

  // Extract common user id claims from token payload
  getUserIdFromToken(): number | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    const payload = this.parseJwt(token);
    console.log('Decoded Token:', payload);
    if (!payload) return null;

    const id =
      payload.sub ||
      payload.User_ID ||
      payload.id ||
      payload.nameid ||
      payload[
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
      ];

    return id ? Number(id) : null;
  }

  async history() {
    const token = localStorage.getItem('auth_token') || this.token;
    const user_ID = this.getUserIdFromToken();

    if (!user_ID) {
      console.error('❌ history: no user id found');
      throw new Error('No user id');
    }

    console.log('📤 Fetching conversation history with token:', token);
    console.log('📤 Fetching conversation history with user id:', user_ID);

    const options = {
      url: `${environment.apiUrl}/Conversation/ConversationHistoryWithMessages/${user_ID}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    return await CapacitorHttp.get(options);
  }

  async OpenConversation(conversationId: number) {
    const token = localStorage.getItem('auth_token') || this.token;

    console.log('📤 Trying to open conversation with ID:', conversationId);

    const options = {
      url: `${environment.apiUrl}/Conversation/OpenConversation/${conversationId}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const response = await CapacitorHttp.get(options);

    // البيانات بتكون داخل response.data
    const res = response?.data;

    // Standardize الرسائل → دايمًا array
    const messages = res?.Messages ?? res?.messages ?? [];

    return {
      ...res,
      messages,
    };
  }

  async isArchive(conversationId: number) {
    const token = localStorage.getItem('auth_token') || this.token;

    const options = {
      url: `${environment.apiUrl}/Conversation/archive/${conversationId}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    return await CapacitorHttp.put(options);
  }

  async isUnArchive(conversationId: number) {
    const token = localStorage.getItem('auth_token') || this.token;

    const options = {
      url: `${environment.apiUrl}/Conversation/unarchive/${conversationId}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    return await CapacitorHttp.put(options);
  }

  getConversation(id: number): Observable<any> {
    const token = localStorage.getItem('auth_token') || this.token;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });

    console.log('📤 Trying to open conversation with ID:', id);

    return this._HttpClient.get(`/api/Conversation/${id}`, {
      headers,
    });
  }


async Change_Password(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) {

  const token = localStorage.getItem('auth_token');

  if (!token) {
    throw new Error('No auth token');
  }

  const options = {
    url: `${environment.apiUrl}/User/change-password`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    data: {
      OldPassword: currentPassword,
      NewPassword: newPassword,
      ConfirmNewPassword: confirmPassword
    }
  };

  return await CapacitorHttp.put(options);
}


async Forget_Password(email: string) {

  const token = localStorage.getItem('auth_token');

  const options = {
    url: `${environment.apiUrl}/User/forgot-password`,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    data: {
      email: email
    }
  };

  return await CapacitorHttp.post(options);
}

async OTP(otp: string, email: string) {

  const token = localStorage.getItem('auth_token');

  const options = {
    url: `${environment.apiUrl}/User/verify-otp`,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    data: {
      otp: otp,
      email: email
    }
  };

  return await CapacitorHttp.post(options);
}


async Delete_Account() {

  const token = localStorage.getItem('auth_token');

  const options = {
    url: `${environment.apiUrl}/User/delete`,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };

  return await CapacitorHttp.delete(options);
}

async getUser() {
  const token = localStorage.getItem('auth_token');

  const options = {
    url: `${environment.apiUrl}/User/get-user`,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };

  const response = await CapacitorHttp.get(options);

  return response.data; 
}

convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = error => reject(error);
  });
}



async sendAccelerometer(data: {
  accelX: number;
  accelY: number;
  accelZ: number
  stepCount: number;
  activityLevel: string;
  fallDetected: boolean;
}) {
  const token = localStorage.getItem('auth_token') || this.token;

  const options = {
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
      activityLevel: data.activityLevel,  // ← maps to behavioralState from BLE
      fallDetected:  data.fallDetected,
    }),
  };

  return await CapacitorHttp.post(options);
}


  async sendHeartRate(data: {
    bpm: number;
    avgBpm: number;
  }) {
    const token = localStorage.getItem('auth_token') || '';
    return await CapacitorHttp.post({
      url: `${environment.apiUrl}/HeartRateRecord/add`,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      data: JSON.stringify({
        bpm:    data.bpm,
        avgBpm: data.avgBpm,
      }),
    });
  }


async EditUser(data: any): Promise<any> {
  const token = localStorage.getItem('auth_token') || this.token;

  const options = {
    url: `${environment.apiUrl}/User/edit`,   // ← no /${userId}
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    data: data,
  };

  return await CapacitorHttp.post(options);
}



}


