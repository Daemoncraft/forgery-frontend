import { Routes } from '@angular/router';

export const BUILDINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./buildings.component').then(m => m.BuildingsComponent),
  },
];
