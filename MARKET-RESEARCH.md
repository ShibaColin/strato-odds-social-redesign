# STRATO Newsdesk: marktupdates en nieuwsselectie

Onderzocht en geïmplementeerd op 6 november 2026 (UTC).

## Wat verandert

De bestaande nieuwsdesk, eenvoudige interface en Telegram-koppeling blijven de basis. Nieuwscontrole draait iedere minuut op de bestaande Ubuntu-server, ook als de computer uitstaat. Nieuwe marktdata worden binnen dezelfde controle opgehaald. Er wordt geen nieuwe timer of dienst gekocht.

De gebruiker koos twee vaste BTC/ETH-updates per dag plus grote bewegingen. De standaardtijdstippen zijn 08:00 en 20:00 Europe/Brussels, inclusief zomer-/wintertijd. Beide assets staan in één Engelstalige post. De verandering heeft steeds expliciet betrekking op de afgelopen 24 uur. Gewone overzichten heten MARKET UPDATE; een geplande post krijgt geen kunstmatige JUST IN-status.

Koersen komen uit Coinbase Exchange BTC-USD en ETH-USD. De 24-uursverandering wordt berekend uit de laatste tickerprijs en de 24-uursopeningsprijs uit product stats. De post vermeldt Coinbase USD spot en het tijdstip in UTC. Dit zijn prijzen van die beurs, geen wereldwijd gewogen cryptoprijzen. Positieve, eindige prijzen en een ticker van maximaal drie minuten oud zijn vereist. Als één asset ontbreekt, wacht het gecombineerde overzicht op geldige data; na vijftien minuten wordt een gemiste vaste editie overgeslagen. Oude edities worden niet alsnog verstuurd.

Extra koersmeldingen gebruiken gemeten bewegingen: BTC per ongeveer één uur in stappen van 3%, ETH in stappen van 4%; daarnaast voor beide assets 24-uursbewegingen in stappen van 5%. De eerste waarneming van een al bestaande grote 24-uursbeweging dient als uitgangspunt en wordt niet als nieuw nieuws verstuurd. Eén-uurmeldingen vereisen ongeveer een uur eigen meetgeschiedenis. Per asset/meetvenster geldt minimaal één uur afkoeling en een nieuwe drempel of richtingsomslag. Gelijke meldingen verschijnen niet iedere minuut. Een koerswijziging levert op zichzelf geen verklaring op: de app verzint geen oorzakelijk verband met Trump, oorlog of rente.

## Onderzoek naar de gewenste nieuwsmix

De opgegeven voorbeelden combineren korte feitelijke koppen met concrete bedragen, bekende assets/personen en een duidelijk tijdvenster. Dit vraagt om twee aanvoerpaden: nieuwsartikelen voor gebeurtenissen en directe marktdata voor cijfers. RSS alleen kan geen betrouwbare minuutmeldingen over prijsacties opleveren. Een accountnaam of populaire headline is evenmin een bewijs voor een koers, liquidatiebedrag of het geheime bronnennetwerk van een account.

Watcher.Guru's eigen website is onderzocht, evenals publiek vindbare berichten op zijn Telegram-kanaal. De onderzochte mix bevat crypto, prijsbewegingen, internationale economische thema's en korte liquidatieberichten. Dit is een kwalitatieve inspectie, geen volledige analyse van de X-tijdlijn of bewijs welke databronnen het account intern gebruikt. Er wordt geen gegarandeerde snelheid of volledige gelijkheid met professionele nieuwsdesks beloofd.

Aan de zes bestaande feeds zijn drie gecontroleerde RSS-feeds toegevoegd: CNBC Politics & Policy, BBC US & Canada en BBC Europe. De regionale/politieke bronnen worden op relevante economische, politieke en geopolitieke onderwerpen gefilterd. Gelijkblijvende URL's en identieke koppen worden gededupliceerd. Oudere artikelen uit nieuw aangesloten feeds krijgen geen inhaalalarm.

De Telegram-wachtrij geeft voorrang aan belangrijke gebeurtenissen: bijvoorbeeld noodrente-ingrepen, invasies, nucleaire ontwikkelingen, ceasefires, handelsmaatregelen, inflatie-/banencijfers, Fed, grote Amerikaanse indices en liquidaties. Trump/Rusland/Oekraïne krijgen extra gewicht in combinatie met beleids-, economische of oorlogsonderwerpen. Een bekende naam alleen is onvoldoende voor de hoogste prioriteit. Algemene bestaande nieuwsdekking blijft behouden. Deze regelgebaseerde prioritering is geen menselijke verificatie van de inhoud van ieder artikel.

## Marktwaarde is geen liquidatie

Een daling van totale cryptomarktkapitalisatie is een waarderingsverschil. Dat is geen gemeten hoeveelheid geld die de markt heeft verlaten en ook geen totaal aan geliquideerde derivatenposities. De app maakt die claims niet op basis van BTC/ETH-prijsveranderingen.

Voor een zelfstandige 'billions wiped off crypto market value'-stroom is betrouwbare totale marktkapitalisatie nodig, steeds uit dezelfde aanbieder en met expliciet vergelijkingsvenster. CoinGecko biedt die geaggregeerde data, maar zijn huidige licentie-uitleg vraagt een betaald abonnement voor commercieel gebruik. CoinPaprika's gratis plan is eveneens niet de gekozen route voor deze commerciële STRATO-workflow. Een bereikbare gratis endpoint betekent niet automatisch dat publicatie commercieel is toegestaan. Daarom is automatische marktwaarde-rapportage nog niet geactiveerd.

CoinGlass heeft een daadwerkelijke liquidation exchange-list API: symbol leeg voor alle cryptovaluta, range 1h/4h/12h/24h, en de 'All'-rij met totaal/long/short. Dit is een andere dataset dan een liquidatieheatmap, die mogelijke liquidatieniveaus toont. De API vereist een sleutel en een passend betaald plan. Er is geen sleutel aangesloten en niets gekocht; zelfstandige liquidatiemeldingen zijn daarom nog niet actief. Bestaande nieuwsartikelen met gerapporteerde bedragen blijven binnenkomen met een bronknop.

De volgende uitbreiding kan een commercieel geschikte marktwaardeprovider en CoinGlass aansluiten via runtime secrets. Vooraf moeten databeschikbaarheid, publicatierechten, tijdvensters en planlimieten worden bevestigd. De nieuwsdesk kan ondertussen prijsupdates en uitgebreidere nieuwsselectie zelfstandig uitvoeren.

## Copy en workflow

De bestaande Engelse schrijfstijl blijft behouden. Dataposts krijgen korte losse paragrafen, een bedrag, percentage, venster en bron/tijd. Alleen nieuwe gedetecteerde bewegingen krijgen JUST IN. Geen decoratieve streepjes, automatische drama-zinnen, verzonnen liquidaties of ingevulde marktoorzaken. Posts komen in dezelfde kopieerbare feed en privé-Telegramchat. Alleen af en toe een verwijzing naar prediction markets volgens de bestaande ingestelde frequentie; geen andere STRATO-promoties.

## Primaire bronnen

- Coinbase stats: https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-stats
- Coinbase ticker: https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-ticker
- CoinGlass echte liquidatiedata: https://docs.coinglass.com/reference/liquidation-exchange-list
- CoinGecko commerciële licenties: https://support.coingecko.com/articles/1043089972-what-are-the-differences-between-commercial-and-custom-licenses
- CoinGecko API: https://www.coingecko.com/en/api
- CoinPaprika abonnementen: https://coinpaprika.com/api/pricing
- Watcher.Guru website: https://watcher.guru/news/
- Publiek Telegram-kanaal: https://t.me/s/watcherguru
- CNBC Politics feed: https://www.cnbc.com/id/10000113/device/rss/rss.html
- BBC US & Canada: https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml
- BBC Europe: https://feeds.bbci.co.uk/news/world/europe/rss.xml

## Controle

TypeScript-controle en productiebuild; bestaande cloudcollector-tests voor nieuwe berichten, opstart zonder oude alarms, deduplicatie, promo-cadans, Telegram 429-retry en onzekere bezorging; nieuwe marktdata-tests voor twee dagvensters, zomertijd, versheid, foutieve/ontbrekende data, eerste waarneming, gemeten uurvenster, drempel, afkoeling, exacte copy en nieuwsrelevantie. Tests sturen geen echte Telegramberichten. Productiebronstatus en de eerstvolgende automatische servercontrole worden apart gecontroleerd na publicatie.

## Aanvulling: gratis gerapporteerde marktverliezen en gsm-meldingen

De nieuwsdesk volgt nu ook de openbare RSS-feeds van The Block, CryptoSlate en Watcher.Guru, gericht op liquidaties, marktwaarde, selloffs en grote koersbewegingen. Dit kost geen extra API-abonnement. Een kwalitatieve livecontrole vond zowel een The Block-artikel over meer dan $1 miljard aan cryptoliquidaties als een CryptoSlate-artikel over verdwenen Amerikaanse beurswaarde. De bedragen worden gebruikt als door de uitgever gerapporteerd nieuws, met bronvermelding. De onderliggende datasets worden niet nagemaakt. De bestaande prijsdata blijven apart functioneren.

Deze route is afhankelijk van het verschijnen en verversen van een nieuwsartikel/RSS-feed. De server controleert elke minuut. De achterstand kan seconden, minuten of langer zijn; er wordt geen vaste achterstand ten opzichte van X-accounts beloofd. Alleen nieuwe relevante berichten krijgen een melding. Artikelen uit nieuw aangesloten feeds die al meer dan vijf minuten oud zijn, worden bij aansluiting zonder push opgeslagen. Exacte URL's en gelijke koppen worden gededupliceerd; anders geformuleerde artikelen van verschillende uitgevers over dezelfde gebeurtenis kunnen nog afzonderlijk verschijnen.

Voorspellingen als 'could be liquidated' en algemene koop-/verkoopadviezen worden in de drie extra marktfeeds gefilterd. De oorspronkelijke scope en tijdvensters blijven behouden voor zover ze in de RSS-kop/het excerpt staan. De app zet verdwenen aandelenmarktwaarde niet om in cryptoliquidaties, telt bedragen van verschillende artikelen niet op en noemt een bronartikel geen eigen marktmeting. Een korte 'Reported by ...' regel verduidelijkt de herkomst.

Een eigen gratis aggregatie via beursstreams is onderzocht als alternatief. Binance documenteert dat zijn liquidatiesnapshot slechts de laatste liquidatie per symbool per 1000 ms kan bevatten. Zo'n stroom optellen zou dus geen volledig marktbreed totaal opleveren. Een beperkte 'waargenomen op beurs X'-meting is mogelijk, maar lost de gevraagde betrouwbare wereldwijde miljardenbedragen niet op en is daarom niet stilzwijgend als vervanger geïnstalleerd.

Telegram verstuurde berichten al zonder stille modus; nu staat disable_notification expliciet op false. Dit kan de instellingen van de ontvanger niet overrulen. De gebruiker bevestigde dat de berichten op de iPhone wel in de Telegram-chat staan maar zonder pushmelding. Controleer daarom de meldingen voor @STRATOnews_bot, Telegrams eigen Notifications and Sounds, de iPhone-meldingsrechten, onmiddellijke bezorging in plaats van een gepland overzicht, en Focus/Niet storen.

Settings > Telegram bevat nu Test notification. Deze verstuurt één gewone niet-stille testmelding, met minimaal één minuut tussen tests. Dit test de Telegrambezorging; ontvangst van een iPhone-banner kan alleen door de gebruiker bevestigd worden. De bot kan telefooninstellingen niet uitlezen of aanpassen.

Extra gecontroleerde bronnen:
- https://www.theblock.co/rss.xml
- https://cryptoslate.com/feed/
- https://watcher.guru/news/feed/
- https://www.theblock.co/news/markets/2026-11-05-bitcoin-erases-post-election-gains-wall-street-selloff-liquidations-435434
- https://cryptoslate.com/bitcoin-crashes-below-76000-as-ai-bubble-fears-wipe-2-5-trillion-from-wall-street/
- https://developers.binance.info/en/docs/catalog/core-trading-derivatives-trading-coin-m-futures/api/ws-streams
- https://core.telegram.org/bots/api#sendmessage
- https://telegram.org/faq#notification-problems
- https://support.apple.com/guide/iphone/change-notification-settings-iph7c3d96bab/ios

De drie extra publicatiefeeds worden maximaal eenmaal per twee minuten opgehaald. Bij HTTP 429/503 wacht de collector minimaal vijf minuten en langer als Retry-After dat voorschrijft. Deze wachttijd blijft in de database bewaard, zodat een Worker-herstart hem niet omzeilt. Andere feeds lopen door. Dit maakt de gratis route doorgaans trager dan directe beursdata.


## Dekking van korte breaking posts: onderzoek 6 november

Concrete gemiste post: https://x.com/WatcherGuru/status/2118735403687563330 over de Russische centrale bank die Bitcoin, Ethereum en USDT voor retailhandel goedkeurt. De post was zichtbaar op X en in de openbare Telegram-preview als https://t.me/WatcherGuru/15859 (16:01:05 UTC), maar stond niet in de op dat moment opgehaalde RSS van de Watcher.Guru-nieuwswebsite. Die RSS en de korte social stream zijn verschillende publicatiekanalen. De collector en bestaande bezorging waren actief. De huidige RSS-filters voor de drie extra marktuitgevers waren bovendien beperkt tot prijsactie en marktverlies; gerelateerde regelgevingsartikelen konden daardoor buiten beeld blijven.

Oplossing: de openbare https://t.me/s/WatcherGuru-preview wordt nu iedere minuut gecontroleerd. De parser leest uitsluitend publieke tekst, originele post-ID en tijdstempel. Hij gebruikt geen Telegram-account, privésessie of verborgen API. De berichten krijgen een directe bronlink, zichtbare Watcher.Guru-attributie en dezelfde blijvende deduplicatie/Telegram-bezorging als andere artikelen. Bij onbereikbaarheid of limieten volgt de bestaande wachttijd, zonder de andere feeds stil te leggen. Eenmalig bij aansluiting mogen maximaal drie belangrijke berichten van minder dan dertig minuten oud alsnog door; oudere berichten worden opgeslagen zonder een grote stroom oude meldingen. De genoemde Rusland-post is met een echte publieke HTML-fixture getest, inclusief eenmalige bezorging in de gesimuleerde database.

De drie extra uitgevers laten nu ook belangrijke cryptoregelgeving, goedkeuringen, bankintroducties en handelsverboden door. Dit vervangt de koers-/liquidatiedekking niet. Concreet gaat een centralebankbesluit over crypto nu door de filter en krijgt het hoge prioriteit.

De primaire publicatie van de Bank of Russia bevestigt de namen van de drie assets en noemt 17 november als ingangsdatum: https://www.cbr.ru/press/event/?id=32964. De social post is een bericht van de uitgever; automatische doorvoer is geen onafhankelijke factcheck van iedere claim. De live koppeling volgt het openbare Telegram-kanaal en garandeert geen volledige X-tijdlijn, geen volledige wereldwijde nieuwsdekking en geen vaste achterstand ten opzichte van professionele redacties. Berichten die uitsluitend op X verschijnen of buiten het publieke previewvenster vallen, kunnen nog ontbreken.


## Uitbreiding 17 november 2026

De generieke promotiefrequentie is vervangen door actuele matching op de openbare Odds-markten en events. Canonieke /markets/address-links worden alleen toegevoegd bij relevante OPEN-markten zonder halt/hidden-vlag en met een toekomstige sluitingstijd. Bij kopiëren en versturen wordt de beschikbaarheid opnieuw gecontroleerd. Bij geen match of API-fout volgt geen link. Goud, zilver, ETH, BTC, NVIDIA, SPY, olie en concrete eventonderwerpen zijn opgenomen. De algemene Odds-verwijzing en Reported by-regels verdwijnen uit kopieertekst; bronknoppen blijven voor controle beschikbaar.

Een lokale Qwen3:8b-schrijfmotor op de bestaande server herschrijft nieuwe posts zonder betaalde API. Deterministische marktupdates blijven op gemeten cijfers gebaseerd. Het systeem blokkeert ongekende cijfers, een aantal nieuwe sprekers/instellingen, verdwenen onzekerheid, gekopieerde lange formuleringen en enkele generieke AI-frases. Dit is geen garantie dat iedere parafrase foutloos is; de bron blijft naast iedere post controleerbaar. Niet-goedgekeurde teksten worden opnieuw geprobeerd en worden niet als ruwe bronkop naar Telegram doorgestuurd.

Vijf extra gratis bronnen: CoinDesk (canonical RSS zonder trailing slash), SEC-pressreleases, ECB-press, Bank of England-news en EIA-press. CoinDesk5min en BoE60min feed-TTL; andere nieuwe overheidsfeeds5min. BLS/IMF blokkeren de geteste verzoeken; Treasury-kandidaat gaf404. Geen volledige gratis Reuters-feed toegevoegd of beloofd.

Automatische1200x675-beelden gebruiken echte Coinbase-candles voor BTC/ETH en echte STRATO-orakelobservaties voor NVIDIA, goud, zilver, olie en SPY. SPY is een ETF-referentie, geen S&P-indexstand. Uurmeldingen krijgen waar herkenbaar een uurvenster; andere koersbeelden24uur. Verouderde of ontbrekende data leveren geen verzonnen chart op. Een samengestelde identity-afbeelding of bestaande licentiegeschikte foto kan dan worden gebruikt. Foto’s zijn als archief-/filebeeld geïdentificeerd met credits/licenties op het beeld. Templates dekken ook Jensen Huang, Trump, Putin, Powell, Fed, ECB en SEC. Andere onderwerpen kunnen zonder beeld blijven.

Afbeeldingen worden in de privédesk downloadbaar en in Telegram als foto met posttekst verstuurd waar de captionlimiet dat toelaat. Opslag is begrensd op300beelden en3dagen. Historische concepten van de afgelopen24uur worden op de achtergrond herschreven; eerder verstuurde berichten worden daarbij niet opnieuw verstuurd.

Primaire broncatalogi: https://www.sec.gov/files/about/secrss.shtml ; https://www.ecb.europa.eu/home/html/rss.en.html ; https://www.bankofengland.co.uk/rss ; https://www.eia.gov/tools/rssfeeds/ . Lokale modeldocumentatie: https://docs.ollama.com/linux en https://ollama.com/library/qwen3:8b . Marktgegevens: https://stratoodds.com/api/v1/markets en https://stratoodds.com/api/v1/events .


## Beeldcorrectie op basis van Watcher.Guru-voorbeelden

De gebruiker verwerpt de beeldkaarten met kleine bronregels en dubbele persoonsnamen. De nieuwste renderer verwijdert alle zulke overlays en gebruikt beeldvullende foto’s/beeldparen. Koersbeelden vullen het canvas en houden alleen echte instrument-, prijs-, as- en tijdvensterinformatie. Foto-output is JPEG met hoge kwaliteit en zonder kleurreductie; charts blijven lossless PNG. Bronnen en rechten blijven in metadata, buiten het beeld en de kopieertekst. Voor Jensen en Trump zijn publieke-domeinfoto’s gebundeld, voor ETH een publiek-domeinvariant, voor NVIDIA een officiële newsroom-asset, en voor omzetnieuws een Pexels-foto waarvan de licentie geen naamsvermelding vraagt. Geen ongefundeerd synthetisch koersverloop of nagemaakt logo.

Opnieuw genereren van bestaande media verandert geen posttekst en verstuurt eerder geleverd nieuws niet opnieuw. De gebruiker heeft de richting gespecificeerd; de nieuwe uitvoer is nog geen door de gebruiker goedgekeurde creatieve set.
