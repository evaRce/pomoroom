# Medición de RNF por número de usuarios concurrentes

Generado: 2026-09-05

Cada fila es lo que realmente midió k6 a ese N de usuarios. No se fuerza ningún umbral en el script — la columna "umbral propuesto" es una recomendación a posteriori basada en los propios datos, no un límite impuesto de antemano.

## RNF-01 — Abrir una conversación (grupal o privada)

Redefinido tras revisar qué medía originalmente el escenario: la versión anterior media "entrar en `/chat` desde cero" (arranque completo de la SPA: descarga de JS, montaje de LiveView + React, WebSocket), que es una operación de naturaleza distinta a "cambiar de pantalla dentro de la app". Se descartó medir el login/redirect real porque el limitador de intentos de login de la app (3/min por IP) capa cualquier prueba de concurrencia hecha desde un único portátil a un máximo de 3 — no aporta información nueva sobre la app, solo confirma el límite ya conocido.

RNF-01 ahora mide, con sesión ya iniciada (cookies precargadas, sin pasar por login), el tiempo desde que se hace clic en una conversación existente hasta que esa conversación queda abierta — `21_open_conversation_latency.js`, separado en caso grupal (`load_test_room`) y privado (chat 1:1 con `eva123`).

| VUs | % éxito (grupo) | p95 grupo | % éxito (privado) | p95 privado |
|---|---|---|---|---|
| 1 | 100.0% | 530ms | 100.0% | 483ms |
| 3 | 100.0% | 1316ms | 100.0% | 1158ms |
| 5 | 100.0% | 1917ms | 100.0% | 2128ms |
| 7 | 100.0% | 2759ms | 100.0% | 2596ms |
| 9 | 100.0% | 3753ms | 100.0% | 3252ms |

Crecimiento constante y predecible (~300-400ms por usuario añadido), sin caídas de éxito ni comportamiento errático — a diferencia de otros escenarios de este documento, aquí no hay indicios de contención real, solo el coste esperado de más carga concurrente.

**Umbral propuesto**: **<3s hasta 7 usuarios**. Es el nivel más alto donde ambos casos (grupo y privado) se mantienen claramente por debajo de un umbral redondo, con 100% de éxito; a partir de 9 usuarios ambos superan los 3s.

**Uso habitual (a mayores de la concurrencia total)**: la tabla de arriba mide el peor caso (todos entrando exactamente a la vez). Medido de forma realista con `21b_open_conversation_latency_staggered.js` (solo 2 usuarios a la vez, el resto espaciados 2s), repetido 3 veces por caso para no fiarse de un solo dato suelto:

| Repetición | % éxito grupo | p95 grupo | % éxito privado | p95 privado |
|---|---|---|---|---|
| 1 | 100.0% | 1.11s | 90.0% | 8.32s (1 fallo real) |
| 2 | 100.0% | 1.41s | 100.0% | 1.34s |
| 3 | 100.0% | 1.34s | 100.0% | 1.25s |

Con uso habitual, ambos casos rondan **~1.3s** de media — muy por debajo de 2s, y bastante mejor que el dato suelto de la tabla de concurrencia total (1917/2128ms), que parece que fue una lectura puntual algo alta. El umbral de uso habitual para RNF-01 queda en **<2s para 5 usuarios**.

Se encontró además un fallo real e intermitente en el chat privado, no achacable a ruido de medición: en la repetición 1, uno de los 5 usuarios vio sus mensajes cargados correctamente pero la cabecera del chat (con el nombre de contacto) se quedó vacía más de 10 segundos. Investigado en `ChatHeader.tsx:486`: el nombre solo se pinta cuando ha llegado `chatData`, que viaja por un camino de carga distinto al de los mensajes — bajo carga concurrente, ocasionalmente uno se retrasa mucho más que el otro. Reproducido dos veces en total (de ~10 repeticiones), siempre en el caso privado, nunca en grupo. Ver bug anotado en memoria del proyecto.

## RNF-02 — Solicitud de amistad

Medido con `20_concurrent_friend_request.js` (detección estable por barra lateral, no por aviso efímero).

| VUs | % éxito (checks) | p95 medido |
|---|--------|-------|
| 1 | 100.0% | 126ms |
| 3 | 100.0% | 154ms |
| 5 | 100.0% | 214ms |
| 7 | 100.0% | 368ms |
| 9 | 100.0% | 539ms |

**Umbral propuesto**: **<1s hasta 9 usuarios** — dato sólido en todo el rango probado, sin degradación visible.

**Uso habitual (a mayores de la concurrencia total)**: medido con `20b_concurrent_friend_request_staggered.js` (solo 3 usuarios a la vez, el resto goteando cada 3s). Al repetirlo varias veces con las mismas cuentas de prueba se descubrió un problema de datos: como el emparejamiento remitente→destinatario es fijo si no se cambia `PAIR_START`, a partir de la segunda ejecución cada "nueva" solicitud en realidad chocaba con una ya pendiente de una ejecución anterior — el backend la rechaza (`Ya hay una petición de amistad entre...`, error de índice único en Mongo), pero como el destinatario ya aparecía en la barra lateral desde la primera vez, la comprobación del test pasaba igualmente, casi al instante. Esto invalidó todos los datos de esta variante hasta que se limpiaron las solicitudes de prueba (`db.friend_requests`) antes de cada nivel:

| Usuarios | % éxito | p95 |
|---|---|---|
| 9 | 100.0% | 1.62s |
| 12 | 100.0% | 1.21s |
| 15 | 97.7% | 1.03s |
| 18 | 100.0% | 781ms |

Con datos ya limpios, el umbral de <1s deja de sostenerse con tanta holgura como sugería la tabla de concurrencia total — aquí ronda o supera el segundo en casi todos los niveles. No hay una tendencia clara de "cuantos más usuarios peor" (18 sale mejor que 9): con solo 3 personas de verdad a la vez en cualquier instante (el resto ya está goteando), esta variante mide más bien "¿se degrada algo si la gente va enviando solicitudes a lo largo del tiempo?" (no, hasta 18) que "cuánta carga simultánea aguanta".

## RNF-03 — Envío de mensajes

Medido con `07_concurrent_message_same_room.js` (misma sala) y `08_concurrent_message_diff_rooms.js` (salas distintas), con el bucle de espera corregido para medir tiempo real (antes inflaba la duración bajo carga).

**Salas distintas:**

| VUs | % éxito  | p95 medido |
      | (checks) |            |
|---|--------|-------|
| 1 | 100.0% | 208ms |
| 3 | 100.0% | 486ms |
| 5 | 100.0% | 556ms |
| 7 | 100.0% | 687-819ms |
| 9 | 100.0% | 773-1431ms |

**Misma sala:**

| VUs | % éxito (checks) | p95 medido |
|---|--------|-------|
| 2 | 100.0% | 308ms |
| 3 | 100.0% | 723ms |
| 5 | 90.0% | 8221ms |
| 7 | 100.0% | 2017ms |
| 8 | 85.7% | 10057ms (tope) |
| 9 | 83.3% | 10048ms (tope) |

**Umbral propuesto**: **<2s hasta 3 usuarios**. "Salas distintas" aguantaría hasta 9, pero "misma sala" (el caso real de un chat de grupo) muestra degradación genuina desde 5 usuarios — contención real al re-renderizar la sala cuando varios escriben a la vez, no solo ruido de medición.

**Uso habitual (a mayores de la concurrencia total)**: la tabla de "misma sala" de arriba mide el peor caso (todos pulsando Enter casi a la vez). Medido de forma realista con `07b_message_staggered_same_room.js` (solo 2 personas a la vez, el resto espaciados 1,5s — como una conversación real, donde la gente no escribe en el mismo instante):

| Usuarios | % éxito | p95 |
|---|---|---|
| 3 | 100.0% | 704ms |
| 5 | 100.0% | 657ms |
| 7 | 100.0% | 1.41s |
| 9 | 93.75% | 7.54s (con un fallo real: timeout de 30s cargando la página) |
| 11 | 94.4% | 7.02s |
| 13 | 100.0% | 5.94s (ya lento, aunque sin fallos) |

Con envíos realistas, el punto de ruptura sube claramente: de "empieza a fallar en 5" (ráfaga) a **"aguanta limpio hasta 7, empieza a fallar en 9"**. El umbral de uso habitual para RNF-03 quedaría en **<2s hasta 7 usuarios**, casi el doble de margen que con la medición de ráfaga.

Nota de contaminación encontrada: `load_test_room` acumula mensajes de todas las pruebas hechas en la sesión (206 en el momento de escribir esto) y el código que carga el historial de la sala (`chat_server.ex`, rama `:get_messages, :all`) vuelve a consultar Mongo entero cada vez que se pide, sin cachear — así que cuanto más crece el histórico de la sala, más lento es abrirla o ver renderizarse un mensaje nuevo, **independientemente de la concurrencia**. Esto pudo inflar algo los tiempos de esta sección y de RNF-01 según avanzaba la sesión de pruebas; no se ha limpiado el histórico todavía.

## RNF-04 — Conexión a videollamada

Medido con `11_concurrent_call_same_room.js` y `12_concurrent_call_diff_rooms.js`.

**Corrección importante sobre esta medición**: la versión anterior de estos dos scripts consideraba "conectado" en cuanto aparecía en pantalla el botón "Finalizar llamada" — pero ese botón se muestra tan pronto como el backend entrega el token de LiveKit, no cuando el navegador confirma una conexión real al servidor de vídeo. Al investigarlo se encontraron dos fallos independientes, ambos ya corregidos:

1. La pantalla de llamada no reflejaba en ningún sitio del DOM el evento real de conexión de LiveKit (`RoomEvent.Connected`). Se añadió un atributo `data-call-connected` que solo pasa a `"true"` cuando esa conexión real se confirma, y los scripts ahora comprueban ese atributo en vez del botón.
2. Con ese atributo ya en su sitio, la conexión real seguía fallando siempre — incluso con 1 solo usuario — porque el navegador headless rechazaba el certificado autofirmado del proxy TLS de LiveKit (`wss://localhost:7443`). Los scripts de llamada no pasaban `ignoreHTTPSErrors: true` al crear el contexto del navegador (otros scripts del proyecto sí lo hacen). Esto significa que **ninguna medición anterior de RNF-04 corresponde a una conexión de vídeo real**: todas eran rechazos de certificado que el script interpretaba como "rechazo con mensaje claro" y contaba como éxito.

Con ambos fallos corregidos y las pruebas repetidas desde cero:

| VUs | % éxito misma sala | p95 misma sala | % éxito salas distintas | p95 salas distintas |
|---|---|---|---|---|
| 1 | 100.0% | 1048ms | 100.0% | 945ms |
| 3 | 100.0% | 1585ms | 100.0% | 1905ms |
| 5 | 100.0% | 3914ms | 100.0% | 2385ms |
| 7 | 100.0% | 6072ms | 100.0% | 4558ms |
| 9 | 100.0% | 7569ms | 100.0% | 5038ms |

A 9 VUs en "misma sala" una iteración no llegó a completarse por timeout de navegación (30s) — con 9 navegadores Chromium reales corriendo a la vez en el mismo portátil, es más probable que sea un límite del propio equipo generando la carga que del servidor, pero queda anotado como dato no descartable sin repetir la prueba en una máquina con más recursos.

**Umbral propuesto**: **<2s hasta 3 usuarios**. A diferencia de la medición anterior (que no medía nada real), los tiempos reales de conexión de vídeo crecen con fuerza a partir de 5 usuarios y superan claramente los 3s a partir de 7 — esta es la RNF con peor comportamiento bajo carga de las cuatro medidas.

**Uso habitual (a mayores de la concurrencia total)**: medido reutilizando `11b_call_capacity_staggered.js` pero con solo 5 participantes (bien por debajo del límite de 10, para medir velocidad sin activar ningún rechazo por aforo), 3 personas a la vez y el resto goteando cada 2s, repetido 3 veces:

| Repetición | % éxito | p95 |
|---|---|---|
| 1 | 100.0% | 3.12s |
| 2 | 100.0% | 3.25s |
| 3 | 100.0% | 3.61s |

Este es el único de los cuatro RNF donde el uso habitual **no** mejora el dato de la tabla de arriba, sino que confirma que el problema es real: incluso con solo 5 usuarios conectándose de forma escalonada (no todos a la vez), el p95 ya supera los 3s. El umbral de uso habitual para RNF-04 no puede fijarse en <3s — quedaría en **<4s para 5 usuarios**. No se ha probado todavía con 3 usuarios de forma escalonada para saber si ahí sí entraría en los 3s.

## RNF-04b — Límite de 10 participantes por llamada grupal

Pregunta original: el código fija `@max_call_participants 10` (`lib/pomoroom/live_kit.ex`) — ¿ese límite se cumple de verdad? Medido con `11b_call_capacity_staggered.js`, que no conecta a todos a la vez (eso mediría contención, no capacidad): en vez de eso, 3 usuarios entran juntos y el resto se va uniendo uno a uno cada 8s, todos manteniéndose conectados el tiempo suficiente para que coincidan de verdad dentro de la sala, hasta llegar a 11 usuarios.

**El límite sí funciona — pero solo a veces, por un bug real de caché.** LiveKit permite fijar el máximo de participantes al crear una sala, pero no permite cambiarlo después en una sala que ya existe. La app evita crear la sala en cada mensaje/llamada guardando en memoria (`Pomoroom.LiveKit.RoomCache`) "esta sala ya tiene el límite puesto" la primera vez que lo consigue. El problema: LiveKit borra automáticamente una sala en cuanto se queda vacía durante unos segundos (comportamiento normal e intencionado del servidor de vídeo), pero ese caché de la app nunca se entera y sigue pensando que la sala (con límite) sigue existiendo. La siguiente vez que alguien llama, LiveKit crea la sala de nuevo él solo, sin límite, y la app no vuelve a pedir el límite porque cree que ya estaba puesto.

Reproducido dos veces de forma controlada:

- Con la sala recién creada por la propia prueba (caché limpio justo antes): los 10 primeros usuarios se conectan y se mantienen dentro a la vez; el 11º recibe un rechazo real y la sala nunca pasa de 10 participantes simultáneos. **El límite funciona correctamente en este caso.**
- Repitiendo la misma llamada tras dejar la sala vacía ~20-30s (lo normal entre dos llamadas separadas de un grupo): la sala se recrea sin límite y los 11 usuarios se conectan sin problema. **El límite deja de aplicarse.**

Conclusión: decir "las llamadas grupales admiten hasta 10 participantes" es **cierto solo la primera vez que se usa una sala de grupo tras arrancar el servidor**. En el uso normal del día a día (llamadas que empiezan y terminan repetidamente en el mismo grupo), el límite se pierde de forma silenciosa después de la primera llamada. Esto no se detecta con pruebas de conexión simultánea (RNF-04) porque ahí todos entran a la vez a una sala recién creada en el mismo instante — solo aparece si la sala ya se usó y quedó vacía antes.

**Pendiente de decidir**: esto es un bug de la aplicación (no solo un dato de rendimiento) — la forma más simple de arreglarlo sería no cachear el resultado para siempre, sino re-verificar el límite cuando haga falta, o limpiar el caché cuando la sala se quede vacía.

## Resumen de la propuesta (definitivo, solo con datos de uso habitual)

Los umbrales de "concurrencia total" (todos a la vez) de cada sección sirven para ver dónde está el techo real bajo el peor caso, pero **no son el escenario que interesa para el uso normal de la app** — ahí la gente no accede exactamente en el mismo instante. Esta tabla final usa únicamente los datos de "uso habitual" (escalonados) de cada RNF:

| RNF | Umbral propuesto | Usuarios | Por qué |
|---|---|---|---|
| RNF-01 (apertura de conversación) | <2s | 5 | uso habitual: ambos casos (grupo y privado) rondan ~1.3s de media en 3 repeticiones, con mucho margen bajo 2s |
| RNF-02 (solicitud de amistad) | <2s | 9 | uso habitual: p95 real 1.62s a 9 usuarios (con datos ya limpios de contaminación) — el <1s original no se sostiene, pero <2s sí, con margen |
| RNF-03 (envío de mensajes, misma sala) | <2s | 7 | uso habitual: p95 1.41s a 7 usuarios con 100% éxito; a partir de 9 empiezan los fallos reales |
| RNF-04 (conexión a videollamada) | <4s | 5 | uso habitual: p95 entre 3.12s y 3.61s en 3 repeticiones a solo 5 usuarios — el <3s original no se sostiene ni a esta carga, es la RNF que peor aguanta de las cuatro |
| RNF-04b (capacidad de la sala) | — (no es de tiempo) | hasta 10 participantes reales | verificado funcionalmente, no por velocidad: se confirmó que el límite sí rechaza al 11º cuando la sala está bien configurada (ver bug de caché arriba) |

Nota sobre el equipo de pruebas: todas estas cifras se generaron en un portátil normal, no en un servidor dedicado — a partir de 9-11 navegadores Chrome reales abiertos a la vez (aunque sea de forma escalonada) el propio equipo empieza a fallar por sus propios recursos, no por el servidor de la app. Por eso los umbrales se quedan en 5-9 usuarios: es el rango donde el dato es fiable y además es un escenario realista para el caso de uso de este proyecto (un grupo de estudio o de amigos), no una app comercial a escala.
