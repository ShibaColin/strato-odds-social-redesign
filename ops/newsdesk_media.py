#!/usr/bin/env python3
"""Fact-based STRATO Newsdesk images. Python 3.9+, Pillow; no paid APIs.

make_media(story, cache_dir=None, now=None) -> dict | None
Returned dict has `png` bytes plus alt/credit/sources/kind/capturedAt/width/height.
No chart is created when the actual source data fail validation. Logos are genuine
cached Commons rasters, never reconstructed or recoloured. Photo provenance is retained in metadata, outside the image. Media provenance belongs to
metadata/the image, not to the copyable news post.
"""
import base64
from decimal import Decimal, InvalidOperation
import hashlib
import html
import io
import json
import math
import os
from pathlib import Path
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from PIL import Image, ImageDraw, ImageFont, ImageOps

RESAMPLE = getattr(Image, 'Resampling', Image).LANCZOS
MEDIANCUT = getattr(Image, 'Quantize', Image).MEDIANCUT
W, H = 1600, 900
NAVY = (0, 19, 79)
DARK = (6, 17, 42)
WHITE = (245, 248, 255)
MUTED = (153, 170, 202)
GRID = (32, 49, 80)
GREEN = (55, 210, 148)
RED = (255, 103, 115)
ALLOWED_HOSTS = frozenset({'commons.wikimedia.org', 'upload.wikimedia.org',
                           'thumb.wikimedia.org', 'api.exchange.coinbase.com', 'stratoodds.com'})
USER_AGENT = 'STRATO-Newsdesk/2.0 (public editorial media; source attribution retained)'
MAX_DOWNLOAD = 8 * 1024 * 1024
MAX_PNG = 650000
CACHE_TTL = 30 * 86400

# Curated licenses verified from Commons metadata/file pages on 17 November 2026.
ASSETS = {
    'BTC': {'file': 'Bitcoin.svg', 'name': 'Bitcoin', 'credit': 'Bitcoin logo: public domain', 'license': 'Public domain'},
    'ETH': {'file': 'Ethereum logo 2014.svg', 'name': 'Ethereum', 'credit': 'ETH logo: Ethereum Foundation / CC BY 3.0', 'license': 'CC BY 3.0'},
    'NVDA': {'file': 'NVIDIA logo.svg', 'name': 'NVIDIA', 'credit': 'NVIDIA logo: NVIDIA / Apache-2.0', 'license': 'Apache License 2.0'},
    'SPY': {'name': 'SPY ETF', 'credit': 'SPY ETF reference series, not the S&P 500 index level', 'type': 'reference'},
    'GOLD': {'file': 'Gold bullion bars.jpg', 'name': 'Gold', 'credit': 'Photo: Stevebidmead / CC0 (2018), cropped', 'license': 'CC0', 'type': 'photo', 'year': '2018', 'author': 'Stevebidmead', 'licenseUrl': 'https://creativecommons.org/publicdomain/zero/1.0/'},
    'SILVER': {'file': 'Chip silver bullion bar.jpg', 'name': 'Silver', 'credit': 'Photo: Kjmonkey / CC0 (2011), cropped', 'license': 'CC0', 'type': 'photo', 'year': '2011', 'author': 'Kjmonkey', 'licenseUrl': 'https://creativecommons.org/publicdomain/zero/1.0/'},
    'OIL': {'file': 'Sunniland Oil Field preserved pumpjack.jpg', 'name': 'Oil', 'credit': 'Archival photo: Declan M. Martin / public domain, cropped', 'license': 'Public domain', 'type': 'photo', 'year': None, 'author': 'Declan M. Martin', 'licenseUrl': ''},
    'TRUMP': {'file': 'Donald Trump official portrait.jpg', 'name': 'Donald Trump', 'credit': 'Photo: White House / Shealah Craighead, public domain (2017), cropped', 'license': 'Public domain', 'type': 'photo', 'year': '2017', 'author': 'Shealah Craighead / White House', 'licenseUrl': ''},
    'PUTIN': {'file': 'Vladimir Putin official portrait.jpg', 'name': 'Vladimir Putin', 'credit': 'Archival photo: Kremlin.ru / CC BY 4.0, cropped', 'license': 'CC BY 4.0', 'type': 'photo', 'year': None, 'author': 'Presidential Press and Information Office / Kremlin.ru', 'licenseUrl': 'https://creativecommons.org/licenses/by/4.0/'},
    'POWELL': {'file': 'Jerome H. Powell, Federal Reserve Chair.jpg', 'name': 'Jerome Powell', 'credit': 'Photo: Federal Reserve Board, public domain (2022), cropped', 'license': 'Public domain', 'type': 'photo', 'year': '2022', 'author': 'Federal Reserve Board', 'licenseUrl': ''},
    'FED': {'file': 'Seal of the United States Federal Reserve System.svg', 'name': 'Federal Reserve', 'credit': 'Federal Reserve seal: U.S. Government, public domain', 'license': 'Public domain', 'author': 'U.S. Government', 'licenseUrl': ''},
    'SEC': {'file': 'Seal of the United States Securities and Exchange Commission.svg', 'name': 'U.S. Securities and Exchange Commission', 'credit': 'SEC seal: U.S. Government, public domain', 'license': 'Public domain', 'author': 'U.S. Government', 'licenseUrl': ''},
    'ECB': {'file': 'Logo European Central Bank.svg', 'name': 'European Central Bank', 'credit': 'ECB logo: European Central Bank, public domain simple mark', 'license': 'Public domain', 'author': 'European Central Bank', 'licenseUrl': ''},
    'JENSEN': {'file': 'Jensen Huang (cropped).jpg', 'name': 'Jensen Huang', 'credit': 'Photo: PMO India / GODL-India (2023), cropped', 'license': 'GODL-India'},
}
LOCAL_ASSETS = {'JENSEN': {'key': 'JENSEN', 'file': 'Jen-Hsun Huang 2025.jpg', 'localpath': '/private/tmp/newsdesk-clean-assets/jensen.jpg', 'sourceURL': 'https://commons.wikimedia.org/wiki/File:Jen-Hsun_Huang_2025.jpg', 'downloadURL': 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Jen-Hsun_Huang_2025.jpg', 'credit': 'The White House', 'license': 'Public domain', 'year': '2025', 'visibleCreditRequired': False, 'localfile': 'jensen.jpg'}, 'ETH': {'key': 'ETH', 'file': 'Ethereum logo.svg', 'localpath': '/private/tmp/newsdesk-clean-assets/eth.png', 'sourceURL': 'https://commons.wikimedia.org/wiki/File:Ethereum_logo.svg', 'downloadURL': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Ethereum_logo.svg/1920px-Ethereum_logo.svg.png', 'credit': 'Ethereum', 'license': 'Public domain', 'year': None, 'visibleCreditRequired': False, 'localfile': 'eth.png'}, 'NVDA': {'key': 'NVDA_WHITE', 'localpath': '/private/tmp/newsdesk-clean-assets/nvidia-white.png', 'sourceURL': 'https://nvidianews.nvidia.com/multimedia/corporate/nvidia-logos', 'downloadURL': 'https://iprsoftwaremedia.com/219/files/202512/nvidia-logo-vert-1cwht.png?download=true', 'credit': 'NVIDIA newsroom', 'license': 'Official editorial media asset; NVIDIA trademark rights retained', 'visibleCreditRequired': False, 'preserveArtwork': True, 'localfile': 'nvidia-white.png'}, 'CASH': {'key': 'CASH', 'file': 'Pexels photo 545064', 'localpath': '/private/tmp/newsdesk-clean-assets/cash.jpg', 'sourceURL': 'https://www.pexels.com/photo/photography-of-one-us-dollar-banknotes-545064/', 'downloadURL': 'https://images.pexels.com/photos/545064/pexels-photo-545064.jpeg', 'credit': 'Burst / Pexels', 'license': 'Pexels License (free use, attribution not required)', 'licenseURL': 'https://www.pexels.com/license/', 'year': '2017', 'visibleCreditRequired': False, 'localfile': 'cash.jpg'}}
LOCAL_ASSETS['TRUMP']={'key': 'TRUMP', 'file': 'trump-current.jpg', 'localpath': '/private/tmp/newsdesk-clean-assets/trump-current.jpg', 'sourceURL': 'https://www.whitehouse.gov/administration/donald-j-trump/', 'downloadURL': 'https://www.whitehouse.gov/wp-content/uploads/2026/01/President-Donald-Trump-Official-Presidential-Portrait.png-1-1.jpg', 'credit': 'The White House', 'license': 'Public domain, official U.S. government photograph', 'year': '2025', 'visibleCreditRequired': False, 'localfile': 'trump-current.jpg'}
ASSETS.update({key:{"name": {"JENSEN":"Jensen Huang","ETH":"Ethereum","NVDA":"NVIDIA","CASH":"US dollars","TRUMP":"Donald Trump"}[key],"file":spec["localfile"],"credit":spec["credit"],"license":spec["license"],"type":"photo" if key in ("JENSEN","CASH","TRUMP") else "logo"} for key,spec in LOCAL_ASSETS.items()})

VARIATION_ASSETS = {'JENSEN_ALT': {'key': 'JENSEN_ALT', 'file': 'jensen-alternate.jpg', 'localpath': '/private/tmp/newsdesk-variation-assets/jensen-alternate.jpg', 'sourceURL': 'https://commons.wikimedia.org/wiki/File:JensenHuangSC18.jpg', 'downloadURL': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/JensenHuangSC18.jpg/1920px-JensenHuangSC18.jpg', 'credit': 'Raysonho / Open Grid Scheduler', 'license': 'CC0', 'year': '2018', 'visibleCreditRequired': False, 'topicTags': ['jensen huang', 'nvidia leadership'], 'dimensions': [1920, 1272], 'selectionNote': '2018 event portrait. Generic Jensen identity only, not a photograph of a current event.', 'localfile': 'jensen-alternate.jpg'}, 'TRUMP_ALT': {'key': 'TRUMP_ALT', 'file': 'trump-alternate.jpg', 'localpath': '/private/tmp/newsdesk-variation-assets/trump-alternate.jpg', 'sourceURL': 'https://trumpwhitehouse.archives.gov/people/donald-j-trump/', 'downloadURL': 'https://trumpwhitehouse.archives.gov/wp-content/uploads/2017/11/President-Trump-Official-Portrait.jpg', 'credit': 'The White House', 'license': 'Public domain, official U.S. government photograph', 'year': '2017', 'visibleCreditRequired': False, 'topicTags': ['donald trump'], 'dimensions': [2250, 2850], 'selectionNote': '2017 official portrait. Generic Trump identity only, not a photograph of a current event.', 'localfile': 'trump-alternate.jpg'}, 'CASH_ALT': {'key': 'CASH_ALT', 'file': 'cash-stacks.jpg', 'localpath': '/private/tmp/newsdesk-variation-assets/cash-stacks.jpg', 'sourceURL': 'https://www.pexels.com/photo/15206825/', 'downloadURL': 'https://images.pexels.com/photos/15206825/pexels-photo-15206825.jpeg?auto=compress&cs=tinysrgb&w=1920', 'credit': 'Mark Youso / Pexels', 'license': 'Pexels License (free use, attribution not required)', 'licenseURL': 'https://www.pexels.com/license/', 'visibleCreditRequired': False, 'topicTags': ['cash', 'dollars', 'earnings', 'revenue'], 'dimensions': [1920, 1280], 'localfile': 'cash-stacks.jpg'}, 'CHIPS': {'key': 'CHIPS', 'file': 'circuit-board.jpg', 'localpath': '/private/tmp/newsdesk-variation-assets/circuit-board.jpg', 'sourceURL': 'https://www.pexels.com/photo/1448561/', 'downloadURL': 'https://images.pexels.com/photos/1448561/pexels-photo-1448561.jpeg?auto=compress&cs=tinysrgb&w=1920', 'credit': 'ClickerHappy / Pexels', 'license': 'Pexels License (free use, attribution not required)', 'licenseURL': 'https://www.pexels.com/license/', 'visibleCreditRequired': False, 'topicTags': ['semiconductors', 'electronics manufacturing', 'computer hardware'], 'dimensions': [1920, 1270], 'selectionNote': 'Generic electronic circuit photograph. Use for broad semiconductor/electronics stories; do not imply this is a specific NVIDIA GPU or production facility.', 'localfile': 'circuit-board.jpg'}}
for key,spec in VARIATION_ASSETS.items():
    LOCAL_ASSETS[key]=spec
    ASSETS[key]={'name':{'JENSEN_ALT':'Jensen Huang','TRUMP_ALT':'Donald Trump','CASH_ALT':'US dollars','CHIPS':'Electronic circuitry'}[key],'file':spec['localfile'],'credit':spec['credit'],'license':spec['license'],'type':'photo'}


# Bundle genuine identity assets so delivery does not depend on remote thumbnail servers.
for spec in json.loads((Path(__file__).with_name('media-assets')/'coverage-registry.json').read_text()):
    key=spec['key'];LOCAL_ASSETS[key]=spec
    ASSETS[key]={'name':spec['name'],'file':spec['localfile'],'credit':spec['credit'],'license':spec['license'],'type':spec['type']}


def _variant(key,story,cache):
    choices={'JENSEN':['JENSEN','JENSEN_ALT'],'TRUMP':['TRUMP','TRUMP_ALT'],'CASH':['CASH','CASH_ALT']}.get(key)
    if not choices:return key
    cache.mkdir(parents=True,exist_ok=True)
    path=cache/'variation-history.json'
    try:history=json.loads(path.read_text())
    except (OSError,ValueError):history={'stories':{},'last':{}}
    identity=str(story.get('id') or story.get('url') or story.get('title'))
    token=hashlib.sha256((identity+key).encode()).hexdigest()
    previous=history['stories'].get(token)
    if previous in choices:return previous
    available=[c for c in choices if c!=history['last'].get(key)] or choices
    chosen=available[int(token[:8],16)%len(available)]
    history['stories'][token]=chosen;history['last'][key]=chosen
    history['stories']=dict(list(history['stories'].items())[-1000:])
    temp=path.with_suffix('.tmp');temp.write_text(json.dumps(history));temp.replace(path)
    return chosen

ORACLE_ASSETS = {'NVDA': 'NVDA', 'GOLD': 'GOLDST', 'SILVER': 'SILVST', 'OIL': 'OIL', 'SPY': 'SPY'}
ENTITIES = [
    ('SPY', re.compile(r'\bSPY\b|S&P\s*500|Standard & Poor', re.I)),
    ('TRUMP', re.compile(r'\bdonald trump\b|\btrump\b', re.I)),
    ('PUTIN', re.compile(r'\bvladimir putin\b|\bputin\b', re.I)),
    ('POWELL', re.compile(r'\bjerome powell\b|\bpowell\b', re.I)),
    ('GOLD', re.compile(r'\bgold\b|\bXAU\b', re.I)),
    ('SILVER', re.compile(r'\bsilver\b|\bXAG\b', re.I)),
    ('OIL', re.compile(r'\b(?:crude\s+)?oil\b|\bbrent\b|\bWTI\b|\bOPEC\b', re.I)),
    ('FED', re.compile(r'\bfederal reserve\b|\bFed\b|\bFOMC\b', re.I)),
    ('SEC', re.compile(r'\bSecurities and Exchange Commission\b|\bSEC\b')),
    ('ECB', re.compile(r'\bEuropean Central Bank\b|\bECB\b', re.I)),
    ('ETH', re.compile(r'\bethereum\b|\bether\b|\$?ETH\b', re.I)),
    ('BTC', re.compile(r'\bbitcoin\b|\$?BTC\b', re.I)),
    ('NVDA', re.compile(r'\bnvidia\b|\bNVDA\b|\bjensen huang\b|\bjen-hsun huang\b', re.I)),
]
# Explicit entities outrank broad category fallbacks; only title entities choose a pair.
ENTITIES += [(key,re.compile(pattern,re.I)) for key,pattern in [
    ('SOL',r'\bsolana\b|\$SOL\b'),('XRP',r'\bripple\b|\bXRP\b'),('DOGE',r'\bdogecoin\b|\bDOGE\b'),
    ('USDT',r'\btether\b|\bUSDT\b'),('USDC',r'\bUSDC\b|\bUSD Coin\b|\bCircle(?: Internet)?\b'),
    ('BNB',r'\bBNB\b'),('ADA',r'\bcardano\b|\$ADA\b'),('LINK',r'\bchainlink\b|\$LINK\b'),('AVAX',r'\bavalanche\b|\bAVAX\b'),
    ('APPLE',r'\bApple\b|\bAAPL\b|\biPhone\b'),('TESLA',r'\bTesla\b|\bTSLA\b'),('GOOGLE',r'\bGoogle\b|\bAlphabet\b|\bGOOGL?\b'),
    ('OPENAI',r'\bOpenAI\b|\bChatGPT\b'),('MICROSOFT',r'\bMicrosoft\b|\bMSFT\b'),('JPMORGAN',r'\bJPMorgan\b|\bJP Morgan\b|\bChase\b'),('META',r'\bMeta\b|\bFacebook\b|\bInstagram\b'),('AMAZON',r'\bAmazon\b|\bAMZN\b'),
    ('COINBASE',r'\bCoinbase\b'),('BINANCE',r'\bBinance\b'),('SAMSUNG',r'\bSamsung\b'),('INTEL',r'\bIntel\b'),('AMD',r'\bAMD\b'),
    ('VISA',r'\bVisa\b'),('MASTERCARD',r'\bMastercard\b'),('GOLDMANSACHS',r'\bGoldman Sachs\b'),('BANKOFAMERICA',r'\bBank of America\b'),
    ('US',r'\bUnited States\b|(?-i:\bUS\b|\bU\.S\.?)(?=\W|$)|\bAmerican\b|\bCongress\b|\bSenate\b|\bWhite House\b|\bTreasury\b'),
    ('CN',r'\bChina\b|\bChinese\b|\bBeijing\b|\bXi Jinping\b'),('RU',r'\bRussia\b|\bRussian\b|\bMoscow\b|\bKremlin\b'),
    ('UA',r'\bUkraine\b|\bUkrainian\b|\bKyiv\b|\bZelenskyy?\b'),('EU',r'\bEuropean Union\b|\bEU\b|\bBrussels\b'),
    ('GB',r'\bUnited Kingdom\b|\bUK\b|\bBritain\b|\bBritish\b|\bBank of England\b'),('JP',r'\bJapan\b|\bJapanese\b|\bBank of Japan\b'),
    ('IN',r'\bIndia\b|\bIndian\b|\bNarendra Modi\b'),('IL',r'\bIsrael\b|\bIsraeli\b|\bNetanyahu\b'),('IR',r'\bIran\b|\bIranian\b|\bTehran\b'),
    ('SA',r'\bSaudi Arabia\b|\bSaudi\b'),('KR',r'\bSouth Korea\b|\bSouth Korean\b')
] if key in ASSETS]
COINBASE_CANDLE_ASSETS=frozenset(('BTC','ETH','SOL','XRP','DOGE','ADA','LINK','AVAX'))


def _chart_subject(story):
    """Choose a named instrument with price action in the headline, never a revenue % in a summary."""
    text=' '.join(str(story.get(k) or '') for k in ('title','dataPost'))
    candidates=sorted((m.start(),key,m) for key,pattern in ENTITIES if key in COINBASE_CANDLE_ASSETS or key in ORACLE_ASSETS if (m:=pattern.search(text)))
    for _,key,match in candidates:
        nearby=text[max(0,match.start()-75):match.end()+130]
        price=re.search(r'\b(?:price|prices|shares?|stock|stocks|trades?|trading|worth|market update|all.time high|record high|record low)\b|\$[\d,]',nearby,re.I)
        move=re.search(r'\b(?:surg\w*|plung\w*|rises?|rising|falls?|falling|drops?|dropped|rall\w*|sell.?off|slumps?|sinks?|soars?|crash\w*|gains?|loses?|jumps?|climbs?|hits?|breaks?|tumbles?)\b',nearby,re.I)
        fundamental=re.search(r'\b(?:revenue|earnings|sales|profits?|inflows?|outflows?|holdings|adoption|users|transactions|hashrate)\b',nearby,re.I)
        direct_move=re.match(r'\W*(?:(?:shares?|stock|price)\s+)?(?:surg\w*|plung\w*|rises?|rising|falls?|falling|drops?|rall\w*|slumps?|sinks?|soars?|jumps?|climbs?|hits?|breaks?|tumbles?)\b',text[match.end():],re.I)
        quoted_price=re.search(r'\b(?:trades?|trading)\b|\bat\s+\$[\d,]|\bprices?\s+(?:is|at|now)\b',nearby,re.I) or re.match(r'\W*\$[\d,]',text[match.end():])
        if story.get('dataPost') or (move and (price or direct_move) and (not fundamental or price or direct_move)) or (quoted_price and price and not fundamental):
            return key,text
    return None,text


PRICE_ACTION = re.compile(r'\b(price|trading at|surges?|plunges?|rises?|rising|falls?|falling|drops?|dropped|rall(?:y|ies)|sell-?off|slumps?|sinks?|soars?|crash(?:es)?|gains?|loses?|market update)\b|[+-]?\d+(?:\.\d+)?\s*%', re.I)


class MediaUnavailable(Exception):
    pass


def _safe_url(url):
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != 'https' or parsed.hostname not in ALLOWED_HOSTS or parsed.username or parsed.password:
        raise MediaUnavailable('Image/data host is not allowlisted')
    return url


class _NoOffsiteRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        _safe_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def _fetch(url, limit=MAX_DOWNLOAD):
    _safe_url(url)
    request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'application/json,image/png,image/jpeg,*/*;q=0.5'})
    opener = urllib.request.build_opener(_NoOffsiteRedirect())
    with opener.open(request, timeout=9) as response:
        _safe_url(response.geturl())
        length = response.headers.get('Content-Length')
        if length and int(length) > limit:
            raise MediaUnavailable('Remote object too large')
        data = response.read(limit + 1)
        if len(data) > limit:
            raise MediaUnavailable('Remote object too large')
        return data


def _plain(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', value or ''))).strip()


def _font(size, bold=False):
    choices = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
        '/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf',
    ]
    for filename in choices:
        try:
            return ImageFont.truetype(filename, size)
        except OSError:
            pass
    return ImageFont.load_default()


def _fit_text(draw, text, max_width, size=24, min_size=12, bold=False):
    for n in range(size, min_size - 1, -1):
        font = _font(n, bold)
        if draw.textbbox((0, 0), text, font=font)[2] <= max_width:
            return font
    return _font(min_size, bold)


def _center_contain(canvas, image, box, padding=30):
    x0, y0, x1, y1 = box
    # Logos are contained, preserving aspect ratio. No logo is cropped/stretched.
    image = image.convert('RGBA')
    image.thumbnail((x1 - x0 - 2 * padding, y1 - y0 - 2 * padding), RESAMPLE)
    canvas.alpha_composite(image, (round((x0 + x1 - image.width) / 2), round((y0 + y1 - image.height) / 2)))


def _asset(key, cache):
    if key=='PUTIN':raise MediaUnavailable('No credit-free portrait available')
    if key in LOCAL_ASSETS:
        spec=LOCAL_ASSETS[key];filename=Path(__file__).with_name('media-assets')/spec['localfile']
        if not filename.exists():raise MediaUnavailable('Local media asset unavailable')
        with Image.open(filename) as opened:opened.load();image=opened.convert('RGBA')
        return image,{'file':spec['localfile'],'url':spec['sourceURL'],'downloadUrl':spec['downloadURL'],'credit':spec['credit'],'license':spec['license'],'year':spec.get('year')}
    spec = ASSETS[key]
    slug = hashlib.sha256((spec['file']+'-clean-v4-1920').encode()).hexdigest()[:20]
    png = cache / (slug + '.png')
    meta = cache / (slug + '.json')
    try:
        if png.exists() and meta.exists() and time.time() - meta.stat().st_mtime < CACHE_TTL:
            info = json.loads(meta.read_text())
            image = Image.open(png)
            image.load()
            return image.convert('RGBA'), info
    except (OSError, ValueError):
        pass
    # Metadata baseline verified 17 November 2026 from Commons file pages/API.
    # The registry is intentionally curated, not a free-form image search.
    filename = spec['file'].replace(' ', '_')
    digest = hashlib.md5(filename.encode()).hexdigest()
    encoded = urllib.parse.quote(filename, safe='')
    thumbnail = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/{}/{}/{}/1920px-{}{}'.format(digest[0], digest[:2], encoded, encoded, '.png' if filename.lower().endswith('.svg') else '')
    core = {
        'BTC': ('Grayliptrot', ''),
        'ETH': ('Ethereum Foundation', 'https://creativecommons.org/licenses/by/3.0/'),
        'NVDA': ('NVIDIA', 'https://www.apache.org/licenses/LICENSE-2.0'),
        'JENSEN': ("Prime Minister's Office, Government of India", 'https://data.gov.in/sites/default/files/Gazette_Notification_OGDL.pdf'),
    }
    author, license_url = core.get(key, (spec.get('author', ''), spec.get('licenseUrl', '')))
    license_name = spec['license']
    details = {'thumburl': thumbnail, 'descriptionurl': 'https://commons.wikimedia.org/wiki/File:' + encoded}
    ext = {'Artist': {'value': author}, 'LicenseUrl': {'value': license_url}}
    image_url = details.get('thumburl') or details.get('url')
    if not image_url:
        raise MediaUnavailable('Asset raster missing')
    try:
        raw = _fetch(image_url)
    except (urllib.error.URLError, OSError) as error:
        if isinstance(error, urllib.error.HTTPError) and error.code == 429:
            raise
        if filename.lower().endswith('.svg'):
            raise
        original = 'https://upload.wikimedia.org/wikipedia/commons/{}/{}/{}'.format(digest[0], digest[:2], encoded)
        raw = _fetch(original)
        image_url = original
    with Image.open(io.BytesIO(raw)) as opened:
        if opened.width * opened.height > 16_000_000:
            raise MediaUnavailable('Raster dimensions too large')
        opened.load()
        image = opened.convert('RGBA')
    info = {'file': spec['file'], 'url': details['descriptionurl'], 'downloadUrl': image_url,
            'author': _plain(ext.get('Artist', {}).get('value')), 'license': license_name,
            'licenseUrl': ext.get('LicenseUrl', {}).get('value', ''), 'credit': spec['credit']}
    cache.mkdir(parents=True, exist_ok=True)
    temp = png.with_suffix('.tmp')
    image.save(temp, format='PNG', optimize=True)
    temp.replace(png)
    meta.write_text(json.dumps(info))
    return image, info


def _candles(symbol, hours, now):
    # Use actual historical candles, not a decorative or interpolated chart.
    start = datetime.fromtimestamp(now - hours * 3600, timezone.utc).isoformat()
    end = datetime.fromtimestamp(now, timezone.utc).isoformat()
    granularity = 300 if hours > 1 else 60
    query = urllib.parse.urlencode({'granularity': granularity, 'start': start, 'end': end})
    url = 'https://api.exchange.coinbase.com/products/' + symbol + '-USD/candles?' + query
    raw = json.loads(_fetch(url, 250000))
    if not isinstance(raw, list):
        raise MediaUnavailable('Candle data unavailable')
    rows = []
    seen = set()
    for row in raw:
        if not isinstance(row, list) or len(row) < 6:
            continue
        t, low, high, opening, close, volume = row[:6]
        values = [t, low, high, opening, close, volume]
        if not all(isinstance(n, (int, float)) and math.isfinite(n) for n in values):
            continue
        if t in seen or t < now - hours * 3600 - granularity or t > now + 30:
            continue
        if min(low, high, opening, close) <= 0 or volume < 0 or low > min(opening, close) or high < max(opening, close) or low > high:
            continue
        seen.add(t)
        rows.append([t, low, high, opening, close, volume])
    rows.sort()
    if len(rows) < 12 or now - rows[-1][0] > granularity + 120:
        raise MediaUnavailable('Not enough fresh candle data')
    # A long market-data gap is not drawn as if trading continuously occurred.
    if any(b[0] - a[0] > granularity * 6 for a, b in zip(rows, rows[1:])):
        raise MediaUnavailable('Candle series contains a gap')
    return rows, url, granularity


def _chart(canvas, rows, symbol, hours, now):
    draw = ImageDraw.Draw(canvas)
    box = (48, 155, 650, 545)
    x0, y0, x1, y1 = box
    low = min(r[1] for r in rows)
    high = max(r[2] for r in rows)
    pad = max((high - low) * .12, high * .0002)
    low, high = low - pad, high + pad
    span = high - low
    def yy(value):
        return y1 - (value - low) / span * (y1 - y0)
    def xx(t):
        return x0 + (t - rows[0][0]) / max(1, rows[-1][0] - rows[0][0]) * (x1 - x0)
    for i in range(5):
        y = y0 + i * (y1 - y0) / 4
        draw.line((x0, y, x1, y), fill=GRID, width=1)
        value = high - i * span / 4
        draw.text((x1 + 10, y - 6), '${:,.0f}'.format(value) if value >= 1000 else '${:,.2f}'.format(value), font=_font(13), fill=MUTED)
    candle_width = min(8, max(1, (x1 - x0) / len(rows) * .65))
    for t, lo, hi, op, close, _ in rows:
        x = xx(t)
        colour = GREEN if close >= op else RED
        draw.line((x, yy(lo), x, yy(hi)), fill=colour, width=1)
        top, bottom = sorted((yy(op), yy(close)))
        draw.rectangle((x - candle_width / 2, top, x + candle_width / 2, max(top + 1, bottom)), fill=colour)
    last = rows[-1][4]
    delta = (last / rows[0][3] - 1) * 100
    colour = GREEN if delta >= 0 else RED
    draw.text((48, 60), symbol + ' / USD', font=_font(28, True), fill=WHITE)
    draw.text((48, 104), '${:,.2f}'.format(last), font=_font(31, True), fill=WHITE)
    change = '{:+.2f}%'.format(delta)
    draw.text((275, 109), change, font=_font(24, True), fill=colour)
    draw.text((606, 68), str(hours) + 'H', font=_font(18, True), fill=MUTED)
    for x, stamp, anchor in [(x0, rows[0][0], 'left'), (x1, rows[-1][0], 'right')]:
        label = datetime.fromtimestamp(stamp, timezone.utc).strftime('%H:%M UTC')
        font = _font(14)
        width = draw.textbbox((0, 0), label, font=font)[2]
        draw.text((x - width if anchor == 'right' else x, y1 + 20), label, font=font, fill=MUTED)
    return last, delta


def _oracle_points(symbol, hours, now):
    asset = ORACLE_ASSETS[symbol]
    url = 'https://stratoodds.com/api/v1/prices/history/' + asset + '?range=1d'
    result = json.loads(_fetch(url, 300000))
    if not isinstance(result, list):
        raise MediaUnavailable('Oracle series unavailable')
    points = []
    seen = set()
    for item in result:
        if not isinstance(item, dict):
            continue
        try:
            stamp = float(item['timestamp'])
            value = float(Decimal(str(item['price'])) / Decimal('1000000000000000000'))
        except (ValueError, TypeError, KeyError, InvalidOperation, OverflowError):
            continue
        if not math.isfinite(stamp) or not math.isfinite(value) or value <= 0 or stamp in seen:
            continue
        if stamp < now - hours * 3600 - 300 or stamp > now + 30:
            continue
        seen.add(stamp)
        points.append([stamp, value])
    points.sort()
    if len(points) < 12 or now - points[-1][0] > 600 or points[-1][0] - points[0][0] < hours * 3600 * .75:
        raise MediaUnavailable('Oracle series is stale or too short')
    if any(b[0] - a[0] > 1200 for a, b in zip(points, points[1:])):
        raise MediaUnavailable('Oracle series has a gap')
    return points, url


def _line_chart(canvas, points, symbol, hours):
    draw = ImageDraw.Draw(canvas)
    x0, y0, x1, y1 = (48, 155, 650, 545)
    minimum = min(p[1] for p in points)
    maximum = max(p[1] for p in points)
    pad = max((maximum - minimum) * .12, maximum * .0002)
    minimum, maximum = minimum - pad, maximum + pad
    def xx(t):
        return x0 + (t - points[0][0]) / max(1, points[-1][0] - points[0][0]) * (x1 - x0)
    def yy(value):
        return y1 - (value - minimum) / (maximum - minimum) * (y1 - y0)
    for i in range(5):
        y = y0 + i * (y1 - y0) / 4
        draw.line((x0, y, x1, y), fill=GRID, width=1)
        value = maximum - i * (maximum - minimum) / 4
        label = '${:,.0f}'.format(value) if value >= 1000 else '${:,.2f}'.format(value)
        draw.text((x1 + 10, y - 6), label, font=_font(13), fill=MUTED)
    last = points[-1][1]
    change = (last / points[0][1] - 1) * 100
    colour = GREEN if change >= 0 else RED
    # Line segments connect actual oracle observations. No OHLC is fabricated.
    draw.line([(xx(t), yy(v)) for t, v in points], fill=colour, width=3, joint='curve')
    draw.ellipse((xx(points[-1][0])-4, yy(last)-4, xx(points[-1][0])+4, yy(last)+4), fill=colour)
    draw.text((48, 57), ORACLE_ASSETS[symbol] + ' / USD', font=_font(28, True), fill=WHITE)
    draw.text((48, 103), '${:,.2f}'.format(last), font=_font(31, True), fill=WHITE)
    draw.text((275, 109), '{:+.2f}%'.format(change), font=_font(24, True), fill=colour)
    draw.text((606, 68), str(hours) + 'H', font=_font(18, True), fill=MUTED)
    for x, stamp, align in [(x0, points[0][0], 'left'), (x1, points[-1][0], 'right')]:
        text = datetime.fromtimestamp(stamp, timezone.utc).strftime('%H:%M UTC')
        font = _font(14)
        width = draw.textbbox((0, 0), text, font=font)[2]
        draw.text((x - width if align == 'right' else x, y1 + 20), text, font=font, fill=MUTED)
    return last, change


def _clean_encode(canvas, photographic=False):
    rgb=canvas.convert('RGB')
    if photographic:
        for quality in [95,93,91,89,86]:
            output=io.BytesIO();rgb.save(output,'JPEG',quality=quality,subsampling=0,optimize=True)
            if len(output.getvalue())<=650000:return output.getvalue(),'image/jpeg'
    output=io.BytesIO();rgb.save(output,'PNG',optimize=True)
    if len(output.getvalue())<=650000:return output.getvalue(),'image/png'
    output=io.BytesIO();rgb.save(output,'JPEG',quality=93,subsampling=0,optimize=True)
    if len(output.getvalue())>650000:raise MediaUnavailable('Full quality image too large')
    return output.getvalue(),'image/jpeg'


def _clean_photo(canvas,image,box):
    x0,y0,x1,y1=box
    # Headroom and a face-centred crop, rather than tiny portraits on a label card.
    fitted=ImageOps.fit(image.convert('RGB'),(x1-x0,y1-y0),method=RESAMPLE,centering=(.5,.28))
    canvas.paste(fitted,(x0,y0))


def _clean_logo(canvas,image,box,symbol):
    x0,y0,x1,y1=box
    backgrounds={'BTC':(247,147,26),'ETH':(245,247,250),'NVDA':(0,0,0)}
    ImageDraw.Draw(canvas).rectangle(box,fill=backgrounds.get(symbol,(250,250,250)))
    image=image.convert('RGBA')
    bbox=image.getchannel('A').getbbox()
    if bbox:image=image.crop(bbox)
    _center_contain(canvas,image,(x0+30,y0+30,x1-30,y1-30),padding=60)


def _clean_chart(canvas,rows,symbol,hours,oracle):
    draw=ImageDraw.Draw(canvas);width,height=canvas.size
    x0,y0,x1,y1=56,130,width-150,height-82
    points=[(r[0],r[1]) for r in rows] if oracle else [(r[0],r[4]) for r in rows]
    low=min(p[1] for p in points) if oracle else min(r[1] for r in rows)
    high=max(p[1] for p in points) if oracle else max(r[2] for r in rows)
    pad=max((high-low)*.075,high*.0003);low-=pad;high+=pad
    xx=lambda t:x0+(t-rows[0][0])/max(1,rows[-1][0]-rows[0][0])*(x1-x0)
    yy=lambda v:y1-(v-low)/(high-low)*(y1-y0)
    muted=(143,151,160);grid=(25,29,34)
    for i in range(6):
        y=y0+i*(y1-y0)/5;value=high-i*(high-low)/5
        draw.line((x0,y,x1,y),fill=grid,width=1)
        label='{:,.0f}'.format(value) if value>=10000 else '{:,.2f}'.format(value)
        draw.text((x1+20,y-13),label,font=_font(24),fill=muted)
    last=points[-1][1];opening=points[0][1] if oracle else rows[0][3]
    delta=(last/opening-1)*100;colour=(30,190,154) if delta>=0 else (245,76,91)
    if oracle:
        draw.line([(xx(t),yy(v)) for t,v in points],fill=colour,width=4,joint='curve')
    else:
        candle_width=min(20,max(2,(x1-x0)/len(rows)*.65))
        for t,lo,hi,op,cl,_ in rows:
            x=xx(t);c=(30,190,154) if cl>=op else (245,76,91)
            draw.line((x,yy(lo),x,yy(hi)),fill=c,width=2)
            top,bottom=sorted((yy(op),yy(cl)));draw.rectangle((x-candle_width/2,top,x+candle_width/2,max(top+2,bottom)),fill=c)
    draw.line((x0,yy(last),x1,yy(last)),fill=colour,width=1)
    price='{:,.2f}'.format(last)
    draw.rounded_rectangle((x1+8,yy(last)-19,width-12,yy(last)+20),radius=3,fill=colour)
    draw.text((x1+15,yy(last)-14),price,font=_font(22,True),fill=(255,255,255))
    ticker=ORACLE_ASSETS.get(symbol,symbol)
    draw.text((54,37),ticker+' / USD',font=_font(34,True),fill=(236,239,242))
    draw.text((width-390,44),datetime.fromtimestamp(rows[-1][0],timezone.utc).strftime('%d %b').upper()+' · '+str(hours)+'H',font=_font(25),fill=muted)
    # Instrument prices/time are part of the chart itself, not an editorial footer.
    draw.text((330,41),'${:,.2f}'.format(last),font=_font(30),fill=colour)
    for x,t,align in [(x0,rows[0][0],'left'),(x1,rows[-1][0],'right')]:
        label=datetime.fromtimestamp(t,timezone.utc).strftime('%H:%M UTC');font=_font(21)
        tw=draw.textbbox((0,0),label,font=font)[2];draw.text((x-tw if align=='right' else x,y1+28),label,font=font,fill=muted)


def make_media(story,cache_dir=None,now=None):
    """Pure visual editorial images. Provenance is retained in metadata only."""
    now=float(time.time() if now is None else now)
    title=str(story.get('title') or '')
    text=' '.join(str(story.get(k) or '') for k in ['title','summary','dataPost'])
    matches=sorted((m.start(),symbol) for symbol,pattern in ENTITIES if (m:=pattern.search(title)))
    if not matches:matches=sorted((m.start(),symbol) for symbol,pattern in ENTITIES if (m:=pattern.search(text)))
    if not matches:
        # A restrained thematic image is better than a wrong person/company.
        if re.search(r'\b(crypto|cryptocurrency|digital assets?)\b',title,re.I):matches=[(0,'BTC'),(1,'ETH')]
        elif re.search(r'\b(banks?|banking|interest rates?|inflation|debt|bond yields?|treasur(?:y|ies)|dollars?|liquidations?)\b',title,re.I):matches=[(0,'CASH')]
        elif re.search(r'\b(semiconductors?|chips?|GPUs?|artificial intelligence|AI)\b',title,re.I):matches=[(0,'CHIPS')]
        else:return None
    symbols=list(dict.fromkeys('RU' if symbol=='PUTIN' else symbol for _,symbol in matches))
    symbol='ETH' if story.get('dataPost') and 'BTC' in symbols and 'ETH' in symbols else symbols[0]
    cache=Path(cache_dir or os.environ.get('NEWSDESK_MEDIA_CACHE','/var/lib/strato-newsdesk/media-assets'))
    captured=datetime.fromtimestamp(now,timezone.utc).isoformat().replace('+00:00','Z')
    attribution=[];sources=[]
    def asset(key):
        chosen=_variant(key,story,cache)
        if chosen=='FED' and chosen not in LOCAL_ASSETS:chosen='US'
        image,meta=_asset(chosen,cache);meta['name']=ASSETS[chosen]['name'];attribution.append(meta);sources.append(meta['url']);return image
    try:
        chart_symbol,chart_text=_chart_subject(story)
        chart_requested=chart_symbol is not None
        chart_end=now
        if chart_requested:
            try:stamp=datetime.fromisoformat(str(story.get('publishedAt') or '').replace('Z','+00:00')).timestamp();chart_requested=-60<=now-stamp<=86400;chart_end=now if now-stamp<=3600 else stamp
            except (ValueError,TypeError):chart_requested=False
        if chart_requested:
            symbol=chart_symbol
            explicit_day=bool(re.search(r'24\s*(?:hours?|h)\b|past day|daily|market update',text,re.I))
            sharp=bool(re.search(r'surg|plung|spik|jump|crash|tumbles?|rallies|earnings',title,re.I))
            hours=1 if re.search(r'(?:past|last)\s+(?:\d+\s+minutes?|an?\s+hour|hour)|\b1h\b|one hour|hourly|single hour',text,re.I) or (sharp and not explicit_day) else 24
            try:
                oracle=symbol in ORACLE_ASSETS
                rows,url=(_oracle_points(symbol,hours,chart_end) if oracle else _candles(symbol,hours,chart_end)[:2])
                canvas=Image.new('RGB',(1600,1000),(7,9,12));_clean_chart(canvas,rows,symbol,hours,oracle)
                raw,content_type=_clean_encode(canvas)
                return {'png':raw,'contentType':content_type,'width':1600,'height':1000,'kind':'chart','asset':symbol,'alt':f'{symbol} USD {hours}-hour price chart','credit':'STRATO oracle reference series' if oracle else 'Coinbase Exchange spot candles','sources':[url],'attribution':[],'capturedAt':datetime.fromtimestamp(rows[-1][0],timezone.utc).isoformat().replace('+00:00','Z'),'generatedAt':captured,'styleVersion':4,'historical':now-chart_end>3600,'dataProvider':'STRATO oracle' if oracle else 'Coinbase Exchange'}
            except (MediaUnavailable,urllib.error.URLError,OSError,ValueError,TypeError):pass
        if symbol=='SPY':symbol='US';symbols=['US' if k=='SPY' else k for k in symbols]
        # Pair related identities when the story actually involves both.
        pair=None
        if symbols[0]=='SEC' and 'NVDA' in symbols:pair=('SEC','NVDA')
        elif 'NVDA' in symbols and re.search(r'\bjensen\b|\bhuang\b',title,re.I):pair=('NVDA','JENSEN')
        elif 'NVDA' in symbols and re.search(r'\b(revenue|earnings|sales|profit|quarterly|q[1-4])\b',title,re.I) and 'CASH' in ASSETS:pair=('NVDA','CASH')
        elif 'NVDA' in symbols and re.search(r'\b(chips?|semiconductors?|gpus?|hardware)\b',title,re.I):pair=('NVDA','CHIPS')
        elif len(symbols)>1:pair=(symbols[0],symbols[1])
        elif ASSETS[symbol].get('type')=='logo' and re.search(r'\b(revenue|earnings|funding|investment|invests?|million|billion|trillion|flows?|ETF|treasury|reserves?)\b',title,re.I):pair=(symbol,'CASH')
        canvas=Image.new('RGBA',(1600,900),(250,250,250,255));photographic=False
        if pair:
            for index,key in enumerate(pair):
                image=asset(key);box=(index*802,0,min(1600,index*802+798),900)
                photo=ASSETS[key].get('type')=='photo' or key=='JENSEN'
                if photo:_clean_photo(canvas,image,box);photographic=True
                else:_clean_logo(canvas,image,box,key)
            kind='pair';alt=' / '.join(a['name'] for a in attribution)
        else:
            image=asset(symbol)
            if ASSETS[symbol].get('type')=='photo':
                if symbol in ('TRUMP','POWELL','PUTIN'):canvas=Image.new('RGBA',(1200,1200),(0,0,0,255))
                _clean_photo(canvas,image,(0,0,*canvas.size));photographic=True;kind='photo'
            else:_clean_logo(canvas,image,(0,0,1600,900),symbol);kind='identity'
            alt=attribution[-1]['name']
        raw,content_type=_clean_encode(canvas,photographic)
        return {'png':raw,'contentType':content_type,'width':canvas.width,'height':canvas.height,'kind':kind,'asset':symbol,'alt':alt,'credit':' | '.join(a['credit'] for a in attribution),'sources':sources,'attribution':attribution,'capturedAt':captured,'styleVersion':4}
    except (MediaUnavailable,urllib.error.URLError,OSError,ValueError,KeyError,IndexError,TypeError,Image.DecompressionBombError):return None


def build_media(story, cache_dir=None):
    """Parent-facing API: (PNG bytes, metadata dict), or None."""
    result = make_media(story, cache_dir)
    if result is None:
        return None
    raw = result.pop('png')
    result['caption'] = result['alt']
    return raw, result


generate_media = make_media

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--story', help='JSON input file, or stdin when omitted')
    parser.add_argument('--output', help='Optional PNG output filename; metadata stays on stdout')
    parser.add_argument('--cache', default='/tmp/newsdesk-media-assets')
    args = parser.parse_args()
    story = json.loads(Path(args.story).read_text() if args.story else __import__('sys').stdin.read())
    media = make_media(story, args.cache)
    if not media:
        print(json.dumps({'available': False}))
    else:
        raw = media.pop('png')
        if args.output:
            Path(args.output).write_bytes(raw)
            media['output'] = args.output
        else:
            media['data'] = base64.b64encode(raw).decode()
        media['available'] = True
        media['bytes'] = len(raw)
        print(json.dumps(media))
