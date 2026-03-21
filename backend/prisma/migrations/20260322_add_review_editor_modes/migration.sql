ALTER TABLE `reviews`
  ADD COLUMN `mode` ENUM('RAPIDO', 'ESTANDAR', 'CRITICO') NOT NULL DEFAULT 'RAPIDO' AFTER `rating`,
  ADD COLUMN `veredicto` VARCHAR(280) NULL AFTER `mode`,
  ADD COLUMN `rating_direccion` DECIMAL(2,1) NULL AFTER `veredicto`,
  ADD COLUMN `rating_guion` DECIMAL(2,1) NULL AFTER `rating_direccion`,
  ADD COLUMN `rating_fotografia` DECIMAL(2,1) NULL AFTER `rating_guion`,
  ADD COLUMN `rating_actuaciones` DECIMAL(2,1) NULL AFTER `rating_fotografia`,
  ADD COLUMN `rating_banda_sonora` DECIMAL(2,1) NULL AFTER `rating_actuaciones`,
  ADD COLUMN `cita_dialogo` VARCHAR(500) NULL AFTER `rating_banda_sonora`,
  ADD COLUMN `cita_personaje` VARCHAR(120) NULL AFTER `cita_dialogo`,
  ADD COLUMN `timestamps` JSON NULL AFTER `cita_personaje`,
  ADD COLUMN `contiene_spoilers` BOOLEAN NOT NULL DEFAULT false AFTER `timestamps`,
  ADD COLUMN `es_critica_larga` BOOLEAN NOT NULL DEFAULT false AFTER `contiene_spoilers`,
  ADD COLUMN `tiempo_lectura_min` INT NULL AFTER `es_critica_larga`;
