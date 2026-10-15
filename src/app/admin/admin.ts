import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface RezervareAdmin {
  id: number;
  userID: number;
  numeClient?: string;
  emailClient?: string;
  roomID: number;
  numeHotel?: string;
  numeCamera: string;
  dataCheckIn: string;
  dataCheckOut: string;
  pretTotal: number;
  status: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  toateRezervarile: RezervareAdmin[] = [];
  rezervariFiltrate: RezervareAdmin[] = [];

  selectedHotelId: number = 0;
  selectedDate: string = '';
  cautareClient: string = '';

  listaHoteluri = [
    { id: 1, nume: 'Grand Hotel Gulsoy Old City' },
    { id: 2, nume: 'Butik Art Hotel' },
    { id: 3, nume: 'Hotel Relais Bosquet' }
  ];

  numarCamereOcupateInZi: number = 0;

  ngOnInit(): void {
    const savedUser = localStorage.getItem('user');
    const user = savedUser ? JSON.parse(savedUser) : null;

    if (!user || user.rol !== 'ADMIN') {
      alert('Acces restricționat! Autentificați-vă mai întâi cu contul de administrator (admin@cozystay.ro).');
      this.router.navigate(['/cont']);
      return;
    }

    this.incarcaToateRezervarile();
  }

  incarcaToateRezervarile(): void {
    const localBookings = JSON.parse(localStorage.getItem('user_bookings') || '[]');

    this.http.get<any[]>('http://localhost:5299/api/bookings').subscribe({
      next: (data: any) => {
        let serverBookings = Array.isArray(data) ? data : (data?.$values || []);
        const combinate = [...localBookings, ...serverBookings];
        const unice = Array.from(new Map(combinate.map(item => [item.id || item.ID, item])).values());

        this.toateRezervarile = unice.map((r: any) => this.normalizeazaRezervare(r));
        this.aplicaFiltre();
      },
      error: () => {
        if (localBookings.length === 0) {
          this.toateRezervarile = [
            { id: 101, userID: 2, numeClient: 'Popescu Ion', emailClient: 'ion.popescu@gmail.com', roomID: 1, numeHotel: 'Grand Hotel Gulsoy Old City', numeCamera: 'Cameră Dublă Standard (1x)', dataCheckIn: '2026-08-15', dataCheckOut: '2026-08-20', pretTotal: 1000, status: 'Confirmată' },
            { id: 102, userID: 3, numeClient: 'Maria Ionescu', emailClient: 'maria.ionescu@yahoo.com', roomID: 2, numeHotel: 'Butik Art Hotel', numeCamera: 'Apartament Family / Suite (1x)', dataCheckIn: '2026-08-15', dataCheckOut: '2026-08-18', pretTotal: 1350, status: 'Confirmată' },
            { id: 103, userID: 4, numeClient: 'Andrei Radu', emailClient: 'andrei.radu@gmail.com', roomID: 1, numeHotel: 'Grand Hotel Gulsoy Old City', numeCamera: 'Cameră Superior Deluxe (1x)', dataCheckIn: '2026-08-18', dataCheckOut: '2026-08-22', pretTotal: 1120, status: 'În așteptare' }
          ];
        } else {
          this.toateRezervarile = localBookings.map((r: any) => this.normalizeazaRezervare(r));
        }
        this.aplicaFiltre();
      }
    });
  }

  private normalizeazaRezervare(r: any): RezervareAdmin {
    const hotelId = r.roomID || r.RoomID || 1;
    const hotelGasit = this.listaHoteluri.find(h => h.id === Number(hotelId));

    return {
      id: r.id || r.ID || Date.now(),
      userID: r.userID || r.UserID || 1,
      numeClient: r.numeClient || r.NumeClient || `Utilizator #${r.userID || r.UserID || 2}`,
      emailClient: r.emailClient || r.EmailClient || 'client@hotel.ro',
      roomID: Number(hotelId),
      numeHotel: hotelGasit ? hotelGasit.nume : `Hotel #${hotelId}`,
      numeCamera: r.numeCamera || r.NumeCamera || 'Cameră Standard',
      dataCheckIn: String(r.dataCheckIn || r.DataCheckIn).split('T')[0],
      dataCheckOut: String(r.dataCheckOut || r.DataCheckOut).split('T')[0],
      pretTotal: r.pretTotal || r.PretTotal || 0,
      status: r.status || r.Status || 'Confirmată'
    };
  }

  aplicaFiltre(): void {
    this.rezervariFiltrate = this.toateRezervarile.filter(r => {
      if (this.selectedHotelId !== 0 && r.roomID !== Number(this.selectedHotelId)) {
        return false;
      }

      if (this.selectedDate) {
        const ziFiltru = new Date(this.selectedDate).getTime();
        const checkIn = new Date(r.dataCheckIn).getTime();
        const checkOut = new Date(r.dataCheckOut).getTime();

        const esteAcupatInZi = ziFiltru >= checkIn && ziFiltru < checkOut;
        if (!esteAcupatInZi) return false;
      }

      if (this.cautareClient.trim() !== '') {
        const text = this.cautareClient.toLowerCase();
        const potrivesteNume = r.numeClient?.toLowerCase().includes(text);
        const potrivesteEmail = r.emailClient?.toLowerCase().includes(text);
        const potrivesteCamera = r.numeCamera?.toLowerCase().includes(text);
        if (!potrivesteNume && !potrivesteEmail && !potrivesteCamera) return false;
      }

      return true;
    });

    this.numarCamereOcupateInZi = this.rezervariFiltrate.length;
    this.cdr.detectChanges();
  }

  resetFiltre(): void {
    this.selectedHotelId = 0;
    this.selectedDate = '';
    this.cautareClient = '';
    this.aplicaFiltre();
  }

  schimbaStatus(rezervare: RezervareAdmin, noulStatus: string): void {
    rezervare.status = noulStatus;
    localStorage.setItem('user_bookings', JSON.stringify(this.toateRezervarile));

    this.http.put(`http://localhost:5299/api/bookings/${rezervare.id}`, rezervare).subscribe({
      next: () => {},
      error: () => {}
    });

    this.aplicaFiltre();
  }
}