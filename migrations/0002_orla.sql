-- ORLA editorial makeup catalog.
-- Reference rows only. Safe to re-run.

create table if not exists brands (
  id text primary key,
  name text not null,
  origin text not null,
  note text not null,
  tier text not null
);

create table if not exists stylists (
  id text primary key,
  name text not null,
  city text not null,
  focus text not null,
  signature text not null,
  years integer not null
);

create table if not exists products (
  id text primary key,
  brand_id text not null references brands(id),
  name text not null,
  category text not null,
  finish text not null,
  shade text not null,
  hex text not null,
  undertone text not null,
  depth text not null,
  price_eur numeric not null
);

create table if not exists looks (
  id text primary key,
  situation text not null,
  title text not null,
  promise text not null,
  stylist_id text not null references stylists(id),
  mood text not null,
  base_brand text not null,
  intensities text not null
);

create table if not exists look_steps (
  look_id text not null references looks(id),
  step_order integer not null,
  zone text not null,
  title text not null,
  instruction text not null,
  product_id text not null references products(id),
  primary key (look_id, step_order)
);

insert into brands (id, name, origin, note, tier) values
  ('mac', 'MAC', 'Canadá', 'Sigue siendo el mostrador que decide qué es un neutro y qué es un rojo.', 'prestigio'),
  ('nars', 'NARS', 'Francia', 'El rubor se reconoce en la mejilla antes que en el envase.', 'prestigio'),
  ('fenty', 'Fenty Beauty', 'Estados Unidos', 'Abrió el abanico de tonos y dejó sin excusa a las bases de cuarenta sombras.', 'prestigio'),
  ('rare', 'Rare Beauty', 'Estados Unidos', 'El líquido se funde en segundos y no perdona la mano pesada.', 'prestigio'),
  ('ct', 'Charlotte Tilbury', 'Reino Unido', 'Traduce la luz de un set a algo que se pone con el dedo.', 'prestigio'),
  ('huda', 'Huda Beauty', 'Emiratos Árabes', 'Pigmento denso, pensado para que el ojo se lea en una foto pequeña.', 'prestigio'),
  ('dior', 'Dior', 'Francia', 'Color de alta costura con la piel todavía visible debajo.', 'lujo'),
  ('armani', 'Armani Beauty', 'Italia', 'La base que los fotógrafos piden cuando no quieren ver textura.', 'lujo'),
  ('hourglass', 'Hourglass', 'Estados Unidos', 'Contorno en crema que esculpe y no deja raya de polvo.', 'prestigio'),
  ('pat', 'Pat McGrath Labs', 'Estados Unidos', 'Pigmento de pasarela: metal y mate con la misma disciplina.', 'lujo'),
  ('merit', 'Merit', 'Estados Unidos', 'Poco producto, piel visible, cara que parece haber dormido.', 'prestigio'),
  ('kiko', 'Kiko Milano', 'Italia', 'Precisión de mostrador italiano sin el precio del lujo.', 'accesible'),
  ('maybelline', 'Maybelline', 'Estados Unidos', 'La base de farmacia que aguanta una jornada sin teatro.', 'accesible'),
  ('saie', 'Saie', 'Estados Unidos', 'Rubor líquido con el color de quien ya lleva horas fuera.', 'prestigio')
on conflict do nothing;

insert into stylists (id, name, city, focus, signature, years) values
  ('ines-vall', 'Inés Vall', 'Madrid', 'Piel de día y novias civiles', 'El rubor que parece sueño, no producto', 14),
  ('leo-marin', 'Leo Marín', 'Ciudad de México', 'Noche y fotografía', 'El ahumado que no cierra la mirada', 11),
  ('noor-elias', 'Noor Elías', 'Beirut', 'Editorial y contraste', 'Labio satinado contra piel mate', 16),
  ('aya-okonkwo', 'Aya Okonkwo', 'Lagos', 'Piel profunda y luz de cámara', 'Iluminador colocado, nunca polvo en toda la cara', 9),
  ('clara-voss', 'Clara Voss', 'Berlín', 'Oficina y reuniones', 'Cejas y labio; el resto en calma', 12),
  ('marta-soler', 'Marta Soler', 'Barcelona', 'Bodas e invitadas', 'Piel luminosa que aguanta horas y lágrimas', 18),
  ('ren-park', 'Ren Park', 'Seúl', 'Videollamada y primer plano', 'Base fina y un punto de luz bajo el ojo', 8),
  ('julio-ferrara', 'Julio Ferrara', 'Buenos Aires', 'Cita y piel cálida', 'Bronce en el pómulo, no en la sien', 13)
on conflict do nothing;

insert into products (id, brand_id, name, category, finish, shade, hex, undertone, depth, price_eur) values
  ('fenty-120', 'fenty', $$Pro Filt'r Soft Matte$$, 'base', 'mate suave', '120', '#F0C8A6', 'frio', 'clara', 40),
  ('fenty-185', 'fenty', $$Pro Filt'r Soft Matte$$, 'base', 'mate suave', '185', '#E2B48C', 'neutro', 'media', 40),
  ('fenty-290', 'fenty', $$Pro Filt'r Soft Matte$$, 'base', 'mate suave', '290', '#8D5A3C', 'calido', 'profunda', 40),
  ('fenty-410', 'fenty', $$Pro Filt'r Soft Matte$$, 'base', 'mate suave', '410', '#5C3828', 'neutro', 'profunda', 40),
  ('armani-4', 'armani', 'Luminous Silk', 'base', 'satinado', '4', '#F3D0B4', 'frio', 'clara', 69),
  ('armani-6', 'armani', 'Luminous Silk', 'base', 'satinado', '6', '#E4B892', 'calido', 'media', 69),
  ('armani-9', 'armani', 'Luminous Silk', 'base', 'satinado', '9', '#A56B45', 'calido', 'profunda', 69),
  ('dior-2n', 'dior', 'Forever Skin Glow', 'base', 'luminoso', '2N', '#F6D3B8', 'neutro', 'clara', 57),
  ('dior-3wo', 'dior', 'Forever Skin Glow', 'base', 'luminoso', '3WO', '#E0B48C', 'calido', 'media', 57),
  ('dior-5n', 'dior', 'Forever Skin Glow', 'base', 'luminoso', '5N', '#A86B45', 'neutro', 'profunda', 57),
  ('maybelline-220', 'maybelline', 'Fit Me Matte', 'base', 'mate', '220', '#E6B898', 'neutro', 'media', 12),
  ('hg-nude', 'hourglass', 'Vanish Stick', 'contorno', 'crema', 'Nude', '#C4A07C', 'neutro', 'clara', 48),
  ('hg-amber', 'hourglass', 'Vanish Stick', 'contorno', 'crema', 'Amber', '#A67555', 'calido', 'media', 48),
  ('hg-mocha', 'hourglass', 'Vanish Stick', 'contorno', 'crema', 'Mocha', '#6E4632', 'calido', 'profunda', 48),
  ('kiko-02', 'kiko', 'Sculpting Touch', 'contorno', 'crema', '02', '#C9A88A', 'neutro', 'clara', 14),
  ('nars-orgasm', 'nars', 'Blush', 'rubor', 'satinado', 'Orgasm', '#E39A86', 'calido', 'universal', 36),
  ('rare-happy', 'rare', 'Soft Pinch', 'rubor', 'líquido', 'Happy', '#E08A74', 'calido', 'universal', 26),
  ('rare-grace', 'rare', 'Soft Pinch', 'rubor', 'líquido', 'Grace', '#C45C6A', 'frio', 'universal', 26),
  ('saie-spicy', 'saie', 'Dew Blush', 'rubor', 'líquido', 'Spicy', '#D2654A', 'calido', 'universal', 28),
  ('merit-stock', 'merit', 'Flush Balm', 'rubor', 'crema', 'Stockholm', '#D9A090', 'neutro', 'universal', 32),
  ('mac-melba', 'mac', 'Powder Blush', 'rubor', 'polvo', 'Melba', '#E7A08A', 'calido', 'universal', 28),
  ('ct-pt-eye', 'ct', 'Eyes to Mesmerise', 'ojos', 'crema', 'Pillow Talk', '#C9908C', 'calido', 'universal', 30),
  ('mac-taupe', 'mac', 'Eye Shadow', 'ojos', 'satinado', 'Satin Taupe', '#7A645C', 'neutro', 'universal', 22),
  ('huda-rose', 'huda', 'Nude Obsessions', 'ojos', 'mate', 'Rose', '#A85A62', 'frio', 'universal', 29),
  ('pat-bronze', 'pat', 'Eye Ecstasy', 'ojos', 'metal', 'Bronze', '#8C5E3C', 'calido', 'universal', 42),
  ('kiko-taupe', 'kiko', 'Smart Eyeshadow', 'ojos', 'mate', 'Taupe 03', '#B89A8C', 'neutro', 'universal', 9),
  ('mac-teddy', 'mac', 'Matte Lipstick', 'labios', 'mate', 'Velvet Teddy', '#B26A58', 'calido', 'universal', 24),
  ('mac-ruby', 'mac', 'Matte Lipstick', 'labios', 'mate', 'Ruby Woo', '#B11124', 'frio', 'universal', 24),
  ('ct-pt-lip', 'ct', 'Matte Revolution', 'labios', 'mate', 'Pillow Talk', '#C47B78', 'calido', 'universal', 32),
  ('dior-999', 'dior', 'Rouge Dior', 'labios', 'satinado', '999', '#9E1B2E', 'frio', 'universal', 45),
  ('merit-1990', 'merit', 'Signature Lip', 'labios', 'satinado', '1990', '#A24A48', 'neutro', 'universal', 26),
  ('saie-poppy', 'saie', 'Lip Blur', 'labios', 'difuminado', 'Poppy', '#C45A4A', 'calido', 'universal', 26),
  ('rare-talent', 'rare', 'Lip Soufflé', 'labios', 'mate', 'Talent', '#8E3A42', 'frio', 'universal', 22),
  ('ct-hff-2', 'ct', 'Hollywood Flawless Filter', 'iluminador', 'líquido', '2 Light', '#F3D7BE', 'frio', 'clara', 46),
  ('ct-hff-4', 'ct', 'Hollywood Flawless Filter', 'iluminador', 'líquido', '4 Medium', '#E8C4A0', 'calido', 'media', 46),
  ('ct-hff-6', 'ct', 'Hollywood Flawless Filter', 'iluminador', 'líquido', '6 Deep', '#C48A5A', 'calido', 'profunda', 46),
  ('rare-mesmerize', 'rare', 'Positive Light', 'iluminador', 'líquido', 'Mesmerize', '#F0D2B4', 'neutro', 'universal', 26),
  ('kiko-brow-3', 'kiko', 'Eyebrow Marker', 'cejas', 'tinta', '03', '#6A4636', 'calido', 'clara', 10),
  ('kiko-brow-5', 'kiko', 'Eyebrow Marker', 'cejas', 'tinta', '05', '#3E2A22', 'neutro', 'profunda', 10),
  ('mac-brow', 'mac', 'Brow Set', 'cejas', 'gel', 'Spiked', '#4A332C', 'neutro', 'universal', 24),
  ('mac-fix', 'mac', 'Fix+', 'fijador', 'bruma', 'Original', '#D5DDE2', 'universal', 'universal', 28),
  ('ct-set', 'ct', 'Airbrush Setting Spray', 'fijador', 'bruma', 'Universal', '#F4F1EC', 'universal', 'universal', 36)
on conflict do nothing;

insert into looks (id, situation, title, promise, stylist_id, mood, base_brand, intensities) values
  (
    'piel-despierta',
    'dia',
    'Piel despierta',
    'La piel queda uniforme, el color vive en el pómulo y el labio parece tuyo.',
    'ines-vall',
    'suave',
    'armani',
    '{"base":0.42,"contorno":0.34,"rubor":0.75,"ojos":0.42,"labios":0.6,"iluminador":0.58,"cejas":0.5}'
  ),
  (
    'linea-clara',
    'oficina',
    'Línea clara',
    'Cejas y labio hacen el trabajo; el resto de la cara se queda en calma.',
    'clara-voss',
    'nitido',
    'dior',
    '{"base":0.38,"contorno":0.28,"rubor":0.4,"ojos":0.32,"labios":0.55,"iluminador":0.3,"cejas":0.72}'
  ),
  (
    'rostro-nitido',
    'entrevista',
    'Rostro nítido',
    'En primer plano la base no se ve y el labio se lee sin esfuerzo.',
    'ren-park',
    'preciso',
    'fenty',
    '{"base":0.4,"contorno":0.3,"rubor":0.36,"ojos":0.28,"labios":0.66,"iluminador":0.48,"cejas":0.78}'
  ),
  (
    'calor-quieto',
    'cita',
    'Calor quieto',
    'Bronce en el pómulo y un rubor cálido que parece haber salido de la piel.',
    'julio-ferrara',
    'calido',
    'armani',
    '{"base":0.4,"contorno":0.55,"rubor":0.82,"ojos":0.5,"labios":0.7,"iluminador":0.52,"cejas":0.48}'
  ),
  (
    'luz-invitada',
    'boda',
    'Luz de invitada',
    'Luz de piel que se sostiene en la foto de grupo, en el abrazo y en la lágrima.',
    'marta-soler',
    'luminoso',
    'dior',
    '{"base":0.48,"contorno":0.4,"rubor":0.7,"ojos":0.46,"labios":0.72,"iluminador":0.7,"cejas":0.55}'
  ),
  (
    'noche-abierta',
    'fiesta',
    'Noche abierta',
    'El ojo llega antes que tú y el rojo aguanta hasta el final de la noche.',
    'leo-marin',
    'fiesta',
    'fenty',
    '{"base":0.5,"contorno":0.62,"rubor":0.58,"ojos":0.9,"labios":0.88,"iluminador":0.28,"cejas":0.6}'
  ),
  (
    'piel-camara',
    'fotos',
    'Piel de cámara',
    'La luz cae solo en el hueso; el resto de la piel se queda quieta para la cámara.',
    'aya-okonkwo',
    'camara',
    'armani',
    '{"base":0.46,"contorno":0.48,"rubor":0.6,"ojos":0.4,"labios":0.64,"iluminador":0.66,"cejas":0.52}'
  ),
  (
    'contraste',
    'editorial',
    'Contraste',
    'La piel no compite: toda la atención cae en el labio.',
    'noor-elias',
    'editorial',
    'fenty',
    '{"base":0.44,"contorno":0.7,"rubor":0.5,"ojos":0.84,"labios":0.92,"iluminador":0.22,"cejas":0.74}'
  )
on conflict do nothing;

insert into look_steps (look_id, step_order, zone, title, instruction, product_id) values
  (
    'piel-despierta', 1, 'base', 'Base en velo fino',
    'Calienta una gota entre los dedos y presiónala desde el centro de la cara hacia las sienes con la esponja apenas húmeda. Cubre enrojecimiento y poros sin llegar al cuello ni al nacimiento del pelo. No construyas capa sobre capa: si se ve la base, ya es demasiado.',
    'armani-6'
  ),
  (
    'piel-despierta', 2, 'cejas', 'Cejas apenas dibujadas',
    'Con el marcador en trazos cortos, rellena solo los huecos del arco, siguiendo el pelo que ya existe. El inicio queda más claro que la cola. No dibujes un bloque ni subas el arco por encima del hueso.',
    'kiko-brow-3'
  ),
  (
    'piel-despierta', 3, 'contorno', 'Sombra bajo el pómulo',
    'Aplica una línea fina de crema justo debajo del pómulo, desde cerca de la oreja hasta el centro de la mejilla, y difumina hacia arriba con la esponja. La sombra debe verse como hueco, no como raya. No bajes el color hacia la mandíbula ni lo subas a la sien.',
    'hg-nude'
  ),
  (
    'piel-despierta', 4, 'rubor', 'Color en la manzana',
    'Sonríe apenas y deposita el color en la manzana, subiendo en diagonal hacia la sien sin pasar de la mitad de la mejilla ni bajar del pómulo. Difumina el borde con la esponja limpia. No pongas rubor debajo del pómulo: eso cansa la cara.',
    'nars-orgasm'
  ),
  (
    'piel-despierta', 5, 'iluminador', 'Luz en puntos altos',
    'Pon una gota en el pómulo más alto, el arco de la ceja y el lagrimal, y fúndela con el dedo antes de que seque. La luz tiene que leerse como piel, no como raya. No la extiendas por toda la mejilla ni por la frente.',
    'ct-hff-4'
  ),
  (
    'piel-despierta', 6, 'ojos', 'Crema en el móvil',
    'Con el dedo anular, deposita la crema en el centro del párpado móvil y llévala apenas hacia el pliegue, sin subir a la cuenca. Difumina el borde con el mismo dedo limpio. No cierres el ojo con negro ni bajes color bajo las pestañas inferiores.',
    'ct-pt-eye'
  ),
  (
    'piel-despierta', 7, 'labios', 'Labio que parece tuyo',
    'Perfila con la propia barra, sin lápiz visible, y rellena el centro con una sola pasada. Difumina el borde con el dedo para que no quede un corte. No excedas el contorno natural ni dejes el centro más oscuro que las comisuras.',
    'mac-teddy'
  ),
  (
    'piel-despierta', 8, 'fijador', 'Bruma a distancia',
    'Cierra los ojos y pulveriza en X a un palmo de la cara, dejando que la niebla caiga en vez de empapar. Espera a que seque al aire. No frotes la piel después ni acerques el bote hasta dejar gotas.',
    'mac-fix'
  ),
  (
    'linea-clara', 1, 'base', 'Piel pareja, sin velo',
    'Extiende una capa mínima con los dedos solo donde el color está desigual: alrededor de la nariz y en el mentón. El resto de la cara se deja ver. No cubras toda la frente ni busques un acabado de máscara.',
    'dior-2n'
  ),
  (
    'linea-clara', 2, 'cejas', 'El arco que ordena',
    'Peina el pelo hacia arriba con el gel y fija solo los que se escapan; si hay un hueco, rellénalo con trazos del color del pelo. El arco tiene que leerse limpio a la distancia de una mesa. No pintes la piel de debajo ni dejes una ceja más oscura que el cabello.',
    'mac-brow'
  ),
  (
    'linea-clara', 3, 'contorno', 'Un gesto, no una talla',
    'Pon una pizca de crema bajo el pómulo y difumínala en segundos con la esponja húmeda hasta que casi desaparezca. Sirve para separar la mejilla de la sien, nada más. No marques la mandíbula ni oscurezcas las sienes.',
    'kiko-02'
  ),
  (
    'linea-clara', 4, 'rubor', 'Rubor que no se nombra',
    'Toca la manzana con el dedo y arrastra una sombra de color hacia la sien, muy diluida. Tiene que notarse en persona y perderse en un pasillo. No construyas un círculo ni lo bajes del hueso.',
    'merit-stock'
  ),
  (
    'linea-clara', 5, 'iluminador', 'Un punto bajo el ojo',
    'Una mota líquida en el lagrimal interno y otra mínima en el centro del pómulo, fundidas con el dedo anular. En la oficina la luz no puede verse como producto. No ilumines la frente, la nariz ni el mentón.',
    'rare-mesmerize'
  ),
  (
    'linea-clara', 6, 'ojos', 'Taupe solo en el pliegue',
    'Con un pincel pequeño, deposita el tono en el pliegue y difumina hacia afuera en un velo corto. El párpado móvil queda casi limpio. No subas el color hasta la ceja ni lo bajes a la línea inferior.',
    'mac-taupe'
  ),
  (
    'linea-clara', 7, 'labios', 'Boca definida, sin grito',
    'Rellena el labio con el aplicador de dentro hacia fuera y cierra el color en el borde natural, sin lápiz. Una segunda pasada solo en el centro, para que la boca se lea en la reunión y no grite. No lo mates con polvo ni lo saques de tu contorno.',
    'merit-1990'
  ),
  (
    'linea-clara', 8, 'fijador', 'Fijar sin apagar',
    'Dos pulverizaciones cruzadas a distancia, con la cara en reposo, para que labio y ceja no se muevan. Deja secar sin abanicar con la mano. No empapes la base hasta volverla mate ni retoces con los dedos húmedos.',
    'ct-set'
  ),
  (
    'rostro-nitido', 1, 'base', 'Capa fina de cerca',
    'Aplica con esponja húmeda en capas delgadas, presionando y no arrastrando, sobre mejillas y alrededor de la boca. En primer plano la textura se amplía: deja ver piel. No uses el dedo seco ni cubras el párpado.',
    'fenty-185'
  ),
  (
    'rostro-nitido', 2, 'cejas', 'Cejas que aguantan el zoom',
    'Pasa el gel de la cola al inicio, peinando hacia arriba, y rellena solo la cola si la luz la borra. El arco tiene que leerse a un palmo de la cámara. No dibujes un trazo grueso ni oscurezcas el inicio.',
    'mac-brow'
  ),
  (
    'rostro-nitido', 3, 'contorno', 'Sombra corta y limpia',
    'Pon la crema en una línea corta bajo el pómulo y difumínala hacia la oreja con la esponja, nunca hacia la boca. En primer plano una raya se ve al instante. No contornees la nariz ni el mentón.',
    'hg-nude'
  ),
  (
    'rostro-nitido', 4, 'rubor', 'Color detrás del hueso',
    'Deposita la crema justo encima del pómulo, no en el centro de la mejilla, y difumina hacia la sien con el dedo. Poco producto: la cámara suma rojo. No bajes el color hacia la nariz.',
    'merit-stock'
  ),
  (
    'rostro-nitido', 5, 'iluminador', 'Luz bajo el ojo',
    'Una gota pequeña en el pómulo más alto y otra en el lagrimal, fundidas antes de que sequen. La luz abre la mirada sin brillar en la frente. No pongas iluminador en el puente de la nariz: la cámara lo convierte en línea.',
    'ct-hff-2'
  ),
  (
    'rostro-nitido', 6, 'ojos', 'Taupe mate, párpado limpio',
    'Con el dedo, deja un velo mate en el pliegue exterior y nada en el centro del párpado. Difumina hasta que no haya borde. No uses brillo en el móvil: en primer plano se ve graso.',
    'kiko-taupe'
  ),
  (
    'rostro-nitido', 7, 'labios', 'Labio nítido, borde quieto',
    'Rellena dentro del contorno con el aplicador y repasa el borde con la punta, sin un lápiz más oscuro. El color tiene que leerse igual en ambos labios. No dejes el centro sin cubrir ni excedas la comisura.',
    'merit-1990'
  ),
  (
    'rostro-nitido', 8, 'fijador', 'Fijar sin mover la base',
    'Pulveriza de lejos, en dos pasadas, y deja secar sin abanicar con la mano. La bruma sujeta el labio y no debe levantar la base mate. No acerques el pulverizador ni seques con un pañuelo.',
    'mac-fix'
  ),
  (
    'calor-quieto', 1, 'base', 'Piel cálida, no plana',
    'Extiende la base satinada con esponja húmeda desde las mejillas hacia fuera, dejando más cobertura solo en el centro. El acabado tiene que conservar luz. No mates toda la cara ni bajes el producto al escote.',
    'armani-6'
  ),
  (
    'calor-quieto', 2, 'cejas', 'Cejas en el mismo tono',
    'Haz trazos finos con el marcador en los huecos, del color del pelo, y peina con el dedo para tumbar el trazo. La ceja acompaña y no compite con el pómulo. No arquées de más ni rellenes el inicio en bloque.',
    'kiko-brow-3'
  ),
  (
    'calor-quieto', 3, 'contorno', 'Bronce solo en el pómulo',
    'Pon la crema cálida en el hueco del pómulo, de la oreja hacia el centro, y difumina hacia arriba con la esponja hasta perder el borde. El calor se queda en el hueso. No lo subas a la sien ni lo bajes a la mandíbula.',
    'hg-amber'
  ),
  (
    'calor-quieto', 4, 'rubor', 'Rubor encima del bronce',
    'El líquido va en la manzana, por encima del contorno, y se funde con el dedo en diagonal hacia la sien. Los dos tonos no deben dejar una raya intermedia. No lo pongas debajo del pómulo ni en círculos.',
    'saie-spicy'
  ),
  (
    'calor-quieto', 5, 'iluminador', 'Luz húmeda, no polvo',
    'Una gota en el punto más alto del pómulo, fundida con el dedo sobre el rubor todavía movible. Tiene que verse piel húmeda, no un punto blanco. No ilumines la frente entera ni el mentón.',
    'ct-hff-4'
  ),
  (
    'calor-quieto', 6, 'ojos', 'Crema cálida en el centro',
    'Con el dedo anular, pon crema en el centro del párpado y arrástrala un poco hacia el pliegue. El ojo se abre y no se cierra. No ahumes la cuenca ni bajes color bajo el ojo.',
    'ct-pt-eye'
  ),
  (
    'calor-quieto', 7, 'labios', 'Boca difuminada, sin borde',
    'Aplica el color en el centro del labio y arrástralo hacia fuera con el dedo hasta que el borde desaparezca. El efecto es mancha, no barra. No perfiles con lápiz ni dejes un corte en la comisura.',
    'saie-poppy'
  ),
  (
    'calor-quieto', 8, 'fijador', 'Fijar sin matar el brillo',
    'Una niebla ligera a distancia, la justa para que el rubor no emigre y la piel siga satinada. Espera a que seque sin tocar el pómulo. No pulverices hasta volver la cara mate.',
    'mac-fix'
  ),
  (
    'luz-invitada', 1, 'base', 'Luminosa a prueba de horas',
    'Aplica con esponja húmeda en una capa uniforme, presionando en mejillas y centro de la frente, y funde hacia el cuello para que no haya corte en la foto de grupo. Deja un acabado de piel, no de máscara. No acumules producto en el pliegue de la nariz ni en las líneas de la sonrisa.',
    'dior-3wo'
  ),
  (
    'luz-invitada', 2, 'cejas', 'Cejas que no se corren',
    'Rellena los huecos con trazos cortos y sella el pelo hacia arriba para que el arco aguante el calor y el roce. La cola queda un punto más firme que el inicio. No uses un bloque de color ni dejes pelos sueltos sobre el párpado.',
    'kiko-brow-3'
  ),
  (
    'luz-invitada', 3, 'contorno', 'Pómulo que separa sin tajar',
    'Crema cálida bajo el pómulo, difuminada en diagonal con la esponja hasta que solo se vea sombra. En una foto de grupo el contorno duro envejece la cara. No marques la mandíbula en ángulo ni oscurezcas las sienes.',
    'hg-amber'
  ),
  (
    'luz-invitada', 4, 'rubor', 'Manzana viva, borde difuso',
    'Sonríe, deposita el líquido en la manzana y súbelo en diagonal hacia la sien, parando antes de la mitad de la mejilla. Difumina el borde con la esponja limpia. No bajes el color del pómulo ni lo dejes en un círculo.',
    'rare-happy'
  ),
  (
    'luz-invitada', 5, 'iluminador', 'Luz que aguanta el flash',
    'Pon puntos líquidos en el pómulo, el arco de la ceja y el lagrimal, y fúndelos con el dedo. El flash se come el brillo, así que insiste solo en el hueso, nunca en toda la mejilla. No ilumines la punta de la nariz.',
    'ct-hff-4'
  ),
  (
    'luz-invitada', 6, 'ojos', 'Crema suave, mirada abierta',
    'Lleva la crema al párpado móvil y difumínala con el dedo hasta el pliegue, sin subir a la cuenca. Si la luz del salón es plana, añade un toque mínimo en el lagrimal. No cierres el ojo con negro ni cargues la línea inferior.',
    'ct-pt-eye'
  ),
  (
    'luz-invitada', 7, 'labios', 'Labio mate que no migra',
    'Rellena dentro del contorno y seca el borde con un pañuelo antes de la segunda capa, para que el color no sangre con la copa. El tono queda parejo, sin un centro más oscuro. No excedas el labio natural ni dejes brillo en el borde.',
    'ct-pt-lip'
  ),
  (
    'luz-invitada', 8, 'fijador', 'Sellar antes del ramo',
    'Pulveriza en X a distancia, deja secar y repite una segunda pasada solo si la piel todavía se mueve al tacto. Tiene que aguantar el abrazo y la lágrima sin cuartear. No empapes hasta dejar gotas ni frotes después.',
    'ct-set'
  ),
  (
    'noche-abierta', 1, 'base', 'Mate sin cerrar el poro',
    'Presiona la base con esponja húmeda en mejillas, frente y alrededor de la boca hasta igualar, sin dejar un velo grueso. El mate tiene que leerse como piel bajo luz baja, no como polvo. No arrastres: el arrastre marca la textura.',
    'fenty-290'
  ),
  (
    'noche-abierta', 2, 'cejas', 'Arco firme, no dibujado',
    'Pasa el gel desde la cola, peinando hacia arriba, y rellena solo donde la luz baja se come el pelo. La ceja enmarca el ojo y no compite con él. No la hagas más oscura que el pelo ni la bloquees en un rectángulo.',
    'mac-brow'
  ),
  (
    'noche-abierta', 3, 'contorno', 'Hueco profundo, borde perdido',
    'Lleva la crema oscura al hueco del pómulo, de la oreja al centro, y difumina con esponja limpia hasta que no quede línea. De noche el contraste aguanta más, el borde no. No bajes el tono a la papada ni lo subas a la sien en bloque.',
    'hg-mocha'
  ),
  (
    'noche-abierta', 4, 'rubor', 'Frío encima del pómulo',
    'Pon el líquido frío en la parte alta de la manzana y fúndelo con el dedo hacia la sien, separado del contorno cálido de abajo. El contraste es el punto, no un batido de los dos colores. No lo bajes al hueco del pómulo.',
    'rare-grace'
  ),
  (
    'noche-abierta', 5, 'iluminador', 'Solo el lagrimal',
    'Deja una mota en el lagrimal interno, fundida con el dedo meñique, y nada en el pómulo: esta noche la luz es del ojo. Si brilla de más, retíralo con la esponja limpia. No ilumines el hueso de la mejilla ni la frente.',
    'rare-mesmerize'
  ),
  (
    'noche-abierta', 6, 'ojos', 'Metal al centro, sombra fuera',
    'Pon el metal en el centro del párpado con el dedo y, con un pincel, arrastra el mismo tono hacia el pliegue exterior hasta perder el corte. El ahumado abre la mirada y no la encierra. No bajes una barra negra bajo todo el ojo ni subas el color hasta la ceja.',
    'pat-bronze'
  ),
  (
    'noche-abierta', 7, 'labios', 'Rojo dentro del borde',
    'Perfila con la propia barra, en trazo corto, y rellena de la comisura al centro. Seca el borde con un pañuelo y da una segunda capa solo por dentro. No saques el rojo de tu labio ni dejes el centro a medias.',
    'mac-ruby'
  ),
  (
    'noche-abierta', 8, 'fijador', 'Sellar ojo y boca',
    'Cierra los ojos y pulveriza a distancia, deteniéndote un segundo más frente a los párpados y la boca. Deja secar sin tocar. No frotes el ahumado ni reapliques el labio encima de la bruma todavía húmeda.',
    'ct-set'
  ),
  (
    'piel-camara', 1, 'base', 'Satinado que la cámara lee',
    'Presiona la base con esponja húmeda en el centro del rostro y difumina hacia las sienes sin llegar a un borde visible. La cámara castiga lo mate plano y también el brillo repartido por toda la cara. No pulverices polvo sobre las mejillas.',
    'armani-6'
  ),
  (
    'piel-camara', 2, 'cejas', 'Pelo a pelo, sin bloque',
    'Haz trazos muy finos con el marcador siguiendo cada pelo, más densos en la cola y casi nada en el inicio. En foto un bloque se ve pintado. No rellenes la piel entre los pelos ni subas el arco.',
    'kiko-brow-5'
  ),
  (
    'piel-camara', 3, 'contorno', 'Sombra donde cae la luz',
    'Pon la crema bajo el pómulo, sobre todo en el lado que la luz principal no toca, y difumina con la esponja hacia la oreja. Sirve para que el hueso exista en la foto, no para cambiar la cara. No contornees los dos lados con la misma fuerza ni marques la nariz.',
    'hg-amber'
  ),
  (
    'piel-camara', 4, 'rubor', 'Polvo solo en la manzana',
    'Sonríe y deposita el polvo en la manzana con una brocha pequeña, en toques, y barre el exceso hacia la sien. El polvo no debe caer encima del punto de luz. No lo bajes del pómulo ni lo soples sobre la base.',
    'mac-melba'
  ),
  (
    'piel-camara', 5, 'iluminador', 'Luz solo en el hueso',
    'Pon líquido en el pómulo más alto, del tamaño de una uña, y fúndelo con el dedo antes del flash. Añade un segundo punto solo en el lagrimal. No extiendas la luz por la mejilla, la frente ni el puente de la nariz.',
    'ct-hff-4'
  ),
  (
    'piel-camara', 6, 'ojos', 'Sombra neutra, sin brillo',
    'Deposita el satinado en el pliegue con un pincel, difuminado hacia fuera, y deja el párpado móvil casi limpio para que no compita con el pómulo. En foto el brillo del párpado se lee como grasa. No bajes la sombra a la bolsa del ojo.',
    'mac-taupe'
  ),
  (
    'piel-camara', 7, 'labios', 'Color parejo, borde seco',
    'Rellena el labio y presiona un pañuelo encima para quitar el exceso del borde antes de la segunda capa. El flash marca cualquier corte. No dejes el centro más claro ni saques el color del contorno.',
    'ct-pt-lip'
  ),
  (
    'piel-camara', 8, 'fijador', 'Bruma fina, sin polvo',
    'Una pasada a distancia para sentar la base y el rubor en polvo, sin añadir polvo suelto después. Si pulverizas de más, apagas la luz del pómulo. Deja secar de cara al aire, sin abanicar con la mano.',
    'mac-fix'
  ),
  (
    'contraste', 1, 'base', 'Piel quieta, casi mate',
    'Presiona una capa fina con esponja húmeda hasta igualar el tono y deja que se asiente antes de seguir. La piel tiene que callar para que el labio hable. No busques brillo en las mejillas ni cubras hasta el cuello.',
    'fenty-185'
  ),
  (
    'contraste', 2, 'cejas', 'Cejas gráficas, pelo visible',
    'Peina hacia arriba con el gel y rellena solo la cola, con la punta del aplicador y en trazo corto. La ceja se lee como línea, no como mancha. No bloquees el inicio ni la hagas más ancha que el pelo.',
    'mac-brow'
  ),
  (
    'contraste', 3, 'contorno', 'Talla limpia bajo el pómulo',
    'Pon la crema oscura en una franja estrecha bajo el pómulo, de la oreja hasta antes de la mitad de la mejilla, y difumina solo el borde inferior con la esponja. El contraste es intencional: el corte superior se queda más nítido. No subas el color a la sien ni lo arrastres hacia la boca.',
    'hg-mocha'
  ),
  (
    'contraste', 4, 'rubor', 'Frío, apartado del contorno',
    'Deja una cantidad pequeña de líquido en la parte alta de la mejilla, lejos del hueco oscuro, y fúndela con el dedo hacia la sien. Si se mezcla con el contorno, el contraste se ensucia. No bajes el rubor del hueso.',
    'rare-grace'
  ),
  (
    'contraste', 5, 'iluminador', 'Casi nada, solo el lagrimal',
    'Pon una punta de líquido en el lagrimal con el dedo meñique y retira cualquier brillo que haya caído en el pómulo. En este look la luz no puede competir con la boca. No ilumines el hueso ni el arco de la ceja.',
    'ct-hff-4'
  ),
  (
    'contraste', 6, 'ojos', 'Mate frío en la cuenca',
    'Con un pincel, lleva el mate al pliegue y al tercio exterior del párpado, difuminando hacia la sien sin subir a la ceja. El ojo es estructura, no brillo. No pongas metal en el centro ni bajes el color en una línea gruesa bajo el ojo.',
    'huda-rose'
  ),
  (
    'contraste', 7, 'labios', 'El rojo es el titular',
    'Perfila con precisión usando el propio aplicador y rellena en dos capas, dejando secar la primera. El satinado se queda en el centro y el borde queda seco para que no sangre. No lo difumines ni lo apagues con un tono más claro.',
    'dior-999'
  ),
  (
    'contraste', 8, 'fijador', 'Sellar piel, cuidar el labio',
    'Pulveriza frente y mejillas a distancia, con la boca cerrada y en reposo, y no repases el labio hasta que la bruma seque. Si cae niebla sobre el rojo, no lo frotes: deja secar y retoca solo el centro. No empapes la boca recién pintada.',
    'ct-set'
  )
on conflict do nothing;
