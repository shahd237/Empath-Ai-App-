import { RouterLink, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonBadge,
  IonProgressBar,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonLabel,
  IonTabs,
  IonTabBar,
  IonFooter,
} from '@ionic/angular/standalone';
import { Data } from '../services';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [
    IonFooter,
    IonTabBar,
    IonTabs,
    IonLabel,
    IonSpinner,
    IonBackButton,
    IonButtons,
    IonProgressBar,
    IonBadge,
    IonCardContent,
    IonCard,
    IonIcon,
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    RouterLink,
  ],
})
export class HistoryPage implements OnInit {
  history: any[] = [];
  archived: any[] = [];
  showArchive = false;
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private _services: Data,
    private route: Router,
    private alertController: AlertController,
  ) {}

  ngOnInit() {
    this.loadConversationHistory();
  }

  // ==================== Load History ====================
  async loadConversationHistory() {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const response = await this._services.history();

      // في Capacitor البيانات بتكون داخل response.data
      let data = response?.data;

      // لو السيرفر بيرجع string
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      if (data) {
        if (Array.isArray(data)) {
          this.history = data.map((msg: any) => this.formatChat(msg));
        } else if (data.items && Array.isArray(data.items)) {
          this.history = data.items.map((msg: any) => this.formatChat(msg));
        } else if (data.messages && Array.isArray(data.messages)) {
          this.history = data.messages.map((msg: any) => this.formatChat(msg));
        } else {
          this.history = [this.formatChat(data)];
        }
      } else {
        this.history = [];
      }
    } catch (err: any) {
      console.error('❌ Error loading history', err);

      this.errorMessage = `فشل تحميل السجل: ${err?.status || ''} ${err?.message || ''}`;
    } finally {
      this.isLoading = false;
    }
  }

  formatChat(chat: any) {
    return {
      conversationId: chat.conversationId,
      title: chat.title || 'بدون عنوان',
      date: chat.last_Activity
        ? new Date(chat.last_Activity).toLocaleString('ar-EG')
        : new Date().toLocaleString('ar-EG'),
      mood: chat.mood || '😊',
      messages: chat.messages || [],
      stress: chat.stressLevel || 50,
      sender: chat.senderType || chat.sender || 'Unknown',
      raw: chat,
    };
  }

  // ==================== Archive & Delete ====================
  toggleArchive() {
    this.showArchive = true;
  }

  Normal() {
    this.showArchive = false;
  }

  async deleteChat(index: number) {
    try {
      const res = await this._services.deleteConversation(
        this.history[index].conversationId,
      );

      console.log('✅', res);

      // نحذف بعد نجاح الطلب
      this.history.splice(index, 1);
    } catch (err) {
      console.error('❌ Error deleting conversation', err);
    }
  }

  async archiveChat(index: number) {
    try {
      const res = await this._services.isArchive(
        this.history[index].conversationId,
      );

      console.log('✅', res);

      const chat = this.history.splice(index, 1)[0];
      this.archived.push(chat);
    } catch (err) {
      console.error('❌ Error Archive conversation', err);
    }
  }

  async unarchiveChat(index: number) {
    try {
      const res = await this._services.isUnArchive(
        this.archived[index].conversationId,
      );

      console.log('✅', res);

      const chat = this.archived.splice(index, 1)[0];
      this.history.push(chat);
    } catch (err) {
      console.error('❌ Error UnArchive conversation', err);
    }
  }

  async OpenConversation(conversationId: number) {
    // أولًا نعمل navigation
    this.route.navigate(['/open-conversation', conversationId]);

    try {
      const res = await this._services.OpenConversation(conversationId);

      console.log('✅ Conversation opened', res);
    } catch (err) {
      console.error('❌ Error opening conversation', err);
    }
  }

  isUserMessage(msg: any): boolean {
    return (
      msg.sender?.toLowerCase().includes('user') ||
      msg.sender?.toLowerCase().includes('you') ||
      msg.sender === '👤 أنت'
    );
  }

  formatTime(timestamp: any): string {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  getStressClass(stress: number): string {
    if (stress < 30) return 'stress-low';
    if (stress < 60) return 'stress-medium';
    return 'stress-high';
  }

  async ConfirmDeleteChat() {
    const alert = await this.alertController.create({
      header: 'حذف المحادثة',
      message: 'هل تريد حذف المحادثة؟',
      buttons: [
        {
          text: 'الغاء',
          role: 'cancel',
        },
        {
          text: 'حذف',
          handler: () => {
            console.log('Deleted Chat');
            // window.alert('🗑️ Chat deleted successfully');
          },
        },
      ],
    });
    await alert.present();
  }
}
