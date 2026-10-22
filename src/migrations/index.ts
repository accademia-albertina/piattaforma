import * as migration_20261020_155718_iniziale from './20261020_155718_iniziale';
import * as migration_20261021_140338_avvisi from './20261021_140338_avvisi';
import * as migration_20261021_144732_avvisi_immagine from './20261021_144732_avvisi_immagine';

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
    name: '20261021_144732_avvisi_immagine'
  },
];
