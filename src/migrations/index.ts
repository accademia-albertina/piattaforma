import * as migration_20261020_155718_iniziale from './20261020_155718_iniziale';
import * as migration_20261021_140338_avvisi from './20261021_140338_avvisi';
import * as migration_20261021_144732_avvisi_immagine from './20261021_144732_avvisi_immagine';
import * as migration_20261022_164339_pagine from './20261022_164339_pagine';
import * as migration_20261022_170417_menu_e_etichette from './20261022_170417_menu_e_etichette';
import * as migration_20261023_083849_corsi_docenti from './20261023_083849_corsi_docenti';
import * as migration_20261105_071837_calendari from './20261105_071837_calendari';
import * as migration_20261105_081212_albo_trasparenza from './20261105_081212_albo_trasparenza';
import * as migration_20261105_130328_dottorandi from './20261105_130328_dottorandi';

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
    up: migration_20261105_130328_dottorandi.up,
    down: migration_20261105_130328_dottorandi.down,
    name: '20261105_130328_dottorandi'
  },
];
