import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { DiseaseComponent } from './disease/disease.component';
import { UploadImageComponent } from './upload-image/upload-image.component';
import { CreateSuccessfullyComponent } from './create-successfully/create-successfully.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'starting',
    pathMatch: 'full',
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'disease',
    component: DiseaseComponent,
  },
  {
    path: 'upload_image',
    component: UploadImageComponent,
  },
  {
    path: 'create_success',
    component: CreateSuccessfullyComponent,
  },
  {
    path: 'Login',
    component: LoginComponent,
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [authGuard],
  },
  {
    path: 'starting',
    loadComponent: () =>
      import('./starting/starting.page').then((m) => m.StartingPage),
  },
  {
    path: 'before-chatbot',
    loadComponent: () =>
      import('./before-chatbot/before-chatbot.page').then(
        (m) => m.BeforeChatbotPage,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'chatbot',
    loadComponent: () =>
      import('./chatbot/chatbot.page').then((m) => m.ChatbotPage),
    canActivate: [authGuard],
  },
  {
    path: 'setting',
    loadComponent: () =>
      import('./setting/setting.page').then((m) => m.SettingPage),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./profile/profile.page').then((m) => m.ProfilePage),
    canActivate: [authGuard],
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./history/history.page').then((m) => m.HistoryPage),
    canActivate: [authGuard],
  },
 
  {
    path: 'welcome-lottie',
    loadComponent: () =>
      import('./welcome-lottie/welcome-lottie.page').then(
        (m) => m.WelcomeLottiePage,
      ),
  },
  {
    path: 'open-conversation/:conversationId',
    loadComponent: () =>
      import('./open-conversation/open-conversation.page').then(
        (m) => m.OpenConversationPage,
      ),
  },
  {
    path: 'create-conversation',
    loadComponent: () =>
      import('./create-conversation/create-conversation.page').then(
        (m) => m.CreateConversationPage,
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
    canActivate: [authGuard],
  },
  {
    path: 'change',
    loadComponent: () => import('./change/change.page').then( m => m.ChangePage)
  },
  {
    path: 'forget',
    loadComponent: () => import('./forget/forget.page').then( m => m.ForgetPage)
  },
  {
    path: 'otp',
    loadComponent: () => import('./otp/otp.page').then( m => m.OTPPage)
  },
  {
    path:'edit',
    loadComponent: () => import('./edit/edit.page').then( m => m.EditProfilePage)
  },
  
];
