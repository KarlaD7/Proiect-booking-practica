import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Property {
  id: number;
 nume?: string;
  Nume?: string;
  locatie?: string;
  Locatie?: string;
  descriere?: string;
  Descriere?: string;
  puncteForte?: string;
  PuncteForte?: string;
  imagineUrl1?: string;
  ImagineUrl1?: string;
  imagineUrl2?: string;
  ImagineUrl2?: string;
  imagineUrl3?: string;
  ImagineUrl3?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private http = inject(HttpClient);
 private apiUrl = 'http://localhost:5299/api/properties';

  getProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(this.apiUrl);
  }
  getPropertyById(id: number): Observable<Property> {
 return this.http.get<Property>(`${this.apiUrl}/${id}`);
}
}