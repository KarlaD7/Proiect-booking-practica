import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { PropertyService } from '../services/property';

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './locations.html',
  styleUrls: ['./locations.css']
})
export class LocationsComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private cdr = inject(ChangeDetectorRef);

  listaHoteluri: any[] = [];

  ngOnInit(): void {
    console.log('LocationsComponent s-a creat! Se trimite cererea la API...');
    
    this.propertyService.getProperties().subscribe({
      next: (data: any) => {
        console.log('Date primite in Locations:', data);
        if (Array.isArray(data)) {
          this.listaHoteluri = data;
        } else if (data && Array.isArray(data.$values)) {
          this.listaHoteluri = data.$values;
        } else if (data) {
          this.listaHoteluri = [data];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Eroare API Locations:', err);
      }
    });
  }
}