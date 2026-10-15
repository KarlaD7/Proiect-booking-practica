import { Routes } from '@angular/router';
import { Home } from './home/home';
import { DetailsComponent } from './details/details';
import { LocationsComponent } from './locations/locations';
import { AccountComponent } from './account/account';
import { AdminComponent } from './admin/admin';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'locations', component: LocationsComponent },
  { path: 'details/:id', component: DetailsComponent },
  { path: 'cont', component: AccountComponent },
   { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: 'home' }
 
];