//Supabase tietokanta yhtetyttä varten
require('dotenv').config();

const express = require('express');
const cors = require('cors');
// Tämä oli lokaalia tietokantaa varten
//const sqlite3 = require('sqlite3').verbose();

//Tämä on supabase kantaa varten
const { createClient } = require('@supabase/supabase-js');


const app = express();
// Tämä oli lokaalia varten
//const port = 3000;
// Tämä supabase yhteyttä varten
const port = process.env.PORT || 3000;


// tämä lokaalia varten:
// const path = require('path');

// Tämä rivi palvelee kaikki tiedostot kansiosta 'public'
// tätä ei supabase veriossa kai tarvita
//app.use(express.static(path.join(__dirname, './')));


app.use(cors());

// Yhdistetään Supabaseen
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// API endpoint, josta haetaan uutiset
app.get('/uutiset', async (req, res) => {
  const { data, error } = await supabase
    .from('uutiset')    // taulun nimi Supabasessa
    .select('*')
    .order('julkaisuaika', { ascending: false })
    
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});








// Avataan tietokanta lokaali:
//const db = new sqlite3.Database('./uutiset.db');

// Endpoint joka palauttaa kaikki uutiset JSON-muodossa
/* Tämä on lokaalia varten:
app.get('/uutiset', (req, res) => {
  db.all('SELECT * FROM uutiset ORDER BY julkaisuaika DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});
*/

// Käynnistetään palvelin
app.listen(port, () => {
  console.log(`Palvelin käynnissä: http://localhost:${port}`);
});
