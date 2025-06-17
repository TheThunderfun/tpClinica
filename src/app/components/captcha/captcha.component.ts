import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-captcha',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './captcha.component.html',
  styleUrl: './captcha.component.scss',
})
export class CaptchaComponent {
  captchaText = '';
  captchaRespuesta: string = '';
  captchaResultado: number = 0;
  captchaError = false;
  @Output() captchaValidoChange = new EventEmitter<boolean>();

  constructor(private toastr: ToastrService) {}

  ngOnInit() {
    this.generarCaptcha();
  }

  generarCaptcha() {
    const a = this.numeroAleatorio(1, 10);
    const b = this.numeroAleatorio(1, 10);
    this.captchaResultado = a + b;
    this.captchaText = `${a} + ${b} = ?`;
    this.captchaRespuesta = '';
    this.captchaError = false;
  }

  numeroAleatorio(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  validarCaptcha() {
    if (parseInt(this.captchaRespuesta, 10) === this.captchaResultado) {
      this.captchaError = false;
      this.captchaValidoChange.emit(true);
      // toastr o alert aquí si querés
    } else {
      this.captchaError = true;
      this.generarCaptcha();
      this.captchaValidoChange.emit(false);
    }
  }
}
