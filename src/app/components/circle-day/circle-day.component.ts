import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-circle-day',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="day-circle" 
      [class.active]="isActive"
      (click)="daySelected.emit()">
      <div class="day-label">{{ getDayLabel() }}</div>
    </div>
  `,
  styles: `
    .day-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      
      &:hover {
        background-color: rgba(103, 58, 183, 0.12);
      }
      
      &.active {
        background-color: #673ab7;
        color: white;
      }
    }
    
    .day-label {
      font-size: 18px;
      font-weight: 500;
      text-transform: uppercase;
      margin-top: 2px;
      line-height: 1;
    }
  `
})
export class CircleDayComponent {
  @Input() date: Date = new Date();
  @Input() isActive: boolean = false;
  @Output() daySelected = new EventEmitter<void>();
  
  getDayLabel(): string {
    return new Date(this.date).toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 1);
  }
} 