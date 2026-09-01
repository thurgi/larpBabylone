import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { AngularAuthenticationService, AngularAuthorizationService } from '@larpbabylone/angular-user-module';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {
          provide: AngularAuthenticationService,
          useValue: {
            consumeCallbackFromUrlHash: () => null,
            getStoredToken: () => null,
            authenticate: async () => null,
            clearToken: () => undefined,
            buildLoginUrl: () => 'http://localhost/login',
            buildLogoutUrl: () => 'http://localhost/logout',
          },
        },
        {
          provide: AngularAuthorizationService,
          useValue: {
            isSuperAdmin: () => false,
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render shell title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Babylone Shell');
  });
});
