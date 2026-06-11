import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Data } from './services';

export const authGuard: CanActivateFn = () => {
  const dataService = inject(Data);
  const router = inject(Router);

  if (dataService.isLoggedIn()) {
    return true;
  } else {
    router.navigate(['/Login']);
    return false;
  }
};
