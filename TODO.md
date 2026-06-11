# Auth Persistence & Logout Fix - Progress Tracker

## Steps (Approved Plan):

1. [✅] Create `src/app/auth.guard.ts` - Auth guard service using Data.isLoggedIn()
2. [✅] Update `src/app/services.ts` - Fix token consistency, enhance isLoggedIn() with expiry check
3. [✅] Update `src/app/login/login.component.ts` - Store 'auth_token', navigate to /home
4. [✅] Update `src/app/app.component.ts` - Use Data service for init auth check
5. [✅] Update `src/app/starting/starting.page.ts` - Add auth check & redirect after splash
6. [✅] Update `src/app/app.routes.ts` - Apply guards to protected routes (home, profile, setting, history, chatbot paths, dashboard)
7. [ ] Update `src/app/home/home.page.ts` - Add logout() method & assume button in HTML
8. [ ] Update `src/app/profile/profile.page.ts` - Remove duplicate storage clear
9. [ ] Update `src/app/setting/setting.page.ts` - Add logout() method
10. [ ] Global cleanup: Fix any remaining 'token' → 'auth_token'
11. [ ] Test & complete

Current step: 7/11

After each step, update this file with [✅] and proceed.
