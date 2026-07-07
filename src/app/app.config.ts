import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';
import { MessageService } from 'primeng/api';
import { provideEchartsCore } from 'ngx-echarts';

import { routes } from './app.routes';
import { AuthStore } from './core/auth/auth.store';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    // Session-Restore vor dem ersten Routing (Refresh-Token → /auth/me)
    provideAppInitializer(() => inject(AuthStore).restoreSession()),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor]),
    ),
    provideAnimationsAsync(),
    MessageService, // PrimeNG Toast (Error-Interceptor, Aktions-Feedback)
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    // ECharts nur in Chart-Komponenten genutzt; Module werden dort tree-shakbar importiert
    provideEchartsCore({ echarts: () => import('echarts/core') }),
  ],
};
