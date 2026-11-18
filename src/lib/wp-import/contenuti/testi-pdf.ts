/**
 * Testi dei PDF pubblicati nelle pagine istituzionali, riscritti in HTML perché si leggano nella
 * pagina (anche da telefono e con i lettori di schermo). Il PDF resta scaricabile: il blocco
 * Documento che lo contiene perde solo l'anteprima. La chiave è il nome del file su WordPress.
 * Quando su WordPress cambia il PDF (nome nuovo), il testo qui va aggiornato a mano.
 */
import type { BloccoGrezzo } from './pagine-html'

type TestoPdf = {
  /** Blocchi da mettere prima del documento. */
  blocchi: BloccoGrezzo[]
  /** Descrizione del documento, sotto il titolo. */
  descrizione: string
}

const rate = (r1: string, r2 = r1, r3 = r1) => `<td>${r1}</td><td>${r2}</td><td>${r3}</td>`
const intestazioneRate =
  '<th>I rata (novembre)</th><th>II rata (dicembre)</th><th>III rata (marzo)</th>'

const tabella = (intestazione: string, righe: string[]) =>
  `<table><thead><tr>${intestazione}</tr></thead><tbody>${righe
    .map((r) => `<tr>${r}</tr>`)
    .join('')}</tbody></table>`.replace(/€ /g, '€\u00a0')

const ISIDATA = 'da calcolare su Isidata'

// --- Regolamento tasse 2026/27 ----------------------------------------------------------------

const TASSE: TestoPdf = {
  descrizione: 'Prot. n. 6267 del 24/09/2026. Versione ufficiale, in PDF.',
  blocchi: [
    {
      tipo: 'testo',
      html: `<h2>Regolamento tasse 2026/27</h2>
<p>Regolamento dell’Accademia Albertina di Belle Arti in materia di contribuzione studentesca, approvato dal Consiglio di Amministrazione con delibera n. 670 del 19/09/2018 ed emendato con le delibere n. 772 del 4/06/2019, n. 828 del 3/07/2020, n. 835 del 27/07/2020, n. 965 del 28/09/2021, n. 1138 del 13/07/2023, n. 1260 del 14/10/2024 e n. 1443 del 29/06/2026.</p>
<p>Qui sotto il testo del regolamento; in fondo alla pagina c’è il documento ufficiale da scaricare.</p>`,
    },
    {
      tipo: 'fisarmonica',
      voci: [
        {
          titolo: 'Titolo I – Principi generali',
          html: `<p>In ottemperanza alla legge 11 dicembre 2016, n. 232 che recita: “Ciascuna università statale, nell’esercizio della propria autonomia normativa, approva il regolamento in materia di contribuzione studentesca, nel rispetto dei criteri di equità, gradualità e progressività, nonché delle disposizioni dei commi da 252 a 267” (della legge sunnominata), e tenuto conto delle modalità di definizione degli esoneri totali e parziali dal contributo onnicomprensivo annuale di cui al Decreto del Ministro dell’Università e della Ricerca del 4 agosto 2021 n. 1016, il Consiglio di Amministrazione dell’Accademia Albertina di Belle Arti di Torino, dopo opportuna comunicazione alla Consulta Studentesca, ha stabilito quanto segue.</p>
<p><strong>Art. 1</strong> – Il presente regolamento si applica a decorrere dall’anno accademico 2026/2027.</p>
<p><strong>Art. 2</strong> – Gli studenti dei corsi di laurea e di laurea magistrale contribuiscono alla copertura dei costi dei servizi didattici, scientifici e amministrativi mediante un contributo annuale da versare all’Accademia Albertina di Belle Arti di Torino.</p>
<p><strong>Art. 3</strong> – Restano ferme le norme in materia di imposta di bollo, le norme in materia di esonero e di graduazione dei contributi, di cui all’articolo 9 del decreto legislativo 29 marzo 2012, n. 68, nonché le norme sulla tassa regionale per il diritto allo studio, di cui all’articolo 3, commi da 20 a 23, della legge 28 dicembre 1995, n. 549.</p>
<p><strong>Art. 4</strong> – Per gli anni successivi a quello di entrata in vigore del presente regolamento saranno possibili variazioni delle somme e delle percentuali indicate negli artt. da 7 a 11, deliberate dal C.d.A., e comunque rientranti nei tetti stabiliti dalla legge 11 dicembre 2016, n. 232.</p>`,
        },
        {
          titolo: 'Titolo II – Studenti UE (tabelle A, B, C, D, E)',
          html: `<p><strong>Art. 5</strong> – Rientrano in questa categoria:</p>
<ul>
<li>cittadini di uno stato membro dell’Unione Europea (Austria, Belgio, Bulgaria, Cipro, Croazia, Danimarca, Estonia, Finlandia, Francia, Germania, Grecia, Irlanda, Italia, Lettonia, Lituania, Lussemburgo, Malta, Olanda, Polonia, Portogallo, Repubblica Ceca, Romania, Slovacchia, Slovenia, Spagna, Svezia, Ungheria);</li>
<li>cittadini di Norvegia, Islanda, Liechtenstein, Svizzera, Repubblica di San Marino e della Santa Sede;</li>
<li>stranieri/internazionali presenti a titolo di protezione internazionale.</li>
</ul>
<p>In caso di doppia cittadinanza, una delle quali sia quella italiana o di un altro Paese UE, è la cittadinanza italiana o quella di altro Paese UE che prevalgono ai fini della presente circolare (legge 31 maggio 1995, n. 218, art. 19 paragrafo 2).</p>
<p><strong>Art. 6</strong> – Sono esonerati dal pagamento del contributo annuale gli studenti UE che soddisfano congiuntamente i seguenti requisiti:</p>
<p>a) appartengono a un nucleo familiare il cui “indicatore della situazione economica equivalente” (ISEE), calcolato secondo le modalità previste dall’articolo 8 del regolamento di cui al decreto del Presidente del Consiglio dei ministri 5 dicembre 2013, n. 159, nonché dall’articolo 2-sexies del decreto-legge 29 marzo 2016, n. 42, convertito, con modificazioni, dalla legge 26 maggio 2016, n. 89, è inferiore o eguale a € 22.000,00;</p>
<p>b) sono iscritti all’Accademia Albertina da un numero di anni accademici inferiore o uguale alla durata normale del corso di studio, aumentata di uno (quindi fino al primo anno fuori corso);</p>
<p>c) nel caso di iscrizione al secondo anno accademico abbiano conseguito, entro la data del 10 agosto del primo anno, almeno 10 crediti formativi universitari; nel caso di iscrizione ad anni accademici successivi al secondo abbiano conseguito, nei dodici mesi antecedenti la data del 10 agosto precedente la relativa iscrizione, almeno 25 crediti formativi.</p>
<p>Nel caso di iscrizione al primo anno accademico, l’unico requisito da soddisfare è quello di cui alla lettera a).</p>
<p><strong>Art. 7</strong> – Per gli studenti UE che appartengono a un nucleo familiare il cui ISEE sia compreso tra € 22.000,01 e € 30.000 e che soddisfano entrambi i requisiti di cui alle lettere b) e c) del precedente art. 6, il contributo annuale è graduato in misura decrescente, riducendo l’importo massimo del contributo ordinariamente dovuto ai sensi della legge n. 232/2016 come indicato nell’articolo 1, comma b), del Decreto del Ministro dell’Università e della Ricerca del 4 agosto 2021 n. 1016. L’importo verrà pertanto calcolato secondo quanto riportato nella tabella A.</p>
<h3>Tabella A – Fino al 1° anno fuori corso, con i crediti minimi</h3>
<p>Studenti del 1°, 2°, 3° e 4° anno del triennio e del 1°, 2° e 3° anno del biennio che hanno conseguito i crediti minimi richiesti. 1° anno: nessun requisito. 2° anno: almeno 10 crediti conseguiti entro il 10 agosto 2026. Anni successivi: almeno 25 crediti conseguiti tra il 10 agosto 2025 e il 10 agosto 2026.</p>
${tabella(
  '<th>Fascia</th><th>ISEE</th><th>Contributo totale</th><th>Rate (novembre, dicembre, marzo)</th>',
  [
    '<td>1</td><td>da 0 a € 22.000</td><td>€ 0,00</td><td>–</td>',
    `<td>2</td><td>da € 22.000,01 a € 24.000</td><td>1,4% (ISEE − 13.000)</td><td>${ISIDATA}</td>`,
    `<td>3</td><td>da € 24.000,01 a € 26.000</td><td>3,5% (ISEE − 13.000)</td><td>${ISIDATA}</td>`,
    `<td>4</td><td>da € 26.000,01 a € 28.000</td><td>5,25% (ISEE − 13.000)</td><td>${ISIDATA}</td>`,
    `<td>5</td><td>da € 28.000,01 a € 30.000</td><td>6,3% (ISEE − 13.000)</td><td>${ISIDATA}</td>`,
  ],
)}
<p><strong>Art. 8</strong> – Gli studenti UE con un ISEE inferiore a € 30.000 che soddisfano il requisito alla lettera b) dell’art. 6 ma non il requisito c), sono tenuti a pagare il contributo massimo previsto dalla loro fascia di appartenenza, definito nella tabella B.</p>
<p><strong>Art. 9</strong> – È prevista una maggiorazione del 25% sull’importo base definito dall’articolo 7, con un valore minimo di € 200 per gli studenti UE con un ISEE inferiore a € 30.000 che non soddisfano il requisito di cui alla lettera b) dell’articolo 6, come dalla tabella C.</p>
<p><strong>Art. 10</strong> – Per gli studenti UE con un ISEE inferiore a € 30.000 che non soddisfano i requisiti di cui alle lettere b) e c) dell’art. 6, è previsto un contributo unico pari a € 2.100 come da tabella D.</p>
<p><strong>Art. 11</strong> – Gli studenti UE con un ISEE superiore a € 30.000 sono tenuti a versare l’importo previsto dalla loro fascia d’appartenenza, definito nella tabella E.</p>
<h3>Tabella B – Fino al 1° anno fuori corso, senza i crediti minimi</h3>
<p>Studenti del 1°, 2°, 3° e 4° anno del triennio e del 1°, 2° e 3° anno del biennio che non hanno conseguito i crediti minimi richiesti. 2° anno: meno di 10 crediti conseguiti entro il 10 agosto 2026. Anni successivi: meno di 25 crediti conseguiti tra il 10 agosto 2025 e il 10 agosto 2026.</p>
${tabella(`<th>Fascia</th><th>ISEE</th><th>Totale dovuto</th>${intestazioneRate}`, [
  `<td>1</td><td>da 0 a € 22.000</td><td>€ 200,00</td>${rate('€ 66,70')}`,
  `<td>2</td><td>da € 22.000,01 a € 24.000</td><td>€ 962,50</td>${rate('€ 320,83')}`,
  `<td>3</td><td>da € 24.000,01 a € 26.000</td><td>€ 1.137,50</td>${rate('€ 379,16')}`,
  `<td>4</td><td>da € 26.000,01 a € 28.000</td><td>€ 1.312,00</td>${rate('€ 437,33')}`,
  `<td>5</td><td>da € 28.000,01 a € 30.000</td><td>€ 1.487,50</td>${rate('€ 495,83')}`,
])}
<h3>Tabella C – Dal 2° anno fuori corso, con i crediti minimi</h3>
<p>Studenti dal 5° anno del triennio e dal 4° anno del biennio in poi che hanno conseguito almeno 25 crediti tra il 10 agosto 2025 e il 10 agosto 2026.</p>
${tabella(
  '<th>Fascia</th><th>ISEE</th><th>Totale dovuto</th><th>Rate (novembre, dicembre, marzo)</th>',
  [
    '<td>1</td><td>da 0 a € 22.000</td><td>€ 200,00</td><td>€ 66,70 ciascuna</td>',
    `<td>2</td><td>da € 22.000,01 a € 24.000</td><td>[1,4% (ISEE − 13.000)] + 25%</td><td>${ISIDATA}</td>`,
    `<td>3</td><td>da € 24.000,01 a € 26.000</td><td>[3,5% (ISEE − 13.000)] + 25%</td><td>${ISIDATA}</td>`,
    `<td>4</td><td>da € 26.000,01 a € 28.000</td><td>[5,25% (ISEE − 13.000)] + 25%</td><td>${ISIDATA}</td>`,
    `<td>5</td><td>da € 28.000,01 a € 30.000</td><td>[6,3% (ISEE − 13.000)] + 25%</td><td>${ISIDATA}</td>`,
  ],
)}
<h3>Tabella D – Dal 2° anno fuori corso, senza i crediti minimi</h3>
<p>Studenti dal 5° anno del triennio e dal 4° anno del biennio in poi con meno di 25 crediti conseguiti tra il 10 agosto 2025 e il 10 agosto 2026.</p>
${tabella(`<th>ISEE</th><th>Totale dovuto</th>${intestazioneRate}`, [
  `<td>da 0 a € 30.000</td><td>€ 2.100,00</td>${rate('€ 700,00')}`,
])}
<p><strong>Art. 12</strong> – Per gli studenti UE con ISEE superiore a € 65.000 e per gli studenti che non presentano ISEE è previsto un contributo di € 2.100.</p>
<h3>Tabella E – ISEE superiore a € 30.000</h3>
${tabella(`<th>Fascia</th><th>ISEE</th><th>Contributo totale</th>${intestazioneRate}`, [
  `<td>6</td><td>da € 30.000,01 a € 37.000</td><td>€ 1.190,00</td>${rate('€ 397,00')}`,
  `<td>7</td><td>da € 37.000,01 a € 44.000</td><td>€ 1.370,00</td>${rate('€ 456,00')}`,
  `<td>8</td><td>da € 44.000,01 a € 51.000</td><td>€ 1.550,00</td>${rate('€ 517,00')}`,
  `<td>9</td><td>da € 51.000,01 a € 58.000</td><td>€ 1.730,00</td>${rate('€ 577,00')}`,
  `<td>10</td><td>da € 58.000,01 a € 65.000</td><td>€ 1.910,00</td>${rate('€ 637,00')}`,
  `<td>11</td><td>oltre € 65.000</td><td>€ 2.100,00</td>${rate('€ 700,00')}`,
])}`,
        },
        {
          titolo: 'Titolo III – Studenti extra UE (tabella F)',
          html: `<p><strong>Art. 13</strong> – Gli studenti non rientranti nelle categorie di cui all’art. 5, qui definiti extra UE, dovranno presentare l’ISEE parificato e versare un contributo per il funzionamento dell’Istituzione, come da tabella F.</p>
<p>Per coloro i quali risulti inapplicabile il calcolo dell’ISEE del nucleo familiare di appartenenza ai sensi dell’articolo 8, comma 5, del regolamento di cui al decreto del Presidente del Consiglio dei ministri 5 dicembre 2013, n. 159, l’importo del contributo annuale è di € 2.625.</p>
<p>Gli studenti extra UE dal secondo anno fuori corso (5° anno triennio e successivi, 4° anno biennio e successivi) che hanno conseguito i crediti minimi richiesti (almeno 25 crediti conseguiti tra il 10 agosto 2025 e il 10 agosto 2026) dovranno pagare € 250 in aggiunta al contributo richiesto nella tabella F.</p>
<p>Gli studenti extra UE dal secondo anno fuori corso (5° anno triennio e successivi, 4° anno biennio e successivi) che non hanno conseguito i crediti minimi richiesti (meno di 25 crediti conseguiti tra il 10 agosto 2025 e il 10 agosto 2026) dovranno pagare € 2.625, divisibili in tre rate da € 875 ciascuna.</p>
<h3>Tabella F – Studenti extra UE</h3>
${tabella(`<th>ISEE</th><th>Contributo totale</th>${intestazioneRate}`, [
  `<td>da € 0 a € 3.250,00</td><td>€ 750,00</td>${rate('€ 250,00')}`,
  `<td>da € 3.250,01 a € 6.500,00</td><td>€ 900,00</td>${rate('€ 300,00')}`,
  `<td>da € 6.500,01 a € 9.750,00</td><td>€ 1.050,00</td>${rate('€ 350,00')}`,
  `<td>da € 9.750,01 a € 13.000,00</td><td>€ 1.200,00</td>${rate('€ 400,00')}`,
  `<td>da € 13.000,01 a € 26.000,00</td><td>€ 1.485,00</td>${rate('€ 495,00')}`,
  `<td>da € 26.000,01 a € 39.000,00</td><td>€ 1.770,00</td>${rate('€ 550,00')}`,
  `<td>da € 39.000,01 a € 52.000,00</td><td>€ 2.055,00</td>${rate('€ 685,00')}`,
  `<td>da € 52.000,01 a € 65.000,00</td><td>€ 2.340,00</td>${rate('€ 780,00')}`,
  `<td>oltre € 65.000 e senza ISEE</td><td>€ 2.625,00</td>${rate('€ 875,00')}`,
])}`,
        },
        {
          titolo: 'Titolo IV – Iscrizione fuori corso solo tesi (tabelle G e H)',
          html: `<p><strong>Art. 14</strong> – Gli studenti che completano l’ultimo anno di studi hanno diritto a tre sessioni per completare gli esami di profitto e sostenere l’esame finale di tesi: estiva (giugno-luglio), autunnale (settembre-ottobre), invernale (febbraio-marzo).</p>
<p>L’iscrizione fuori corso solo tesi al successivo anno accademico interessa gli studenti che entro la sessione invernale 2026/2027 (febbraio-marzo 2027) abbiano completato tutti gli esami di profitto ma non abbiano ancora sostenuto l’esame finale di tesi.</p>
<ul>
<li><strong>Solo tesi luglio, sessione estiva (tabella G)</strong>: gli studenti UE ed extra UE verseranno entro il 31 marzo dell’anno in corso un contributo per rimborso spese di € 100,00 a prescindere dal valore ISEE. Gli studenti borsisti del settimo semestre per il triennio e del quinto semestre per il biennio sono esonerati dal pagamento della tassa EDISU, ma non del versamento del contributo di € 100,00.</li>
<li><strong>Solo tesi ottobre, sessione autunnale (tabella H)</strong>: gli studenti UE ed extra UE verseranno entro il 31 marzo dell’anno in corso l’importo della prima rata calcolata sulla base del valore ISEE (tabella A, B, C, D, E o F di appartenenza). Se gli studenti UE non presentano la dichiarazione ISEE, l’importo dovuto è pari a € 700,00. Gli studenti extra UE che non presentano la dichiarazione ISEE verseranno entro il 31 marzo l’importo della prima rata, pari a € 875,00. Gli studenti borsisti del settimo semestre per il triennio e del quinto semestre per il biennio sono esonerati dal pagamento della tassa EDISU, ma non dal versamento della prima rata dovuta. In ogni caso lo studente pagherà una cifra non inferiore a € 100,00 quando l’importo della prima rata, dovuto in base all’ISEE, fosse inferiore a detta somma.</li>
<li><strong>Tesi a marzo, sessione invernale</strong>: si paga il contributo totale dovuto per il primo anno fuori corso. I vincitori della borsa EDISU (settimo semestre per il triennio, quinto semestre per il biennio) sono esonerati dal pagamento della tassa EDISU ma non dal pagamento del contributo dovuto sulla base del valore ISEE (tabella A, B, C, D, E o F di appartenenza).</li>
</ul>
<p><strong>Art. 15</strong> – Per l’iscrizione fuori corso solo tesi, la tassa di iscrizione e frequenza e la marca da bollo virtuale da € 16,00 devono essere versate entro il 31 marzo dell’anno in corso. Coloro i quali non sono vincitori della borsa di studio EDISU dovranno pagare la tassa EDISU di € 140,00.</p>
<h3>Tabella G – Solo tesi luglio (tesisti della sessione estiva 2025/2026)</h3>
${tabella('<th>Tassa</th><th>Importo</th><th>Scadenza</th>', [
  '<td>Contributo ABA solo tesi luglio</td><td>€ 100,00</td><td>31 marzo</td>',
  '<td>Marca da bollo virtuale</td><td>€ 16,00</td><td>31 marzo</td>',
  '<td>Tassa di iscrizione e frequenza</td><td>€ 72,67</td><td>31 marzo</td>',
  '<td>Tassa EDISU (non i borsisti EDISU)</td><td>€ 140,00</td><td>31 marzo</td>',
])}
<h3>Tabella H – Solo tesi ottobre (tesisti della sessione autunnale 2025/2026)</h3>
${tabella('<th>Tassa</th><th>Importo</th><th>Scadenza</th>', [
  '<td>I rata del contributo ABA</td><td>secondo la tabella di appartenenza</td><td>31 marzo</td>',
  '<td>Marca da bollo virtuale</td><td>€ 16,00</td><td>31 marzo</td>',
  '<td>Tassa di iscrizione e frequenza</td><td>€ 72,67</td><td>31 marzo</td>',
  '<td>Tassa EDISU (non i borsisti EDISU)</td><td>€ 140,00</td><td>31 marzo</td>',
])}`,
        },
        {
          titolo: 'Titolo V – Rinuncia agli studi e ricognizione di carriera',
          html: `<p><strong>Art. 16</strong> – Come previsto dal comma 3 dell’art. 73 del Regolamento Didattico, lo studente ha facoltà di interrompere gli studi. Se lo studente, una volta effettuata l’iscrizione, rinuncia agli studi entro 15 giorni dall’inizio dell’anno accademico, può richiedere il rimborso del contributo accademico già versato. Qualora rinunci agli studi oltre tale data, non potrà chiedere il rimborso dell’importo versato all’Accademia. La rinuncia agli studi non consente di riattivare la carriera pregressa in caso di ripensamenti.</p>
<p><strong>Art. 17 – Ricognizione di carriera</strong> – Lo studente che non abbia rinnovato l’iscrizione al corso di studi accademici e che intenda esercitare successivamente i diritti derivanti dalla condizione di studente dovrà pagare un importo di € 350 per ogni anno di sospensione degli studi. Qualora l’interruzione degli studi superi i tre anni, l’amministrazione dell’Accademia potrà definire una somma di rientro forfettaria che tenga conto della fascia di reddito dello studente. Nel caso in cui, nei dodici mesi antecedenti la data del 10 agosto precedente l’ultima iscrizione, non si siano raggiunti almeno 25 crediti formativi, lo studente dovrà versare un contributo studentesco maggiorato come da tabella B e tabella D.</p>
<p><strong>Art. 18 – Congelamento</strong> – In caso di sospensione della carriera per iscriversi e frequentare corsi di studio presso altra Istituzione, o Accademia straniera che rilasci un titolo di laurea di 1° o 2° livello, ovvero nel caso di ammissione ad altro corso di Specializzazione o di Dottorato di ricerca, e nel caso di maternità, ricovero ospedaliero superiore a quattro mesi continuativi o in caso di gravi cause documentate e dimostrabili (art. 73, commi 1 e 2 del Regolamento Didattico), lo studente è tenuto a presentare istanza documentata per il congelamento e non è tenuto al pagamento di alcun importo per riprendere gli studi. Il congelamento è concesso per non oltre tre anni.</p>
<p><strong>Art. 19 – Decadenza</strong> – Nei casi citati negli articoli 14 e 15, non è in ogni caso consentito protrarre la sospensione degli studi per più di cinque anni. Lo studente che non abbia rinnovato l’iscrizione al corso di studi accademici per cinque anni decade dalla qualifica di studente (art. 74 comma 4 del Regolamento Didattico).</p>
<p><strong>Art. 20 – Trasferimenti e passaggi di corso</strong> – In caso di trasferimento in entrata da altre istituzioni è dovuto un contributo per il trasferimento pari a € 50,00. In caso di passaggio di corso è dovuto un contributo per il passaggio pari a € 30,00.</p>`,
        },
        {
          titolo: 'Titolo VI – Esoneri',
          html: `<p><strong>Art. 21</strong> – Sono esonerati dal pagamento del contributo annuale tutti gli studenti UE che risultino vincitori e idonei di borsa di studio EDISU per l’anno accademico in corso. Non saranno esonerati dal versamento dei contributi gli studenti vincitori o idonei extra UE, ovvero gli studenti non rientranti nelle categorie di cui all’art. 5.</p>
<p><strong>Art. 22</strong> – La tassa EDISU deve essere pagata tassativamente anche se si è presentata istanza di borsa di studio EDISU. Coloro che risulteranno vincitori della borsa di studio EDISU, nella graduatoria definitiva, verranno rimborsati direttamente dall’Ente. I vincitori di borsa di studio EDISU potranno fare richiesta di rimborso della tassa regionale dal portale personale del sito <a href="https://www.edisu.piemonte.it/">www.edisu.piemonte.it</a> secondo le disposizioni dell’Ente.</p>
<p><strong>Art. 23</strong> – In caso di revoca o rinuncia al beneficio concesso da EDISU, lo studente è tenuto al pagamento delle tasse in base al livello contributivo relativo all’ISEE presentato all’atto dell’iscrizione. A motivo di ciò, allo studente saranno sospesi eventuali benefici interni (borse di studio, collaborazioni) e non potrà sostenere esami sino a quando non effettuerà il saldo delle tasse dovute e/o non restituirà a EDISU le rate della borsa di studio incassate.</p>
<p><strong>Art. 24</strong> – Lo studente può richiedere l’esonero dal pagamento delle sole tasse governative di iscrizione e frequenza più immatricolazione se al primo anno, e di iscrizione e frequenza se negli anni successivi al primo. L’esonero viene concesso solo per condizioni di reddito, con ISEE familiare pari o inferiore a € 22.000,00. Il modulo di domanda di esonero è disponibile nella pagina <a href="/didattica/iscrizioni">Iscrizioni</a>.</p>`,
        },
        {
          titolo: 'Titolo VII – Scadenze e more',
          html: `<p><strong>Art. 25</strong> – Il valore ISEE universitario deve essere inserito su Isidata in Anagrafica in sede di immatricolazione/iscrizione, secondo le modalità ed entro le scadenze che verranno specificate dalla Segreteria Didattica. Gli studenti appartenenti all’Unione europea non sono più tenuti a consegnare o caricare autonomamente l’attestazione ISEE, che sarà acquisita direttamente dall’Accademia attraverso l’accesso ai servizi messi a disposizione dall’INPS, purché sia stata previamente presentata una DSU valida per il rilascio dell’ISEE universitario. Gli studenti appartenenti a Paesi non facenti parte dell’Unione europea sono tenuti a presentare, entro i termini stabiliti annualmente dall’Accademia, l’ISEE parificato, corredato dalla documentazione richiesta.</p>
<p><strong>Art. 26</strong> – Il versamento del contributo accademico viene effettuato in tre rate di pari entità, indicativamente entro il 20 novembre, entro il 18 dicembre ed entro il 31 marzo.</p>
<p><strong>Art. 27</strong> – Vanno inoltre effettuati entro il 30 settembre i seguenti versamenti:</p>
<ul>
<li>tassa di iscrizione e frequenza più immatricolazione (per tutti gli studenti di cittadinanza italiana che si iscrivono al primo anno);</li>
<li>tassa di iscrizione e frequenza (per tutti gli studenti di cittadinanza italiana che si iscrivono ad anni successivi al primo);</li>
<li>tassa EDISU (anche coloro che hanno presentato istanza di borsa di studio EDISU: se risulteranno vincitori, sarà l’EDISU a provvedere al rimborso).</li>
</ul>
<p><strong>Art. 28</strong> – Per chi non rispetta le date di scadenza indicate per completare le operazioni di pagamento e caricamento su Isidata, è prevista una mora di € 50 per ritardo non superiore ai 30 giorni e di € 100 per un ritardo non superiore ai 60 giorni, da versare all’Accademia. Oltre i 60 giorni di ritardo viene disattivato il profilo Isidata. Lo studente che non risulti in regola con i pagamenti non può accedere alle attività didattiche, alle sessioni di esami di profitto e alla sessione finale di tesi. Le more si applicano ai pagamenti in ritardo di qualsiasi contributo e devono essere versate all’Accademia. Chi non versa le more dovute non può accedere alla sessione di tesi.</p>
<h3>Tabella riassuntiva delle scadenze</h3>
${tabella(
  '<th>Tassa o contributo</th><th>Importo</th><th>Beneficiario</th><th>Modalità di versamento</th><th>Causale</th><th>Scadenza primo anno</th><th>Scadenza anni successivi</th>',
  [
    '<td>Tassa statale prova di ammissione</td><td>€ 15,13</td><td>Agenzia delle Entrate</td><td>c/c postale 1016 intestato a “Agenzia delle Entrate C.O. di Pescara”</td><td>Prova di ammissione</td><td>vedi gli avvisi sul sito</td><td>–</td>',
    '<td>Contributo prova di ammissione</td><td>€ 50,00</td><td>Accademia di Belle Arti di Torino</td><td>Bollettino PagoPA</td><td>Prova di ammissione corso di …</td><td>vedi gli avvisi sul sito</td><td>–</td>',
    '<td>Tassa statale di iscrizione e frequenza più immatricolazione (primo anno)</td><td>€ 102,93</td><td>Agenzia delle Entrate</td><td>c/c postale 1016 intestato a “Agenzia delle Entrate C.O. di Pescara”</td><td>Tasse scolastiche</td><td>vedi gli avvisi sul sito</td><td>–</td>',
    '<td>Tassa statale di iscrizione e frequenza (anni successivi)</td><td>€ 72,67</td><td>Agenzia delle Entrate</td><td>c/c postale 1016 intestato a “Agenzia delle Entrate C.O. di Pescara”</td><td>Tasse scolastiche</td><td>–</td><td>16 ottobre</td>',
    '<td>Tassa regionale per il diritto allo studio universitario (EDISU)</td><td>€ 140,00</td><td>Accademia di Belle Arti di Torino per EDISU Piemonte</td><td>Bollettino PagoPA</td><td>Tassa regionale</td><td>vedi gli avvisi sul sito</td><td>16 ottobre</td>',
    '<td>Imposta di bollo virtuale</td><td>€ 16,00</td><td>Accademia di Belle Arti di Torino</td><td>Bollettino PagoPA</td><td>Imposta di bollo</td><td>vedi gli avvisi sul sito</td><td>16 ottobre</td>',
    '<td>Contributo accademico onnicomprensivo annuale, studenti UE</td><td>secondo le tabelle A, B, C, D, E</td><td>Accademia di Belle Arti di Torino</td><td>Bollettino PagoPA</td><td>Contributo accademico</td><td>20 novembre, 18 dicembre, 31 marzo</td><td>20 novembre, 18 dicembre, 31 marzo</td>',
    '<td>Contributo accademico onnicomprensivo annuale, studenti extra UE</td><td>secondo la tabella F</td><td>Accademia di Belle Arti di Torino</td><td>Bollettino PagoPA</td><td>Contributo accademico</td><td>20 novembre, 18 dicembre, 31 marzo</td><td>20 novembre, 18 dicembre, 31 marzo</td>',
  ],
)}
<p>Gli studenti UE ed extra UE che non presentano la certificazione ISEE nei termini stabiliti sono tenuti al versamento corrispondente alla fascia massima delle tabelle A, B, C, D, E, F del regolamento tasse e contributi.</p>`,
        },
        {
          titolo: 'Titolo VIII – Dottorati',
          html: `<p><strong>Art. 29</strong> – L’iscrizione al corso di dottorato, al primo e agli anni successivi, prevede il versamento di:</p>
<ul>
<li>tassa governativa di € 102,93 per il primo anno e di € 72,67 per gli anni successivi al primo, su bollettino postale c/c 1016 (disponibile presso gli Uffici Postali);</li>
<li>tassa regionale più imposta di bollo, per un importo totale di € 156,00, da pagare con bollettino PagoPA.</li>
</ul>
<h3>Altri contributi</h3>
${tabella('<th>Contributo</th><th>Importo</th>', [
  '<td>Test di ammissione</td><td>€ 30,00</td>',
  '<td>Rilascio della pergamena</td><td>€ 30,00</td>',
  '<td>Imposta di bollo per il rilascio della pergamena, secondo la normativa vigente</td><td>€ 16,00</td>',
])}`,
        },
      ],
    },
  ],
}

// --- Matricole: presentazione dell'Accademia -------------------------------------------------

const ACCADEMIA: TestoPdf = {
  descrizione: 'Le slide presentate alle matricole 2026/27, in PDF.',
  blocchi: [
    {
      tipo: 'fisarmonica',
      voci: [
        {
          titolo: 'Mail istituzionale',
          html: `<p>La casella di posta istituzionale viene attribuita all’immatricolazione. Per attivarla segui le indicazioni inviate dall’Ufficio Servizi Informatici. Va usata per tutte le comunicazioni da e per l’Accademia, e serve anche per accedere a questo sito.</p>
<ul>
<li>Studenti: numero di matricola seguito da @albertina.academy, ad esempio 12345b@albertina.academy.</li>
<li>Docenti: nome.cognome@albertina.academy.</li>
</ul>`,
        },
        {
          titolo: 'Libretto universitario',
          html: `<p>Da novembre puoi prenotare il ritiro del libretto presso la <a href="/studente/segreteria-didattica">Segreteria Didattica</a>. Serve una fototessera.</p>`,
        },
        {
          titolo: 'Piano di studi',
          html: `<p>Il piano di studi viene inserito dalla Segreteria nel tuo profilo Isidata. Nell’anno della tesi si verifica il piano di studi secondo le indicazioni che verranno pubblicate sul sito.</p>
<p><strong>Importante</strong>: per qualunque dubbio o chiarimento rivolgiti esclusivamente alla Segreteria Didattica.</p>`,
        },
        {
          titolo: 'Ricevimento della Segreteria Didattica',
          html: `<ul>
<li>Lunedì: ricevimento dalle 10 alle 12.</li>
<li>Martedì: sportello telefonico dalle 9:30 alle 11.</li>
<li>Mercoledì: sportello telefonico dalle 9:30 alle 10:30; ricevimento dalle 13:30 alle 15 (non per i certificati).</li>
<li>Giovedì: sportello telefonico dalle 13:30 alle 15.</li>
<li>Venerdì: ricevimento dalle 10 alle 12.</li>
</ul>
<p>Per le urgenze scrivi a <a href="mailto:didattica@albertina.academy">didattica@albertina.academy</a>.</p>`,
        },
        {
          titolo: 'Richiesta di certificati',
          html: `<p>I certificati si richiedono prenotandosi dalla pagina della <a href="/studente/segreteria-didattica">Segreteria Didattica</a>:</p>
<ul>
<li>certificato di iscrizione;</li>
<li>certificato di iscrizione con i voti, per il permesso di soggiorno;</li>
<li>certificato delle tasse versate, per la dichiarazione dei redditi;</li>
<li>certificato di laurea;</li>
<li>pergamena di laurea.</li>
</ul>
<p>Previa prenotazione, puoi richiedere un certificato anche in formato digitale.</p>`,
        },
        {
          titolo: 'Tasse e ISEE',
          html: `<p>Il <a href="/studente/tasse">regolamento tasse</a> è pubblicato sul sito. Per il calcolo delle rette serve il valore dell’ISEE ordinario universitario in corso di validità: va inserito su Isidata, in Anagrafica, nella sezione indicata in sede di iscrizione. L’Accademia verifica il dato con l’INPS.</p>
<p>Senza il valore ISEE si applicano le rette massime previste dal regolamento tasse.</p>`,
        },
        {
          titolo: 'Come si pagano le tasse',
          html: `<p>Con PagoPA:</p>
<ul>
<li>tassa regionale per il diritto allo studio universitario (EDISU): € 140,00. Va pagata anche da chi ha presentato domanda di borsa di studio; chi risulta vincitore nella graduatoria definitiva viene rimborsato direttamente dall’EDISU;</li>
<li>marca da bollo da € 16,00, per tutti;</li>
<li>rate universitarie (3).</li>
</ul>
<p>Con bollettino postale n. 1016 intestato all’Agenzia delle Entrate, Centro Operativo di Pescara, causale “Tasse scolastiche”: tassa statale di immatricolazione e frequenza, € 102,93. La ricevuta con il timbro postale va caricata su Isidata, in Fascicolo. Gli studenti di nazionalità estera non pagano questa tassa.</p>`,
        },
        {
          titolo: 'PagoPA',
          html: `<p>Il bollettino PagoPA si genera dal tuo profilo Isidata e si può pagare:</p>
<ul>
<li>presso una filiale della tua banca, se aderisce al Nodo dei Pagamenti: con addebito in conto corrente o con la tessera Pagobancomat agli sportelli ATM abilitati;</li>
<li>con l’home banking, se la banca aderisce al circuito (compaiono i loghi CBILL o PagoPA);</li>
<li>nei punti vendita SISAL, Lottomatica e Banca 5;</li>
<li>negli Uffici Postali.</li>
</ul>
<p>Per pagare in contanti devi andare in un punto vendita SISAL o Lottomatica.</p>`,
        },
        {
          titolo: 'Stage, workshop e seminari',
          html: `<p>I piani di studio prevedono crediti di workshop, stage o seminari. Un credito corrisponde a 25 ore. Per gli stage e i tirocini trovi tutto nella pagina <a href="/studente/stage-tirocinio">Stage e tirocinio</a>; workshop e seminari sono organizzati e proposti dai docenti dell’Accademia.</p>
<ul>
<li>Alla fine dello stage l’ente ospitante rilascia una certificazione con le ore svolte e il periodo: caricala sul tuo profilo Isidata, in Fascicolo, per l’accredito.</li>
<li>Alla fine di workshop e seminari i docenti rilasciano una dichiarazione con le ore svolte: caricala anche questa su Isidata, in Fascicolo.</li>
</ul>
<p>Per informazioni: <a href="mailto:stage@albertina.academy">stage@albertina.academy</a>.</p>`,
        },
        {
          titolo: 'Studenti lavoratori',
          html: `<p>Lo studente lavoratore può concordare con i docenti dei corsi una frequenza non inferiore al 50%, presentando un certificato del datore di lavoro.</p>`,
        },
        {
          titolo: 'Carriera Alias',
          html: `<p>Per attivare una carriera Alias rivolgiti alla Segreteria Didattica e compila il modulo che ti verrà consegnato.</p>
<p>L’Accademia attiva quindi la carriera Alias assegnando un’identità provvisoria, transitoria e non consolidabile, e rilascia un nuovo libretto con il nome e il cognome scelti e la matricola universitaria.</p>
<p>La carriera Alias nasce dalla modifica della carriera reale: anticipa i provvedimenti che si renderanno necessari al termine del procedimento di transizione di genere, quando la persona richiedente avrà nuovi documenti di identità a seguito della sentenza del Tribunale che rettifica l’attribuzione di sesso e, di conseguenza, il nome attribuito alla nascita.</p>`,
        },
        {
          titolo: 'App Student Card di Isidata',
          html: `<p>Scarica l’app Student Card di Isidata e attiva le notifiche: è il canale ufficiale con cui l’Accademia ti avvisa in tempo reale di scadenze, calendari e avvisi urgenti.</p>
<ul>
<li>Contiene un tesserino digitale con i dati principali dell’iscrizione e il relativo QR code.</li>
<li>Dà accesso al fascicolo digitale completo: puoi inviare alla Segreteria Didattica documenti e file richiesti.</li>
<li>Apre la versione mobile del portale Isidata, con tutte le funzioni: registrazione e prenotazione degli esami, generazione dello IUV PagoPA, pagamento delle tasse.</li>
<li>Ha un lettore di QR code integrato, ad esempio per entrare direttamente nel portale Isidata.</li>
</ul>`,
        },
        {
          titolo: 'Consulta studentesca',
          html: `<p>La <a href="/studente/consulta">Consulta studentesca</a> è l’organo istituzionale che rappresenta gli studenti, composto da studentesse e studenti eletti periodicamente.</p>`,
        },
        {
          titolo: 'Studenti con disabilità o DSA',
          html: `<p>Studentesse e studenti con disabilità o con disturbi specifici dell’apprendimento possono scrivere alla referente provvisoria del servizio, prof.ssa Silvia Carbotti: <a href="mailto:silvia.carbotti@albertina.academy">silvia.carbotti@albertina.academy</a>.</p>
<p>Lo sportello riceve su appuntamento, in presenza e online (Google Meet), ogni giovedì dalle 13:30 alle 15. Vedi anche la pagina <a href="/studente/sportelli">Sportelli</a>.</p>`,
        },
        {
          titolo: 'Borse di studio',
          html: `<p>Le borse di studio le eroga l’EDISU Piemonte, l’ente regionale per il diritto allo studio universitario. Il bando è sul sito <a href="https://www.edisu.piemonte.it/">www.edisu.piemonte.it</a>; vedi anche la pagina <a href="/studente/borse-di-studio">Borse di studio</a>.</p>`,
        },
        {
          titolo: 'Il sito',
          html: `<p>Il sito è uno strumento necessario: consultalo spesso. Qui trovi piani di studio, tasse, avvisi, esami e tutto quello che ti serve.</p>
<ul>
<li><strong>Didattica</strong>: <a href="/didattica/piani-di-studio">piani di studio</a>, <a href="/corsi">corsi</a> con i rispettivi docenti, <a href="/calendari">orari e calendari</a> delle lezioni (con le aule), degli esami, delle tesi e dell’anno accademico.</li>
<li><strong>Studente</strong>: <a href="/studente/modulistica">modulistica</a>, <a href="/studente/tasse">tasse</a>, <a href="/studente/segreteria-didattica">Segreteria Didattica</a> con gli orari e le richieste dei certificati, <a href="/studente/stage-tirocinio">stage e tirocinio</a> con il riconoscimento dei crediti.</li>
<li><strong><a href="/avvisi">Avvisi</a></strong>: una delle sezioni più importanti, da guardare ogni giorno. Orari delle lezioni e loro variazioni, convocazioni, esami, tasse, scadenze, bandi: ogni informazione passa da qui.</li>
<li><strong><a href="/albo">Albo online</a></strong>: i bandi attivi, in corso e scaduti.</li>
</ul>`,
        },
      ],
    },
  ],
}

// --- Matricole: il profilo Isidata -----------------------------------------------------------

const ISIDATA_PROFILO: TestoPdf = {
  descrizione: 'Le slide con le schermate di Isidata, in PDF.',
  blocchi: [
    {
      tipo: 'fisarmonica',
      voci: [
        {
          titolo: 'Accesso al portale',
          html: `<ol>
<li>Apri il portale <a href="https://servizi1.isidata.net/home/Index.aspx">Isidata Servizi per gli studenti</a>.</li>
<li>Dal menu a tendina Accademia scegli TORINO.</li>
<li>Inserisci codice e password e premi Accedi.</li>
<li>Scegli Gestione dati principali.</li>
</ol>
<p>Puoi entrare anche con SPID o CIE, ma è preferibile usare le credenziali ricevute all’immatricolazione.</p>`,
        },
        {
          titolo: 'Anagrafica',
          html: `<p>Qui ci sono i tuoi dati anagrafici, già inseriti con la domanda per l’esame di ammissione. Puoi modificarli, ad esempio quando cambi residenza: dopo ogni modifica è necessario inviare la richiesta.</p>
<p>In Anagrafica va inserito anche il valore dell’ISEE universitario, necessario per le riduzioni delle rette: senza, si applica l’importo massimo. Ogni anno sul sito viene pubblicato l’avviso con le scadenze per presentare l’ISEE, che va caricato anche nel Fascicolo.</p>`,
        },
        {
          titolo: 'Esami',
          html: `<p>Qui la Segreteria Didattica inserisce il tuo piano di studi completo e, di volta in volta, gli esami superati.</p>`,
        },
        {
          titolo: 'Tasse',
          html: `<p>Qui vedi le tasse pagate e quelle ancora da pagare, con le scadenze. Nella stessa sezione, a sinistra, con Genera PagoPA crei il bollettino della tassa che selezioni.</p>`,
        },
        {
          titolo: 'Fascicolo',
          html: `<p>Qui carichi tutti i documenti necessari: documento di riconoscimento (carta d’identità o passaporto), codice fiscale, certificato di diploma o autocertificazione, ricevute delle tasse pagate con il bollettino postale n. 1016 intestato all’Agenzia delle Entrate (tassa di immatricolazione e frequenza: € 102,93 il primo anno, € 72,67 gli anni successivi), certificazioni di workshop e stage.</p>
<p>Per caricare un file:</p>
<ol>
<li>premi Scegli file e seleziona il documento dal tuo dispositivo;</li>
<li>in Oggetto documento scrivi di che documento si tratta, ad esempio “Carta d’identità”;</li>
<li>salva.</li>
</ol>
<p>Il documento passa poi alla Segreteria Didattica.</p>`,
        },
        {
          titolo: 'Stampe',
          html: `<p>Il menu Stampe ha due voci:</p>
<ul>
<li><strong>Autocertificazioni</strong>;</li>
<li><strong>Schede – Piani di studio</strong>: indicando l’anno accademico si apre la scheda matricolare con tutto il piano di studi e gli esami sostenuti.</li>
</ul>`,
        },
        {
          titolo: 'Questionari',
          html: `<p>Ogni anno ti viene chiesto di compilare un questionario di gradimento. Quando il questionario è attivo, il profilo Isidata resta bloccato finché non hai risposto.</p>`,
        },
        {
          titolo: 'Consigli utili',
          html: `<p>Nel profilo Isidata c’è tutto quello che riguarda il tuo percorso in Accademia: consultalo spesso, per non perdere scadenze importanti su tasse ed esami. Scarica anche l’app Student Card di Isidata e attiva le notifiche.</p>`,
        },
      ],
    },
  ],
}

export const TESTI_PDF: Record<string, TestoPdf> = {
  'Prot.-n.-6267-del-24-09-2026_regolamento_tasse_2026-27.pdf': TASSE,
  'Presentazione-Accademia-matricole-2026-27.pdf': ACCADEMIA,
  'Presentazione-Isidata-matricole-2026-27.pdf': ISIDATA_PROFILO,
}

const nomeFile = (url: string) => decodeURIComponent(url.split(/[?#]/)[0].split('/').pop() ?? '')

/** Mette il testo dei PDF noti prima del loro documento, che resta solo da scaricare. */
export function conTestiPdf(blocchi: BloccoGrezzo[]): BloccoGrezzo[] {
  return blocchi.flatMap((b) => {
    if (b.tipo !== 'documento') return [b]
    const t = TESTI_PDF[nomeFile(b.url)]
    if (!t) return [b]
    return [...t.blocchi, { ...b, descrizione: t.descrizione, anteprima: false }]
  })
}
