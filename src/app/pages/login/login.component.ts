import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      // Redirect to home page if already logged in
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    this.authService.login(this.username, this.password).subscribe(
      (user) => {
        if (user) {
          // Redirect to the desired page after login
          this.router.navigate(['/']);
        } else {
          this.errorMessage = 'Invalid username or password';
        }
      },
      (error) => {
        console.error('Login error:', error);
        this.errorMessage = 'An error occurred during login.';
      }
    );
  }
}
