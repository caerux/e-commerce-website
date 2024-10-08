import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap, map, catchError } from 'rxjs/operators';
import * as CryptoJS from 'crypto-js';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

export interface User {
  id: number;
  username: string;
}

export interface AuthResponse {
  id: number;
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private usersUrl = 'assets/users.json';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private router: Router
  ) {
    const savedUser = sessionStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser$ = this.currentUserSubject.asObservable();

    if (savedUser) {
      const parsedUser: User = JSON.parse(savedUser);
      this.verifyUser(parsedUser);
    }
  }

  //Verifies whether the provided user exists in the users.json file. If the user doesn't exist, logs out and notifies the user.
  private verifyUser(user: User): void {
    this.http
      .get<AuthResponse[]>(this.usersUrl)
      .pipe(
        map((users) =>
          users.find((u) => u.id === user.id && u.username === user.username)
        ),
        tap((validUser) => {
          if (validUser) {
            // User is valid, set the current user
            this.currentUserSubject.next(user);
          } else {
            // User is invalid, perform logout and notify
            this.logout();
            this.toastr.error(
              'Session is invalid. Please log in again.',
              'Invalid Session'
            );
            this.router.navigate(['/login']); // Redirect to login page
          }
        }),
        catchError((error) => {
          console.error('Error verifying user:', error);
          // On error, perform logout and notify
          this.logout();
          this.toastr.error(
            'An error occurred while verifying your session.',
            'Error'
          );
          this.router.navigate(['/login']); // Redirect to login page
          return of(null);
        })
      )
      .subscribe();
  }

  login(username: string, password: string): Observable<User | null> {
    const hashedPassword = CryptoJS.SHA256(password).toString();

    return this.http.get<AuthResponse[]>(this.usersUrl).pipe(
      map((users) => {
        const user = users.find(
          (u) => u.username === username && u.password === hashedPassword
        );
        return user ? { id: user.id, username: user.username } : null;
      }),
      tap((user) => {
        if (user) {
          this.currentUserSubject.next(user);
          sessionStorage.setItem('currentUser', JSON.stringify(user));
          this.toastr.success('Logged in successfully!', 'Success');
        } else {
          this.toastr.error('Invalid username or password.', 'Login Failed');
        }
      }),
      catchError((error) => {
        console.error('Login error:', error);
        this.toastr.error('An error occurred during login.', 'Error');
        return of(null);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.toastr.info('You have been logged out.', 'Logged Out');
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
