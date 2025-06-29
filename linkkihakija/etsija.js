const puppeteer = require('puppeteer');

(async () => {
  const selaus = await puppeteer.launch({ headless: true });
  const sivu = await selaus.newPage();

  await sivu.goto('https://www.palloliitto.fi/maajoukkueet/helmarit', {
    waitUntil: 'networkidle2'
  });

  // Odotetaan että sisältö varmasti latautuu
  await new Promise(r => setTimeout(r, 3000));

  // Haetaan kaikki uutiset, joiden tekstissä esiintyy päivämäärä
  const paivamaara = "22.5.2025";

  const uutiset = await sivu.evaluate((paivamaara) => {
    // Etsitään kaikki linkit ja niiden vanhempien elementtien tekstit
    const uutisElementit = Array.from(document.querySelectorAll('a'));
    
    return uutisElementit
      .filter(a => a.innerText.includes(paivamaara))
      .map(a => ({
        otsikko: a.innerText.trim(),
        linkki: a.href
      }));
  }, paivamaara);

  if (uutiset.length > 0) {
    console.log(`Löytyi ${uutiset.length} uutista päivältä ${paivamaara}:`);
    uutiset.forEach(u => console.log(`- ${u.otsikko}\n  Linkki: ${u.linkki}`));
  } else {
    console.log(`Ei löytynyt uutisia päivältä ${paivamaara}`);
  }

  await selaus.close();
})();