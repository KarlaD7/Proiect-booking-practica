import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PropertyService } from '../services/property';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit {
  private propertyService = inject(PropertyService);
  private cdr = inject(ChangeDetectorRef);
  
  listaHoteluri: any[] = [];

  ngOnInit(): void {
    this.propertyService.getProperties().subscribe({
      next: (data: any) => {
        console.log('Date aduse în Home:', data);
        if (Array.isArray(data)) {
          this.listaHoteluri = data;
        } else if (data && Array.isArray(data.$values)) {
          this.listaHoteluri = data.$values;
        } else {
          this.listaHoteluri = [data];
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Eroare API Home:', err)
    });
  }
}