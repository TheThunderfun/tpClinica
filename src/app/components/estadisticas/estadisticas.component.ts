import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  ViewChildren,
  QueryList,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../services/usuarios.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

import { ChartConfiguration, ChartType, ChartOptions } from 'chart.js';
import { BaseChartDirective, NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.scss'],
})
export class EstadisticasComponent implements OnInit {
  fechaInicio: string = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
  fechaFin: string = dayjs().format('YYYY-MM-DD');
  @ViewChild('canvasEspecialidades')
  canvasEspecialidadesRef?: ElementRef<HTMLCanvasElement>;

  @ViewChildren('chartCanvas') chartCanvases!: QueryList<
    ElementRef<HTMLCanvasElement>
  >;
  logs: any[] = [];

  charts: {
    title: string;
    data: ChartConfiguration<'bar'>['data'];
    type: 'bar';
    options: ChartOptions<'bar'>;
    rawData: Record<string, number>;
    exportName: string;
    canvasRef?: ElementRef<HTMLCanvasElement>;
  }[] = [];

  constructor(private usuariosService: UsuariosService) {}

  async ngOnInit() {
    await this.actualizarGraficos();
  }

  async actualizarGraficos() {
    const [especialidades, porDia, porMedico, finalizados, logs] =
      await Promise.all([
        this.usuariosService.obtenerCantidadTurnosPorEspecialidad(),
        this.usuariosService.cantidadTurnosPorDia(),
        this.usuariosService.turnosPorMedicoEnRango(
          this.fechaInicio,
          this.fechaFin
        ),
        this.usuariosService.turnosFinalizadosPorMedicoEnRango(
          this.fechaInicio,
          this.fechaFin
        ),
        this.usuariosService.obtenerLogIngresos(
          this.fechaInicio,
          this.fechaFin
        ),
      ]);

    this.logs = logs;

    this.charts = [
      this.crearGrafico(
        'Turnos por Especialidad',
        especialidades,
        'turnos_por_especialidad',
        '#42A5F5'
      ),
      this.crearGrafico('Turnos por Día', porDia, 'turnos_por_dia', '#66BB6A'),
      this.crearGrafico(
        'Turnos Solicitados por Médico',
        porMedico,
        'turnos_solicitados_por_medico',
        '#FFA726'
      ),
      this.crearGrafico(
        'Turnos Finalizados por Médico',
        finalizados,
        'turnos_finalizados_por_medico',
        '#EF5350'
      ),
    ];

    // Esperamos al siguiente ciclo para que se rendericen los canvas
    setTimeout(() => {
      this.chartCanvases.forEach((ref, index) => {
        this.charts[index].canvasRef = ref;
      });
    });
  }
  crearGrafico(
    titulo: string,
    data: Record<string, number>,
    nombre: string,
    color: string
  ) {
    return {
      title: titulo,
      exportName: nombre,
      rawData: data,
      type: 'bar' as const,
      options: {
        responsive: true,
      },
      data: {
        labels: Object.keys(data),
        datasets: [
          {
            data: Object.values(data),
            label: titulo,
            backgroundColor: color,
          },
        ],
      },
    };
  }

  descargarExcel(data: Record<string, number>, nombreArchivo: string) {
    const datos = Object.entries(data).map(([clave, valor]) => ({
      Clave: clave,
      Cantidad: valor,
    }));
    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
    XLSX.writeFile(workbook, `${nombreArchivo}.xlsx`);
  }

  descargarPdf(data: Record<string, number>, titulo: string) {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Clave', 'Cantidad']],
      body: Object.entries(data).map(([clave, cantidad]) => [clave, cantidad]),
    });
    doc.save(`${titulo}.pdf`);
  }

  descargarLogsExcel() {
    const datos = this.logs.map((log) => ({
      Usuario: `${log.usuario?.nombre} ${log.usuario?.apellido}`,
      Email: log.usuario?.email,
      Fecha: dayjs(log.fecha_hora_ingreso).format('YYYY-MM-DD HH:mm'),
    }));
    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs');
    XLSX.writeFile(workbook, `logs_ingresos.xlsx`);
  }

  descargarLogsPdf() {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Usuario', 'Email', 'Fecha y Hora']],
      body: this.logs.map((log) => [
        `${log.usuario?.nombre} ${log.usuario?.apellido}`,
        log.usuario?.email,
        dayjs(log.fecha_hora_ingreso).format('YYYY-MM-DD HH:mm'),
      ]),
    });
    doc.save(`logs_ingresos.pdf`);
  }

  descargarGraficoComoPdf(chartElement: HTMLCanvasElement, titulo: string) {
    const doc = new jsPDF('landscape');

    const imgData = chartElement.toDataURL('image/png');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.addImage(imgData, 'PNG', 10, 10, pageWidth - 20, pageHeight - 20);
    doc.save(`${titulo}.pdf`);
  }
}
