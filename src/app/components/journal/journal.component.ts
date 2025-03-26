import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

interface JournalEntry {
  id: number;
  date: Date;
  title: string;
  content: string;
}

@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  template: `
    <div class="journal-container">
      <h1>Fitness Journal</h1>
      
      <!-- New Entry Form -->
      <mat-card class="entry-form">
        <mat-card-header>
          <mat-card-title>Add New Entry</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Title</mat-label>
            <input matInput [(ngModel)]="newEntry.title" placeholder="Entry Title">
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Journal Entry</mat-label>
            <textarea matInput [(ngModel)]="newEntry.content" placeholder="Write your thoughts..." rows="4"></textarea>
          </mat-form-field>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="addEntry()">Save Entry</button>
        </mat-card-actions>
      </mat-card>
      
      <!-- Journal Entries List -->
      <div class="entries-list">
        <mat-card *ngFor="let entry of journalEntries" class="journal-entry">
          <mat-card-header>
            <mat-card-title>{{ entry.title }}</mat-card-title>
            <mat-card-subtitle>{{ entry.date | date:'medium' }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>{{ entry.content }}</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="warn" (click)="deleteEntry(entry.id)">
              <mat-icon>delete</mat-icon> Delete
            </button>
          </mat-card-actions>
        </mat-card>
        
        <div *ngIf="journalEntries.length === 0" class="no-entries">
          <p>No journal entries yet. Start writing your fitness journey!</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .journal-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    h1 {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .entry-form {
      margin-bottom: 30px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .journal-entry {
      margin-bottom: 20px;
    }
    
    .no-entries {
      text-align: center;
      padding: 40px 0;
      color: #888;
    }
  `]
})
export class JournalComponent {
  journalEntries: JournalEntry[] = [
    {
      id: 1,
      date: new Date(),
      title: 'Great Workout Today',
      content: 'Had an amazing leg day session. Increased my squat weight by 10 pounds!'
    }
  ];
  
  newEntry: Partial<JournalEntry> = {
    title: '',
    content: ''
  };
  
  addEntry() {
    if (this.newEntry.title && this.newEntry.content) {
      const entry: JournalEntry = {
        id: this.getNextId(),
        date: new Date(),
        title: this.newEntry.title,
        content: this.newEntry.content
      };
      
      this.journalEntries.unshift(entry);
      
      // Reset form
      this.newEntry = {
        title: '',
        content: ''
      };
    }
  }
  
  deleteEntry(id: number) {
    this.journalEntries = this.journalEntries.filter(entry => entry.id !== id);
  }
  
  private getNextId(): number {
    return this.journalEntries.length ? Math.max(...this.journalEntries.map(e => e.id)) + 1 : 1;
  }
} 