# STRATO Odds · lokale social redesign

Start met `Start-STRATO-Odds.command` of `python3 server.py`. Open http://127.0.0.1:4173. Python 3 en curl zijn voldoende; geen npm-installatie of API-sleutels nodig voor de basis. Het account blijft in localStorage. Bestaande accounts op dezelfde localhostpoort worden behouden.

## Deze herwerking

Grotere banners en kaarten, een rustige topicsbalk, appnavigatie achter het menu, echte nieuwsfeeds en een volledige footer. Social heeft theses met marktbijlagen en conviction, reacties, bewaren, reposts, profielpagina’s, Following en marktvoorstellen met stemmen en discussie. Leaderboards tonen Today, This month en All time met Profit, Volume en Win rate. De voorbeeldprofielen en ranglijsten zijn fictief.

De marktpagina heeft een tijdcorrecte kansgrafiek met autoscale, eigen en gevolgde traderentries, crosshair, marktselectie en een visueel orderboek met depth-weergave. De compacte Buy/Sell/Earn-flow heeft een eigen review. De spinvoortgang zit binnen hetzelfde ticket: geen apart overlappend blok. Op mobiel volgen ticket en discussion elkaar op.

Liquidity toevoegen vraagt een bedrag; de spreadinstelling staat ingeklapt. Quotes van je lokale LP verschijnen als YOU in het orderboek. De makerberekening gebruikt tijd, poolaandeel en quotevoorwaarden. Opnemen bewaart opgebouwde rewards. Rewards bevat het wheel, makerprogramma, missions, referrals en research-XP. Iedere tien gevulde voorspellingen geeft één spin. Het wheel legt de uitkomst vast voor de animatie, zodat herladen geen extra reward geeft. Drie originele STRATO-bellengeluidsmotieven zijn inbegrepen; zet geluid aan in de header of beluister ze via Settings.

## Live data

- Publieke STRATO Odds-markten en orderboeken; geen oracleprijs als kanspercentage.
- Polymarket Gamma-catalogus, CLOB-historiek en orderboeken, Data API v2-trades. De chart luistert naar de publieke market-WebSocket; REST-polling iedere drie seconden is de fallback. Nieuwe prijzen veranderen de chart en ticketcijfers zonder de pagina te hertekenen.
- Kalshi open events, quoteprijzen, publieke orderboeken en candlesticks waar beschikbaar. Kalshi-volumes zijn contractaantallen.
- BBC, CoinDesk, Federal Reserve en NASA RSS: kop, korte samenvatting en bronlink. Een lokale nieuws- en marktsnapshot ondersteunt offline openen.

De catalogus ververst iedere minuut bij een open app; nieuws wordt vijf minuten gecachet. Een markt beweegt alleen wanneer upstream nieuwe data levert. Geen verzonnen live koersbewegingen. Native markten zonder beschikbare kanshistoriek verzamelen echte bookquotes vanaf openen. De twaalf eigen conceptvragen hebben illustratieve kansen en chartpaden.

## Sociale kanalen

X-delen maakt een correct deelconcept. Zonder accountkoppeling opent de gebruiker zelf X om het bericht te plaatsen. Optioneel kan de lokale server automatisch publiceren als `STRATO_X_USER_TOKEN` is ingesteld met een daarvoor geschikte user access token en schrijfrechten. De POST-adapter gebruikt `/2/tweets`, controleert origin en tekstlengte en stuurt het token niet naar de browser. Gebruik geen token in broncode of ZIP. Configureer accounttoegang buiten het project; de benodigde X-apprechten en toegang vallen onder je eigen X-account. Tijdens de controle is niets extern gepubliceerd.

Instagram levert een downloadbare portrait-sharecard met de officiële STRATO-identiteit. Automatisch publiceren naar Instagram en OAuth-accountbeheer zijn niet geïmplementeerd. De Connections-interface geeft de werkelijke verbindingsstatus weer.

## Wat lokaal gesimuleerd is

De interface laat op verzoek geen herhaalde demo- of bronbadges zien. Menu → About bewaart de toelichting. Handel, USDST-saldi, LP-quotes, makerbudgetten, settlement, spinprijzen, referrals, XP, profielen, traderentries en leaderboards zijn lokale voorbeelden zonder geldwaarde. Sociale posten en reacties blijven in deze browser; er is geen gedeelde social database. De publieke marktdata is read-only. De paperbroker voert uit tegen een referentieprijs en modelleert geen echte fills, gas, matching, slippage of marktimpact.

Makerbudgetten zijn ontwerpwaarden en geen live STRATO-belofte. Accrual is begrensd tot één dag per claimperiode; quotekwaliteit vereist minimumgrootte en maximumspread. Productie vraagt onder andere echte quoting, gefinancierde beloningen, accounts, moderatie en server-side opslag. Zie RESEARCH.md voor bronnen en keuzes.

## Testen

`npm test` of `node --test tests/*.test.mjs` draait 21 tests. Er zijn geen npm-dependencies.

1. Open een markt, koop een lokale positie en bekijk My entries op de chart.
2. Test Sell en een Limit-order; bekijk reserveringen en annuleren in Portfolio.
3. Kies Earn, voeg liquiditeit toe en bekijk Pools en makerrewards.
4. Plaats een thesis, reageer, bewaar hem en stel een markt voor bij Social.
5. Volg traders en wissel leaderboardperiode en ranking.
6. Plaats tien voorspellingen en draai het wheel. Geluid kan via Settings worden getest.

Snapshot bijwerken: `python3 server.py --snapshot`; thumbnails: `python3 cache_assets.py`. `VALIDATION.md` vermeldt de uitgevoerde controles.

## Kaartmetadata, live assets en rewardaccenten · 4 november

Iedere marktkaart heeft een vaste datum- en volumepositie. Ontbrekend volume is een streepje, nooit een verzonnen nul; Kalshi blijft in contracts. Live is een afzonderlijk label voor de nabij sluitende markten. Rewards zijn met een consistent goudaccent gemarkeerd, inclusief een directe headerknop, kaartlinks, Earn, het wheel en maker-CTA’s.

Crypto-prijsvragen met een ondersteunde spotfeed openen standaard op een Live-kansgrafiek met een venster van vijftien minuten en fijnere autoscale. Detailkansen tonen één decimaal. De stream verwerkt ook best_bid_ask en orderboekdeltas. De WebSocket en eerste bookpoll starten meteen, onafhankelijk van het ophalen van historie en openbare trades. Binnenkomende observaties blijven behouden als de historische response later arriveert. De REST-fallback mag een nieuwere streamquote niet overschrijven.

Daarnaast staat bij ondersteunde Bitcoin/Ethereum/Solana/Dogecoin/XRP/Zcash-prijsvragen een echte USD-spotkoers met een uurhistoriek. Coinbase Exchange levert deze via publieke ticker-WebSocket, minuutcandles en REST-fallback. Deze contextkoers staat los van de kans op de voorspelling en is geen vervanging van de marktresolutiebron. Er worden geen kansen afgeleid van deze koers. Conceptmarkten en vragen zonder passende feed krijgen geen fictieve assetstream. De last-update-indicator wordt oud wanneer geen actuele quotes binnenkomen.
