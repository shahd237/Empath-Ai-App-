import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonSpinner } from '@ionic/angular/standalone';
import { Data } from '../services';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-open-conversation',
  templateUrl: './open-conversation.page.html',
  styleUrls: ['./open-conversation.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class OpenConversationPage implements OnInit {

  conversation: any = null;
  messages: any[] = [];
  loading: boolean = true;
  errorMessage: string = '';
  newMessage = '';

  constructor(
    private _services: Data,
    private router: ActivatedRoute,
    private route: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.router.snapshot.paramMap.get('conversationId');
    if (!id) {
      this.loading = false;
      this.errorMessage = 'Conversation ID not provided.';
      return;
    }
    this.loadConversation(Number(id));
  }

 async loadConversation(conversationId: number) {

  this.loading = true;
  this.errorMessage = '';

  try {

    const res = await this._services.OpenConversation(conversationId);

    console.log('✅ Conversation opened', res);

    this.conversation = res;

    // ✅ messages دايمًا array
    if (Array.isArray(res.messages) && res.messages.length > 0) {
      this.messages = res.messages;
    } else {
      this.messages = [];
      this.errorMessage = 'المحادثة فارغة.';
    }

    console.log('Messages:', this.messages);

  } catch (err) {

    console.error('❌ Error opening conversation', err);

    this.messages = [];
    this.errorMessage = 'Failed to load conversation.';

  } finally {

    this.loading = false;

    // 👇 غالبًا مش محتاجاه هنا، بس لو عندك مشكلة تحديث UI سيبيه
    this.cdr.detectChanges();

  }
}
  sendMessage() {
    if (!this.newMessage.trim()) return;

    const userText = this.newMessage;

    this.messages.push({ sender_Type: 'User', content: userText, Time: new Date() });
    this.messages.push({ sender_Type: 'Bot', content: 'Typing...', Time: new Date() });
    this.newMessage = '';

    setTimeout(() => {
      this.messages[this.messages.length - 1] = { sender_Type: 'Bot', content: `You said: "${userText}"`, Time: new Date() };
      this.cdr.detectChanges();
    }, 1500);
  }

  isUserMessage(msg: any): boolean {
    return msg.sender_Type === 'User';
  }

  formatTime(time: any): string {
    if (!time) return '';
    return new Date(time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  }
}