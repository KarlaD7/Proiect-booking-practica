import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface TipCamera {
  id: number;
  nume: string;
  capacitate: number;
  pretNoapte: number;
  stocTotal: number;
  camereDisponibile?: number;
  disponibila: boolean;
  descriere: string;
  motivIndisponibilitate?: string;
}

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './details.html',
  styleUrl: './details.css'
})
export class DetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  hotel: any = null;

  minCheckInDate: string = new Date().toISOString().split('T')[0];
  minCheckOutDate: string = '';

  checkInDate: string = '2026-08-15';
  checkOutDate: string = '2026-08-20';
  numarPersoane: number = 3;

  tipuriCamere: TipCamera[] = [];
  selectedCameraId: number | null = null;
  cameraSelectata: TipCamera | null = null;

  pretTotalCalculat: number = 0;
  numarCamereNecesare: number = 1;

  bookingMessage: string = '';
  isSuccess: boolean = false;
  isError: boolean = false;
  sugestieCamere: string = '';

  rezervariExistente: any[] = [];

  private hoteluriMock: Record<number, any> = {
    1: { id: 1, nume: 'Grand Hotel Gulsoy Old City', adresa: 'Kemal Pasa, Sehzadebasi Cd. No:9, Istanbul', descriere: 'Grand Hotel Gulsoy Old City se află în centrul orașului vechi din Istanbul, la 10 minute de mers pe jos de Marele Bazar.', pozaNume: 'grandhotel', imagineUrl: '/grandhotel1.jpg' },
    2: { id: 2, nume: 'Butik Art Hotel', adresa: 'Budapest, Nagykörút, Ungaria', descriere: 'Situat în cea mai populara zona din Budapesta. Acest hotel de 3 stele oferă o grădină, precum și camere cu aer condiționat și WiFi gratuit, care beneficiază toate de o baie proprie. ', pozaNume: 'butikarthotel', imagineUrl: '/butikarthotel1.jpg' },
    3: { id: 3, nume: 'Hotel Relais Bosquet', adresa: '19 Rue du Champ de Mars, Paris, Franța', descriere: 'Situat chiar în centrul Parisului, la doar 10 minute de Turnul Eiffel.', pozaNume: 'hotelrelais', imagineUrl: '/hotelrelais1.jpg' }
  };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.hotel = this.hoteluriMock[id] || this.hoteluriMock[1];

    this.actualizeazaMinCheckOut();
    this.incarcaRezervariSiVerifica();
  }

  incarcaRezervariSiVerifica(): void {
    const rezervariLocal = JSON.parse(localStorage.getItem('user_bookings') || '[]');

    this.http.get<any[]>('http://localhost:5299/api/bookings').subscribe({
      next: (data: any) => {
        let listaServer = Array.isArray(data) ? data : (data?.$values || []);
        this.rezervariExistente = [...rezervariLocal, ...listaServer];
        this.incarcaTipuriCamere();
      },
      error: () => {
        this.rezervariExistente = rezervariLocal;
        this.incarcaTipuriCamere();
      }
    });
  }

  incarcaTipuriCamere(): void {
    const definireCamere = [
      {
        id: 101,
        nume: 'Cameră Dublă Standard',
        capacitate: 2,
        pretNoapte: 200,
        stocTotal: 3,
        descriere: '1 Pat Matrimonial sau 2 Paturi Single, Baie proprie'
      },
      {
        id: 102,
        nume: 'Cameră Superior Deluxe',
        capacitate: 2,
        pretNoapte: 280,
        stocTotal: 2,
        descriere: 'Pat King Size, Balcon cu vedere la oraș'
      },
      {
        id: 104,
        nume: 'Cameră Triplă Family',
        capacitate: 3,
        pretNoapte: 340,
        stocTotal: 2,
        descriere: '1 Pat Matrimonial + 1 Pat Single, ideală pentru 3 persoane'
      },
      {
        id: 103,
        nume: 'Apartament Family / Suite',
        capacitate: 4,
        pretNoapte: 450,
        stocTotal: 1,
        descriere: '2 Dormitoare separate, Sufragerie, Capacitate 4 persoane'
      }
    ];

    const nouCheckIn = new Date(this.checkInDate).getTime();
    const nouCheckOut = new Date(this.checkOutDate).getTime();

    this.tipuriCamere = definireCamere.map(cam => {
      const rezervariSuprapuse = this.rezervariExistente.filter(r => {
        const hId = r.roomID || r.RoomID;
        if (hId !== this.hotel.id) return false;

        const numeCamRes = r.numeCamera || r.NumeCamera || '';
        const esteAceeasiCamera = numeCamRes.includes(cam.nume);

        if (!esteAceeasiCamera) return false;

        const exIn = new Date(r.dataCheckIn || r.DataCheckIn).getTime();
        const exOut = new Date(r.dataCheckOut || r.DataCheckOut).getTime();

        return nouCheckIn < exOut && nouCheckOut > exIn;
      });

      const ocupate = rezervariSuprapuse.length;
      const libere = cam.stocTotal - ocupate;

      if (libere <= 0) {
        return {
          ...cam,
          camereDisponibile: 0,
          disponibila: false,
          motivIndisponibilitate: `Toate cele ${cam.stocTotal} camere de acest tip sunt ocupate!`
        };
      }

      return {
        ...cam,
        camereDisponibile: libere,
        disponibila: true
      };
    });

    this.evalueazaOptiuniAbalabile();
  }

  onCheckInChange(): void {
    if (!this.checkInDate) return;

    const nextDay = new Date(this.checkInDate);
    nextDay.setDate(nextDay.getDate() + 1);
    this.minCheckOutDate = nextDay.toISOString().split('T')[0];

    if (this.checkOutDate <= this.checkInDate) {
      this.checkOutDate = this.minCheckOutDate;
    }

    this.incarcaTipuriCamere();
  }

  actualizeazaMinCheckOut(): void {
    if (this.checkInDate) {
      const nextDay = new Date(this.checkInDate);
      nextDay.setDate(nextDay.getDate() + 1);
      this.minCheckOutDate = nextDay.toISOString().split('T')[0];
    }
  }

  evalueazaOptiuniAbalabile(): void {
    this.sugestieCamere = '';
    const n = Number(this.numarPersoane);

    if (n === 3) {
      const tripla = this.tipuriCamere.find(c => c.capacitate === 3 && c.disponibila);
      const apartament = this.tipuriCamere.find(c => c.capacitate === 4 && c.disponibila);

      if (tripla) {
        this.selectedCameraId = tripla.id;
        this.numarCamereNecesare = 1;
      } else if (apartament) {
        this.selectedCameraId = apartament.id;
        this.numarCamereNecesare = 1;
      } else {
        const cameraDubla = this.tipuriCamere.find(c => c.capacitate === 2 && (c.camereDisponibile || 0) >= 2);
        if (cameraDubla) {
          this.selectedCameraId = cameraDubla.id;
          this.numarCamereNecesare = 2;
          this.sugestieCamere = 'Nu există o cameră de 3 sau 4 persoane disponibilă. Am selectat automat opțiunea de 2 Camere Duble!';
        } else {
          this.selectedCameraId = null;
          this.sugestieCamere = 'Nu mai există locuri în această perioadă.';
        }
      }
    } else if (n === 4) {
      const apartament = this.tipuriCamere.find(c => c.capacitate === 4 && c.disponibila);

      if (apartament) {
        this.selectedCameraId = apartament.id;
        this.numarCamereNecesare = 1;
      } else {
        const cameraDubla = this.tipuriCamere.find(c => c.capacitate === 2 && (c.camereDisponibile || 0) >= 2);
        if (cameraDubla) {
          this.selectedCameraId = cameraDubla.id;
          this.numarCamereNecesare = 2;
          this.sugestieCamere = 'Apartamentul de 4 persoane este indisponibil. Am selectat automat opțiunea de 2 Camere Duble!';
        } else {
          this.selectedCameraId = null;
          this.sugestieCamere = ' Nu mai există camere libere pentru 4 persoane în această perioadă.';
        }
      }
    } else {
      this.numarCamereNecesare = 1;
      const cameraAdecvata = this.tipuriCamere.find(c => c.capacitate >= n && c.disponibila);
      if (cameraAdecvata) {
        this.selectedCameraId = cameraAdecvata.id;
      } else {
        this.selectedCameraId = null;
      }
    }

    this.calculeazaPret();
  }

  selecteazaCamera(camera: TipCamera): void {
    if (!camera.disponibila) return;
    this.selectedCameraId = camera.id;

    const n = Number(this.numarPersoane);
    if ((n === 3 || n === 4) && camera.capacitate === 2) {
      this.numarCamereNecesare = 2;
    } else {
      this.numarCamereNecesare = 1;
    }

    this.calculeazaPret();
  }

  calculeazaPret(): void {
    this.cameraSelectata = this.tipuriCamere.find(c => c.id === this.selectedCameraId) || null;

    if (!this.checkInDate || !this.checkOutDate || !this.cameraSelectata) {
      this.pretTotalCalculat = 0;
      this.cdr.detectChanges();
      return;
    }

    const start = new Date(this.checkInDate);
    const end = new Date(this.checkOutDate);

    if (end <= start) {
      this.onCheckInChange();
      return;
    }

    const diferentaTimp = end.getTime() - start.getTime();
    const numarNopti = Math.max(1, Math.ceil(diferentaTimp / (1000 * 3600 * 24)));

    this.pretTotalCalculat = numarNopti * this.cameraSelectata.pretNoapte * this.numarCamereNecesare;
    this.cdr.detectChanges();
  }

  creeazaRezervare(): void {
    if (!this.hotel || !this.cameraSelectata) {
      this.bookingMessage = 'Te rugăm să selectezi o cameră disponibilă.';
      this.isError = true;
      return;
    }

    const savedUser = localStorage.getItem('user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    const currentUserId = user ? (user.id || user.ID || 2) : 2;

    const nouaRezervare = {
      id: Date.now(),
      userID: currentUserId,
      roomID: this.hotel.id,
      numeCamera: `${this.cameraSelectata.nume} (${this.numarCamereNecesare}x)`,
      dataCheckIn: this.checkInDate,
      dataCheckOut: this.checkOutDate,
      pretTotal: this.pretTotalCalculat,
      status: 'În așteptare'
    };

    const rezervariExistente = JSON.parse(localStorage.getItem('user_bookings') || '[]');
    rezervariExistente.push(nouaRezervare);
    localStorage.setItem('user_bookings', JSON.stringify(rezervariExistente));

    this.http.post('http://localhost:5299/api/bookings', nouaRezervare).subscribe({
      next: () => this.finalizeazaRedirectionare(),
      error: () => this.finalizeazaRedirectionare()
    });
  }

  private finalizeazaRedirectionare(): void {
    this.bookingMessage = 'Rezervarea a fost efectuată cu succes! Se redirecționează...';
    this.isSuccess = true;
    this.isError = false;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.router.navigate(['/cont']);
    }, 1200);
  }
}