import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Auth (außerhalb der Layout-Shell)
  {
    path: 'login',
    loadComponent: () =>
      import('./core/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./core/auth/register.component').then(m => m.RegisterComponent),
  },

  // Layout-Shell mit allen Feature-Routen (lazy)
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'production',
        loadChildren: () =>
          import('./features/production/production.routes').then(m => m.PRODUCTION_ROUTES),
      },
      {
        path: 'buildings',
        loadChildren: () =>
          import('./features/buildings/buildings.routes').then(m => m.BUILDINGS_ROUTES),
      },
      {
        path: 'research',
        loadChildren: () =>
          import('./features/research/research.routes').then(m => m.RESEARCH_ROUTES),
      },
      {
        path: 'market',
        loadChildren: () =>
          import('./features/market/market.routes').then(m => m.MARKET_ROUTES),
      },
      {
        path: 'inventory',
        loadChildren: () =>
          import('./features/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES),
      },
      {
        path: 'leaderboard',
        loadChildren: () =>
          import('./features/leaderboard/leaderboard.routes').then(m => m.LEADERBOARD_ROUTES),
      },
      {
        path: 'rewards',
        loadChildren: () =>
          import('./features/rewards/rewards.routes').then(m => m.REWARDS_ROUTES),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
      },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
