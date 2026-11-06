import * as migration_20261020_155718_iniziale from './20261020_155718_iniziale';
import * as migration_20261021_140338_avvisi from './20261021_140338_avvisi';
import * as migration_20261021_144732_avvisi_immagine from './20261021_144732_avvisi_immagine';
import * as migration_20261022_164339_pagine from './20261022_164339_pagine';
import * as migration_20261022_170417_menu_e_etichette from './20261022_170417_menu_e_etichette';
import * as migration_20261023_083849_corsi_docenti from './20261023_083849_corsi_docenti';
import * as migration_20261105_071837_calendari from './20261105_071837_calendari';
import * as migration_20261105_081212_albo_trasparenza from './20261105_081212_albo_trasparenza';
import * as migration_20261105_132425_dottorandi from './20261105_132425_dottorandi';
import * as migration_20261105_165306_media_alt_facoltativo from './20261105_165306_media_alt_facoltativo';
import * as migration_20261105_170559_scuole_dipartimento_immagine from './20261105_170559_scuole_dipartimento_immagine';
import * as migration_20261105_234342_albertina_press from './20261105_234342_albertina_press';
import * as migration_20261106_000151_ruolo_biblioteca from './20261106_000151_ruolo_biblioteca';
import * as migration_20261106_082749_pagine_scuole from './20261106_082749_pagine_scuole';
import * as migration_20261106_115509_ruoli_pannello from './20261106_115509_ruoli_pannello';

export const migrations = [
  {
    up: migration_20261020_155718_iniziale.up,
    down: migration_20261020_155718_iniziale.down,
    name: '20261020_155718_iniziale',
  },
  {
    up: migration_20261021_140338_avvisi.up,
    down: migration_20261021_140338_avvisi.down,
    name: '20261021_140338_avvisi',
  },
  {
    up: migration_20261021_144732_avvisi_immagine.up,
    down: migration_20261021_144732_avvisi_immagine.down,
    name: '20261021_144732_avvisi_immagine',
  },
  {
    up: migration_20261022_164339_pagine.up,
    down: migration_20261022_164339_pagine.down,
    name: '20261022_164339_pagine',
  },
  {
    up: migration_20261022_170417_menu_e_etichette.up,
    down: migration_20261022_170417_menu_e_etichette.down,
    name: '20261022_170417_menu_e_etichette',
  },
  {
    up: migration_20261023_083849_corsi_docenti.up,
    down: migration_20261023_083849_corsi_docenti.down,
    name: '20261023_083849_corsi_docenti',
  },
  {
    up: migration_20261105_071837_calendari.up,
    down: migration_20261105_071837_calendari.down,
    name: '20261105_071837_calendari',
  },
  {
    up: migration_20261105_081212_albo_trasparenza.up,
    down: migration_20261105_081212_albo_trasparenza.down,
    name: '20261105_081212_albo_trasparenza',
  },
  {
    up: migration_20261105_132425_dottorandi.up,
    down: migration_20261105_132425_dottorandi.down,
    name: '20261105_132425_dottorandi',
  },
  {
    up: migration_20261105_165306_media_alt_facoltativo.up,
    down: migration_20261105_165306_media_alt_facoltativo.down,
    name: '20261105_165306_media_alt_facoltativo',
  },
  {
    up: migration_20261105_170559_scuole_dipartimento_immagine.up,
    down: migration_20261105_170559_scuole_dipartimento_immagine.down,
    name: '20261105_170559_scuole_dipartimento_immagine',
  },
  {
    up: migration_20261105_234342_albertina_press.up,
    down: migration_20261105_234342_albertina_press.down,
    name: '20261105_234342_albertina_press',
  },
  {
    up: migration_20261106_000151_ruolo_biblioteca.up,
    down: migration_20261106_000151_ruolo_biblioteca.down,
    name: '20261106_000151_ruolo_biblioteca',
  },
  {
    up: migration_20261106_082749_pagine_scuole.up,
    down: migration_20261106_082749_pagine_scuole.down,
    name: '20261106_082749_pagine_scuole',
  },
  {
    up: migration_20261106_115509_ruoli_pannello.up,
    down: migration_20261106_115509_ruoli_pannello.down,
    name: '20261106_115509_ruoli_pannello'
  },
];
