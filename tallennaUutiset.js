const puppeteer = require('puppeteer');
// Tämä lokaalia varten: 
// const sqlite3 = require('sqlite3').verbose();

// Tämä Supabase yhteyttä varten
const { Pool } = require('pg');  // PostgreSQL-yhteys

//supodas: tarvitaan ympäristömuuttujia eli tunnuksia varten
require('dotenv').config();


const pool = new Pool({
  //selvitä mihin voi tallentaa salasanat ettei ne mene suoraan githubiin tai muualle
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Supabase vaatii SSL-yhteyden, mutta tässä asetetaan se hyväksymään kaikki sertifikaatit
  }
});


// Supabase yhteyttä varten lisätty
(async () => {
  // Luo taulu, jos ei vielä ole (esim. vastaava kuin SQLite-taulusi)
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS uutiset (
      id SERIAL PRIMARY KEY,
      otsikko TEXT,
      julkaisuaika DATETIME,
      url TEXT UNIQUE
    );
  `;

await pool.query(createTableQuery);




/* Lokaali toteutus:

const db = new sqlite3.Database('./uutiset.db');

(async () => {
  // Luodaan taulu, jos sitä ei vielä ole
  db.run(`CREATE TABLE IF NOT EXISTS uutiset (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    otsikko TEXT,
    julkaisuaika DATETIME,
    url TEXT UNIQUE
  )`);
*/ 


  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://www.palloliitto.fi/maajoukkueet/helmarit', {
    waitUntil: 'networkidle2'
  });

  // Odotetaan hetki, jotta sivun sisältö varmasti latautuu
  await new Promise(r => setTimeout(r, 3000));

  // Haetaan uutiset sivulta

const uutiset = await page.evaluate(() => {
  function erottelePaivaJaKello(text) {
    const regex = /(\d{1,2})\.(\d{1,2})\.(\d{4})\s*klo\s*(\d{1,2}):(\d{2})/i;
    const match = text.match(regex);
    if (match) {
      const päivä = match[1].padStart(2, '0');     // esim. 5 → 05
      const kuukausi = match[2].padStart(2, '0');  // esim. 6 → 06
      const vuosi = match[3];
      const tunti = match[4].padStart(2, '0');
      const minuutti = match[5];
      const julkaisuaika = `${vuosi}-${kuukausi}-${päivä} ${tunti}:${minuutti}`;
      return {julkaisuaika: julkaisuaika};
    }
    return null;
  }

  const tulos = [];
  const linkit = Array.from(document.querySelectorAll('a[href*="/ajankohtaista/"]'));

  linkit.forEach(link => {
    const href = link.href;
    let otsikko = link.innerText.trim();

    const kortti = link.closest('article, li, div');
    const paivaTeksti = kortti?.innerText || link.parentElement?.innerText || '';
    const { julkaisuaika } = erottelePaivaJaKello(paivaTeksti);

    // Etsitään vaihtoehtoinen otsikko, jos linkissä ei ole
    if (!otsikko && kortti) {
      const otsikkoElementti = kortti.querySelector('h3, h2, strong, span');
      if (otsikkoElementti) {
        otsikko = otsikkoElementti.innerText.trim();
      }
    }

    if (julkaisuaika && otsikko) {
      tulos.push({
        otsikko,
        julkaisuaika,
        url: href
      });
    }
  });

  return tulos;
});


uutiset.sort((a, b) => new Date(a.julkaisuaika) - new Date(b.julkaisuaika));

// Lisätty Supabase toteutusta varten

  for (const u of uutiset) {
    try {
      await pool.query(
        `INSERT INTO uutiset (otsikko, paivamaara, kellonaika, url, lahde)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (url) DO NOTHING`,
        [u.otsikko, u.paivamaara, u.kellonaika, u.url, u.lahde]
      );
      console.log(`Tallennettu: ${u.otsikko} (${u.paivamaara} klo ${u.kellonaika})`);
    } catch (err) {
      console.error('Tietokantavirhe:', err.message);
    }
  }


  /*lokaali toteutus SQL tietokanta:

  for (const u of uutiset) {
    db.run(
      `INSERT OR IGNORE INTO uutiset (otsikko, julkaisuaika, url) VALUES (?, ?, ?)`,
      [u.otsikko, u.julkaisuaika, u.url],
      (err) => {
        if (err) {
          console.error('Tietokantavirhe:', err.message);
        } else {
          console.log(`Tallennettu: ${u.otsikko} (${u.julkaisuaika})`);
        }
      }
    );
  }*/

  await browser.close();

  // Suljetaan tietokantayhteys
  await pool.end();
  console.log('Tietokantayhteys suljettu.');
})();

  // Suljetaan tietokantayhteys pienen viiveen jälkeen




  /* Lokaalia varten
  setTimeout(() => {
    db.close();
    console.log('Tietokantayhteys suljettu.');
  }, 1000); 
})();*/
