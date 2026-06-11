import { routes } from './../app.routes';
import { Data } from '../services';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import * as signalR from '@microsoft/signalr';
import {
  HubConnectionBuilder,
  HubConnection,
  LogLevel,
} from '@microsoft/signalr';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonFooter,
  IonIcon,
  IonInput,
  IonButton,
  IonItem,
  IonButtons,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';


@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.page.html',
  styleUrls: ['./chatbot.page.scss'],
  standalone: true,
  imports: [
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonFooter,
    IonIcon,
    IonInput,
    IonButton,
    CommonModule,
    FormsModule,
  ],
})
export class ChatbotPage implements OnInit {
  private hubConnection!: HubConnection; // Create Variable hubConnection Type = SignalR !: promise this variable Takes Value before Connection
  messages: { text: string; from: string }[] = []; // Array From File Services.ts Takes Object Contain {Text,from}
  UserInput = ''; // Create Variable UserInput Type = String
   conversationId!: number;  // خليها من API بعدين
  // userId = 11; // خليها من التوكن بعدين
  isBotTyping = true; // حالة الكتابة للبوت
  isCreateConversation = false;
  userData: any = null;
  constructor(
    private alertController: AlertController,
    private _services: Data,
    private routes: ActivatedRoute,
    private router: Router
  ) {
    // addIcons({
    //   add,
    //   trashOutline,
    //   sendOutline,
    //   micOutline,
    //   attachOutline,
    // });
  
  }



  // Start a new conversation: clear UI and local storage
  async newConversation() {

  try {

    const res = await this._services.newConversation();

    this.isCreateConversation = true;

    console.log('🆕 New conversation started', res);

    // ⚠️ مهم: الرد في Capacitor بيبقى جوه res.data
    const conversationId = res.data?.conversationId;

    this.conversationId = conversationId;

    if (conversationId) {
      localStorage.setItem('conversationId', conversationId.toString());
    }

  } catch (err) {
    console.error('❌ Error starting new conversation', err);
  }

  this.messages = [];
}

  ngOnInit() {
    const id=this.routes.snapshot.paramMap.get('id');
    if(id){
      this.conversationId=Number(id);
    }
    this.isBotTyping=false;
    // Load saved messages
    const token = localStorage.getItem('auth_token');
    console.log('🔑 Token from localStorage:', token);

    // 🟢 أنشئ الاتصال
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://empath-ai.runasp.net/hubs/Chat', {
        accessTokenFactory: () => localStorage.getItem('auth_token') || '',
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect()
      .build();

    // 🟢 استقبال الرسالة من السيرفر
    this.hubConnection.on('ReceiveMessage', (data: any) => {
      console.log('📩 ReceiveMessage:', data);

      // Typing Animation
      this.isBotTyping = false;

      // backend may send different shapes; extract only the bot content
      let botMsg = '';
      if (typeof data === 'string') {
        botMsg = data;
      } else {
        // look for various casing and nesting
        botMsg =
          data.content ||
          data.Content ||
          data.message ||
          data.Message ||
          data.bot?.content ||
          data.bot?.Content ||
          data.bot?.message ||
          data.bot?.Message ||
          '';
      }

      if (botMsg) {
        this.messages.push({ text: botMsg, from: 'bot' });
        this.saveMessages();
      } else {
        console.warn('⚠️ Received message payload without content', data);
        // if no recognized field, ignore rather than dumping JSON
      }
    });

    // 🟢 استقبال الخطأ من السيرفر (عشان warning يختفي)
    this.hubConnection.on('ReceiveError', (msg: string) => {
      console.error('❌ Server Error:', msg);
    });

    // 🟢 بدء الاتصال
    this.hubConnection
      .start()
      .then(() => console.log('✅ SignalR Connected'))
      .catch((err) => console.error('❌ Connection error:', err));

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

  // Decode JWT payload safely
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
   const token = localStorage.getItem('auth_token');;
    if (!token) return null;

    const payload = this.parseJwt(token);
    console.log("Decoded Token:", payload);
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

  getConversationIdFromToken(): number | null {
  const token = localStorage.getItem('auth_token');;
  if (!token) return null;

  const payload = this.parseJwt(token);
  if (!payload) return null;

  const conversationId =
    payload.conversationId ||
    payload.Conversation_ID ||
    payload.conversation_id;

  return conversationId ? Number(conversationId) : null;
}

  sendMessage() {
    const content = this.UserInput.trim();
    if (!content) return;
    const User_ID = this.getUserIdFromToken();
    console.log('USER ID FROM TOKEN:', User_ID);
    const messageDTO = {
      user_ID: User_ID,
      conversation_ID: this.conversationId,
      content: content,
    };

    console.log('📤 Conversation_ID:', messageDTO.conversation_ID);
  


    this.hubConnection
      .invoke('SendMessage', messageDTO, content)
      .then(() => console.log('📤 Message sent successfully', messageDTO))
      .catch((err) => console.error('❌ Error sending message:', err));
      this.isBotTyping=false

    this.addMessage(content, 'user');
    this.saveMessages();
    this.UserInput = '';
    this.isBotTyping = true; // إظهار حالة الكتابة عند إرسال رسالة
  }

  addMessage(text: string, from: string) {
    this.messages.push({ text, from });
  }

  ClearChat() {
    this.messages = []; // Return Message Array Empty
    localStorage.removeItem('chatMessages'); // Delete From ChatMessage in LocalStorage
    console.log('Chat Deleted Successfully');
  }



// delete() {

//   const conversationId = this.conversationId; // ييجي من route أو history

//   this._services.deleteConversation(conversationId).subscribe({
//     next: (res) => {
//       console.log('🗑️',res);
//       this.messages = [];
//       localStorage.removeItem('chatMessages');
//     },
//     error: (err) => {
//       console.error('❌ Error deleting conversation', err);
//     }
//   });
//   this.ClearChat()

// }

  onTyping() {}
  isRecording = false;
  mediaRecorder!: MediaRecorder;
  audioChunks: Blob[] = [];
  audioUrl: string | null = null;

  saveMessages() {
    localStorage.setItem('chatMessages', JSON.stringify(this.messages));
  }

  async toggleRecording() {
    if (!this.isRecording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioUrl = URL.createObjectURL(audioBlob);
        console.log('Audio URL:', this.audioUrl);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } else {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }
  async startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.audioChunks = [];

    this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioUrl = URL.createObjectURL(blob);
    };

    this.mediaRecorder.start();
  }

  stopRecording() {
    this.mediaRecorder.stop();
  }

  

  plusInHeader=false;
  showStartButton = true;
  startChat(){
    this.showStartButton = false;
    this.plusInHeader=true;
    this.isCreateConversation = true;
    this.newConversation();
    setTimeout(() => {
       this.messages.push({
        from:'bot',
         text: "مرحبًا 👋 أنا Empath AI، كيف حالك اليوم؟",
       })
    }, 700);
  }


  goBack(){
   this.router.navigate(['/home']);
  }
  
}
