-- Catálogo de droguería. Las marcas caras salen; se quedan las que
-- aparecen en reseñas y pruebas de farmacia.

insert into brands (id, name, origin, note, tier) values
  ('nyx', 'NYX', 'Estados Unidos', 'En una prueba de ocho bases de droguería de 2026, la suya unificó la piel sin meterse en las líneas.', 'accesible'),
  ('essence', 'Essence', 'Alemania', 'Es la marca que más se repite cuando piden algo barato para el día: rubor, ceja y brillo.', 'accesible'),
  ('catrice', 'Catrice', 'Alemania', 'Sale junto a Essence en las reseñas. La base HD cubre, aunque varias dicen que no queda natural.', 'accesible'),
  ('loreal', $$L'Oréal Paris$$, 'Francia', 'True Match se recomienda como piel de día hidratante, no como una máscara.', 'accesible'),
  ('elf', 'e.l.f.', 'Estados Unidos', 'Precio bajo. El Halo Glow aparece una y otra vez en las rondas de novedades de droguería.', 'accesible')
on conflict do nothing;

update brands set
  note = 'Fit Me y Sky High están en casi todas las listas. La Lumi Matte tiene quejas de parches en piel seca: mejor no usarla si la piel tira.',
  tier = 'accesible'
where id = 'maybelline';

update brands set
  note = 'Mostrador accesible en Europa. La ceja y el contorno no piden precio de lujo.',
  tier = 'accesible'
where id = 'kiko';

update products set brand_id = 'essence', name = 'Fresh & Fit', finish = 'ligero', shade = '10', hex = '#F0C8A6', undertone = 'frio', depth = 'clara', price_eur = 5 where id = 'fenty-120';
update products set brand_id = 'nyx', name = 'Bare With Me', finish = 'serum', shade = '6.5', hex = '#E2B48C', undertone = 'neutro', depth = 'media', price_eur = 12 where id = 'fenty-185';
update products set brand_id = 'maybelline', name = 'Fit Me Matte', finish = 'mate', shade = '330', hex = '#8D5A3C', undertone = 'calido', depth = 'profunda', price_eur = 11 where id = 'fenty-290';
update products set brand_id = 'loreal', name = 'True Match', finish = 'hidratante', shade = '8N', hex = '#5C3828', undertone = 'neutro', depth = 'profunda', price_eur = 15 where id = 'fenty-410';
update products set brand_id = 'elf', name = 'Halo Glow', finish = 'luminoso', shade = '1', hex = '#F3D0B4', undertone = 'frio', depth = 'clara', price_eur = 12 where id = 'armani-4';
update products set brand_id = 'loreal', name = 'True Match', finish = 'hidratante', shade = '3W', hex = '#E4B892', undertone = 'calido', depth = 'media', price_eur = 15 where id = 'armani-6';
update products set brand_id = 'catrice', name = 'HD Liquid Coverage', finish = 'cubriente', shade = '070', hex = '#A56B45', undertone = 'calido', depth = 'profunda', price_eur = 7 where id = 'armani-9';
update products set brand_id = 'catrice', name = 'HD Liquid Coverage', finish = 'cubriente', shade = '010', hex = '#F6D3B8', undertone = 'neutro', depth = 'clara', price_eur = 7 where id = 'dior-2n';
update products set brand_id = 'maybelline', name = 'Fit Me Matte', finish = 'mate', shade = '220', hex = '#E0B48C', undertone = 'calido', depth = 'media', price_eur = 11 where id = 'dior-3wo';
update products set brand_id = 'essence', name = 'Fresh & Fit', finish = 'ligero', shade = '70', hex = '#A86B45', undertone = 'neutro', depth = 'profunda', price_eur = 5 where id = 'dior-5n';
update products set brand_id = 'maybelline', name = 'Fit Me Matte', finish = 'mate', shade = '220', hex = '#E6B898', undertone = 'neutro', depth = 'media', price_eur = 11 where id = 'maybelline-220';

update products set brand_id = 'catrice', name = 'Butter Bronzer', finish = 'crema', shade = '010', hex = '#C4A07C', undertone = 'neutro', depth = 'clara', price_eur = 6 where id = 'hg-nude';
update products set brand_id = 'nyx', name = 'Wonder Stick', finish = 'crema', shade = 'Medium', hex = '#A67555', undertone = 'calido', depth = 'media', price_eur = 12 where id = 'hg-amber';
update products set brand_id = 'essence', name = 'Baby Got Bronze', finish = 'polvo', shade = '30', hex = '#6E4632', undertone = 'calido', depth = 'profunda', price_eur = 4 where id = 'hg-mocha';
update products set brand_id = 'kiko', name = 'Sculpting Touch', finish = 'crema', shade = '02', hex = '#C9A88A', undertone = 'neutro', depth = 'clara', price_eur = 10 where id = 'kiko-02';

update products set brand_id = 'essence', name = 'The Blush', finish = 'polvo', shade = '20 Beloved', hex = '#E39A86', undertone = 'calido', depth = 'universal', price_eur = 4 where id = 'nars-orgasm';
update products set brand_id = 'maybelline', name = 'Sunkisser', finish = 'líquido', shade = '06', hex = '#E08A74', undertone = 'calido', depth = 'universal', price_eur = 12 where id = 'rare-happy';
update products set brand_id = 'catrice', name = 'Air Blush', finish = 'líquido', shade = '040', hex = '#C45C6A', undertone = 'frio', depth = 'universal', price_eur = 6 where id = 'rare-grace';
update products set brand_id = 'nyx', name = 'Sweet Cheeks', finish = 'crema', shade = '03', hex = '#D2654A', undertone = 'calido', depth = 'universal', price_eur = 8 where id = 'saie-spicy';
update products set brand_id = 'elf', name = 'Putty Blush', finish = 'crema', shade = 'Bali', hex = '#D9A090', undertone = 'neutro', depth = 'universal', price_eur = 8 where id = 'merit-stock';
update products set brand_id = 'kiko', name = 'Blush', finish = 'polvo', shade = 'Melocotón', hex = '#E7A08A', undertone = 'calido', depth = 'universal', price_eur = 8 where id = 'mac-melba';

update products set brand_id = 'essence', name = 'Eyeshadow', finish = 'crema', shade = 'Taupe', hex = '#C9908C', undertone = 'calido', depth = 'universal', price_eur = 3 where id = 'ct-pt-eye';
update products set brand_id = 'catrice', name = 'Absolute Eye', finish = 'mate', shade = 'Taupe', hex = '#7A645C', undertone = 'neutro', depth = 'universal', price_eur = 5 where id = 'mac-taupe';
update products set brand_id = 'nyx', name = 'Ultimate Shadow', finish = 'mate', shade = 'Rose', hex = '#A85A62', undertone = 'frio', depth = 'universal', price_eur = 9 where id = 'huda-rose';
update products set brand_id = 'elf', name = 'No Budge', finish = 'mate', shade = 'Bronze', hex = '#8C5E3C', undertone = 'calido', depth = 'universal', price_eur = 6 where id = 'pat-bronze';
update products set brand_id = 'kiko', name = 'Smart Eyeshadow', finish = 'mate', shade = '03', hex = '#B89A8C', undertone = 'neutro', depth = 'universal', price_eur = 6 where id = 'kiko-taupe';

update products set brand_id = 'maybelline', name = 'Lifter Gloss', finish = 'brillo', shade = 'Pearl', hex = '#B26A58', undertone = 'calido', depth = 'universal', price_eur = 11 where id = 'mac-teddy';
update products set brand_id = 'essence', name = 'Heart of Gold', finish = 'satinado', shade = 'Rojo', hex = '#B11124', undertone = 'frio', depth = 'universal', price_eur = 4 where id = 'mac-ruby';
update products set brand_id = 'nyx', name = 'Soft Matte Lip', finish = 'mate', shade = 'Nude', hex = '#C47B78', undertone = 'calido', depth = 'universal', price_eur = 8 where id = 'ct-pt-lip';
update products set brand_id = 'catrice', name = 'Ultimate Stay', finish = 'satinado', shade = '090', hex = '#9E1B2E', undertone = 'frio', depth = 'universal', price_eur = 6 where id = 'dior-999';
update products set brand_id = 'loreal', name = 'Color Riche', finish = 'satinado', shade = 'Nude', hex = '#A24A48', undertone = 'neutro', depth = 'universal', price_eur = 13 where id = 'merit-1990';
update products set brand_id = 'elf', name = 'Lip Lacquer', finish = 'brillo', shade = 'Coral', hex = '#C45A4A', undertone = 'calido', depth = 'universal', price_eur = 7 where id = 'saie-poppy';
update products set brand_id = 'maybelline', name = 'Super Stay Ink', finish = 'mate', shade = 'Pioneer', hex = '#8E3A42', undertone = 'frio', depth = 'universal', price_eur = 12 where id = 'rare-talent';

update products set brand_id = 'essence', name = 'Glow', finish = 'polvo', shade = '10', hex = '#F3D7BE', undertone = 'frio', depth = 'clara', price_eur = 4 where id = 'ct-hff-2';
update products set brand_id = 'catrice', name = 'Highlighter', finish = 'crema', shade = '020', hex = '#E8C4A0', undertone = 'calido', depth = 'media', price_eur = 5 where id = 'ct-hff-4';
update products set brand_id = 'nyx', name = 'Born to Glow', finish = 'líquido', shade = 'Deep', hex = '#C48A5A', undertone = 'calido', depth = 'profunda', price_eur = 10 where id = 'ct-hff-6';
update products set brand_id = 'elf', name = 'Halo Glow Wand', finish = 'líquido', shade = 'Champagne', hex = '#F0D2B4', undertone = 'neutro', depth = 'universal', price_eur = 10 where id = 'rare-mesmerize';

update products set brand_id = 'essence', name = 'Make Me Brow', finish = 'gel', shade = '02', hex = '#6A4636', undertone = 'calido', depth = 'clara', price_eur = 4 where id = 'kiko-brow-3';
update products set brand_id = 'nyx', name = 'Micro Brow', finish = 'lápiz', shade = 'Espresso', hex = '#3E2A22', undertone = 'neutro', depth = 'profunda', price_eur = 10 where id = 'kiko-brow-5';
update products set brand_id = 'catrice', name = 'Brow Definer', finish = 'lápiz', shade = '030', hex = '#4A332C', undertone = 'neutro', depth = 'universal', price_eur = 4 where id = 'mac-brow';

update products set brand_id = 'catrice', name = 'Prime and Fine', finish = 'bruma', shade = 'Universal', hex = '#D5DDE2', undertone = 'universal', depth = 'universal', price_eur = 6 where id = 'mac-fix';
update products set brand_id = 'nyx', name = 'Setting Spray', finish = 'bruma', shade = 'Matte', hex = '#F4F1EC', undertone = 'universal', depth = 'universal', price_eur = 10 where id = 'ct-set';

update looks set base_brand = 'essence' where id = 'piel-despierta';
update looks set base_brand = 'loreal' where id = 'linea-clara';
update looks set base_brand = 'nyx' where id = 'rostro-nitido';
update looks set base_brand = 'maybelline' where id = 'calor-quieto';
update looks set base_brand = 'loreal' where id = 'luz-invitada';
update looks set base_brand = 'nyx' where id = 'noche-abierta';
update looks set base_brand = 'elf' where id = 'piel-camara';
update looks set base_brand = 'catrice' where id = 'contraste';

delete from brands where not exists (
  select 1 from products p where p.brand_id = brands.id
);
