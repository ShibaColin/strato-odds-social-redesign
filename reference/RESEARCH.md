# Onderzoek en ontwerp — STRATO Odds Social

Onderzocht op 3 november 2026, New York-tijd. Dit is een lokaal productvoorstel, geen wijziging van de productie-app.

## De ontwerpkeuze

Maak de prediction market zelf rustig en vertrouwd. Maak de deelname sociaal en plezierig. Markets blijft de standaardingang: vraag, uitkomsten, kans, bron, dan pas de trade. Pulse, Traders en Rewards zijn herkenbare bestemmingen naast die kern. De sociale laag moet bruikbare context geven over een positie en haar timing.

Visueel: Paper #FAFBFD, navy #001B71, elektrisch blauw #3452FF, Inter en tabular figures. Officiële Odds-lockup ongewijzigd. Functionele groen/rood-uitkomsten, dunne kaders, compacte kaarten en normale producttypografie. Geen marketinghero met loze cijfers, glasplaten, neonachtergronden of gegenereerde UI-assets. De conceptuele zetelillustratie in de focuskaart is als illustratie gemarkeerd en beweert geen actuele zetelverdeling.

De actuele brandkit en BRAND-SYSTEM-KNOWLEDGE zijn geraadpleegd. De oude lokale `strato-odds-concept` en haar onderzoeksnotities zijn bekeken, maar de nieuwe interface is afzonderlijk opgebouwd. De huidige live STRATO-app is rechtstreeks bekeken: zij heeft inmiddels meer functies dan de oudere septembernotities. Die oudere momentopname is daarom niet als huidige functielijst overgenomen.

## Wat de referenties bijdragen

| Referentie | Waargenomen / gedocumenteerd | Toegepast in dit voorstel |
| --- | --- | --- |
| Polymarket | Categorieën, compacte vraagkaarten, meerdere uitkomsten, directe prijsvergelijking, kanshistoriek, orderboek en regels. De publieke homepage is ook visueel bekeken. | Een marktgerichte homepage; herkenbare YES/NO-acties; bronvolume; afzonderlijk ticket en regels. Geen kopie van branding, volledige layout, voorwaarden of alle productfuncties. |
| Kalshi | Publieke events met submarkten, duidelijke contractstructuur en marktdata zonder handelsauthenticatie. | Tweede echte catalogusbron; bedragen en contracts worden in de UI onderscheiden. |
| Fomo | Eigen positionering als sociale tradingapp; feed van activiteit en traders als ontdekking naast de trade. | Pulse met context, gevolgd netwerk en handmatige overstap van activiteit naar een prediction. |
| Axiom | Officiële documentatie beschrijft wallettracking en Trader Scan met koop/verkoopactiviteit, holdings en holdingduur naast de tradinginterface. | Profielen, zichtbare sociale entries en chartmarkers. Geen claim van een Axiom-integratie of automatische copy trading. |
| STRATO Odds | Actuele live app en publieke read-only markt- en book-endpoints; USDST en STRATO-oracleresolutie. | Echte native markten, eigen quotes, originele resolutietekst en bronlink; eigen merk en USDST-model. |

De precieze identiteit van “OX” kon niet eenduidig worden bevestigd. Na verduidelijking van de gebruiker is de sociale productrichting onderzocht via Fomo en Axiom. Er is geen onbewezen OX-featurelijst ingevuld.

## Waar STRATO zich kan onderscheiden

**1. Entries met context.** Een chartmarker toont wanneer iemand een positie nam; een profiel en thesis geven er betekenis aan. In deze demo zijn de sociale overlays als simulatie herkenbaar. Je eigen paperentry gebruikt je werkelijke lokale tijd en entryprijs. Openbare Polymarket-trades staan apart als bronactiviteit.

Voor productie: laat een gebruiker expliciet kiezen welke posities openbaar zijn. Controleer de relatie tussen een publiek profiel en een wallet. Laat ook gesloten posities en verliezen zien. Een bekende naam en een goede trade zijn verschillende dingen.

**2. HardFi als herkenbare redactionele niche.** Goud, zilver, tokenized Treasuries, ETH versus goud en onchain adoptie passen bij STRATO. Deze niche krijgt een gewone plaats naast Politics, Crypto, Sports, Economy, Tech & AI, Culture, Geopolitics en Weather. Nieuwe vragen moeten een ondubbelzinnige uitkomst hebben: exacte periode, databron, drempel, inclusies, uitsluitingen en fallback.

**3. Geluid als producthandtekening.** Korte eigen synthese met rustige, oplopende tonen voor een prediction, aparte lage/hoge tonen voor LP en een langere rewardcadens. Geen externe audioafhankelijkheid. Uit bij de start en eenvoudig aan te zetten. Dit geeft het bevestigingsmoment karakter zonder het hele product een casinoverpakking te geven.

**4. Rewards op meerdere handelingen.** De gevraagde spin per tien predictions is gebouwd. Daarnaast belonen missions regels lezen, watchlist, traders volgen, LP en researchbijdragen. LP-fees en referrals zijn afzonderlijk doorloopbare demo-verdienmodellen. De modellen staan met hun aannames in beeld.

**5. Een betere reputatielaag.** De demoprofielen tonen Brier-score plus sample size, naast de niche. Productie zou een controleerbare periode, minimumaantal afgewikkelde forecasts en kalibratie per kansbucket moeten tonen. Handelsvolume en geluk op één grote positie zijn onvoldoende om voorspellingskwaliteit te meten.

## Marktredactie

De catalogus gebruikt echte vragen van de aangesloten publieke bronnen. De twaalf eigen concepten omvatten de Musk- en Coinbase-vragen van de gebruiker, tokenized gold, relatieve ETH/goud- en zilver/goud-prestaties, tokenized Treasuries, robotaxi’s, Apple, Starship, AI-film en BTC-adoptie.

De vragen zijn voorstellen, niet als nieuw-op-de-wereld of exclusief voorgesteld. Voor de twee genoemde persoons-/bedrijfsvoorbeelden is de scope bewust concreet gemaakt: daadwerkelijk beginnen van een gevangenisstraf, respectievelijk een officieel bevestigde platformcompromittering met verlies van klantassets. Geen gerucht, beschuldiging of bestaand incident wordt geïmpliceerd.

Sommige andere concepten vragen meer redactionele afbakening, bijvoorbeeld AI-aandeel in filmframes of launchomzet. De resolutiepagina benoemt dat. Geen van deze ideeën heeft fictieve live volumes of verzonnen echte liquiditeit.

## Incentives en producteconomie

De huidige demo rekent nul handelsfees. De extra verdienmodellen zijn transparante voorstellen, los van bestaande STRATO-programma’s.

- Wheel: één spin per tien gevulde paperpredictions; zes gelijke segmenten. Cashsegmenten 25, 50 en 100 demo-USDST. Verwachte democash-uitgifte: 175/6 ≈ 29,17 per spin, dus ≈ 2,92 per prediction. Dit bedrag is uitsluitend een demonstratiebudget. Een live aanbod moet kleiner, gefinancierd en begrensd worden.
- LP: 250 voorbeeld-dagfees verdeeld over een pool van 50.000 plus de eigen demostorting. Bijvoorbeeld 250 deposito geeft circa 1,24 demo-USDST voor één gemodelleerde dag. De UI belooft geen APY. Productie vraagt echte fee accounting, quote quality, uptime, minimumdiepte, en kapitaalrisico.
- Referrals: drie lokale testslots van 50 demo-USDST na gesimuleerde kwalificatie. Er wordt niemand uitgenodigd. Productie vraagt unieke gebruikers, een echte relevante activiteitsvoorwaarde en budgetcaps.
- Research: één eerste thesis levert 150 XP. Voor grotere creatorprogramma’s zijn inhoudsbeoordeling, disclosure en anti-plagiaat nodig. Een beloning voor positieve promotie van een specifieke markt is geen goede standaard.

Voorkom later dat zelfhandel, herhaald rondpompen, LP storten/opnemen of vele accounts onbeperkt beloningen opleveren. Financier incentives uit een bekend budget en toon de daadwerkelijke deelnamevoorwaarden. De demo is bedoeld om de ervaring te beoordelen, niet om een economische simulatie als bewezen businessmodel te presenteren.

## Technische onderzoeksbevindingen

Polymarket Data API v1 gaf tijdens de test HTTP 410. Officiële migratiedocumentatie bevestigt beëindiging op 2 november 2026. De implementatie gebruikt daarom `/v2/trades`, een `condition`-filter, de `data`-envelope en snake_case-velden. De server controleert daarnaast dat elke trade de gevraagde condition heeft.

STRATO Odds publiceert marktdata en books via `/api/v1`. De onderzochte quotes hebben 18 decimalen. Status 1 en niet-gehalteerde markten worden gebruikt. Een bruikbare bookmid heeft voorrang op een bestaande tradequote. Geen quote betekent geen verzonnen 50%-kans.

Een oracleprijs beschrijft het onderliggende activum. Een kansquote beschrijft de uitkomsttoken. Deze twee grafieken mogen later wel naast elkaar staan, maar niet met dezelfde eenheid of misleidende y-as.

GitHub is via de gekoppelde connector doorzocht op STRATO/Odds; er is in die zoekresultaten geen Odds-repository gevonden. Deze versie is daarom zelfstandig lokaal gebouwd op basis van de officiële assets, bestaande lokale referentie en gecontroleerde publieke appdata. Er is niets gepusht of gedeployed.

## Mogelijke volgende uitbreidingen

- Geverifieerde creatorprofielen met echte walletbinding, consent en complete historie.
- Forecast leagues op kalibratie en sample size; gescheiden van volumecompetities.
- Vriendenduels met een vooraf vastgelegde vraag en gezamenlijke resolutiebron.
- Nieuwscontext met gelicentieerde bron, tijdstempel en correctiebeleid.
- Scenariovergelijking: hoe jouw thesis verschilt van de marktprijs.
- Echte maker incentives op quote quality, spread en time-in-book.
- Eigen vraagvoorstellen met redactionele wachtrij en duidelijke listingcriteria.

## Primaire bronnen

- Huidige STRATO Odds: https://stratoodds.com/
- STRATO markets: https://stratoodds.com/markets
- STRATO public markets: https://stratoodds.com/api/v1/markets
- Polymarket homepage: https://polymarket.com/
- Polymarket marktontdekking: https://docs.polymarket.com/market-data/discover-markets
- Prijzen en orderboeken: https://docs.polymarket.com/concepts/prices-orderbook
- Data API v2-migratie: https://docs.polymarket.com/migrate/data-api-v1-to-v2.md
- Kalshi homepage: https://kalshi.com/
- Kalshi publieke marktdata: https://docs.kalshi.com/getting_started/quick_start_market_data
- Fomo eigen website: https://fomo.family/
- Fomo sociale uitleg: https://production.fomo.family/answers/what-is-social-trading-in-crypto
- Axiom: https://docs.axiom.trade/readme.md
- Axiom Trader Scan: https://docs.axiom.trade/trader-scan.md

De gelinkte productbeschrijvingen zijn onderzoeksreferenties, geen endorsement of integratieovereenkomst.

## Herwerking op gebruikersfeedback · november 2026

De primaire navigatie is nu topicsgericht, met de apponderdelen in het rechter menu. De pagina’s hebben grotere composities en meer witruimte, informatie staat lager in afzonderlijke secties. Geen herhaalde bron- en testbadges; de technische herkomst blijft in About en README.

Social is uitgebreid met thesispost, conviction, marktbijlage, replies, bewaren, Following, ideeën met stemmen en een aparte nieuwsfeed. OKX Signals en Fomo zijn de referenties voor zichtbare sociale entries; de lokale profielen zijn illustratief. Er wordt geen echte KOL-identiteit of rendement geclaimd.

Makerrewards volgen het idee van minimumgrootte, competitieve spread en tijd in de markt; de lokale budgetten zijn ontwerpparameters. Dit is geen productclaim over STRATO-opbrengsten.

Primaire bronnen voor de implementatie:
- https://docs.polymarket.com/market-data/realtime-data — publieke market-WebSocket, assetsubscription, heartbeat en book/trade-events.
- https://docs.polymarket.com/programs/liquidity-rewards — minimumgrootte, maximumspread en tweezijdige liquiditeit.
- https://web3.okx.com/signal — sociale onchain-signalen en traderactiviteit als productreferentie.
- https://production.fomo.family/ — officiële Fomo-productreferentie voor sociale handelsfeeds.
- https://docs.x.com/x-api/posts/create-post — user-authorized postcreatie; geen werkende verbinding zonder geconfigureerd account.

X heeft een echte optionele serveradapter en een deelconcept als fallback. Instagram heeft een lokaal gegenereerde sharecard. Automatisch publiceren zonder account of permissions wordt niet voorgesteld als aangesloten functionaliteit.

### Live verfijning en vaste metadata

- https://docs.cdp.coinbase.com/exchange/websocket-feed/channels — publieke ticker-events met product_id, prijs en timestamp; heartbeat en ticker-subscriptie.
- https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles — uurhistoriek uit echte minuutcandles.
- https://docs.polymarket.com/market-data/realtime-data — CLOB price_change, book, best_bid_ask en last_trade_price.

De asset-USD-koers is een duidelijk afzonderlijk contextblok. Kansen en USD-spotkoersen worden niet onderling verwisseld. Een ingezoomde Live-chart toont echte kleine bewegingen; het ontwerp simuleert geen extra prijsschommelingen.
