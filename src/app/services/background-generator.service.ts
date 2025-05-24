import { Injectable, signal } from '@angular/core';

interface BackgroundPattern {
  type: 'fitness3d';
  css: string;
  keyframes: string;
}

@Injectable({
  providedIn: 'root'
})
export class BackgroundGeneratorService {
  private currentBackground = signal<BackgroundPattern | null>(null);

  getCurrentBackground() {
    return this.currentBackground();
  }

  generateNewBackground(): BackgroundPattern {
    // Always generate the fitness 3D background
    const background = this.generateFitness3DBackground();
    this.currentBackground.set(background);
    return background;
  }

  private generateFitness3DBackground(): BackgroundPattern {
    const animationId = `fitness3d_screensaver`;
    
    const keyframes = `
      /* Floating dumbbells animation */
      @keyframes ${animationId}_dumbbell {
        0% { 
          transform: translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1);
        }
        25% { 
          transform: translateZ(80px) rotateX(15deg) rotateY(90deg) rotateZ(10deg) scale(1.1);
        }
        50% { 
          transform: translateZ(-40px) rotateX(30deg) rotateY(180deg) rotateZ(-5deg) scale(0.9);
        }
        75% { 
          transform: translateZ(120px) rotateX(-10deg) rotateY(270deg) rotateZ(15deg) scale(1.05);
        }
        100% { 
          transform: translateZ(0px) rotateX(0deg) rotateY(360deg) rotateZ(0deg) scale(1);
        }
      }

      /* Geometric shapes animation */
      @keyframes ${animationId}_geometric {
        0% { 
          transform: translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1);
        }
        33% { 
          transform: translateZ(60px) rotateX(120deg) rotateY(120deg) rotateZ(60deg) scale(1.15);
        }
        66% { 
          transform: translateZ(-30px) rotateX(240deg) rotateY(240deg) rotateZ(120deg) scale(0.85);
        }
        100% { 
          transform: translateZ(0px) rotateX(360deg) rotateY(360deg) rotateZ(180deg) scale(1);
        }
      }

      /* Fitness rings animation */
      @keyframes ${animationId}_rings {
        0% { 
          transform: translateZ(0px) rotateX(0deg) rotateY(0deg) scale(1);
        }
        50% { 
          transform: translateZ(100px) rotateX(180deg) rotateY(180deg) scale(1.2);
        }
        100% { 
          transform: translateZ(0px) rotateX(360deg) rotateY(360deg) scale(1);
        }
      }

      /* Floating particles */
      @keyframes ${animationId}_particles {
        0%, 100% { 
          transform: translateY(0px) translateX(0px) rotateZ(0deg);
          opacity: 0.3;
        }
        25% { 
          transform: translateY(-20px) translateX(10px) rotateZ(90deg);
          opacity: 0.6;
        }
        50% { 
          transform: translateY(-10px) translateX(-15px) rotateZ(180deg);
          opacity: 0.4;
        }
        75% { 
          transform: translateY(-30px) translateX(5px) rotateZ(270deg);
          opacity: 0.5;
        }
      }
    `;

    return {
      type: 'fitness3d',
      css: `
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        perspective: 1500px;
        transform-style: preserve-3d;
        overflow: hidden;
      `,
      keyframes: keyframes
    };
  }

  // Generate background on app initialization
  initializeBackground(): void {
    this.generateNewBackground();
  }

  // Generate new background (can be called on navigation)
  refreshBackground(): void {
    this.generateNewBackground();
  }
} 