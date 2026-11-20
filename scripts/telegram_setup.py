#!/usr/bin/env python3
"""One-time local Telegram enrollment. Never prints bot tokens or chat IDs."""
import getpass
import json
import os
from pathlib import Path
import re
import secrets
import stat
import sys
import tempfile
import time
import urllib.error
import urllib.request
import webbrowser

BOT = 'STRATOnews_bot'
PENDING = Path('/private/tmp/strato-newsdesk-telegram-setup')

class SetupError(Exception):
    pass


def telegram(token, method, payload=None):
    request = urllib.request.Request(
        'https://api.telegram.org/bot' + token + '/' + method,
        data=json.dumps(payload or {}).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.load(response)
    except urllib.error.HTTPError as exc:
        if exc.code == 401:
            raise SetupError('Telegram herkent deze token niet. Controleer de token bij BotFather.') from None
        if exc.code == 409:
            raise SetupError('Een andere koppeling gebruikt deze bot al. Stop hier en meld dit in Codex.') from None
        raise SetupError('Telegram is niet bereikbaar (HTTP %s). Probeer later opnieuw.' % exc.code) from None
    except (urllib.error.URLError, TimeoutError, ValueError):
        raise SetupError('Geen geldige reactie van Telegram. Controleer je internetverbinding.') from None
    if not result.get('ok'):
        raise SetupError('Telegram kon deze stap niet uitvoeren. De token wordt niet getoond.')
    return result.get('result')


def save_pending(token, bot_id, chat_id):
    old_mask = os.umask(0o077)
    try:
        try:
            PENDING.mkdir(mode=0o700)
        except FileExistsError:
            pass
        info = PENDING.lstat()
        if not stat.S_ISDIR(info.st_mode) or info.st_uid != os.getuid():
            raise SetupError('De tijdelijke opslag is niet veilig. Meld dit in Codex.')
        PENDING.chmod(0o700)
        fd, temporary = tempfile.mkstemp(prefix='.pending-', dir=str(PENDING))
        try:
            with os.fdopen(fd, 'w') as handle:
                json.dump({'bot_username': BOT, 'bot_id': bot_id,
                           'bot_token': token, 'chat_id': str(chat_id),
                           'created_at': int(time.time())}, handle)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary, PENDING / 'pending.json')
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)
    finally:
        os.umask(old_mask)


def main():
    if not sys.stdin.isatty():
        raise SetupError('Open het Telegram-Koppelen.command-bestand in Terminal.')
    print('\nSTRATO Newsdesk — Telegram koppelen\n')
    print('Bot: @' + BOT)
    print('Plak hieronder de API-token van BotFather.')
    print('De invoer is onzichtbaar. Je ziet ook geen sterretjes.')
    print('De token gaat uitsluitend naar Telegram ter controle en wordt daarna')
    print('tijdelijk lokaal bewaard in een afgeschermd bestand buiten je project.')
    print('Codex gebruikt dit vervolgens om de geheime cloudinstellingen te configureren.\n')
    token = getpass.getpass('API-token: ').strip()
    if not re.fullmatch(r'\d+:[A-Za-z0-9_-]{20,}', token):
        raise SetupError('Dit lijkt geen volledige bot-token. Probeer opnieuw.')
    bot = telegram(token, 'getMe')
    if not bot or bot.get('username', '').casefold() != BOT.casefold():
        raise SetupError('Deze token hoort niet bij @' + BOT + '. Er is niets opgeslagen.')
    webhook = telegram(token, 'getWebhookInfo')
    if webhook.get('url'):
        raise SetupError('Deze bot heeft al een actieve webhook. Ik vervang die niet. Meld dit in Codex.')
    code = 'newsdesk_' + secrets.token_urlsafe(18)
    expected = '/start ' + code
    print('\nDe bot-token is gecontroleerd. Nu koppelen we jouw privéchat.')
    print('Telegram wordt geopend. Druk daar op Start.')
    print('Als dat niet werkt, stuur dit bericht naar @' + BOT + ':\n')
    print(expected + '\n')
    webbrowser.open('https://t.me/' + BOT + '?start=' + code)
    print('Wachten op jouw eenmalige code (maximaal 5 minuten)…\n')
    deadline = time.monotonic() + 300
    offset = None
    while time.monotonic() < deadline:
        payload = {'timeout': 20, 'allowed_updates': ['message']}
        if offset is not None:
            payload['offset'] = offset
        updates = telegram(token, 'getUpdates', payload)
        for update in updates:
            offset = max(offset or 0, update.get('update_id', 0) + 1)
            message = update.get('message', {})
            chat = message.get('chat', {})
            if (message.get('text', '').strip() == expected
                    and chat.get('type') == 'private'
                    and message.get('from', {}).get('id') == chat.get('id')):
                save_pending(token, bot['id'], chat['id'])
                print('Gereed: jouw bot en privéchat zijn gecontroleerd.')
                print('De token staat tijdelijk lokaal, niet in de chat of broncode.')
                print('Er zijn nog geen testberichten of nieuwsmeldingen verstuurd.')
                print('\nStuur nu in Codex: Telegram klaar.\n')
                print('De cloudkoppeling en achtergrondverwerking worden daarna afgerond.')
                return
    raise SetupError('Geen eenmalige code ontvangen. Er is geen token opgeslagen. Start het bestand opnieuw.')


if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print('\nGestopt. De token wordt niet getoond.')
    except SetupError as exc:
        print('\n' + str(exc))
    except Exception:
        # Do not emit tracebacks: a request URL contains the bot token.
        print('\nDe koppeling is niet afgerond. Meld dit in Codex; deel je token niet.')
    finally:
        try:
            input('\nDruk Enter om dit venster te sluiten.')
        except (EOFError, KeyboardInterrupt):
            pass
