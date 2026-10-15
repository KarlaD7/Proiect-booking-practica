import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('practica-app');
  private router = inject(Router);

  go(path: string) {
    this.router.navigate([path]);
  }
}