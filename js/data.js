/* Teclanauta — datos: palabras, imágenes, lecciones, datos curiosos y logros */
window.TT = window.TT || {};

(function () {
  const D = {};

  /* ---------- Diccionario general (minúsculas) ---------- */
  D.words = `
sala salsa falda hada hadas gala gas las da ha ala alas sal haga saga faja fajas alfa llaga halla dañada
sed seda fila filas idea ideas deja dejas hija hijas sigla fiel jefe jefes lee leal legal liga ligas dije isla islas hiel ideal fea feas
rueda ruedas risa risas aire arde dura duda dudas fresa fresas regla reglas jugar lugar agua aguas sur salud jaula guerra real reja surge ladrar regalar grasa fuga
tierra tarde tigre fiesta estrella tijera tetera gatita ya raya rayas ley leyes tela sitar tuya yeti yegua rayita artista tarta este esta tres triste fruta frutas fuerte suerte jirafa tarea tareas tirar atleta
oso ola olas rojo todo foto loro gato toro sol solo rosa oro hola ojo ojos hoja hojas tortuga otro otra julio sello gorro hielo kiwi kilo koala karate karaoke agosto helado gorila salto lago tos
papa pato pie pera sopa queso que quiere parque perro pelota pirata tapa papel puerta raqueta equipo pequeño espada playa pulpo pastel pista quieto ropa sapo lupa pulga arpa apio pato pollo pared tapir
casa cara cielo cohete cosa poco foca coco chocolate cachorro fresco disco cocodrilo cuatro cuerda cactus carta cuchara chico chica cerca clase ciruela caracol colegio cristal escuela chiste chaleco cola copa
vaca mesa mar mapa mago vaso vela verde vida mucho mito cometa amigo camello dormir mamut lima meta muro moto mira vuelo viaje vampiro mariposa mochila muela lavar volar medusa momia mascota meteoro meteorito museo
barco nube luna banana bota nido noche nave ventana bandera burbuja nieve balde bufanda canguro conejo botella ballena abeja bosque globo nueve once nadar bonito bueno brillante robot sombrero tambor tren pan pino mono limonada
zorro taza luz paz voz azul examen explorar zapato zanahoria zapatilla tiza pez nariz lazo zona taxi extra texto feliz manzana calabaza arroz
planeta galaxia universo cosmos asteroide astronauta nebulosa cohete propulsor estrella cometa gravedad
juego escribir teclado pantalla dedo dedos letra letras palabra palabras lento mano manos libro cuaderno lapicera regla mochila maestra
amiga perro gato familia hermano hermana abuelo abuela primo prima vecino ciudad pueblo campo calle plaza parque playa
rojo azul verde amarillo blanco negro gris rosado violeta naranja dorado plateado
uno dos tres cuatro cinco seis siete ocho nueve diez cien mil
correr saltar nadar cantar bailar comer beber dormir jugar leer pintar dibujar volar mirar pensar soñar llorar abrir cerrar subir bajar
grande chico alto bajo largo corto nuevo viejo feliz triste fuerte suave duro blando caliente claro oscuro limpio sucio
hoy ayer tarde noche semana mes verano invierno otoño primavera lunes martes jueves viernes domingo
puerta ventana techo piso mesa silla cama espejo reloj cocina baño patio escalera
castillo princesa caballero tesoro mapa pirata barco isla selva desierto montaña lago mar
`.trim().split(/\s+/);

  /* Palabras con tildes y ñ (para niveles difíciles y lecciones de tildes) */
  D.accentWords = `
niño niña año sueño montaña araña señal mañana piñata uña baño castaño campaña español compañero otoño pequeña enseñar
música rápido teléfono lápiz árbol fácil difícil cámara pájaro murciélago águila plátano sábado miércoles jamás después además también
canción avión camión ratón limón corazón jardín delfín volcán imán sofá mamá papá café bebé menú día tía río frío maíz país energía
satélite cráter órbita cósmico atmósfera estación cápsula constelación alienígena océano búho tiburón dragón león melón botón
`.trim().split(/\s+/);

  /* Palabras temáticas para los juegos (sin tildes, por dificultad) */
  D.gameWords = {
    easy: `sol luna mar pan oso ola gato perro casa mesa flor nube agua rojo azul tren pez mano pie ojo dedo uva lobo rana sapo pato vaca mapa nave meta foto taza kilo lima toro faro copa bota rosa`.split(' '),
    mid: `planeta cohete cometa estrella galaxia escuela ventana pelota tortuga caballo jirafa camello conejo naranja chocolate tesoro castillo pirata volar saltar correr teclado pantalla palabra dibujo bosque montaña isla ballena robot sombrero mochila cuaderno guitarra tambor`.split(' '),
    hard: `astronauta asteroide meteorito telescopio universo nebulosa gravedad propulsor cocodrilo zanahoria mariposa calabaza hipopótamo rinoceronte dinosaurio computadora bicicleta helicóptero submarino laboratorio explorador aventurero`.split(' ')
  };

  /* ---------- Adivina la imagen: [categoría, emoji, palabra, alternativas] ---------- */
  D.images = [
    // Animales
    ['animales', '🦇', 'murciélago'], ['animales', '🐘', 'elefante'], ['animales', '🦒', 'jirafa'], ['animales', '🐢', 'tortuga'],
    ['animales', '🦁', 'león'], ['animales', '🐯', 'tigre'], ['animales', '🐒', 'mono'], ['animales', '🐍', 'serpiente', ['víbora']],
    ['animales', '🦉', 'búho', ['lechuza']], ['animales', '🐬', 'delfín'], ['animales', '🦈', 'tiburón'], ['animales', '🐙', 'pulpo'],
    ['animales', '🦀', 'cangrejo'], ['animales', '🐌', 'caracol'], ['animales', '🦋', 'mariposa'], ['animales', '🐝', 'abeja'],
    ['animales', '🐜', 'hormiga'], ['animales', '🕷️', 'araña'], ['animales', '🐸', 'rana', ['sapo']], ['animales', '🐊', 'cocodrilo', ['yacaré', 'caimán']],
    ['animales', '🦓', 'cebra'], ['animales', '🦘', 'canguro'], ['animales', '🐇', 'conejo'], ['animales', '🦊', 'zorro'],
    ['animales', '🐺', 'lobo'], ['animales', '🐻', 'oso'], ['animales', '🐼', 'panda'], ['animales', '🐨', 'koala'],
    ['animales', '🦔', 'erizo'], ['animales', '🐴', 'caballo'], ['animales', '🐄', 'vaca'], ['animales', '🐖', 'cerdo', ['chancho']],
    ['animales', '🐑', 'oveja'], ['animales', '🐐', 'cabra'], ['animales', '🐓', 'gallo'], ['animales', '🦆', 'pato'],
    ['animales', '🦅', 'águila'], ['animales', '🦜', 'loro'], ['animales', '🦩', 'flamenco'], ['animales', '🐳', 'ballena'],
    ['animales', '🦭', 'foca'], ['animales', '🦖', 'dinosaurio'], ['animales', '🐉', 'dragón'], ['animales', '🦄', 'unicornio'],
    ['animales', '🐫', 'camello'], ['animales', '🦏', 'rinoceronte'], ['animales', '🦛', 'hipopótamo'], ['animales', '🦥', 'perezoso'],
    ['animales', '🐭', 'ratón'], ['animales', '🐱', 'gato'], ['animales', '🐶', 'perro'], ['animales', '🐟', 'pez'],
    ['animales', '🦂', 'escorpión', ['alacrán']], ['animales', '🐛', 'oruga'], ['animales', '🦌', 'ciervo'], ['animales', '🦙', 'llama'],
    ['animales', '🦦', 'nutria'], ['animales', '🐧', 'pingüino'], ['animales', '🦗', 'grillo'], ['animales', '🦎', 'lagarto', ['lagartija']],
    // Comida
    ['comida', '🍎', 'manzana'], ['comida', '🍌', 'banana', ['plátano']], ['comida', '🍇', 'uvas', ['uva']], ['comida', '🍉', 'sandía'],
    ['comida', '🍓', 'frutilla', ['fresa']], ['comida', '🍍', 'ananá', ['piña']], ['comida', '🥕', 'zanahoria'], ['comida', '🌽', 'choclo', ['maíz', 'elote']],
    ['comida', '🍕', 'pizza'], ['comida', '🍔', 'hamburguesa'], ['comida', '🍦', 'helado'], ['comida', '🍩', 'dona', ['rosquilla']],
    ['comida', '🍪', 'galleta', ['galletita']], ['comida', '🎂', 'torta', ['pastel']], ['comida', '🧀', 'queso'], ['comida', '🥚', 'huevo'],
    ['comida', '🍞', 'pan'], ['comida', '🥛', 'leche'], ['comida', '🍯', 'miel'], ['comida', '🍫', 'chocolate'],
    ['comida', '🍋', 'limón'], ['comida', '🍒', 'cerezas', ['cereza']], ['comida', '🥑', 'palta', ['aguacate']], ['comida', '🍅', 'tomate'],
    ['comida', '🥔', 'papa', ['patata']], ['comida', '🧅', 'cebolla'], ['comida', '🍄', 'hongo', ['champiñón', 'seta']], ['comida', '🥥', 'coco'],
    ['comida', '🍐', 'pera'], ['comida', '🍑', 'durazno', ['melocotón']], ['comida', '🥦', 'brócoli'], ['comida', '🍿', 'pochoclo', ['palomitas', 'pororó']],
    ['comida', '🍗', 'pollo'], ['comida', '🥐', 'medialuna', ['cruasán']], ['comida', '🍬', 'caramelo'], ['comida', '🍭', 'chupetín', ['piruleta', 'paleta']],
    ['comida', '🥜', 'maní', ['cacahuate', 'cacahuete']], ['comida', '🍚', 'arroz'], ['comida', '🌮', 'taco'], ['comida', '🥗', 'ensalada'],
    ['comida', '🍝', 'fideos', ['espaguetis', 'pasta']], ['comida', '🌶️', 'ají', ['chile', 'pimiento']], ['comida', '🍈', 'melón'], ['comida', '🥒', 'pepino'],
    // Objetos y transporte
    ['objetos', '⚽', 'pelota', ['balón']], ['objetos', '🎸', 'guitarra'], ['objetos', '🎹', 'piano'], ['objetos', '🥁', 'tambor'],
    ['objetos', '🎺', 'trompeta'], ['objetos', '📚', 'libros', ['libro']], ['objetos', '✏️', 'lápiz'], ['objetos', '📏', 'regla'],
    ['objetos', '✂️', 'tijera', ['tijeras']], ['objetos', '🔑', 'llave'], ['objetos', '🔒', 'candado'], ['objetos', '💡', 'lamparita', ['bombilla', 'foco', 'lámpara']],
    ['objetos', '📱', 'celular', ['teléfono', 'móvil']], ['objetos', '💻', 'computadora', ['ordenador', 'notebook']], ['objetos', '⌚', 'reloj'], ['objetos', '📷', 'cámara'],
    ['objetos', '🎒', 'mochila'], ['objetos', '👓', 'anteojos', ['lentes', 'gafas']], ['objetos', '👟', 'zapatilla', ['zapatillas', 'tenis']], ['objetos', '🎩', 'sombrero', ['galera']],
    ['objetos', '👑', 'corona'], ['objetos', '💎', 'diamante'], ['objetos', '🎁', 'regalo'], ['objetos', '🎈', 'globo'],
    ['objetos', '🪁', 'barrilete', ['cometa', 'papalote']], ['objetos', '🧸', 'osito', ['peluche']], ['objetos', '🚲', 'bicicleta'], ['objetos', '🚗', 'auto', ['coche', 'carro']],
    ['objetos', '🚌', 'colectivo', ['autobús', 'micro', 'ómnibus']], ['objetos', '✈️', 'avión'], ['objetos', '🚀', 'cohete'], ['objetos', '🚂', 'tren'],
    ['objetos', '⛵', 'velero', ['barco']], ['objetos', '🚁', 'helicóptero'], ['objetos', '🛸', 'ovni', ['platillo']], ['objetos', '🔨', 'martillo'],
    ['objetos', '🧲', 'imán'], ['objetos', '🪑', 'silla'], ['objetos', '🚪', 'puerta'], ['objetos', '🕯️', 'vela'],
    ['objetos', '☂️', 'paraguas'], ['objetos', '🧭', 'brújula'], ['objetos', '🔭', 'telescopio'], ['objetos', '🔬', 'microscopio'],
    ['objetos', '🧩', 'rompecabezas'], ['objetos', '🧦', 'medias', ['calcetines', 'media']], ['objetos', '🧤', 'guantes'], ['objetos', '🧣', 'bufanda'],
    ['objetos', '🏆', 'trofeo', ['copa']], ['objetos', '🥇', 'medalla'], ['objetos', '🎨', 'paleta'], ['objetos', '🖌️', 'pincel'],
    ['objetos', '📦', 'caja'], ['objetos', '✉️', 'sobre', ['carta']], ['objetos', '🗺️', 'mapa'], ['objetos', '⏰', 'despertador'],
    ['objetos', '🔔', 'campana'], ['objetos', '🪜', 'escalera'], ['objetos', '🧹', 'escoba'], ['objetos', '🪣', 'balde', ['cubo', 'cubeta']],
    ['objetos', '🛹', 'patineta'], ['objetos', '🎤', 'micrófono'], ['objetos', '🎧', 'auriculares'], ['objetos', '🔦', 'linterna'],
    // Naturaleza y espacio
    ['naturaleza', '☀️', 'sol'], ['naturaleza', '🌙', 'luna'], ['naturaleza', '⭐', 'estrella'], ['naturaleza', '🪐', 'planeta', ['saturno']],
    ['naturaleza', '☄️', 'cometa', ['meteorito']], ['naturaleza', '🌍', 'tierra', ['mundo', 'planeta']], ['naturaleza', '🌈', 'arcoíris'], ['naturaleza', '⚡', 'rayo'],
    ['naturaleza', '❄️', 'nieve', ['copo']], ['naturaleza', '🌋', 'volcán'], ['naturaleza', '🏔️', 'montaña'], ['naturaleza', '🌊', 'ola'],
    ['naturaleza', '🌳', 'árbol'], ['naturaleza', '🌵', 'cactus'], ['naturaleza', '🌻', 'girasol'], ['naturaleza', '🌹', 'rosa'],
    ['naturaleza', '🍁', 'hoja'], ['naturaleza', '🔥', 'fuego'], ['naturaleza', '💧', 'gota'], ['naturaleza', '☁️', 'nube'],
    ['naturaleza', '🌪️', 'tornado'], ['naturaleza', '🏝️', 'isla'], ['naturaleza', '🌲', 'pino'], ['naturaleza', '🍀', 'trébol'],
    ['naturaleza', '🌷', 'tulipán'], ['naturaleza', '🐚', 'caracola', ['concha']], ['naturaleza', '🪨', 'roca', ['piedra']], ['naturaleza', '👽', 'extraterrestre', ['alienígena', 'marciano']],
    ['naturaleza', '🧑‍🚀', 'astronauta'], ['naturaleza', '🌌', 'galaxia'], ['naturaleza', '🛰️', 'satélite'], ['naturaleza', '🌠', 'estrella fugaz'],
    // Lugares y personajes
    ['lugares', '🏰', 'castillo'], ['lugares', '🏠', 'casa'], ['lugares', '🏫', 'escuela', ['colegio']], ['lugares', '🏥', 'hospital'],
    ['lugares', '⛺', 'carpa', ['tienda']], ['lugares', '🎪', 'circo'], ['lugares', '🗼', 'torre'], ['lugares', '🌉', 'puente'],
    ['lugares', '🤖', 'robot'], ['lugares', '👻', 'fantasma'], ['lugares', '💀', 'calavera'], ['lugares', '🧙', 'mago', ['brujo']],
    ['lugares', '🧛', 'vampiro'], ['lugares', '🧜‍♀️', 'sirena'], ['lugares', '🦸', 'superhéroe'], ['lugares', '🥷', 'ninja'],
    ['lugares', '🤡', 'payaso'], ['lugares', '👮', 'policía'], ['lugares', '🧟', 'zombi', ['zombie']], ['lugares', '🏟️', 'estadio'],
    ['lugares', '⛪', 'iglesia'], ['lugares', '🎡', 'calesita', ['noria']], ['lugares', '🏜️', 'desierto'], ['lugares', '🏕️', 'campamento']
  ];

  D.imageCategories = [
    { id: 'todas', name: 'Todas', icon: '🌌' },
    { id: 'animales', name: 'Animales', icon: '🦇' },
    { id: 'comida', name: 'Comida', icon: '🍕' },
    { id: 'objetos', name: 'Objetos y transporte', icon: '🚲' },
    { id: 'naturaleza', name: 'Naturaleza y espacio', icon: '🪐' },
    { id: 'lugares', name: 'Lugares y personajes', icon: '🏰' }
  ];

  /* ---------- Datos curiosos (para carrera y desafío final) ---------- */
  D.facts = [
    'Júpiter es el planeta más grande del sistema solar.',
    'La luz del Sol tarda unos ocho minutos en llegar a la Tierra.',
    'Un día en Venus dura más que un año en Venus.',
    'Marte se ve rojo porque su suelo tiene mucho óxido de hierro.',
    'Saturno es tan liviano que flotaría en una bañera gigante.',
    'La Luna se aleja de la Tierra casi cuatro centímetros por año.',
    'Los pulpos tienen tres corazones y sangre de color azul.',
    'Los murciélagos son los únicos mamíferos que pueden volar.',
    'Las abejas se comunican entre ellas con un baile.',
    'Los flamencos son rosados por las algas y camarones que comen.',
    'El monte Everest es la montaña más alta del mundo.',
    'El río Amazonas lleva más agua que cualquier otro río.',
    'Los delfines duermen con la mitad del cerebro despierta.',
    'El agua cubre más de dos tercios de la superficie de la Tierra.',
    'En el espacio no hay aire, por eso no se escucha ningún sonido.',
    'Los astronautas crecen unos centímetros mientras viven en el espacio.',
    'Neptuno tiene los vientos más rápidos del sistema solar.',
    'Mercurio es el planeta más cercano al Sol, pero Venus es el más caliente.',
    'Las estrellas que vemos de noche son soles muy lejanos.',
    'Las huellas de los astronautas siguen en la Luna porque allí no hay viento.',
    'Los colibríes son las únicas aves que pueden volar hacia atrás.',
    'Las tortugas marinas vuelven a la playa donde nacieron para poner huevos.',
    'Un rayo es más caliente que la superficie del Sol.',
    'La Vía Láctea es la galaxia donde está nuestro sistema solar.',
    'Neil Armstrong fue la primera persona en pisar la Luna, en 1969.',
    'Los camellos guardan grasa en sus jorobas, no agua.',
    'Las arañas no son insectos, porque tienen ocho patas.',
    'Los koalas pueden dormir hasta veinte horas por día.',
    'Una cucharadita de una estrella de neutrones pesaría millones de toneladas.',
    'Las jirafas tienen la lengua de color violeta oscuro.'
  ];

  /* ---------- Lecciones ---------- */
  // add: letras nuevas que se suman al conjunto permitido. type: drill | words | text
  D.lessons = [
    { id: 1, group: 'Fila base', title: 'F y J: tus anclas', add: 'fj', keys: ['f', 'j'], type: 'drill', goal: 8,
      intro: 'Las teclas <b>F</b> y <b>J</b> tienen una rayita en relieve. Tocalas sin mirar: ahí apoyás tus dedos <b>índices</b>. Desde esta posición, todos los dedos saben a dónde ir.',
      tip: 'Mirá la pantalla, no el teclado. Los pulgares descansan sobre la barra espaciadora.' },
    { id: 2, group: 'Fila base', title: 'D y K: dedos medios', add: 'dk', keys: ['d', 'k'], type: 'drill', goal: 8,
      intro: 'Al lado de los índices están los dedos <b>medios</b>: el izquierdo en <b>D</b> y el derecho en <b>K</b>.',
      tip: 'Después de cada tecla, el dedo vuelve a su lugar en la fila base.' },
    { id: 3, group: 'Fila base', title: 'S y L: dedos anulares', add: 'sl', keys: ['s', 'l'], type: 'drill', goal: 10,
      intro: 'Los dedos <b>anulares</b> descansan en <b>S</b> (izquierda) y <b>L</b> (derecha).',
      tip: 'Mantené las muñecas en el aire, sin apoyarlas sobre la mesa.' },
    { id: 4, group: 'Fila base', title: 'A y Ñ: meñiques', add: 'añ', keys: ['a', 'ñ'], type: 'drill', goal: 10,
      intro: 'Los <b>meñiques</b> van en <b>A</b> y en <b>Ñ</b>. ¡La Ñ es la tecla más nuestra del teclado!',
      tip: 'Los meñiques son los dedos más débiles: tené paciencia, se entrenan.' },
    { id: 5, group: 'Fila base', title: 'G y H: estirar los índices', add: 'gh', keys: ['g', 'h'], type: 'drill', goal: 10,
      intro: 'Para llegar a <b>G</b> el índice izquierdo se estira hacia la derecha. Para <b>H</b>, el índice derecho se estira hacia la izquierda.',
      tip: 'Estirá solo el índice; los otros dedos se quedan quietos en su lugar.' },
    { id: 6, group: 'Fila base', title: 'Palabras de la fila base', add: '', keys: [], type: 'words', goal: 12,
      intro: '¡Ya conocés toda la fila base! Ahora vas a escribir palabras reales usando solo esas teclas.',
      tip: 'Leé la palabra completa antes de escribirla: así vas más fluido.' },

    { id: 7, group: 'Fila superior', title: 'E e I', add: 'ei', keys: ['e', 'i'], type: 'drill', goal: 12,
      intro: 'Subimos a la fila de arriba. El dedo <b>medio izquierdo</b> sube a la <b>E</b> y el <b>medio derecho</b> sube a la <b>I</b>.',
      tip: 'Subí el dedo, tocá la tecla y volvé enseguida a D o K.' },
    { id: 8, group: 'Fila superior', title: 'R y U', add: 'ru', keys: ['r', 'u'], type: 'drill', goal: 12,
      intro: 'Los <b>índices</b> suben: el izquierdo a la <b>R</b> y el derecho a la <b>U</b>.',
      tip: 'Los índices son los que más trabajan: se encargan de dos columnas cada uno.' },
    { id: 9, group: 'Fila superior', title: 'T e Y', add: 'ty', keys: ['t', 'y'], type: 'drill', goal: 12,
      intro: '<b>T</b> la escribe el índice izquierdo y <b>Y</b> el índice derecho, estirándose hacia el centro.',
      tip: 'Si te equivocás, no te apures: la precisión es más importante que la velocidad.' },
    { id: 10, group: 'Fila superior', title: 'W y O', add: 'wo', keys: ['w', 'o'], type: 'drill', goal: 12,
      intro: 'Los <b>anulares</b> suben: el izquierdo a la <b>W</b> y el derecho a la <b>O</b>.',
      tip: 'Mantené los dedos curvos, como si tuvieras una pelotita en la mano.' },
    { id: 11, group: 'Fila superior', title: 'Q y P', add: 'qp', keys: ['q', 'p'], type: 'drill', goal: 12,
      intro: 'Los <b>meñiques</b> suben: el izquierdo a la <b>Q</b> y el derecho a la <b>P</b>.',
      tip: 'En español, después de la Q casi siempre viene una U: que, quien, queso.' },
    { id: 12, group: 'Fila superior', title: 'Palabras con la fila superior', add: '', keys: [], type: 'words', goal: 14,
      intro: 'Combinamos la fila base con la fila superior para escribir muchísimas palabras.',
      tip: 'Buscá un ritmo parejo, como un tambor: tac, tac, tac.' },

    { id: 13, group: 'Fila inferior', title: 'C y la coma', add: 'c,', keys: ['c', ','], type: 'drill', goal: 14,
      intro: 'Bajamos a la fila de abajo. El <b>medio izquierdo</b> baja a la <b>C</b> y el <b>medio derecho</b> baja a la <b>coma</b>.',
      tip: 'Después de una coma siempre va un espacio.' },
    { id: 14, group: 'Fila inferior', title: 'V y M', add: 'vm', keys: ['v', 'm'], type: 'drill', goal: 14,
      intro: 'Los <b>índices</b> bajan: el izquierdo a la <b>V</b> y el derecho a la <b>M</b>.',
      tip: 'Las teclas de abajo se alcanzan doblando un poquito el dedo hacia adentro.' },
    { id: 15, group: 'Fila inferior', title: 'B y N', add: 'bn', keys: ['b', 'n'], type: 'drill', goal: 14,
      intro: '<b>B</b> la escribe el índice izquierdo y <b>N</b> el índice derecho. ¡Cuidado de no confundirlas!',
      tip: 'B está a la izquierda de N: “B de banco, N de noche”.' },
    { id: 16, group: 'Fila inferior', title: 'X, Z y el punto', add: 'xz.', keys: ['x', 'z', '.'], type: 'drill', goal: 14,
      intro: '<b>Z</b> va con el meñique izquierdo, <b>X</b> con el anular izquierdo y el <b>punto</b> con el anular derecho.',
      tip: 'Después de un punto, también va un espacio.' },
    { id: 17, group: 'Fila inferior', title: 'Todas las letras', add: '', keys: [], type: 'words', goal: 16,
      intro: '¡Ya conocés todas las letras! Practiquemos con palabras de todo el teclado.',
      tip: 'Si una palabra te cuesta, escribila más lento: la velocidad llega sola.' },

    { id: 18, group: 'Avanzado', title: 'Mayúsculas con Shift', add: '', keys: ['Shift'], type: 'text', goal: 14,
      intro: 'Para una <b>mayúscula</b>, mantené apretado <b>Shift</b> con el meñique de la <b>mano contraria</b> a la letra. Ejemplo: para la <b>A</b> (mano izquierda) usás el Shift derecho.',
      tip: 'No uses Bloq Mayús para una sola letra: Shift es más rápido.',
      texts: ['Ana vive en Lima.', 'Pedro come pan.', 'Hoy vamos a Rosario.', 'Sara tiene un gato.', 'El Sol es una estrella.', 'Mi perro se llama Rayo.', 'Lucas juega al tenis.', 'La Luna sale de noche.', 'Marte es rojo.', 'Vamos a Mendoza.', 'Elena lee un libro.', 'Bruno tiene una nave.'] },
    { id: 19, group: 'Avanzado', title: 'Tildes: á é í ó ú', add: '', keys: ['´'], type: 'text', goal: 12,
      intro: 'Para escribir una vocal con tilde, primero apretá la tecla <b>´</b> (está a la derecha de la P) y <b>soltala</b>. No aparece nada… ¡todavía! Después apretá la vocal: <b>´ + a = á</b>.',
      tip: 'La tecla ´ se aprieta con el meñique derecho.',
      texts: ['mamá', 'papá', 'café', 'sofá', 'jamás', 'después', 'árbol', 'música', 'río', 'día', 'búho', 'menú', 'sí', 'más', 'también', 'canción', 'avión', 'camión', 'ratón', 'limón', 'jardín', 'delfín', 'número', 'sábado', 'lápiz', 'fácil', 'águila', 'océano', 'mamá', 'corazón'] },
    { id: 20, group: 'Avanzado', title: 'Signos: ¿? ¡!', add: '', keys: ['¿', '?', '¡', '!'], type: 'text', goal: 12,
      intro: 'En español las preguntas y exclamaciones llevan signo de <b>apertura</b> y de <b>cierre</b>. <b>¿</b> está a la izquierda de Backspace, <b>?</b> es Shift + la tecla del apóstrofo, <b>¡</b> es Shift + ¿ y <b>!</b> es Shift + 1.',
      tip: 'Recordá: ¿ abre y ? cierra. ¡ abre y ! cierra.',
      texts: ['¿Qué hora es?', '¡Hola!', '¿Cómo estás?', '¡Qué bueno!', '¿Dónde está?', '¡Vamos!', '¿Jugamos?', '¡Bien hecho!', '¿Quién ganó?', '¡Increíble!'] },
    { id: 21, group: 'Avanzado', title: 'Números', add: '', keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], type: 'text', goal: 12,
      intro: 'Los números están en la fila de más arriba. Cada dedo sube dos filas desde su tecla base: el índice izquierdo hace <b>4 y 5</b>, el derecho <b>6 y 7</b>.',
      tip: 'Al principio podés mirar, pero tratá de volver siempre a la fila base.',
      texts: ['Tengo 12 años.', 'Hay 8 planetas.', 'Un año tiene 365 días.', 'Son las 10 y 30.', 'Leí 25 libros.', 'Mi número es el 7.', 'Faltan 4 días.', 'Corrí 100 metros.', 'Estamos en 2026.', 'Somos 3 amigos.'] },
    { id: 22, group: 'Avanzado', title: 'Desafío final', add: '', keys: [], type: 'fact', goal: 18,
      intro: '¡Último desafío! Vas a escribir datos curiosos completos, con mayúsculas, tildes y signos. Demostrá todo lo que aprendiste.',
      tip: 'Respirá, relajá los hombros y escribí con ritmo.' }
  ];

  /* ---------- Rangos por experiencia ---------- */
  D.ranks = [
    { xp: 0, name: 'Cadete espacial', icon: '🧑‍🚀' },
    { xp: 400, name: 'Piloto', icon: '🚀' },
    { xp: 1200, name: 'Navegante', icon: '🛰️' },
    { xp: 3000, name: 'Capitán', icon: '⭐' },
    { xp: 6000, name: 'Comandante', icon: '🌟' },
    { xp: 10000, name: 'Almirante', icon: '🪐' },
    { xp: 16000, name: 'Leyenda galáctica', icon: '🌌' }
  ];

  TT.data = D;
})();
