import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateForecastRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'La consulta no puede estar vacía' })
  query: string;

  @IsOptional()
  @IsString()
  departamento?: string;

  @IsOptional()
  @IsString()
  familiaEvento?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1980)
  anioDesde?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(2100)
  anioHasta?: number;
}
