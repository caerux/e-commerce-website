import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap, map, catchError } from 'rxjs/operators';
import * as CryptoJS from 'crypto-js';

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

  constructor(private http: HttpClient) {
    const savedUser = sessionStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      savedUser ? JSON.parse(savedUser) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  // Attempts to log in a user with the provided credentials. Compares hashed passwords.
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
        }
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return of(null);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
