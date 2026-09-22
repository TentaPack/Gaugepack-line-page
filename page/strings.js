// Every string, in one file. The page is written in English; this file
// holds the Spanish, keyed by the English, and a switch by the phone's
// language (or ?lang=es, remembered on this phone). Markup is translated
// once at load by walking the text; the script's own lines go through t().
// Missing a translation, a string shows in English. Terms and privacy stay
// English for now: they are the contract, translated when a lawyer reads it.
(() => {
  const ES = {
    // the front door, the maker, the codes
    "A private line": "Una línea privada",
    "Gaugepack · A private line": "Gaugepack · Una línea privada",
    "Two stickers. One line.": "Dos stickers. Una línea.",
    "Nobody can read it. Not even us.": "Nadie puede leerla. Ni siquiera nosotros.",
    "Mail, sealed, that arrives in a second.": "Correo, sellado, que llega en un segundo.",
    "Two stickers that open one room. No account, no phone number, no app. Sealed on your phone; we hold noise we cannot read; handed over once and burned.": "Dos stickers que abren una sola sala. Sin cuenta, sin número, sin app. Sellado en tu teléfono; nosotros guardamos ruido que no podemos leer; se entrega una vez y se quema.",
    "Not open yet. If you have a line, scan your code.": "Todavía no abrimos. Si tienes una línea, escanea tu código.",
    "Buy a year": "Compra un año", "A door for a business": "Una puerta para un negocio", "Terms": "Términos", "Privacy": "Privacidad", "The code": "El código", "Status": "Estado",
    "Checking the page you are running…": "Revisando la página que estás usando…",
    "An update to this page was refused: {f} not on the published list. This phone keeps the version it had. Tell us.": "Se rechazó una actualización de esta página: {f} no está en la lista publicada. Este teléfono conserva la versión que tenía. Avísanos.",
    "An update to this page could not be checked against the published list; this phone keeps the version it had for now.": "No se pudo comprobar una actualización de esta página contra la lista publicada; este teléfono conserva por ahora la versión que tenía.",
    "Print these two codes, or send one to the other person. Scan a code to enter the line. Messages are sealed on your phone before they leave it, handed over once, then gone. Close the page and it forgets everything; the sticker is the key.": "Imprime estos dos códigos, o envía uno a la otra persona. Escanea un código para entrar a la línea. Los mensajes se sellan en tu teléfono antes de salir, se entregan una vez y desaparecen. Cierra la página y lo olvida todo; el sticker es la llave.",
    "Yours": "Tuyo", "Theirs": "Suyo", "Decoy": "Señuelo",
    "Enter the line": "Entrar a la línea", "Copy the link": "Copiar el enlace", "Download the codes": "Descargar los códigos", "Copied": "Copiado",
    "Fingerprint:": "Huella:", "Fingerprint": "Huella",
    ". The same four words show on every screen in this line; say them aloud once to be sure you are in the same room.": ". Las mismas cuatro palabras aparecen en cada pantalla de esta línea; díganlas en voz alta una vez para saber que están en la misma sala.",
    "The link carries the key after the": "El enlace lleva la llave después del",
    ", which your browser never sends to a server. Lose both codes and the line is gone.": ", que tu navegador nunca envía a un servidor. Pierde los dos códigos y la línea desaparece.",
    "What we count: the network, never the line. Your phone tells us \"a line was made\", \"a picture was sent\", one word at a time with nothing attached, and": "Lo que contamos: la red, nunca la línea. Tu teléfono nos dice \"se hizo una línea\", \"se envió una foto\", una palabra a la vez y sin nada más, y",
    "shows the totals. Not which line, not when, not to whom.": "muestra los totales. No qué línea, ni cuándo, ni a quién.",
    "Never bookmark a line or paste its link to yourself: bookmarks, notes and history sync to Apple and Google. The page empties the address bar as it opens. The sticker, or \"remember this line\" on your phone, are the two safe ways back.": "Nunca guardes una línea en favoritos ni te envíes su enlace: los favoritos, las notas y el historial se sincronizan con Apple y Google. La página vacía la barra de direcciones al abrirse. El sticker, o \"recordar esta línea\" en tu teléfono, son las dos maneras seguras de volver.",
    "Add a decoy code": "Añadir un código señuelo",
    "A third sticker that looks the same. Scanning it burns the line and opens an empty room. For when someone makes you hand over your sticker.": "Un tercer sticker igual a los otros. Escanearlo quema la línea y abre una sala vacía. Para cuando alguien te obligue a entregar tu sticker.",
    "The decoy is the code marked Decoy; it looks like the others once cut. Hand it over and the line is gone before they see anything.": "El señuelo es el código marcado Señuelo; recortado, es igual a los otros. Entrégalo y la línea se quema antes de que vean nada.",
    "Couldn't add a decoy just now.": "No se pudo añadir el señuelo ahora.",
    "A word, optional": "Una palabra, opcional", "said aloud, never typed into a text": "dicha en voz alta, nunca escrita en un mensaje",
    "No word: anyone holding a code is in the line.": "Sin palabra: cualquiera con un código está en la línea.",
    // the word
    "This line has a word.": "Esta línea tiene una palabra.",
    "The person who made it said a word to you. Type it once; it never leaves this phone.": "Quien la hizo te dijo una palabra. Escríbela una vez; nunca sale de este teléfono.",
    "the word": "la palabra", "The word": "La palabra", "Open": "Abrir", "Opening": "Abriendo",
    "A wrong word opens an empty room, not an error; check the fingerprint words with them.": "Una palabra equivocada abre una sala vacía, no un error; comparen las palabras de la huella.",
    // the room
    "Name this line (stays on this phone)": "Nombra esta línea (se queda en este teléfono)", "Name this line": "Nombra esta línea", "Colour of this line": "Color de esta línea",
    "Your name here (sealed, for groups)": "Tu nombre aquí (sellado, para grupos)", "Your name in this line": "Tu nombre en esta línea",
    "Only you here": "Solo tú aquí", "{n} here now": "{n} aquí ahora",
    "Remember this line on this phone": "Recordar esta línea en este teléfono", "Remembered on this phone; tap to forget": "Recordada en este teléfono; toca para olvidar",
    "Tell me when there's something new": "Avísame cuando haya algo nuevo", "Notifications are on for this line; tap to turn off": "Las notificaciones están activas en esta línea; toca para apagarlas",
    "Call": "Llamar", "Video": "Video", "Voice call": "Llamada de voz", "Video call": "Videollamada", "Burn the line": "Quemar la línea",
    "Incoming call": "Llamada entrante", "Incoming video call": "Videollamada entrante", "Accept": "Aceptar", "Decline": "Rechazar",
    "Calling…": "Llamando…", "Ringing…": "Sonando…", "Connecting…": "Conectando…", "Connected {t}": "Conectados {t}", "No answer.": "No contestan.", "They declined.": "Rechazaron la llamada.", "They're on another call.": "Están en otra llamada.", "They hung up.": "Colgaron.",
    "Ringing… they're not here; their phone gets a tap and this rings for 90 seconds.": "Sonando… no están aquí; su teléfono recibe un toque y esto suena 90 segundos.",
    "Couldn't connect these two networks directly (no relay yet).": "No se pudieron conectar estas dos redes directamente (aún sin relevo).",
    "Couldn't connect these two phones, even through the relay.": "No se pudieron conectar estos dos teléfonos, ni a través del relevo.",
    "The phone didn't allow the camera or microphone.": "El teléfono no permitió la cámara ni el micrófono.",
    "Mute": "Silenciar", "Unmute": "Activar sonido", "Camera off": "Apagar cámara", "Camera on": "Encender cámara", "Share screen": "Compartir pantalla", "Stop sharing": "Dejar de compartir", "Hang up": "Colgar",
    "This device can't share its screen.": "Este dispositivo no puede compartir su pantalla.",
    "Sealed. Messages are handed over once and burned; nothing is kept here after you close this page.": "Sellado. Los mensajes se entregan una vez y se queman; nada queda aquí cuando cierras esta página.",
    "Burn after": "Quemar después de", "closing the line": "cerrar la línea", "10 seconds": "10 segundos", "1 minute": "1 minuto", "1 hour": "1 hora", "1 day": "1 día",
    "Counts from when it is seen, on both screens.": "Cuenta desde que se ve, en ambas pantallas.",
    "Messages burn {t} after they are seen, on both screens.": "Los mensajes se queman {t} después de verse, en ambas pantallas.", "Messages stay until the line is closed.": "Los mensajes se quedan hasta que se cierre la línea.",
    "10 seconds_": "10 segundos", "a minute": "un minuto", "an hour": "una hora", "a day": "un día",
    "Tap the mark to remember this line on this phone. Dark, the sticker is the key. Lit, this phone opens the line by itself, and so can anyone holding it unlocked.": "Toca la marca para recordar esta línea en este teléfono. Apagada, el sticker es la llave. Encendida, este teléfono abre la línea por sí solo, y también cualquiera que lo tenga desbloqueado.",
    "Panic burn: shake the phone hard, or hold the mark for two seconds, and the line burns with no question asked.": "Quemado de pánico: sacude fuerte el teléfono, o mantén la marca dos segundos, y la línea se quema sin preguntar.",
    "Panic burn is on for this line on this phone.": "El quemado de pánico está activo en esta línea en este teléfono.", "Panic burn is off.": "El quemado de pánico está apagado.",
    "Motion wasn't allowed, so only holding the mark will burn; allow it in Settings to shake.": "No se permitió el movimiento, así que solo mantener la marca quema; permítelo en Ajustes para sacudir.",
    "Tap the bell to be told when there's something new. Only \"something new\", never the words. On iPhone, add this page to your Home Screen first.": "Toca la campana para que te avisen cuando haya algo nuevo. Solo \"algo nuevo\", nunca las palabras. En iPhone, añade antes esta página a tu pantalla de inicio.",
    "Notifications are on for this line. Only \"something new\", never the words.": "Las notificaciones están activas en esta línea. Solo \"algo nuevo\", nunca las palabras.", "Notifications are off for this line.": "Las notificaciones están apagadas en esta línea.",
    "Notifications were refused by the phone.": "El teléfono rechazó las notificaciones.", "Add this page to your Home Screen first, then tap the bell.": "Añade antes esta página a tu pantalla de inicio y luego toca la campana.", "Couldn't turn them on here.": "No se pudieron activar aquí.",
    "View once: a picture burns the moment they close it": "Ver una vez: la foto se quema en cuanto la cierran", "Tap to view, once": "Toca para ver, una vez", "A picture, view once.": "Una foto, ver una vez.",
    "Tap anywhere to close. It burns when you do.": "Toca donde sea para cerrar. Se quema al hacerlo.",
    "Tap to record": "Toca para grabar", "Recording; tap to send": "Grabando; toca para enviar", "Tap to record a voice note, tap again to send": "Toca para grabar una nota de voz, toca otra vez para enviar",
    "Send a picture": "Enviar una foto", "Send a short video": "Enviar un video corto", "Say something": "Di algo", "Send": "Enviar", "Sending": "Enviando",
    "Reply": "Responder", "Stop replying": "Dejar de responder", "Messages": "Mensajes", "Their camera": "Su cámara", "Your camera": "Tu cámara", "Take back": "Retirar", "Replying to: {s}": "Respondiendo a: {s}", "a picture": "una foto", "a voice note": "una nota de voz",
    "Delivered live to the other side.": "Entregado en vivo al otro lado.", "Waiting for them; tapped {n} phone(s).": "Esperando; se avisó a {n} teléfono(s).", "Waiting for them; the tap failed ({e}).": "Esperando; el aviso falló ({e}).", "Waiting for them; no phone asked to be told.": "Esperando; ningún teléfono pidió aviso.",
    "Waiting for signal.": "Esperando señal.", "Too big to send; try a smaller picture.": "Demasiado grande; prueba una foto más pequeña.", "Too big to send, even shrunk.": "Demasiado grande, incluso reducido.",
    "Couldn't read that picture. Try a JPEG, or a screenshot of it.": "No se pudo leer esa foto. Prueba un JPEG, o una captura de pantalla.",
    "Sealing the voice note…": "Sellando la nota de voz…", "Sealing the video…": "Sellando el video…", "Tap the mic, talk, tap it again to send.": "Toca el micrófono, habla, tócalo otra vez para enviar.",
    "Recording {m}:{s}. Tap the pink square to send.": "Grabando {m}:{s}. Toca el cuadro rosa para enviar.",
    "This phone's browser can't record voice notes.": "El navegador de este teléfono no puede grabar notas de voz.",
    "The phone didn't allow the microphone. Allow it in the browser's site settings and try again.": "El teléfono no permitió el micrófono. Permítelo en los ajustes del sitio y vuelve a intentar.",
    "That video is too big even shrunk; try a shorter one.": "Ese video es demasiado grande incluso reducido; prueba uno más corto.",
    "[a message this line could not open]": "[un mensaje que esta línea no pudo abrir]",
    "Burn the line? Every message goes and both codes become paper. There is no undo.": "¿Quemar la línea? Todos los mensajes desaparecen y los dos códigos quedan en papel. No hay vuelta atrás.",
    "Open until {d}. ": "Abierta hasta {d}. ", "Open {d}. ": "Abierta {d}. ", "Closes in {n} days. ": "Cierra en {n} días. ", "Closes today. ": "Cierra hoy. ", "Renew": "Renovar",
    "Renewal code ": "Código de renovación ", ", good for ten minutes. ": ", válido diez minutos. ", "Buy a year with it": "Compra un año con él", ", here or on any other screen.": ", aquí o en cualquier otra pantalla.",
    " This line isn't in the register, so it can't be renewed here.": " Esta línea no está en el registro, así que no se puede renovar aquí.", " Couldn't make a renewal code just now.": " No se pudo crear un código de renovación ahora.",
    "Something new. Open your code.": "Algo nuevo. Abre tu código.",
    // closed, burned, several lines
    "This line has closed.": "Esta línea se cerró.",
    "Nothing is delivered while a line is closed; nothing was read. The person who made it can reopen it at": "Nada se entrega mientras una línea está cerrada; nada se leyó. Quien la hizo puede reabrirla en",
    "This line was burned.": "Esta línea se quemó.", "Every message is gone and these codes are paper now.": "Todos los mensajes desaparecieron y estos códigos ya son papel.", "Make a new line.": "Haz una línea nueva.",
    "Your lines on this phone.": "Tus líneas en este teléfono.", "Each one opens by itself because you asked this phone to remember it. Forget a line from inside it.": "Cada una se abre sola porque pediste a este teléfono que la recordara. Olvida una línea desde adentro.", "A line": "Una línea", "Your door": "Tu puerta",
    // the door and the knock
    "Your door.": "Tu puerta.",
    "One sticker with your door's public key in it. Anyone who scans it opens a fresh private line with you: their phone makes the line and seals its key to your door, so only this phone can answer. Print it on a card, a window, a table.": "Un sticker con la llave pública de tu puerta. Quien lo escanee abre una línea privada nueva contigo: su teléfono hace la línea y sella su llave a tu puerta, así que solo este teléfono puede contestar. Imprímelo en una tarjeta, una vitrina, una mesa.",
    "Download the code": "Descargar el código", "Tell me when someone knocks": "Avísame cuando alguien toque", "Knocks": "Toques",
    "Nobody has knocked yet. This phone checks every few seconds while this page is open, and gets a tap when it isn't.": "Nadie ha tocado todavía. Este teléfono revisa cada pocos segundos mientras esta página está abierta, y recibe un aviso cuando no lo está.",
    "Nobody waiting. This phone checks every few seconds while this page is open, and gets a tap when it isn't.": "Nadie esperando. Este teléfono revisa cada pocos segundos mientras esta página está abierta, y recibe un aviso cuando no lo está.",
    "Answering a knock opens that line here and remembers it on this phone, so you can come back to it from the front door.": "Contestar un toque abre esa línea aquí y la recuerda en este teléfono, para que vuelvas a ella desde la puerta principal.",
    "Someone knocked": "Alguien tocó", "just now": "ahora mismo", "{n} min ago": "hace {n} min", "Answer": "Contestar", "Knock, {d}": "Toque, {d}",
    "This door has closed. Reopen it from the maker.": "Esta puerta se cerró. Reábrela desde el creador.", "This phone gets a tap when someone knocks.": "Este teléfono recibe un aviso cuando alguien toca.",
    "Knock.": "Toca.", "This door opens a private line with whoever printed it. Your phone makes the line and seals its key to their door; only their phone can open it. Nobody else, not even us, can read what follows.": "Esta puerta abre una línea privada con quien la imprimió. Tu teléfono hace la línea y sella su llave a su puerta; solo su teléfono puede abrirla. Nadie más, ni siquiera nosotros, puede leer lo que sigue.",
    "Open a line": "Abrir una línea", "Making the line…": "Haciendo la línea…", "Closed": "Cerrada", "This door is closed.": "Esta puerta está cerrada.", "Too many knocks from here; try in a minute.": "Demasiados toques desde aquí; prueba en un minuto.", "Couldn't knock.": "No se pudo tocar.",
    "No account, no number. When they answer, you're both here; you can talk, send pictures, or call. The line opens for a week; once they answer it lasts as long as their door.": "Sin cuenta, sin número. Cuando contesten, están los dos aquí; pueden hablar, enviar fotos o llamar. La línea se abre por una semana; cuando contesten dura tanto como su puerta.",
    "Knocked. Their phone has been tapped; when they answer, you're both here.": "Tocaste. Su teléfono recibió un aviso; cuando contesten, están los dos aquí.",
    // the claim page
    "Paid. Now make your line.": "Pagado. Ahora haz tu línea.",
    "Your phone makes the key now, here, and it never leaves this phone except as the stickers you print. Nothing about the line is tied to the payment.": "Tu teléfono hace la llave ahora, aquí, y nunca sale de este teléfono salvo como los stickers que imprimas. Nada de la línea queda ligado al pago.",
    "Make the line": "Hacer la línea", "Making it…": "Haciéndola…",
    "This claim was already used, or is older than a week.": "Este cobro ya se usó, o tiene más de una semana.", "Couldn't open the line; try again in a moment.": "No se pudo abrir la línea; intenta en un momento.",
    "Renewed.": "Renovada.", "That line is open for another year. Open it on your phone as always; the date under the fingerprint words has moved.": "Esa línea está abierta un año más. Ábrela en tu teléfono como siempre; la fecha bajo las palabras de la huella cambió.",
    "Already claimed.": "Ya reclamado.", "Not paid yet.": "Aún sin pagar.", "Couldn't find that payment.": "No se encontró ese pago.",
    "Yours for a year, until {d}. Print {c} (or download the sheet) before you leave this page; they are the only keys.": "Tuya por un año, hasta {d}. Imprime {c} (o descarga la hoja) antes de salir de esta página; son las únicas llaves.",
    "these two codes": "estos dos códigos", "these {n} codes": "estos {n} códigos", "{i} of {n}": "{i} de {n}",
    // the buy page and the doors page
    "A line, one year. Nobody can read it. Not even us.": "Una línea, un año. Nadie puede leerla. Ni siquiera nosotros.",
    "Pay once for a year. After paying, your phone makes the line itself: the key is made on your phone, printed as stickers, and never sent to us. The payment says \"a line, one year\", and nothing about which line. We never connect a card to a room.": "Paga una vez por un año. Después de pagar, tu teléfono hace la línea: la llave se crea en tu teléfono, se imprime como stickers y nunca se nos envía. El pago dice \"una línea, un año\", y nada sobre cuál. Nunca conectamos una tarjeta con una sala.",
    "A pair": "Un par", "Two stickers, one line, a year.": "Dos stickers, una línea, un año.", "A pack of 6": "Un paquete de 6", "Six stickers, one line. A family, a crew.": "Seis stickers, una línea. Una familia, un equipo.", "A pack of 12": "Un paquete de 12", "Twelve stickers, one line. A team, a club.": "Doce stickers, una línea. Un equipo, un club.", "A pack of 30": "Un paquete de 30", "Thirty stickers, one line. A building, an event.": "Treinta stickers, una línea. Un edificio, un evento.",
    "Renew a line you already have": "Renueva una línea que ya tienes", "Renewal code": "Código de renovación", "A year, $36": "Un año, $36",
    "Open the line on your phone and tap \"Renew\" under the fingerprint words: it shows a six-letter code, good for ten minutes. Type it here and buy a year. The code points at your line only while it lives; afterwards nobody, including us, can tell which line was renewed.": "Abre la línea en tu teléfono y toca \"Renovar\" bajo las palabras de la huella: muestra un código de seis letras, válido diez minutos. Escríbelo aquí y compra un año. El código apunta a tu línea solo mientras vive; después nadie, ni nosotros, puede saber qué línea se renovó.",
    "Not yet: buying opens soon. If you have a line already, it keeps working.": "Todavía no: la venta abre pronto. Si ya tienes una línea, sigue funcionando.", "Not yet: buying opens soon.": "Todavía no: la venta abre pronto.", "Opening the checkout…": "Abriendo el pago…", "Couldn't reach the mailbox.": "No se pudo llegar al buzón.", "Six letters or numbers.": "Seis letras o números.",
    "That code isn't live. Open the line on your phone and tap Renew for a fresh one.": "Ese código no está vivo. Abre la línea en tu teléfono y toca Renovar para uno nuevo.", "Too many tries from here; wait a minute.": "Demasiados intentos desde aquí; espera un minuto.",
    "For a business: a door": "Para un negocio: una puerta", "The door, explained.": "La puerta, explicada.", "What the payment knows": "Lo que sabe el pago", "The front door": "La puerta principal", "A line for a year": "Una línea por un año",
    "A door. One sticker that opens a private line with you.": "Una puerta. Un sticker que abre una línea privada contigo.",
    "The card that rings": "La tarjeta que suena", "The window": "La vitrina", "The table": "La mesa", "How it works": "Cómo funciona", "The price": "El precio", "a month": "al mes", "a year": "al año", "Unlimited knocks. Cancel any time.": "Toques ilimitados. Cancela cuando quieras.", "Two months free.": "Dos meses gratis.",
    "After paying, open the success link on the phone that will answer the door. That phone becomes the door.": "Después de pagar, abre el enlace de éxito en el teléfono que contestará la puerta. Ese teléfono se convierte en la puerta.",
  };
  let lang = "en";
  try { const q = new URLSearchParams(location.search).get("lang"); if (q === "es" || q === "en") localStorage.setItem("line:lang", q); lang = (localStorage.getItem("line:lang") || navigator.language || "en").slice(0, 2); } catch { lang = (navigator.language || "en").slice(0, 2); }
  const es = lang === "es";
  const t = (s, vars) => { let out = (es && ES[s]) || s; if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v)); return out; };
  window.t = t; window.LANG = es ? "es" : "en";
  if (!es) return;
  document.documentElement.lang = "es";
  // Markup: every text node and the attributes people read, translated in place.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) { const raw = n.nodeValue, key = raw.trim(); if (key && ES[key]) n.nodeValue = raw.replace(key, ES[key]); }
  for (const el of document.body.querySelectorAll("[placeholder],[title],[aria-label],[alt]")) for (const a of ["placeholder", "title", "aria-label", "alt"]) { const v = el.getAttribute(a); if (v && ES[v]) el.setAttribute(a, ES[v]); }
  if (ES[document.title]) document.title = ES[document.title]; else if (document.title === "A private line") document.title = "Una línea privada";
})();
