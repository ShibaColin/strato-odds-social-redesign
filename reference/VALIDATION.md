# Controle van de social redesign · 4 november 2026 UTC

- 16 Node-tests geslaagd: aankopen, deelverkoop, kapitaalbehoud, ongeldige invoer, afzonderlijke YES/NO-posities, limietreserves en fills, LP-hoofdsom, spins zonder replay, missions, referrals, thesisreward, settlement, tijdgebonden makeraccrual, quotevoorwaarden, rewardclaims zonder dubbel claimen, opname met behoud van opgebouwde rewards en chartgeometrie op echte timestamps.
- Alle gewijzigde JavaScriptmodules door node --check; Python via ast.parse.
- Browsercontrole op desktop 1280×720 en mobiel 390×844. Homepage, social, markt, pools, traders en rewards gecontroleerd. Mobiele min-content-overflow van lange marktvragen verholpen; documentbreedte is 390px.
- Lokaal gepubliceerd: een thesis met marktbijlage en conviction; een reply; een nieuw marktvoorstel en een stem. Opnieuw renderen bewaart deze gegevens. Er is geen bericht op X of Instagram geplaatst.
- Leaderboard gewisseld naar Today/Volume; volgen getest.
- Lokale LP van 100 USDST toegevoegd; YOU-quotes zichtbaar in het echte read-only orderboek. Daarna een prediction geplaatst; balans en spinvoortgang aangepast, eigen entry zichtbaar op chart.
- Echte geselecteerde marktquote bewoog tijdens de controle; grafiek, orderboek en ticket werkten bij. Prijsupdates overschrijven invoer niet.
- Nieuws-API leverde 46 echte feeditems. WebSocket gebruikt het publieke gedocumenteerde market-kanaal; REST-fallback beschikbaar. Niet ieder upstream event heeft historiek of een liquide boek.
- De drie originele WAV-motieven zijn gegenereerd en aangesloten; geluid vereist een gebruikersactie en ingeschakelde soundsetting. Geen subjectieve luistertest geclaimd.

Niet end-to-end getest: echte X-publicatie met geautoriseerd account, gedeelde accounts, echte financiële afwikkeling en Instagram-publicatie. Die laatste drie zijn geen werkende productieonderdelen van deze lokale versie. Accounts, marktvoorstellen, fictieve socialfiguren en makerprogramma zijn browserfixtures.

## Live en incentives · aanvullende controle 4 november

- 21 Node-tests slagen: de oorspronkelijke 16 plus streamdeltas, quote-envelopeondersteuning, het bewaren van nieuwe ticks bij laat binnenkomende historiek, fijne live-autoscale en correcte selectie van een USD-assetfeed.
- Bij een echte kortlopende Bitcoin Up/Down-markt veranderde de voorspelde kans tijdens de browsertest van 44,5% naar 46,5% en daarna weer naar 45,5%. De afzonderlijke BTC/USD-koers veranderde eveneens meerdere keren; ticketprijzen en quote-update-indicator werkten mee bij. Geen gesimuleerde prijsbeweging toegevoegd.
- Kaarten hebben steeds aparte datum- en volumeslots. In de mobiele homepage hadden alle 18 zichtbare kaarten beide velden. Ontbrekende volumes blijven onbekend.
- Gouden headerknop, kaart-CTA, marktbeloningsbanner, Earn-ticket en wheelaccent gecontroleerd op desktop en 390px mobiel. Geen documentoverflow; mobiel 390px scrollWidth.
- Historiek en openbare trades blokkeren niet meer de start van de WebSocket/bookfeed. REST mag een nieuwere streamquote niet overschrijven.
- Directe marktlinks die niet in de snapshot staan worden afzonderlijk opgehaald. Afgelopen of niet-beschikbare markten krijgen een herstelpad in plaats van een eindeloze laadstatus.
