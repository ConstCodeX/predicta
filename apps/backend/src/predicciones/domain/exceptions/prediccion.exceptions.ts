export class InvalidForecastResponseException extends Error {
  constructor(reason: string) {
    super(`Respuesta de IA inválida: ${reason}`);
    this.name = 'InvalidForecastResponseException';
  }
}

export class LLMUnavailableException extends Error {
  constructor(detail: string) {
    super(`Servicio LLM no disponible: ${detail}`);
    this.name = 'LLMUnavailableException';
  }
}

export class InsufficientHistoricalDataException extends Error {
  constructor(filters: string) {
    super(`Sin datos históricos suficientes para: ${filters}`);
    this.name = 'InsufficientHistoricalDataException';
  }
}
