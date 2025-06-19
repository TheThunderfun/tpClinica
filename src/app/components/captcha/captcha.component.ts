import {
  Component,
  EventEmitter,
  Output,
  ViewChild,
  ElementRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-captcha',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './captcha.component.html',
  styleUrl: './captcha.component.scss',
})
export class CaptchaComponent implements OnInit {
  @Output() captchaValidoChange = new EventEmitter<boolean>();
  @ViewChild('captchaCanvas', { static: true }) canvasRef!: ElementRef;

  captchaResultado: number = 0;
  captchaRespuesta: string = '';
  captchaError = false;
  captchaTexto: string = '';
  captchaValido: boolean = false;
  ngOnInit() {
    this.generarCaptcha();
  }

  generarCaptcha() {
    const a = this.numeroAleatorio(1, 10);
    const b = this.numeroAleatorio(1, 10);
    this.captchaResultado = a + b;
    this.captchaTexto = `${a} + ${b} = ?`;
    this.dibujarCaptcha();
    this.captchaRespuesta = '';
    this.captchaError = false;
  }

  numeroAleatorio(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  dibujarCaptcha() {
    const canvas = this.canvasRef.nativeElement as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo ruidoso
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 15; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${Math.random()})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Texto del captcha
    ctx.font = '24px monospace';
    ctx.fillStyle = '#333';
    ctx.fillText(this.captchaTexto, 10, 30);
  }

  intentosFallidos = 0;

  validarCaptcha() {
    const respuestaNum = parseInt(this.captchaRespuesta, 10);

    if (!isNaN(respuestaNum) && respuestaNum === this.captchaResultado) {
      this.captchaError = false;
      this.captchaValido = true; // ✅ Agregá esta línea
      this.captchaValidoChange.emit(true);
    } else {
      this.captchaError = true;
      this.captchaValido = false; // ❌ respuesta incorrecta
      this.captchaValidoChange.emit(false);
      this.intentosFallidos++;

      if (this.intentosFallidos >= 2) {
        this.generarCaptcha();
        this.intentosFallidos = 0;
      }
    }
  }
}
