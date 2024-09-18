import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface User {
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
    const savedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      savedUser ? JSON.parse(savedUser) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  login(username: string, password: string): Observable<User | null> {
    return this.http.get<User[]>(this.usersUrl).pipe(
      map((users) => {
        const user = users.find(
          (u) => u.username === username && u.password === password
        );
        return user ? user : null;
      }),
      tap((user) => {
        if (user) {
          this.currentUserSubject.next(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
