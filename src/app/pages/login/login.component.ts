import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  returnUrl: string = '/';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      // Redirect to home page if already logged in
      this.router.navigate(['/']);
      return;
    }

    // Get the returnUrl from query parameters or default to '/'
    this.route.queryParams.subscribe((params) => {
      this.returnUrl = params['returnUrl'] || '/';
    });
  }

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password.';
      this.toastr.error(this.errorMessage, 'Error');
      return;
    }

    this.authService.login(this.username, this.password).subscribe(
      (user) => {
        if (user) {
          this.toastr.success('Logged in successfully!', 'Success');
          // Redirect to the intended page after login
          this.router.navigateByUrl(this.returnUrl);
          return;
        }

        this.errorMessage = 'Invalid username or password.';
        this.toastr.error('Invalid username or password.', 'Login Failed');
      },
      (error) => {
        console.error('Login error:', error);
        this.errorMessage = 'An error occurred during login.';
        this.toastr.error('An error occurred during login.', 'Login Failed');
      }
    );
  }
}
