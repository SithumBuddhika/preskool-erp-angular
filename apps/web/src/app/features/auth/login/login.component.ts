import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <section class="erp-card login-card">
      <h1>Sign In</h1>
      <p>Login screen will be matched with the Figma authentication design.</p>
    </section>
  `,
  styles: `
    .login-card {
      width: min(100%, 420px);
      padding: 32px;
      text-align: center;
    }

    .login-card h1 {
      margin: 0 0 8px;
      font-size: 28px;
    }

    .login-card p {
      margin: 0;
      color: var(--erp-text-muted);
    }
  `,
})
export class LoginComponent {}
