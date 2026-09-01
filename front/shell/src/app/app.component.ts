import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AngularAuthenticationService,
  AngularAuthorizationService,
} from '@larpbabylone/angular-user-module';
import { AuthenticatedUser } from '@larpbabylone/user-module';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  user: AuthenticatedUser | null = null;
  loading = true;

  constructor(
    private readonly authenticationService: AngularAuthenticationService,
    private readonly authorizationService: AngularAuthorizationService,
  ) {}

  async ngOnInit(): Promise<void> {
    const callbackToken = this.authenticationService.consumeCallbackFromUrlHash();
    const token = callbackToken ?? this.authenticationService.getStoredToken();

    if (!token) {
      this.loading = false;
      return;
    }

    this.user = await this.authenticationService.authenticate(token);
    if (!this.user) {
      this.authenticationService.clearToken();
    }
    this.loading = false;
  }

  login(): void {
    const state = encodeURIComponent(window.location.pathname);
    window.location.href = this.authenticationService.buildLoginUrl(state);
  }

  logout(): void {
    this.authenticationService.clearToken();
    window.location.href = this.authenticationService.buildLogoutUrl();
  }

  isSuperAdmin(): boolean {
    return this.user ? this.authorizationService.isSuperAdmin(this.user) : false;
  }
}
