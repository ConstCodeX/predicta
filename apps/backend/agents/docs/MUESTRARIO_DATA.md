# Muestrario de la data

Generado por `analisis/muestrario.py` leyendo los archivos reales de `data/`.
Todo lo que sigue sale de los archivos; nada esta escrito a mano.

## COEN scrapeado y limpio
`data/data_coen_limpio.parquet` — 36,650 reportes del portal INDECI/COEN. Es nuestra fuente principal 2019-2026.

- **36,650 filas x 28 columnas**, 4.9 MB
- rango de `fecha`: 2019-01-02 .. 2026-07-28

### Esquema

| columna | tipo | nulos | distintos | ejemplo / rango |
|---|---|---|---|---|
| fecha | datetime64[ns] | 3.8% | 2,691 | 2019-01-15(1046), 2019-02-15(170), 2026-07-27(43) |
| precision_fecha | object | 0.0% | 3 | exacta(34024), nula(1385), mes(1241) |
| origen_fecha | object | 3.8% | 4 | titulo_dd/mm/yyyy(33761), urlpdf_anio_mes(1241), urlpdf_DDMMMYYYY(241) |
| hora | object | 7.8% | 1,085 | 17:00(396), 23:00(382), 22:30(380) |
| tipo_reporte | object | 0.0% | 5 | COMPLEMENTARIO(34305), OTRO(1261), PRELIMINAR(660) |
| num_reporte | Int64 | 7.7% | 12,607 | min 1 / med 5148 / max 7.529e+04 |
| secuencia | Int64 | 7.6% | 41 | min 0 / med 2 / max 64 |
| evento | object | 0.5% | 43 | INCENDIO FORESTAL(8314), INCENDIO URBANO(6940), LLUVIAS INTENSAS(5094) |
| familia_evento | object | 0.5% | 8 | INCENDIO(15346), HIDROMETEOROLOGICO(10838), MOVIMIENTO DE MASA(5608) |
| departamento | object | 2.4% | 25 | ANCASH(4044), LIMA(3930), HUANCAVELICA(3380) |
| provincia | object | 92.8% | 324 | LIMA(172), LA CONVENCION(56), ABANCAY(52) |
| distrito | object | 4.2% | 2,520 | INDEPENDENCIA(368), SAN JUAN DE LURIGANCHO(250), ATE(199) |
| distritos_lista | object | 93.2% | 1,105 | SULLANA(20), CALLERIA(19), CERCADO DE LIMA(18) |
| n_distritos | float64 | 92.7% | 12 | min 0 / med 1 / max 11 |
| origen_ubicacion | object | 2.4% | 3 | formato1_dist_depto(32142), formato2_con_provincia(2658), solo_depto_c |
| ambito | object | 1.1% | 4 | DISTRITAL(35102), DEPARTAMENTAL(964), PROVINCIAL(126) |
| num_sospechoso | boolean | 7.7% | 2 | False(33826), True(2) |
| titulo | object | 0.0% | 36,566 | LIMA - Lima - Cercado de Lima: Incendio Urbano (Reporte Complementario |
| id_evento | object | 0.0% | 36,632 | moquegua-gral-sanchez-cerro-yunga-huayco(2), madre-de-dios-tambopata-l |
| url_detalle | object | 0.0% | 36,632 | https://portal.indeci.gob.pe/emergencias/moquegua-gral-sanchez-cerro-y |
| url_pdf | object | 0.0% | 36,623 | https://portal.indeci.gob.pe/wp-content/uploads/2020/07/REPORTE-COMPLE |
| duplicado | bool | 0.0% | 2 | False(36644), True(6) |
| anio | Int64 | 3.8% | 8 | min 2019 / med 2023 / max 2026 |
| mes | Int64 | 3.8% | 12 | min 1 / med 7 / max 12 |
| semana_epi | Int64 | 3.8% | 53 | min 1 / med 28 / max 53 |
| anio_semana | object | 3.8% | 396 | 2019-S03(1046), 2023-S37(201), 2024-S38(194) |
| es_ultimo_reporte | bool | 0.0% | 2 | True(36632), False(18) |
| calidad_ok | bool | 0.0% | 2 | True(33246), False(3404) |

### Filas de ejemplo

```
       fecha precision_fecha       origen_fecha   hora    tipo_reporte  num_reporte  secuencia             evento      familia_evento
0 2022-04-29          exacta   urlpdf_DDMMMYYYY  17:30  COMPLEMENTARIO         4246          2    INCENDIO URBANO            INCENDIO
1 2026-07-27          exacta   urlpdf_DDMMMYYYY  15:47  COMPLEMENTARIO         9696          1  INCENDIO FORESTAL            INCENDIO
2 2026-07-28          exacta  titulo_dd/mm/yyyy  19:10  COMPLEMENTARIO         9758          1      DESLIZAMIENTO  MOVIMIENTO DE MASA
3 2026-07-28          exacta  titulo_dd/mm/yyyy  18:30  COMPLEMENTARIO         9757         38              SISMO           GEOFISICO
4 2026-07-28          exacta  titulo_dd/mm/yyyy  17:30  COMPLEMENTARIO         9756          2    VIENTOS FUERTES  HIDROMETEOROLOGICO
```

## Base de Emergencia y Danos INDECI
`data/indeci_2003_2020.xlsx` — 96,526 emergencias oficiales 2003-2020, con 30 columnas de danos.

- **96,526 filas x 49 columnas**, 19.2 MB
- rango de `FECHA  DE LA EMER`: 2003-01-01 .. 2020-12-31

### Esquema

| columna | tipo | nulos | distintos | ejemplo / rango |
|---|---|---|---|---|
| CÓDIGO DE EMERGENCIA-SINPAD | string | 0.0% | 96,447 | 115372(2), 115405(2), 115345(2) |
| FECHA  DE LA EMER | datetime64[ns] | 0.0% | 6,551 | 2019-05-26(284), 2017-03-15(246), 2007-08-15(229) |
| AÑO | float64 | 0.0% | 18 | min 2003 / med 2013 / max 2020 |
| MES | string | 0.0% | 12 | Marzo(13840), Febrero(13466), Enero(11514) |
| COD. DISTRITO | float64 | 0.0% | 1,872 | min 1.01e+04 / med 9.072e+04 / max 2.504e+05 |
| DPTO. | string | 0.0% | 25 | APURÍMAC(10183), HUANCAVELICA(8288), LIMA(7336) |
| PROV. | string | 0.0% | 196 | LIMA(4306), HUANCAVELICA(2754), ABANCAY(2149) |
| DIST. | string | 0.0% | 1,722 | ABANCAY(709), LIMA(664), INDEPENDENCIA(653) |
| EMERGENCIA | string | 0.0% | 22 | LLUVIA INTENSA(25262), INCENDIO URB. E INDUST.(22531), BAJAS TEMPERATU |
| REGIÓN NATURAL | string | 0.0% | 4 | SIERRA(59820), COSTA(15383), SELVA BAJA(12219) |
| FALLECIDOS | float64 | 0.0% | 27 | min 0 / med 0 / max 299 |
| DESAPARECIDOS | float64 | 0.0% | 15 | min 0 / med 0 / max 37 |
| HERIDOS | float64 | 0.0% | 67 | min 0 / med 0 / max 2230 |
| DAMNIFICADOS | float64 | 0.0% | 772 | min 0 / med 0 / max 5.208e+04 |
| AFECTADOS | float64 | 0.0% | 2,887 | min 0 / med 0 / max 3.115e+05 |
| VIVIENDAS DESTRUIDAS | float64 | 0.0% | 286 | min 0 / med 0 / max 1.042e+04 |
| VIVIENDAS AFECTADAS | float64 | 0.0% | 892 | min 0 / med 0 / max 6.43e+04 |
| CENTROS EDUCATIVOS DESTRUIDOS | float64 | 0.0% | 26 | min 0 / med 0 / max 50 |
| CENTROS EDUCATIVOS AFECTADOS | float64 | 0.0% | 82 | min 0 / med 0 / max 259 |
| CENTROS SALUD DESTRUIDOS | float64 | 0.0% | 6 | min 0 / med 0 / max 27 |
| CENTROS SALUD AFECTADOS | float64 | 0.0% | 22 | min 0 / med 0 / max 48 |
| HAS CULTIVO DESTRUIDO | float64 | 0.0% | 1,059 | min -20 / med 0 / max 2.759e+05 |
| HAS CULTIVO AFECTADO | float64 | 0.0% | 1,668 | min 0 / med 0 / max 1.24e+05 |
| PUENTE AFECTADO | float64 | 0.0% | 28 | min 0 / med 0 / max 250 |
| PUENTE COLAPSADO | float64 | 0.0% | 24 | min 0 / med 0 / max 235 |
| CARRETERA AFECTADA | float64 | 0.0% | 1,118 | min 0 / med 0 / max 6.13e+05 |
| CARRETERA COLAPSADA | float64 | 0.0% | 532 | min 0 / med 0 / max 8.856e+04 |
| CAMINO RURAL AFECTADO | float64 | 0.0% | 490 | min 0 / med 0 / max 5.269e+05 |
| CAMNINO RURAL COLAPSADO | float64 | 0.0% | 277 | min 0 / med 0 / max 2.63e+04 |
| AGUA AFECTADA | float64 | 0.0% | 185 | min 0 / med 0 / max 3.645e+04 |
| AGUA COLAPSADA | float64 | 0.0% | 123 | min 0 / med 0 / max 8000 |
| DESAGÜE AFECTADO | float64 | 0.0% | 113 | min 0 / med 0 / max 2.637e+04 |
| DESAGÜE COLAPSADO | float64 | 0.0% | 73 | min 0 / med 0 / max 1.3e+04 |
| CANAL DE REGADÍO AFECTADO | float64 | 0.0% | 662 | min 0 / med 0 / max 1.282e+07 |
| CANAL DE REGADÍA COLAPSADO | float64 | 0.0% | 439 | min 0 / med 0 / max 4.5e+05 |
| PÉRDIDA VACUNO | float64 | 0.0% | 311 | min 0 / med 0 / max 3.298e+04 |
| PÉRDIDA CABALLAR | float64 | 0.0% | 71 | min 0 / med 0 / max 2610 |
| PÉRDIDA AUQUÉNIDO | float64 | 0.0% | 551 | min 0 / med 0 / max 8.147e+04 |
| PÉRDIDA CAPRINO* | float64 | 0.0% | 596 | min 0 / med 0 / max 8.656e+04 |
| PÉRDIDA PORCINO | float64 | 0.0% | 127 | min 0 / med 0 / max 1.243e+04 |

_(se muestran 40 de 49 columnas)_

### Filas de ejemplo

```
  CÓDIGO DE EMERGENCIA-SINPAD FECHA  DE LA EMER     AÑO        MES  COD. DISTRITO     DPTO.        PROV.        DIST.               EMERGENCIA
0                         351        2003-02-11  2003.0    Febrero        10101.0  AMAZONAS  CHACHAPOYAS  CHACHAPOYAS           LLUVIA INTENSA
1                        1588        2003-06-05  2003.0      Junio        10101.0  AMAZONAS  CHACHAPOYAS  CHACHAPOYAS  INCENDIO URB. E INDUST.
2                        1990        2003-07-14  2003.0      Julio        10101.0  AMAZONAS  CHACHAPOYAS  CHACHAPOYAS            DESLIZAMIENTO
3                        1994        2003-09-22  2003.0  Setiembre        10101.0  AMAZONAS  CHACHAPOYAS  CHACHAPOYAS           LLUVIA INTENSA
4                        3600        2003-10-22  2003.0    Octubre        10101.0  AMAZONAS  CHACHAPOYAS  CHACHAPOYAS           LLUVIA INTENSA
```

## Indice Costero El Nino (IGP/ENFEN)
`data/icen.txt` — Serie mensual 1950-2026. Indice oficial de El Nino costero.

- 922 lineas, 917 con datos

Cabecera y primeras filas:
```
% Índice Costero El Niño (ICEN; ENFEN, 2024)
% Versión oficial
%Referencia
%ENFEN (2024). Definición operacional de los eventos El Niño Costero y La Niña Costera en el Perú. N
% yy   mm   ICEN
1950   1   -0.75
1950   2   -1.07
1950   3   -1.25
...
2026   3    0.96
2026   4    1.34
2026   5    1.98
```

## RENIPRESS (SUSALUD)
`data/renipress.csv` — Padron de establecimientos de salud con coordenadas.

- **26,787 filas x 33 columnas**, 17.6 MB

### Esquema

| columna | tipo | nulos | distintos | ejemplo / rango |
|---|---|---|---|---|
| INSTITUCION | object | 0.0% | 12 | PRIVADO(16797), GOBIERNO REGIONAL(8387), MINSA(515) |
| COD_IPRESS | int64 | 0.0% | 26,787 | min 1 / med 1.866e+04 / max 3.885e+04 |
| NOMBRE | object | 0.1% | 24,119 | CONSULTORIO MEDICO(146), CONSULTORIO DENTAL(72), CONSULTORIO ODONTOLOG |
| CLASIFICACION | object | 0.3% | 127 | CONSULTORIOS MEDICOS Y DE OTROS PROFESIONALES DE LA SALUD(10231), PUES |
| TIPO_ESTABLECIMIENTO | object | 0.0% | 5 | ESTABLECIMIENTO DE SALUD SIN INTERNAMIENTO(22780), SERVICIO MEDICO DE  |
| DEPARTAMENTO | object | 0.0% | 25 | LIMA(9773), CAJAMARCA(1493), PIURA(1472) |
| PROVINCIA | object | 0.0% | 196 | LIMA(8893), AREQUIPA(1044), CALLAO(871) |
| DISTRITO | object | 0.0% | 1,733 | SAN JUAN DE LURIGANCHO(787), LOS OLIVOS(621), SANTIAGO DE SURCO(569) |
| UBIGEO | int64 | 0.0% | 1,889 | min 1.01e+04 / med 1.501e+05 / max 2.504e+05 |
| DIRECCION | object | 0.0% | 20,747 | ACTUALIZAR(214), SAN MARTIN(87), GRAU(85) |
| CO_DISA | int64 | 0.0% | 29 | min 1 / med 22 / max 36 |
| COD_RED | float64 | 28.5% | 161 | min 0 / med 0 / max 181 |
| COD_MICRORRED | float64 | 25.4% | 898 | min 0 / med 0 / max 1194 |
| DISA | object | 0.0% | 29 | LIMA CENTRO(4014), LIMA SUR(1940), LIMA NORTE(1915) |
| RED | object | 28.5% | 160 | NO PERTENECE A NINGUNA RED(10777), CHACHAPOYAS(212), CHOTA(167) |
| MICRORED | object | 25.4% | 853 | NO PERTENECE A NINGUNA MICRORED(11873), SANTO TOMAS(56), BELLAVISTA(50 |
| COD_UE | float64 | 66.3% | 238 | min 117 / med 1058 / max 5.003e+05 |
| UNIDAD_EJECUTORA | object | 66.3% | 238 | REGION AMAZONAS-SALUD(214), SALUD LUCIANO CASTILLO COLONNA(206), SALUD |
| CATEGORIA | object | 0.0% | 11 | I-1(9831), I-2(6704), 0(4895) |
| TELEFONO | object | 0.2% | 23,383 | NO TIENE(396), ACTUALIZAR(123), 0(115) |
| HORARIO | object | 0.0% | 6,840 | 8:00 - 20:00(1587), 8:00 - 14:00(1150), 24 HORAS(880) |
| INICIO_ACTIVIDAD | object | 0.0% | 9,601 | 1/01/1900(788), 1/01/1990(151), 9/10/1996(137) |
| ESTADO | object | 0.0% | 1 | ACTIVO(26787) |
| SITUACION | object | 0.0% | 1 | REGISTRADO(26787) |
| CONDICION | object | 0.2% | 3 | ACTIVO(26717), ANOTACION(27), INOPERATIVO(2) |
| NORTE | float64 | 26.5% | 18,078 | min -18.34 / med -12.01 / max -0.09638 |
| ESTE | float64 | 26.5% | 18,070 | min -81.31 / med -76.97 / max -68.66 |
| IMAGEN_1 | object | 26.4% | 19,701 | http://app20.susalud.gob.pe:8080/registro-renipress-webapp/ipress.htm? |
| FE_ACT_IMAGEN_1 | object | 93.3% | 985 | 1/01/1900 02:00:00(147), 1/01/2000(135), 3/07/2015(22) |
| IMAGEN_2 | object | 38.5% | 16,471 | http://app20.susalud.gob.pe:8080/registro-renipress-webapp/ipress.htm? |
| FE_ACT_IMAGEN_2 | object | 93.3% | 985 | 1/01/1900 02:00:00(147), 1/01/2000(135), 3/07/2015(22) |
| IMAGEN_3 | object | 42.5% | 15,399 | http://app20.susalud.gob.pe:8080/registro-renipress-webapp/ipress.htm? |
| FE_ACT_IMAGEN_3 | object | 93.3% | 985 | 1/01/1900 02:00:00(147), 1/01/2000(135), 3/07/2015(22) |

### Filas de ejemplo

```
         INSTITUCION  COD_IPRESS                   NOMBRE                    CLASIFICACION             TIPO_ESTABLECIMIENTO   DEPARTAMENTO       PROVINCIA    DISTRITO  UBIGEO
0  GOBIERNO REGIONAL        2806                 LA NOVIA  PUESTOS DE SALUD O POSTAS DE...  ESTABLECIMIENTO DE SALUD SIN...  MADRE DE DIOS       TAHUAMANU   TAHUAMANU  170303
1  GOBIERNO REGIONAL        2807              SANTA MARIA  PUESTOS DE SALUD O POSTAS DE...  ESTABLECIMIENTO DE SALUD SIN...  MADRE DE DIOS       TAHUAMANU   TAHUAMANU  170303
2  GOBIERNO REGIONAL        2808            P.S. CAMBRUNE  PUESTOS DE SALUD O POSTAS DE...  ESTABLECIMIENTO DE SALUD SIN...       MOQUEGUA  MARISCAL NIETO     CARUMAS  180102
3  GOBIERNO REGIONAL        2809  CENTRO DE SALUD CARUMAS  CENTROS DE SALUD O CENTROS M...  ESTABLECIMIENTO DE SALUD SIN...       MOQUEGUA  MARISCAL NIETO     CARUMAS  180102
4  GOBIERNO REGIONAL        2811             P.S. SACUAYA  PUESTOS DE SALUD O POSTAS DE...  ESTABLECIMIENTO DE SALUD SIN...       MOQUEGUA  MARISCAL NIETO  CUCHUMBAYA  180103
```

## Clima diario (Open-Meteo / ERA5)
`data/openmeteo.parquet` — Precipitacion y temperatura por distrito-dia.

- **206,496 filas x 9 columnas**, 1.3 MB
- rango de `fecha`: 2003-01-01 .. 2026-07-22

### Esquema

| columna | tipo | nulos | distintos | ejemplo / rango |
|---|---|---|---|---|
| ubigeo | object | 0.0% | 24 | 020105(8604), 150132(8604), 150103(8604) |
| distrito | object | 0.0% | 24 | INDEPENDENCIA(8604), SAN JUAN DE LURIGANCHO(8604), ATE(8604) |
| departamento | object | 0.0% | 7 | LIMA(86040), PASCO(43020), ANCASH(25812) |
| fecha | datetime64[ns] | 0.0% | 8,604 | 2026-07-22(24), 2003-01-01(24), 2003-01-02(24) |
| precipitation_sum | float64 | 0.0% | 571 | min 0 / med 0.3 / max 155 |
| precipitation_hours | float64 | 0.0% | 25 | min 0 / med 2 / max 24 |
| temperature_2m_max | float64 | 0.0% | 372 | min -0.3 / med 20 / max 38.2 |
| temperature_2m_min | float64 | 0.0% | 360 | min -12 / med 13.8 / max 26 |
| temperature_2m_mean | float64 | 0.0% | 329 | min -2.4 / med 16.5 / max 31 |

### Filas de ejemplo

```
   ubigeo       distrito departamento      fecha  precipitation_sum  precipitation_hours  temperature_2m_max  temperature_2m_min  temperature_2m_mean
0  020105  INDEPENDENCIA       ANCASH 2003-01-01                6.8                 11.0                12.9                 4.8                  8.1
1  020105  INDEPENDENCIA       ANCASH 2003-01-02               10.2                 14.0                13.0                 5.1                  8.2
2  020105  INDEPENDENCIA       ANCASH 2003-01-03               11.2                 17.0                14.4                 4.3                  8.2
3  020105  INDEPENDENCIA       ANCASH 2003-01-04                5.9                 11.0                13.0                 3.9                  8.0
4  020105  INDEPENDENCIA       ANCASH 2003-01-05                3.0                  9.0                13.0                 4.6                  8.4
```

## Dataset de modelado
`data/dataset_riesgo.parquet` — Distrito-dia con features de clima y el objetivo del modelo.

- **64,632 filas x 39 columnas**, 2.7 MB
- rango de `fecha`: 2019-03-03 .. 2026-07-16

### Esquema

| columna | tipo | nulos | distintos | ejemplo / rango |
|---|---|---|---|---|
| ubigeo | object | 0.0% | 24 | 020101(2693), 020105(2693), 021809(2693) |
| distrito | object | 0.0% | 24 | HUARAZ(2693), INDEPENDENCIA(2693), NUEVO CHIMBOTE(2693) |
| departamento | object | 0.0% | 7 | LIMA(26930), PASCO(13465), ANCASH(8079) |
| fecha | datetime64[ns] | 0.0% | 2,693 | 2026-07-16(24), 2019-03-03(24), 2019-03-04(24) |
| precipitation_sum | float64 | 0.0% | 454 | min 0 / med 0.2 / max 104.6 |
| precipitation_hours | float64 | 0.0% | 25 | min 0 / med 1 / max 24 |
| temperature_2m_max | float64 | 0.0% | 365 | min 1.1 / med 20 / max 38.2 |
| temperature_2m_min | float64 | 0.0% | 343 | min -10.5 / med 13 / max 26 |
| temperature_2m_mean | float64 | 0.0% | 319 | min -1.7 / med 16 / max 31 |
| k | object | 0.0% | 24 | ANCASH|HUARAZ(2693), ANCASH|INDEPENDENCIA(2693), ANCASH|NUEVO CHIMBOTE |
| lluv1 | float64 | 0.0% | 454 | min 0 / med 0.2 / max 104.6 |
| pct1 | float64 | 0.0% | 1,811 | min 0.02773 / med 0.4213 / max 1 |
| lluv3 | float64 | 0.0% | 10,537 | min 0 / med 1.2 / max 131.8 |
| pct3 | float64 | 0.0% | 5,062 | min 0.004893 / med 0.3991 / max 1 |
| lluv7 | float64 | 0.0% | 10,539 | min 0 / med 4.2 / max 197.8 |
| pct7 | float64 | 0.0% | 5,268 | min 0.0007249 / med 0.4899 / max 1 |
| lluv15 | float64 | 0.0% | 8,477 | min 0 / med 10.5 / max 342 |
| pct15 | float64 | 0.0% | 5,313 | min 0.0003625 / med 0.4937 / max 1 |
| lluv30 | float64 | 0.0% | 8,299 | min 0 / med 23.3 / max 572.4 |
| pct30 | float64 | 0.0% | 5,318 | min 0.0005437 / med 0.4954 / max 1 |
| lluv60 | float64 | 0.0% | 12,537 | min 0 / med 50.8 / max 1099 |
| pct60 | float64 | 0.0% | 5,262 | min 0.0007249 / med 0.4998 / max 1 |
| dias_secos30 | float64 | 0.0% | 31 | min 0 / med 23 / max 30 |
| mes | int32 | 0.0% | 12 | min 1 / med 6 / max 12 |
| anom_min | float64 | 0.0% | 16,656 | min -9.813 / med -0.007661 / max 6.134 |
| anom_mean | float64 | 0.0% | 13,428 | min -10.12 / med -0.03871 / max 5.584 |
| tmin_pct | float64 | 0.0% | 1,926 | min 0.0003625 / med 0.4917 / max 1 |
| sin_anio | float64 | 0.0% | 366 | min -1 / med 0.06232 / max 1 |
| cos_anio | float64 | 0.0% | 366 | min -1 / med -0.04622 / max 1 |
| semana_epi | int64 | 0.0% | 53 | min 1 / med 26 / max 53 |
| anio | int32 | 0.0% | 8 | min 2019 / med 2022 / max 2026 |
| icen | float64 | 0.0% | 78 | min -1.51 / med -0.3 / max 2.92 |
| icen_d3 | float64 | 1.1% | 146 | min -1.72 / med 0.07 / max 2.62 |
| ev_hoy | int64 | 0.0% | 4 | min 0 / med 0 / max 3 |
| hubo | int64 | 0.0% | 2 | 0(64277), 1(355) |
| y | int64 | 0.0% | 2 | 0(62367), 1(2265) |
| ev_frio | int64 | 0.0% | 2 | 0(64567), 1(65) |
| y_frio | int64 | 0.0% | 2 | 0(64192), 1(440) |
| hist_prev | float64 | 0.0% | 20,280 | min 0 / med 0.002533 / max 0.03333 |

### Filas de ejemplo

```
   ubigeo distrito departamento      fecha  precipitation_sum  precipitation_hours  temperature_2m_max  temperature_2m_min  temperature_2m_mean
0  020101   HUARAZ       ANCASH 2019-03-03               12.0                 11.0                15.2                 1.9                  8.6
1  020101   HUARAZ       ANCASH 2019-03-04                7.6                 11.0                16.5                 2.7                  9.0
2  020101   HUARAZ       ANCASH 2019-03-05                9.6                 14.0                14.9                 5.3                  9.6
3  020101   HUARAZ       ANCASH 2019-03-06               17.9                 21.0                14.5                 6.7                  9.2
4  020101   HUARAZ       ANCASH 2019-03-07               22.9                 16.0                15.0                 5.7                  9.5
```

## Geometria distrital (INEI)
`data/peru_distritos.geojson` — 1,834 distritos con ubigeo, provincia y departamento.

- 1,834 features, 1.9 MB

Propiedades del primer feature:
```json
{
 "OBJECTID": 1,
 "IDDIST": "230110",
 "IDDPTO": "23",
 "IDPROV": "2301",
 "NOMBDIST": "CORONEL GREGORIO ALBARRACIN LANCHIPA",
 "NOMBPROV": "TACNA",
 "NOMBDEP": "TACNA",
 "DCTO": "LEY",
 "LEY": "27415",
 "FECHA": "02/02/2001",
 "NOM_CAP": "ALFONSO UGARTE",
 "SHAPE_LENG": 0.570509667,
 "SHAPE_AREA": 0.0161399587,
 "SHAPE_LE_1": 0.57019506331,
 "SHAPE_AR_1": 0.01598980139,
 "AREA_MINAM": 18834.14
}
```

## Dengue (CDC Peru)
`data/dengue.csv` — PENDIENTE de descarga.

- **757,890 filas x 13 columnas**, 81.8 MB

### Esquema

| columna | tipo | nulos | distintos | ejemplo / rango |
|---|---|---|---|---|
| departamento | object | 0.0% | 22 | PIURA(205714), LORETO(99078), UCAYALI(51881) |
| provincia | object | 0.0% | 115 | PIURA(98668), MAYNAS(68819), SULLANA(47953) |
| distrito | object | 0.0% | 588 | PIURA(36377), IQUITOS(29480), SULLANA(28893) |
| enfermedad | object | 0.0% | 3 | DENGUE SIN SIGNOS DE ALARMA(670500), DENGUE CON SIGNOS DE ALARMA(84114 |
| ano | int64 | 0.0% | 24 | min 2000 / med 2020 / max 2023 |
| semana | int64 | 0.0% | 53 | min 1 / med 20 / max 53 |
| diagnostic | object | 0.0% | 3 | A97.0(670500), A97.1(84114), A97.2(3276) |
| tipo_dx | object | 0.0% | 2 | C(652086), P(105804) |
| diresa | float64 | 0.0% | 31 | min 2 / med 22 / max 53 |
| ubigeo | int64 | 0.0% | 622 | min 1.01e+04 / med 1.603e+05 / max 2.504e+05 |
| edad | int64 | 0.0% | 122 | min 0 / med 27 / max 7.196e+07 |
| tipo_edad | object | 0.0% | 3 | A(752390), M(5234), D(266) |
| sexo | object | 0.0% | 2 | F(406976), M(350914) |

### Filas de ejemplo

```
  departamento      provincia                distrito                   enfermedad   ano  semana diagnostic tipo_dx  diresa
0      HUANUCO  LEONCIO PRADO                 LUYANDO  DENGUE SIN SIGNOS DE ALARMA  2000      47      A97.0       P    10.0
1      HUANUCO  LEONCIO PRADO                 LUYANDO  DENGUE SIN SIGNOS DE ALARMA  2000      40      A97.0       P    10.0
2      HUANUCO  LEONCIO PRADO  JOSE CRESPO Y CASTILLO  DENGUE SIN SIGNOS DE ALARMA  2000      48      A97.0       C    10.0
3      HUANUCO  LEONCIO PRADO  JOSE CRESPO Y CASTILLO  DENGUE SIN SIGNOS DE ALARMA  2000      37      A97.0       P    10.0
4      HUANUCO  LEONCIO PRADO   MARIANO DAMASO BERAUN  DENGUE SIN SIGNOS DE ALARMA  2000      42      A97.0       C    10.0
```

## IRA / neumonia (CDC Peru)
`data/ira.csv` — PENDIENTE de descarga.

**No esta descargado.**
