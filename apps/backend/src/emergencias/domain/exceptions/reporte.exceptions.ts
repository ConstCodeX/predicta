export class ReporteNotFoundException extends Error {
  constructor(id: string) {
    super(`Reporte '${id}' no encontrado`);
    this.name = 'ReporteNotFoundException';
  }
}

export class InvalidReporteException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidReporteException';
  }
}

export class CSVParseException extends Error {
  constructor(message: string) {
    super(`Error al parsear CSV: ${message}`);
    this.name = 'CSVParseException';
  }
}
