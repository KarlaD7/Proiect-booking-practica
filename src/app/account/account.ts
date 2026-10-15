import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './account.html',
  styleUrls: ['./account.css']
})
export class AccountComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  isRegisterMode: boolean = false;
  isLoggedIn: boolean = false;
  currentUser: any = null;

  nume: string = '';
  loginEmail: string = '';
  loginPass: string = '';
  telefon: string = '';

  message: string = '';
  isError: boolean = false;

  rezervari: any[] = [];
  isLoadingBookings: boolean = false;

  private pozeHoteluri: Record<number, string> = {
    1: 'grandhotel',
    2: 'butikarthotel',
    3: 'hotelrelais'
  };

  private numeHoteluri: Record<number, string> = {
    1: 'Grand Hotel Gulsoy Old City',
    2: 'Butik Art Hotel',
    3: 'Hotel Relais Bosquet'
  };

  ngOnInit(): void {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.isLoggedIn = true;
      this.incarcaRezervari();
    }
  }

  toggleMode(): void {
    this.isRegisterMode = !this.isRegisterMode;
    this.message = '';
    this.isError = false;
  }

  onLogin(): void {
    const emailCurat = (this.loginEmail || '').trim().toLowerCase();
    const parolaCurata = (this.loginPass || '').trim();

    if (!emailCurat) {
      this.message = 'Te rugăm să introduci adresa de email.';
      this.isError = true;
      return;
    }

    // 1. Verificare cont Administrator
    if (emailCurat === 'admin@cozystay.ro' && parolaCurata === 'admin123') {
      const adminUser = {
        id: 999,
        nume: 'Administrator Hotel',
        email: 'admin@cozystay.ro',
        telefon: '0700 000 000',
        rol: 'ADMIN'
      };

      this.salveazaSesiune(adminUser);
      this.router.navigate(['/admin']);
      return;
    }

    // 2. Autentificare Client 
    this.http.get<any[]>('http://localhost:5299/api/users').subscribe({
      next: (users: any) => {
        let lista = Array.isArray(users) ? users : (users?.$values || []);
        
        const gasit = lista.find((u: any) => 
          (u.email || u.Email || '').toLowerCase() === emailCurat
        );

        if (gasit) {
          this.salveazaSesiune({ ...gasit, rol: 'CLIENT' });
        } else {
          this.message = 'Adresa de email sau parola este incorectă.';
          this.isError = true;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Eroare API Users:', err);
        const numeGenerat = emailCurat.split('@')[0].replace('.', ' ');
        
        const userFallback = {
          id: 2,
          nume: numeGenerat.charAt(0).toUpperCase() + numeGenerat.slice(1),
          email: emailCurat,
          telefon: '0712 345 678',
          rol: 'CLIENT'
        };
        
        this.salveazaSesiune(userFallback);
      }
    });
  }

  onRegister(): void {
    const numeCurat = (this.nume || '').trim();
    const emailCurat = (this.loginEmail || '').trim();
    const parolaCurata = (this.loginPass || '').trim();

    if (!numeCurat || !emailCurat || !parolaCurata) {
      this.message = 'Completarea numelui, email-ului și parolei este obligatorie.';
      this.isError = true;
      return;
    }

    const newUserPayload = {
      nume: numeCurat,
      email: emailCurat,
      parola: parolaCurata,
      telefon: this.telefon || 'Nespecificat',
      rol: 'CLIENT'
    };

    this.http.post('http://localhost:5299/api/users', newUserPayload).subscribe({
      next: (userSalvat: any) => {
        this.salveazaSesiune(userSalvat || newUserPayload);
      },
      error: (err) => {
        console.error('Eroare la creare cont:', err);
        this.salveazaSesiune(newUserPayload);
      }
    });
  }

  salveazaSesiune(user: any): void {
    this.currentUser = user;
    this.isLoggedIn = true;
    this.message = '';
    this.isError = false;
    localStorage.setItem('user', JSON.stringify(user));
    this.incarcaRezervari();
    this.cdr.detectChanges();
  }

  incarcaRezervari(): void {
    if (!this.currentUser) return;
    
    if (this.currentUser.rol === 'ADMIN') {
      this.rezervari = [];
      return;
    }

    this.isLoadingBookings = true;
    const localBookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');

    this.http.get<any[]>('http://localhost:5299/api/bookings').subscribe({
      next: (data: any) => {
        let lista = Array.isArray(data) ? data : (data?.$values || []);
        const userId = this.currentUser.id || this.currentUser.ID || 2;
        
        const deLaServer = lista.filter((b: any) => (b.userID || b.UserID || b.userId) === userId);
        
        this.rezervari = [...localBookings, ...deLaServer];
        this.isLoadingBookings = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.rezervari = localBookings;
        this.isLoadingBookings = false;
        this.cdr.detectChanges();
      }
    });
  }

  anuleazaRezervare(bookingId: number): void {
    if (!confirm('Ești sigur că dorești să anulezi această rezervare?')) return;

    this.http.delete(`http://localhost:5299/api/bookings/${bookingId}`).subscribe({
      next: () => {
        this.rezervari = this.rezervari.filter(b => (b.id || b.ID) !== bookingId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Eroare la anulare backend:', err);
        this.rezervari = this.rezervari.filter(b => (b.id || b.ID || 1) !== bookingId);
        this.cdr.detectChanges();
      }
    });
  }

  getNumeHotel(roomId: number): string {
    return this.numeHoteluri[roomId] || 'Grand Hotel Gulsoy Old City';
  }

  getPozaHotel(roomId: number): string {
    const numePoza = this.pozeHoteluri[roomId] || 'grandhotel';
    return `/${numePoza}1.jpg`;
  }

  formatData(dataString: string): string {
    if (!dataString) return '';
    return dataString.split('T')[0];
  }

  logout(): void {
    this.isLoggedIn = false;
    this.currentUser = null;
    this.rezervari = [];
    this.loginEmail = '';
    this.loginPass = '';
    this.nume = '';
    this.telefon = '';
    this.message = '';
    localStorage.removeItem('user');
    this.cdr.detectChanges();
  }
}