-- CreateTable
CREATE TABLE "reportes_emergencia" (
    "id"              TEXT NOT NULL,
    "fecha"           TIMESTAMP(3),
    "hora"            TEXT,
    "anio"            INTEGER NOT NULL,
    "mes"             INTEGER,
    "semanaEpi"       INTEGER,
    "tipoReporte"     TEXT,
    "numReporte"      TEXT,
    "secuencia"       INTEGER,
    "esUltimoReporte" BOOLEAN NOT NULL DEFAULT false,
    "evento"          TEXT NOT NULL,
    "familiaEvento"   TEXT,
    "departamento"    TEXT NOT NULL,
    "distrito"        TEXT,
    "titulo"          TEXT,
    "idEvento"        TEXT,
    "urlDetalle"      TEXT,
    "urlPdf"          TEXT,
    "tienePdf"        BOOLEAN NOT NULL DEFAULT false,
    "urlIcono"        TEXT,
    "colorFondo"      TEXT,
    "pagina"          INTEGER,
    "duplicado"       BOOLEAN NOT NULL DEFAULT false,
    "parseOk"         BOOLEAN NOT NULL DEFAULT true,
    "notas"           TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reportes_emergencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reportes_emergencia_departamento_idx" ON "reportes_emergencia"("departamento");

-- CreateIndex
CREATE INDEX "reportes_emergencia_anio_idx" ON "reportes_emergencia"("anio");

-- CreateIndex
CREATE INDEX "reportes_emergencia_familiaEvento_idx" ON "reportes_emergencia"("familiaEvento");

-- CreateIndex
CREATE INDEX "reportes_emergencia_evento_idx" ON "reportes_emergencia"("evento");

-- CreateIndex
CREATE INDEX "reportes_emergencia_idEvento_idx" ON "reportes_emergencia"("idEvento");

-- CreateIndex
CREATE INDEX "reportes_emergencia_departamento_anio_idx" ON "reportes_emergencia"("departamento", "anio");
