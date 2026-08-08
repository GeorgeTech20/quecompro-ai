-- ===========================================================================
-- seed.sql — QuéCompro.app
--
-- ⚠️ DATOS DE DEMOSTRACIÓN. Los precios son **promedios aproximados de
-- mercado peruano (Lima, 2026)** puestos a mano para que la demo tenga con qué
-- comparar. NO son precios oficiales de PlazaVea, Tottus, Metro, Wong ni de
-- ninguna otra cadena, no están sincronizados con ninguna de ellas y no deben
-- presentarse como tales.
--
-- Contenido:
--   * 97 productos distintos (`product_key`) en 133 filas — varios existen en
--     2 o 3 tiendas con precios distintos, que es justo lo que alimenta al
--     comparador y al swap "más barato".
--   * `nutrition` por cada producto, macros por 100 g/ml (valores aproximados
--     de tablas USDA y de la tabla peruana de composición de alimentos).
--   * 16 recetas peruanas con pasos reales y sus ingredientes enlazados al
--     catálogo por nombre.
--
-- Idempotente: todo es UPSERT sobre claves naturales (product_key+store, slug,
-- recipe_id+name). Correrlo dos veces refresca precios y no duplica nada.
-- No toca households / profiles / memberships / cart_items / transactions.
-- ===========================================================================

set search_path = public;

-- --------------------------------------------------------------------------
-- PRODUCTOS
-- (product_key, name, brand, store, price, unit, category, health_grade)
-- --------------------------------------------------------------------------
insert into public.products (product_key, name, brand, store, price, unit, category, health_grade) values
  -- --- carnes ---
  ('pollo-entero',        'Pollo entero',                 null,          'PlazaVea', 12.90, 'kg', 'carnes', 'A'),
  ('pollo-entero',        'Pollo entero',                 null,          'Metro',    13.50, 'kg', 'carnes', 'A'),
  ('pollo-entero',        'Pollo entero',                 null,          'Tottus',   12.50, 'kg', 'carnes', 'A'),
  ('pechuga-pollo',       'Pechuga de pollo',             null,          'PlazaVea', 17.90, 'kg', 'carnes', 'A'),
  ('pechuga-pollo',       'Pechuga de pollo',             null,          'Tottus',   18.90, 'kg', 'carnes', 'A'),
  ('pierna-pollo',        'Pierna de pollo',              null,          'Metro',    11.90, 'kg', 'carnes', 'B'),
  ('carne-molida-res',    'Carne molida de res',          null,          'PlazaVea', 22.90, 'kg', 'carnes', 'B'),
  ('lomo-fino-res',       'Lomo fino de res',             null,          'Wong',     42.90, 'kg', 'carnes', 'B'),
  ('lomo-fino-res',       'Lomo fino de res',             null,          'Metro',    38.90, 'kg', 'carnes', 'B'),
  ('bistec-res',          'Bistec de res',                null,          'Metro',    29.90, 'kg', 'carnes', 'B'),
  ('higado-res',          'Hígado de res',                null,          'PlazaVea', 14.90, 'kg', 'carnes', 'A'),
  ('chuleta-cerdo',       'Chuleta de cerdo',             null,          'Tottus',   19.90, 'kg', 'carnes', 'C'),
  ('filete-merluza',      'Filete de merluza',            null,          'Metro',    16.90, 'kg', 'carnes', 'A'),
  ('bonito',              'Bonito fresco',                null,          'PlazaVea', 13.90, 'kg', 'carnes', 'A'),
  ('hot-dog',             'Hot dog de pollo Otto Kunz',   'Otto Kunz',   'Metro',     9.90, 'paq','carnes', 'D'),

  -- --- verduras ---
  ('papa-amarilla',       'Papa amarilla',                null,          'PlazaVea',  4.50, 'kg', 'verduras', 'A'),
  ('papa-amarilla',       'Papa amarilla',                null,          'Metro',     4.90, 'kg', 'verduras', 'A'),
  ('papa-amarilla',       'Papa amarilla',                null,          'Tottus',    3.99, 'kg', 'verduras', 'A'),
  ('papa-blanca',         'Papa blanca',                  null,          'PlazaVea',  2.99, 'kg', 'verduras', 'A'),
  ('camote',              'Camote amarillo',              null,          'Metro',     3.20, 'kg', 'verduras', 'A'),
  ('cebolla-roja',        'Cebolla roja',                 null,          'PlazaVea',  3.50, 'kg', 'verduras', 'A'),
  ('cebolla-roja',        'Cebolla roja',                 null,          'Tottus',    2.99, 'kg', 'verduras', 'A'),
  ('tomate',              'Tomate italiano',              null,          'Metro',     4.20, 'kg', 'verduras', 'A'),
  ('tomate',              'Tomate italiano',              null,          'PlazaVea',  4.90, 'kg', 'verduras', 'A'),
  ('zanahoria',           'Zanahoria',                    null,          'PlazaVea',  2.80, 'kg', 'verduras', 'A'),
  ('ajo-pelado',          'Ajo pelado',                   null,          'Wong',     24.90, 'kg', 'verduras', 'A'),
  ('aji-amarillo',        'Ají amarillo fresco',          null,          'PlazaVea',  8.90, 'kg', 'verduras', 'A'),
  ('aji-amarillo',        'Ají amarillo fresco',          null,          'Metro',     9.50, 'kg', 'verduras', 'A'),
  ('aji-panca',           'Ají panca seco',               null,          'Tottus',   15.90, 'kg', 'verduras', 'A'),
  ('rocoto',              'Rocoto fresco',                null,          'Metro',     7.90, 'kg', 'verduras', 'A'),
  ('choclo',              'Choclo desgranado',            null,          'PlazaVea',  6.50, 'kg', 'verduras', 'A'),
  ('culantro',            'Culantro (atado)',             null,          'PlazaVea',  1.50, 'und','verduras', 'A'),
  ('perejil',             'Perejil (atado)',              null,          'Metro',     1.50, 'und','verduras', 'A'),
  ('cebolla-china',       'Cebolla china (atado)',        null,          'Tottus',    2.00, 'und','verduras', 'A'),
  ('apio',                'Apio',                         null,          'PlazaVea',  2.50, 'und','verduras', 'A'),
  ('lechuga',             'Lechuga americana',            null,          'Tottus',    3.50, 'und','verduras', 'A'),
  ('espinaca',            'Espinaca (bolsa 250 g)',       null,          'PlazaVea',  3.90, 'paq','verduras', 'A'),
  ('brocoli',             'Brócoli',                      null,          'Metro',     4.50, 'und','verduras', 'A'),
  ('vainita',             'Vainita',                      null,          'PlazaVea',  6.90, 'kg', 'verduras', 'A'),
  ('arveja-fresca',       'Arveja verde fresca',          null,          'Metro',     7.50, 'kg', 'verduras', 'A'),
  ('zapallo-macre',       'Zapallo macre',                null,          'PlazaVea',  3.90, 'kg', 'verduras', 'A'),
  ('pimiento',            'Pimiento rojo',                null,          'Metro',     8.90, 'kg', 'verduras', 'A'),
  ('yuca',                'Yuca amarilla',                null,          'PlazaVea',  3.20, 'kg', 'verduras', 'A'),

  -- --- frutas ---
  ('palta-fuerte',        'Palta fuerte',                 null,          'PlazaVea',  8.90, 'kg', 'frutas', 'A'),
  ('palta-fuerte',        'Palta fuerte',                 null,          'Wong',     11.90, 'kg', 'frutas', 'A'),
  ('palta-fuerte',        'Palta fuerte',                 null,          'Tottus',    7.99, 'kg', 'frutas', 'A'),
  ('platano-seda',        'Plátano de seda',              null,          'PlazaVea',  3.50, 'kg', 'frutas', 'A'),
  ('platano-seda',        'Plátano de seda',              null,          'Metro',     3.90, 'kg', 'frutas', 'A'),
  ('limon',               'Limón sutil',                  null,          'PlazaVea',  6.90, 'kg', 'frutas', 'A'),
  ('limon',               'Limón sutil',                  null,          'Tottus',    5.99, 'kg', 'frutas', 'A'),
  ('manzana-israel',      'Manzana Israel',               null,          'Metro',     5.90, 'kg', 'frutas', 'A'),
  ('naranja-jugo',        'Naranja de jugo',              null,          'PlazaVea',  3.20, 'kg', 'frutas', 'A'),
  ('mandarina',           'Mandarina',                    null,          'Tottus',    4.50, 'kg', 'frutas', 'A'),
  ('papaya',              'Papaya',                       null,          'Metro',     4.90, 'kg', 'frutas', 'A'),
  ('pina-golden',         'Piña Golden',                  null,          'PlazaVea',  4.50, 'und','frutas', 'A'),
  ('mango-edward',        'Mango Edward',                 null,          'PlazaVea',  4.90, 'kg', 'frutas', 'A'),
  ('fresa',               'Fresa',                        null,          'Metro',     8.90, 'kg', 'frutas', 'A'),
  ('sandia',              'Sandía',                       null,          'Tottus',    2.50, 'kg', 'frutas', 'A'),

  -- --- granos ---
  ('arroz-costeno',       'Arroz Costeño extra',          'Costeño',     'PlazaVea',  4.90, 'kg', 'granos', 'B'),
  ('arroz-costeno',       'Arroz Costeño extra',          'Costeño',     'Metro',     5.20, 'kg', 'granos', 'B'),
  ('arroz-costeno',       'Arroz Costeño extra',          'Costeño',     'Tottus',    4.69, 'kg', 'granos', 'B'),
  ('arroz-paisana',       'Arroz Paisana superior',       'Paisana',     'Metro',     4.50, 'kg', 'granos', 'B'),
  ('lenteja',             'Lentejas',                     null,          'PlazaVea',  6.90, 'kg', 'granos', 'A'),
  ('lenteja',             'Lentejas',                     null,          'Tottus',    6.50, 'kg', 'granos', 'A'),
  ('frejol-canario',      'Frejol canario',               null,          'Metro',     9.90, 'kg', 'granos', 'A'),
  ('garbanzo',            'Garbanzo',                     null,          'PlazaVea', 10.90, 'kg', 'granos', 'A'),
  ('quinua',              'Quinua perlada',               null,          'Wong',     12.90, 'kg', 'granos', 'A'),
  ('quinua',              'Quinua perlada',               null,          'PlazaVea', 11.50, 'kg', 'granos', 'A'),
  ('kiwicha',             'Kiwicha',                      null,          'Metro',     9.90, 'kg', 'granos', 'A'),
  ('arveja-partida',      'Arveja partida',               null,          'PlazaVea',  7.50, 'kg', 'granos', 'A'),
  ('avena-tres-ositos',   'Avena 3 Ositos (bolsa 900 g)', '3 Ositos',    'PlazaVea',  5.90, 'paq','granos', 'A'),
  ('avena-tres-ositos',   'Avena 3 Ositos (bolsa 900 g)', '3 Ositos',    'Tottus',    5.49, 'paq','granos', 'A'),

  -- --- lacteos ---
  ('leche-gloria',        'Leche Gloria evaporada (lata 395 g)', 'Gloria','PlazaVea', 4.20, 'und','lacteos', 'B'),
  ('leche-gloria',        'Leche Gloria evaporada (lata 395 g)', 'Gloria','Metro',    4.50, 'und','lacteos', 'B'),
  ('leche-gloria',        'Leche Gloria evaporada (lata 395 g)', 'Gloria','Tottus',   3.99, 'und','lacteos', 'B'),
  ('leche-fresca-laive',  'Leche fresca Laive (1 L)',     'Laive',       'Metro',     6.90, 'L',  'lacteos', 'A'),
  ('yogurt-gloria-fresa', 'Yogurt Gloria fresa (1 L)',    'Gloria',      'PlazaVea',  7.90, 'L',  'lacteos', 'C'),
  ('yogurt-gloria-fresa', 'Yogurt Gloria fresa (1 L)',    'Gloria',      'Tottus',    7.49, 'L',  'lacteos', 'C'),
  ('queso-fresco',        'Queso fresco (500 g)',         null,          'PlazaVea', 11.90, 'paq','lacteos', 'B'),
  ('queso-fresco',        'Queso fresco (500 g)',         null,          'Metro',    12.50, 'paq','lacteos', 'B'),
  ('mantequilla-laive',   'Mantequilla Laive (200 g)',    'Laive',       'Metro',     8.90, 'und','lacteos', 'C'),

  -- --- abarrotes ---
  ('huevos-pardos',       'Huevos pardos (paquete 15 und)', null,        'PlazaVea',  9.90, 'paq','abarrotes', 'A'),
  ('huevos-pardos',       'Huevos pardos (paquete 15 und)', null,        'Tottus',    9.50, 'paq','abarrotes', 'A'),
  ('aceite-primor',       'Aceite vegetal Primor (900 ml)', 'Primor',    'PlazaVea',  8.90, 'und','abarrotes', 'C'),
  ('aceite-primor',       'Aceite vegetal Primor (900 ml)', 'Primor',    'Metro',     9.30, 'und','abarrotes', 'C'),
  ('aceite-primor',       'Aceite vegetal Primor (900 ml)', 'Primor',    'Tottus',    8.49, 'und','abarrotes', 'C'),
  ('aceite-cocinero',     'Aceite Cocinero (1 L)',        'Cocinero',    'Metro',     9.90, 'und','abarrotes', 'C'),
  ('atun-florida',        'Atún Florida en aceite (170 g)', 'Florida',   'PlazaVea',  5.50, 'und','abarrotes', 'B'),
  ('atun-florida',        'Atún Florida en aceite (170 g)', 'Florida',   'Metro',     5.90, 'und','abarrotes', 'B'),
  ('atun-florida',        'Atún Florida en aceite (170 g)', 'Florida',   'Tottus',    4.99, 'und','abarrotes', 'B'),
  ('azucar-rubia',        'Azúcar rubia',                 null,          'PlazaVea',  4.20, 'kg', 'abarrotes', 'D'),
  ('azucar-rubia',        'Azúcar rubia',                 null,          'Metro',     4.50, 'kg', 'abarrotes', 'D'),
  ('fideos-don-vittorio', 'Fideos Don Vittorio spaghetti (500 g)', 'Don Vittorio', 'PlazaVea', 3.90, 'paq','abarrotes', 'B'),
  ('fideos-don-vittorio', 'Fideos Don Vittorio spaghetti (500 g)', 'Don Vittorio', 'Metro',    4.20, 'paq','abarrotes', 'B'),
  ('fideos-don-vittorio', 'Fideos Don Vittorio spaghetti (500 g)', 'Don Vittorio', 'Tottus',   3.69, 'paq','abarrotes', 'B'),
  ('harina-blanca-flor',  'Harina Blanca Flor sin preparar (1 kg)', 'Blanca Flor', 'PlazaVea', 4.90, 'kg','abarrotes', 'B'),
  ('pan-frances',         'Pan francés',                  null,          'PlazaVea',  0.40, 'und','abarrotes', 'B'),
  ('pan-frances',         'Pan francés',                  null,          'Metro',     0.45, 'und','abarrotes', 'B'),
  ('pan-molde-bimbo',     'Pan de molde Bimbo blanco (500 g)', 'Bimbo',  'Tottus',    6.90, 'paq','abarrotes', 'C'),
  ('salsa-tomate-pomarola','Salsa de tomate Pomarola (160 g)', 'Pomarola','Metro',    3.50, 'und','abarrotes', 'B'),
  ('aceituna-botija',     'Aceituna botija',              null,          'PlazaVea', 16.90, 'kg', 'abarrotes', 'B'),

  -- --- condimentos ---
  ('sal-emsal',           'Sal de mesa Emsal (1 kg)',     'Emsal',       'PlazaVea',  1.80, 'kg', 'condimentos', 'C'),
  ('pasta-aji-amarillo',  'Pasta de ají amarillo Alacena (100 g)', 'Alacena', 'PlazaVea', 5.90, 'und','condimentos', 'B'),
  ('pasta-aji-panca',     'Pasta de ají panca Alacena (100 g)',    'Alacena', 'Metro',    5.90, 'und','condimentos', 'B'),
  ('mayonesa-alacena',    'Mayonesa Alacena (400 g)',     'Alacena',     'PlazaVea', 10.90, 'und','condimentos', 'D'),
  ('mayonesa-alacena',    'Mayonesa Alacena (400 g)',     'Alacena',     'Tottus',    9.99, 'und','condimentos', 'D'),
  ('vinagre-tinto',       'Vinagre tinto (500 ml)',       null,          'Metro',     3.20, 'und','condimentos', 'B'),
  ('sillao-kikko',        'Sillao Kikko (500 ml)',        'Kikko',       'PlazaVea',  5.50, 'und','condimentos', 'C'),
  ('comino-sibarita',     'Comino molido Sibarita (20 g)','Sibarita',    'Metro',     2.50, 'und','condimentos', 'B'),
  ('pimienta-sibarita',   'Pimienta negra molida Sibarita (20 g)', 'Sibarita', 'PlazaVea', 2.90, 'und','condimentos', 'B'),
  ('oregano-sibarita',    'Orégano Sibarita (12 g)',      'Sibarita',    'Tottus',    2.20, 'und','condimentos', 'B'),
  ('palillo-sibarita',    'Palillo Sibarita (20 g)',      'Sibarita',    'PlazaVea',  1.90, 'und','condimentos', 'B'),
  ('caldo-gallina-maggi', 'Caldo de gallina Maggi (8 cubos)', 'Maggi',   'Metro',     4.50, 'paq','condimentos', 'D'),

  -- --- bebidas ---
  ('inca-kola-15',        'Inca Kola (1.5 L)',            'Inca Kola',   'PlazaVea',  6.90, 'und','bebidas', 'D'),
  ('inca-kola-15',        'Inca Kola (1.5 L)',            'Inca Kola',   'Metro',     7.20, 'und','bebidas', 'D'),
  ('inca-kola-15',        'Inca Kola (1.5 L)',            'Inca Kola',   'Tottus',    6.49, 'und','bebidas', 'D'),
  ('coca-cola-15',        'Coca Cola (1.5 L)',            'Coca Cola',   'Metro',     7.50, 'und','bebidas', 'D'),
  ('agua-san-luis',       'Agua San Luis sin gas (2.5 L)','San Luis',    'PlazaVea',  4.50, 'und','bebidas', 'A'),
  ('chicha-negrita',      'Chicha morada Negrita (sobre 180 g)', 'Negrita', 'Metro',  2.50, 'und','bebidas', 'C'),
  ('jugo-frugos',         'Jugo Frugos durazno (1 L)',    'Frugos',      'PlazaVea',  4.90, 'und','bebidas', 'C'),
  ('cafe-altomayo',       'Café Altomayo instantáneo (190 g)', 'Altomayo','Metro',    21.90, 'und','bebidas', 'B'),
  ('te-hornimans',        'Té Hornimans (100 sobres)',    'Hornimans',   'PlazaVea',  8.90, 'paq','bebidas', 'A'),

  -- --- snacks ---
  ('galletas-soda-field', 'Galletas Soda Field (paquete 6)', 'Field',    'PlazaVea',  4.20, 'paq','snacks', 'C'),
  ('papas-lays',          'Papas Lay''s clásicas (145 g)','Lay''s',      'Metro',     8.90, 'paq','snacks', 'D'),
  ('mani-salado',         'Maní salado (200 g)',          null,          'PlazaVea',  6.90, 'paq','snacks', 'C'),
  ('chocolate-sublime',   'Chocolate Sublime (30 g)',     'Sublime',     'PlazaVea',  2.20, 'und','snacks', 'D'),

  -- --- limpieza ---
  ('detergente-bolivar',  'Detergente Bolívar (2 kg)',    'Bolívar',     'PlazaVea', 22.90, 'paq','limpieza', null),
  ('detergente-bolivar',  'Detergente Bolívar (2 kg)',    'Bolívar',     'Metro',    23.90, 'paq','limpieza', null),
  ('lavavajilla-ayudin',  'Lavavajilla Ayudín (900 g)',   'Ayudín',      'Metro',     8.90, 'und','limpieza', null),
  ('lejia-clorox',        'Lejía Clorox (1 L)',           'Clorox',      'PlazaVea',  5.90, 'und','limpieza', null),
  ('papel-higienico-elite','Papel higiénico Elite (x12)', 'Elite',       'Tottus',   18.90, 'paq','limpieza', null),
  ('papel-higienico-elite','Papel higiénico Elite (x12)', 'Elite',       'Metro',    19.90, 'paq','limpieza', null),
  ('limpiatodo-poett',    'Limpiatodo Poett (1.8 L)',     'Poett',       'Tottus',    9.90, 'und','limpieza', null)
on conflict (product_key, store) do update set
  name         = excluded.name,
  brand        = excluded.brand,
  price        = excluded.price,
  unit         = excluded.unit,
  category     = excluded.category,
  health_grade = excluded.health_grade;

-- --------------------------------------------------------------------------
-- NUTRICIÓN — macros por 100 g (o 100 ml en líquidos).
-- Se enlaza por product_key, así todas las variantes de tienda del mismo
-- producto comparten los mismos macros sin repetir la tabla a mano.
-- Los artículos de limpieza van en cero: no son comestibles, pero mantener la
-- fila hace que el comparador de "alternativa más barata" funcione igual
-- (macros idénticos ⇒ decide solo el precio, que es lo correcto ahí).
-- --------------------------------------------------------------------------
insert into public.nutrition (product_id, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg)
select p.id, n.kcal, n.protein_g, n.carbs_g, n.fat_g, n.fiber_g, n.sodium_mg
from public.products p
join (
  values
    ('pollo-entero'::text,   215::numeric, 18.60::numeric,  0.00::numeric, 15.10::numeric,  0.00::numeric,    70::numeric),
    ('pechuga-pollo',        120,  22.50,  0.00,  2.60,  0.00,     63),
    ('pierna-pollo',         172,  18.00,  0.00, 10.90,  0.00,     82),
    ('carne-molida-res',     250,  19.00,  0.00, 19.00,  0.00,     66),
    ('lomo-fino-res',        143,  21.20,  0.00,  5.90,  0.00,     55),
    ('bistec-res',           187,  20.50,  0.00, 11.30,  0.00,     58),
    ('higado-res',           135,  20.40,  3.90,  3.60,  0.00,     69),
    ('chuleta-cerdo',        231,  20.70,  0.00, 15.90,  0.00,     62),
    ('filete-merluza',        90,  18.30,  0.00,  1.30,  0.00,     89),
    ('bonito',               168,  23.30,  0.00,  8.10,  0.00,     47),
    ('hot-dog',              250,  11.00,  4.00, 21.00,  0.00,    950),

    ('papa-amarilla',         90,   2.00, 20.60,  0.10,  1.80,      6),
    ('papa-blanca',           77,   2.00, 17.50,  0.10,  2.10,      6),
    ('camote',                86,   1.60, 20.10,  0.10,  3.00,     55),
    ('cebolla-roja',          40,   1.10,  9.30,  0.10,  1.70,      4),
    ('tomate',                18,   0.90,  3.90,  0.20,  1.20,      5),
    ('zanahoria',             41,   0.90,  9.60,  0.20,  2.80,     69),
    ('ajo-pelado',           149,   6.40, 33.10,  0.50,  2.10,     17),
    ('aji-amarillo',          40,   1.90,  8.80,  0.40,  1.50,      9),
    ('aji-panca',            282,  12.00, 50.00,  5.50, 28.00,     30),
    ('rocoto',                32,   1.40,  6.70,  0.40,  1.60,      8),
    ('choclo',                96,   3.40, 21.00,  1.50,  2.40,     15),
    ('culantro',              23,   2.10,  3.70,  0.50,  2.80,     46),
    ('perejil',               36,   3.00,  6.30,  0.80,  3.30,     56),
    ('cebolla-china',         32,   1.80,  7.30,  0.20,  2.60,     16),
    ('apio',                  16,   0.70,  3.00,  0.20,  1.60,     80),
    ('lechuga',               15,   1.40,  2.90,  0.20,  1.20,     28),
    ('espinaca',              23,   2.90,  3.60,  0.40,  2.20,     79),
    ('brocoli',               34,   2.80,  6.60,  0.40,  2.60,     33),
    ('vainita',               31,   1.80,  7.00,  0.20,  2.70,      6),
    ('arveja-fresca',         81,   5.40, 14.50,  0.40,  5.10,      5),
    ('zapallo-macre',         26,   1.00,  6.50,  0.10,  0.50,      1),
    ('pimiento',              31,   1.00,  6.00,  0.30,  2.10,      4),
    ('yuca',                 160,   1.40, 38.10,  0.30,  1.80,     14),

    ('palta-fuerte',         160,   2.00,  8.50, 14.70,  6.70,      7),
    ('platano-seda',          89,   1.10, 22.80,  0.30,  2.60,      1),
    ('limon',                 29,   1.10,  9.30,  0.30,  2.80,      2),
    ('manzana-israel',        52,   0.30, 13.80,  0.20,  2.40,      1),
    ('naranja-jugo',          47,   0.90, 11.80,  0.10,  2.40,      0),
    ('mandarina',             53,   0.80, 13.30,  0.30,  1.80,      2),
    ('papaya',                43,   0.50, 10.80,  0.30,  1.70,      8),
    ('pina-golden',           50,   0.50, 13.10,  0.10,  1.40,      1),
    ('mango-edward',          60,   0.80, 15.00,  0.40,  1.60,      1),
    ('fresa',                 32,   0.70,  7.70,  0.30,  2.00,      1),
    ('sandia',                30,   0.60,  7.60,  0.20,  0.40,      1),

    ('arroz-costeno',        360,   6.70, 79.30,  0.60,  1.30,      5),
    ('arroz-paisana',        358,   6.50, 79.00,  0.60,  1.20,      5),
    ('lenteja',              352,  24.60, 63.40,  1.10, 10.70,      6),
    ('frejol-canario',       341,  21.60, 62.40,  1.20, 15.50,     12),
    ('garbanzo',             364,  19.30, 60.70,  6.00, 17.40,     24),
    ('quinua',               368,  14.10, 64.20,  6.10,  7.00,      5),
    ('kiwicha',              371,  13.60, 65.30,  7.00,  6.70,      4),
    ('arveja-partida',       341,  24.60, 60.40,  1.20, 25.50,     15),
    ('avena-tres-ositos',    379,  13.20, 67.70,  6.50, 10.10,      6),

    ('leche-gloria',         134,   6.80, 10.00,  7.60,  0.00,    106),
    ('leche-fresca-laive',    61,   3.20,  4.80,  3.30,  0.00,     43),
    ('yogurt-gloria-fresa',   85,   2.90, 13.80,  2.10,  0.00,     46),
    ('queso-fresco',         264,  17.60,  3.40, 20.00,  0.00,    373),
    ('mantequilla-laive',    717,   0.90,  0.10, 81.10,  0.00,    643),

    ('huevos-pardos',        143,  12.60,  0.70,  9.50,  0.00,    142),
    ('aceite-primor',        884,   0.00,  0.00,100.00,  0.00,      0),
    ('aceite-cocinero',      884,   0.00,  0.00,100.00,  0.00,      0),
    ('atun-florida',         198,  29.10,  0.00,  8.20,  0.00,    354),
    ('azucar-rubia',         380,   0.00, 98.10,  0.00,  0.00,     12),
    ('fideos-don-vittorio',  371,  13.00, 74.70,  1.50,  3.20,      6),
    ('harina-blanca-flor',   364,  10.30, 76.30,  1.00,  2.70,      2),
    ('pan-frances',          274,   8.90, 52.00,  3.10,  2.40,    490),
    ('pan-molde-bimbo',      265,   9.00, 49.00,  3.20,  2.70,    490),
    ('salsa-tomate-pomarola', 68,   1.40, 12.50,  1.40,  1.50,    480),
    ('aceituna-botija',      145,   1.00,  3.80, 15.30,  3.30,   1550),

    ('sal-emsal',              0,   0.00,  0.00,  0.00,  0.00,  38758),
    ('pasta-aji-amarillo',   120,   1.50, 12.00,  7.00,  3.00,    900),
    ('pasta-aji-panca',      110,   1.80, 13.00,  5.50,  4.00,    950),
    ('mayonesa-alacena',     680,   1.00,  2.00, 74.00,  0.00,    620),
    ('vinagre-tinto',         19,   0.00,  0.30,  0.00,  0.00,      8),
    ('sillao-kikko',          53,   5.50,  4.90,  0.10,  0.80,   5493),
    ('comino-sibarita',      375,  17.80, 44.20, 22.30, 10.50,    168),
    ('pimienta-sibarita',    251,  10.40, 63.90,  3.30, 25.30,     20),
    ('oregano-sibarita',     265,   9.00, 68.90,  4.30, 42.50,     25),
    ('palillo-sibarita',     312,   9.70, 67.10,  3.20, 22.70,     27),
    ('caldo-gallina-maggi',  230,   9.00, 18.00, 13.00,  0.00,  17000),

    ('inca-kola-15',          45,   0.00, 11.30,  0.00,  0.00,     10),
    ('coca-cola-15',          42,   0.00, 10.60,  0.00,  0.00,      5),
    ('agua-san-luis',          0,   0.00,  0.00,  0.00,  0.00,      2),
    ('chicha-negrita',       370,   0.50, 92.00,  0.20,  0.50,     20),
    ('jugo-frugos',           47,   0.20, 11.50,  0.00,  0.20,      8),
    ('cafe-altomayo',        353,  12.20, 41.10,  0.50,  0.00,     37),
    ('te-hornimans',           1,   0.00,  0.30,  0.00,  0.00,      3),

    ('galletas-soda-field',  430,   9.00, 70.00, 12.00,  2.50,    900),
    ('papas-lays',           536,   6.60, 53.00, 34.60,  4.40,    525),
    ('mani-salado',          587,  25.80, 21.50, 49.20,  8.50,    410),
    ('chocolate-sublime',    545,   7.80, 52.00, 33.00,  3.00,     65),

    ('detergente-bolivar',     0,   0.00,  0.00,  0.00,  0.00,      0),
    ('lavavajilla-ayudin',     0,   0.00,  0.00,  0.00,  0.00,      0),
    ('lejia-clorox',           0,   0.00,  0.00,  0.00,  0.00,      0),
    ('papel-higienico-elite',  0,   0.00,  0.00,  0.00,  0.00,      0),
    ('limpiatodo-poett',       0,   0.00,  0.00,  0.00,  0.00,      0)
) as n(product_key, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg)
  on n.product_key = p.product_key
on conflict (product_id) do update set
  kcal      = excluded.kcal,
  protein_g = excluded.protein_g,
  carbs_g   = excluded.carbs_g,
  fat_g     = excluded.fat_g,
  fiber_g   = excluded.fiber_g,
  sodium_mg = excluded.sodium_mg;

-- --------------------------------------------------------------------------
-- RECETAS — 16 clásicos peruanos con pasos escritos como los diría alguien
-- que cocina, no como una lista de comandos.
-- --------------------------------------------------------------------------
insert into public.recipes (slug, title, steps, time_min, servings, difficulty, tags, kcal_per_serving) values
  ('aji-de-gallina', 'Ají de gallina', array[
    'Sancocha la pechuga en agua con sal, media cebolla y una rama de apio por 25 minutos. Guarda el caldo, es la base de la salsa.',
    'Deshilacha el pollo con las manos cuando esté tibio: en hebras finas, nunca picado a cuchillo.',
    'Remoja el pan francés en leche evaporada hasta que se deshaga y licúalo con un poco del caldo.',
    'Aparte, sofríe la cebolla bien picadita con ajo hasta que quede transparente; recién ahí entra la pasta de ají amarillo y se cocina 5 minutos más para que pierda el sabor a crudo.',
    'Incorpora el pan licuado y ve soltando con caldo hasta que la salsa cubra el dorso de la cuchara sin chorrear.',
    'Echa el pollo deshilachado, sazona con sal, pimienta y una pizca de palillo, y cocina 10 minutos a fuego bajo moviendo para que no se pegue al fondo.',
    'Sirve sobre papa amarilla sancochada en rodajas, con arroz blanco al costado, aceituna botija y huevo duro encima.'
  ], 50, 4, 'media', array['peruano','criollo','pollo'], 620),

  ('lomo-saltado', 'Lomo saltado', array[
    'Corta el lomo en tiras del ancho de un dedo y sazónalo con sal, pimienta y comino unos minutos antes de cocinar.',
    'Pica la cebolla en gajos gruesos y el tomate en gajos parejos: la gracia es que lleguen enteros al plato.',
    'Calienta la sartén hasta que casi humee. La carne se sella, no se hierve; saltéala en dos tandas para que no suelte agua.',
    'Retira la carne, echa la cebolla y saltea un minuto; agrega el ají amarillo en tiras y el tomate 30 segundos más.',
    'Devuelve la carne, agrega un chorro de sillao y otro de vinagre, y deja que el vapor levante todo el fondo tostado de la sartén.',
    'Apaga el fuego y recién ahí echa el culantro picado, para que no se cocine.',
    'Sirve con papas fritas encima y arroz blanco al lado.'
  ], 35, 4, 'media', array['peruano','criollo','res','wok'], 690),

  ('saltado-de-pollo', 'Saltado de pollo', array[
    'Corta la pechuga en tiras y sazona con sal, pimienta, comino y un chorrito de sillao.',
    'Ten todo cortado antes de prender la hornilla: el saltado no espera a nadie.',
    'Sella el pollo en la sartén bien caliente hasta que dore por fuera; retíralo.',
    'Saltea la cebolla en gajos con el ají amarillo, luego el tomate, siempre a fuego alto.',
    'Regresa el pollo, agrega sillao y vinagre y saltea 2 minutos más sacudiendo la sartén.',
    'Termina con culantro picado fuera del fuego y sirve con arroz y papas fritas.'
  ], 25, 4, 'facil', array['peruano','criollo','pollo','rapido'], 560),

  ('arroz-con-pollo', 'Arroz con pollo', array[
    'Sazona las presas de pollo con sal, pimienta y comino, y dóralas en aceite hasta que tomen color. Retíralas.',
    'En la misma olla haz el aderezo: cebolla picada, ajo, pasta de ají amarillo y un toque de ají panca.',
    'Licúa el culantro con un poco de agua hasta que quede un verde intenso y échalo al aderezo; deja que rompa hervor.',
    'Agrega el arroz lavado y remuévelo para que se impregne del verde antes de mojar.',
    'Vierte el caldo caliente (una medida y media por medida de arroz), acomoda el pollo encima y agrega arveja y zanahoria en cubos.',
    'Tapa y cocina a fuego bajo 20 minutos sin destapar; el vapor es el que cocina.',
    'Apaga, deja reposar 5 minutos y recién ahí remueve con tenedor. Sirve con salsa criolla de cebolla y limón.'
  ], 55, 4, 'media', array['peruano','criollo','pollo','arroz'], 720),

  ('causa-limena', 'Causa limeña', array[
    'Sancocha la papa amarilla con cáscara hasta que la punta del cuchillo entre sola; pélala en caliente.',
    'Prensa la papa mientras está tibia: fría se vuelve pegajosa y ya no queda lisa.',
    'Amasa la papa con pasta de ají amarillo, jugo de limón, sal y un chorrito de aceite hasta que quede una masa suave y amarilla pareja.',
    'Prepara el relleno mezclando el atún escurrido con mayonesa, cebolla picada finita y sal.',
    'En un molde o un aro, pon una capa de masa, aplana, luego el relleno, luego palta en láminas y cierra con otra capa de masa.',
    'Refrigera al menos 30 minutos: la causa se come fría y necesita tomar cuerpo.',
    'Desmolda y decora con mayonesa, aceituna y huevo duro en rodajas.'
  ], 40, 4, 'facil', array['peruano','frio','entrada','atun'], 380),

  ('ceviche', 'Ceviche de pescado', array[
    'Usa pescado fresquísimo: si huele a pescado, no sirve para ceviche.',
    'Corta el filete en cubos de dos centímetros y guárdalos en frío mientras preparas lo demás.',
    'Exprime los limones a mano y sin apretar la cáscara, que amarga el jugo.',
    'Sazona el pescado con sal y ají en tiras, y recién ahí echa el limón; mezcla y deja reposar 2 minutos, no más.',
    'Agrega la cebolla cortada en pluma bien delgada y lavada en agua fría, y el culantro picado.',
    'Prueba y ajusta sal. Debe salir ácido pero no doler.',
    'Sirve al toque con camote sancochado, choclo y una hoja de lechuga.'
  ], 25, 4, 'media', array['peruano','pescado','frio','clasico'], 310),

  ('tallarin-saltado', 'Tallarín saltado criollo', array[
    'Pon a hervir agua con sal y cocina los fideos al dente; escúrrelos y mézclalos con un chorrito de aceite para que no se peguen.',
    'Corta el pollo en tiras y sazona con sal, pimienta, comino y sillao.',
    'Sella la carne en la sartén bien caliente y retírala.',
    'Saltea cebolla en gajos, ají amarillo en tiras y tomate, a fuego alto y moviendo poco.',
    'Regresa la carne, agrega sillao, vinagre y un poco del agua de los fideos.',
    'Echa los fideos y saltea todo junto un par de minutos hasta que se integren.',
    'Termina con culantro picado y sirve de inmediato.'
  ], 30, 4, 'facil', array['peruano','criollo','fideos','rapido'], 640),

  ('sopa-de-lentejas', 'Sopa de lentejas', array[
    'Remoja las lentejas al menos una hora; si te olvidaste, sirve pero tardará más en cocer.',
    'Haz un aderezo con cebolla picada, ajo, un poco de pasta de ají panca y comino hasta que huela dulce.',
    'Agrega zanahoria y apio en cubos chicos y sofríe dos minutos.',
    'Echa las lentejas escurridas, cubre con agua caliente tres dedos por encima y deja hervir a fuego medio.',
    'Cuando las lentejas estén casi listas, agrega la papa en cubos y sal.',
    'Cocina hasta que la papa esté suave y la sopa haya espesado sola; si queda muy densa, suelta con agua caliente, nunca fría.',
    'Sirve con culantro picado encima y un chorrito de limón.'
  ], 45, 4, 'facil', array['peruano','sopa','legumbres','economico'], 340),

  ('seco-de-pollo', 'Seco de pollo con frejoles', array[
    'Sazona las presas con sal, pimienta y comino y dóralas bien en aceite caliente; ese dorado es medio sabor del plato.',
    'Retira el pollo y en la misma olla sofríe cebolla, ajo y pasta de ají amarillo hasta que el aderezo se vea brillante.',
    'Licúa un buen puñado de culantro con un poco de agua y échalo a la olla; deja que hierva un par de minutos.',
    'Devuelve el pollo, agrega un chorro de chicha o cerveza y tapa.',
    'Cocina a fuego bajo 30 minutos, agregando zanahoria y arveja en los últimos 10.',
    'Aparte, guisa los frejoles ya cocidos con un aderezo simple de cebolla y ajo hasta que estén cremosos.',
    'Sirve el seco con su salsa verde, los frejoles al costado, arroz blanco y salsa criolla.'
  ], 60, 4, 'media', array['peruano','criollo','pollo','norteno'], 710),

  ('papa-a-la-huancaina', 'Papa a la huancaína', array[
    'Sancocha las papas con cáscara en agua con sal hasta que estén firmes pero cocidas; enfríalas y pélalas.',
    'Sofríe la cebolla y el ajo con la pasta de ají amarillo hasta que pierda el crudo. Este paso es el que separa una huancaína rica de una que sabe a ají crudo.',
    'Licúa ese sofrito con queso fresco, galletas de soda y leche evaporada.',
    'Ve agregando leche de a pocos hasta lograr una crema que caiga en cinta, ni líquida ni pastosa.',
    'Prueba de sal: el queso ya trae, así que sazona al final.',
    'Corta las papas en rodajas gruesas, acomódalas sobre lechuga y báñalas con la crema.',
    'Decora con huevo duro y aceituna botija, y sírvela fría.'
  ], 25, 4, 'facil', array['peruano','entrada','frio','clasico'], 420),

  ('tortilla-de-verduras', 'Tortilla de verduras', array[
    'Pica la verdura en trozos chicos y parejos: espinaca, zanahoria rallada, cebolla china y lo que tengas por morir en la refri.',
    'Saltea las verduras con un poco de aceite y sal hasta que suelten el agua y se seque la sartén.',
    'Bate los huevos con sal y pimienta hasta que estén espumosos.',
    'Mezcla las verduras tibias con el huevo, no hirviendo, para que no se cuaje antes de tiempo.',
    'Vierte en la sartén a fuego bajo y tapa: la tortilla se cocina con paciencia, no con fuego alto.',
    'Cuando el borde esté firme, voltéala con ayuda de un plato y dora el otro lado 2 minutos.',
    'Sirve con arroz o entre dos panes francés.'
  ], 20, 3, 'facil', array['vegetariano','rapido','economico','huevo'], 260),

  ('arroz-chaufa', 'Arroz chaufa', array[
    'Usa arroz cocido del día anterior y bien frío; el arroz recién hecho se apelmaza y arruina el chaufa.',
    'Bate los huevos y haz una tortilla delgada en la sartén; córtala en tiras y resérvala.',
    'Corta el pollo en cubitos, sazónalo con sillao y séllalo a fuego fuerte.',
    'Agrega la parte blanca de la cebolla china y saltea 30 segundos.',
    'Echa el arroz frío y remueve para separarlo, siempre a fuego alto.',
    'Agrega sillao en hilo por el borde de la sartén, no al centro, para que se tueste y perfume.',
    'Incorpora la tortilla en tiras y la parte verde de la cebolla china, mezcla y sirve caliente.'
  ], 25, 4, 'facil', array['peruano','chifa','arroz','rapido'], 580),

  ('estofado-de-pollo', 'Estofado de pollo', array[
    'Dora las presas de pollo sazonadas en aceite caliente hasta que tomen color parejo.',
    'Sofríe cebolla, ajo y tomate rallado hasta que el tomate se deshaga y el aderezo se vea espeso.',
    'Agrega un poco de pasta de ají panca y comino, y cocina dos minutos más.',
    'Devuelve el pollo, agrega zanahoria en rodajas, arveja y papa en trozos grandes.',
    'Cubre apenas con agua o caldo, tapa y cocina a fuego bajo 30 minutos.',
    'Destapa los últimos 5 minutos para que la salsa reduzca y quede brillante.',
    'Sirve con arroz blanco y perejil picado.'
  ], 45, 4, 'facil', array['peruano','criollo','pollo','olla'], 610),

  ('ocopa', 'Ocopa arequipeña', array[
    'Sancocha las papas con cáscara y déjalas enfriar antes de pelar.',
    'Tuesta el maní en una sartén seca hasta que huela; sin aceite y sin quemarlo.',
    'Sofríe cebolla y ajo con ají amarillo hasta que estén bien cocidos.',
    'Licúa el sofrito con el maní, queso fresco, galletas de soda y leche hasta obtener una crema espesa y verdosa.',
    'Ajusta el espesor con leche: debe quedar más densa que la huancaína.',
    'Corta las papas en rodajas gruesas y báñalas con la ocopa.',
    'Sirve fría, sobre lechuga, con huevo duro y aceituna.'
  ], 30, 4, 'media', array['peruano','arequipa','entrada','frio'], 450),

  ('escabeche-de-pollo', 'Escabeche de pollo', array[
    'Sazona las presas con sal, pimienta y comino, pásalas por harina y fríelas hasta dorar. Resérvalas.',
    'Corta la cebolla en gajos gruesos, no en pluma: en el escabeche la cebolla se come.',
    'En la misma sartén sofríe ajo y pasta de ají amarillo; agrega orégano restregado entre las manos.',
    'Echa la cebolla y saltéala solo hasta que pierda el filo crudo, tiene que quedar crocante.',
    'Agrega un buen chorro de vinagre y deja que evapore el golpe ácido a fuego alto.',
    'Devuelve el pollo, tapa y cocina 5 minutos para que agarre el sabor.',
    'Sirve tibio o frío sobre camote sancochado, con lechuga, huevo duro y aceituna.'
  ], 40, 4, 'media', array['peruano','criollo','pollo','vinagre'], 590),

  ('quinua-atamalada', 'Quinua atamalada', array[
    'Lava la quinua frotándola con las manos y cambiando el agua tres veces hasta que deje de salir espuma; así se va el amargor.',
    'Haz un aderezo con cebolla, ajo, pasta de ají amarillo y un toque de palillo.',
    'Agrega la quinua escurrida y remueve un minuto para que se impregne.',
    'Vierte caldo caliente (dos medidas por una de quinua) y deja hervir destapado.',
    'Cuando esté a medio cocer, agrega papa en cubos, zanahoria y arveja.',
    'Cocina removiendo de rato en rato hasta que quede cremosa, tipo risotto; si se seca, suelta con caldo.',
    'Fuera del fuego incorpora queso fresco en cubos y culantro picado, y sirve al toque.'
  ], 40, 4, 'facil', array['peruano','andino','quinua','vegetariano'], 430)
on conflict (slug) do update set
  title            = excluded.title,
  steps            = excluded.steps,
  time_min         = excluded.time_min,
  servings         = excluded.servings,
  difficulty       = excluded.difficulty,
  tags             = excluded.tags,
  kcal_per_serving = excluded.kcal_per_serving;

-- --------------------------------------------------------------------------
-- INGREDIENTES — el enlace receta ↔ catálogo.
-- `product_name` null = ingrediente que no está en el catálogo (huacatay,
-- pecanas, chicha de jora); la fila igual existe, solo queda sin product_id.
-- La subconsulta ordena por precio para que el enlace sea determinista cuando
-- el producto vive en varias tiendas.
-- --------------------------------------------------------------------------
insert into public.recipe_ingredients (recipe_id, product_id, name, qty, unit, is_optional)
select
  r.id,
  (select p.id from public.products p where p.name = v.product_name order by p.price asc, p.store asc limit 1),
  v.name,
  v.qty,
  v.unit,
  v.is_optional
from (
  values
    -- ají de gallina
    ('aji-de-gallina'::text, 'Pechuga de pollo'::text,                       'Pechuga de pollo'::text,      0.600::numeric, 'kg'::text,  false),
    ('aji-de-gallina', 'Papa amarilla',                          'Papa amarilla',               0.500, 'kg',  false),
    ('aji-de-gallina', 'Pan francés',                            'Pan francés',                 4.000, 'und', false),
    ('aji-de-gallina', 'Leche Gloria evaporada (lata 395 g)',     'Leche evaporada',             1.000, 'und', false),
    ('aji-de-gallina', 'Pasta de ají amarillo Alacena (100 g)',   'Pasta de ají amarillo',       1.000, 'und', false),
    ('aji-de-gallina', 'Cebolla roja',                           'Cebolla roja',                0.200, 'kg',  false),
    ('aji-de-gallina', 'Ajo pelado',                             'Ajo pelado',                  0.020, 'kg',  false),
    ('aji-de-gallina', 'Arroz Costeño extra',                    'Arroz',                       0.400, 'kg',  false),
    ('aji-de-gallina', 'Huevos pardos (paquete 15 und)',          'Huevos',                      2.000, 'und', false),
    ('aji-de-gallina', 'Aceituna botija',                        'Aceituna botija',             0.050, 'kg',  true),
    ('aji-de-gallina', 'Palillo Sibarita (20 g)',                'Palillo',                     1.000, 'und', true),

    -- lomo saltado
    ('lomo-saltado', 'Lomo fino de res',                         'Lomo fino de res',            0.600, 'kg',  false),
    ('lomo-saltado', 'Cebolla roja',                             'Cebolla roja',                0.300, 'kg',  false),
    ('lomo-saltado', 'Tomate italiano',                          'Tomate',                      0.300, 'kg',  false),
    ('lomo-saltado', 'Ají amarillo fresco',                      'Ají amarillo fresco',         0.100, 'kg',  false),
    ('lomo-saltado', 'Sillao Kikko (500 ml)',                    'Sillao',                      1.000, 'und', false),
    ('lomo-saltado', 'Vinagre tinto (500 ml)',                   'Vinagre tinto',               1.000, 'und', false),
    ('lomo-saltado', 'Papa blanca',                              'Papa blanca',                 0.600, 'kg',  false),
    ('lomo-saltado', 'Arroz Costeño extra',                      'Arroz',                       0.400, 'kg',  false),
    ('lomo-saltado', 'Culantro (atado)',                         'Culantro',                    1.000, 'und', false),
    ('lomo-saltado', 'Aceite vegetal Primor (900 ml)',           'Aceite vegetal',              1.000, 'und', false),
    ('lomo-saltado', 'Comino molido Sibarita (20 g)',            'Comino',                      1.000, 'und', false),

    -- saltado de pollo
    ('saltado-de-pollo', 'Pechuga de pollo',                     'Pechuga de pollo',            0.600, 'kg',  false),
    ('saltado-de-pollo', 'Cebolla roja',                         'Cebolla roja',                0.300, 'kg',  false),
    ('saltado-de-pollo', 'Tomate italiano',                      'Tomate',                      0.250, 'kg',  false),
    ('saltado-de-pollo', 'Ají amarillo fresco',                  'Ají amarillo fresco',         0.080, 'kg',  false),
    ('saltado-de-pollo', 'Sillao Kikko (500 ml)',                'Sillao',                      1.000, 'und', false),
    ('saltado-de-pollo', 'Papa blanca',                          'Papa blanca',                 0.500, 'kg',  false),
    ('saltado-de-pollo', 'Arroz Costeño extra',                  'Arroz',                       0.400, 'kg',  false),
    ('saltado-de-pollo', 'Culantro (atado)',                     'Culantro',                    1.000, 'und', false),

    -- arroz con pollo
    ('arroz-con-pollo', 'Pollo entero',                          'Pollo en presas',             1.200, 'kg',  false),
    ('arroz-con-pollo', 'Arroz Costeño extra',                   'Arroz',                       0.600, 'kg',  false),
    ('arroz-con-pollo', 'Culantro (atado)',                      'Culantro',                    2.000, 'und', false),
    ('arroz-con-pollo', 'Cebolla roja',                          'Cebolla roja',                0.200, 'kg',  false),
    ('arroz-con-pollo', 'Ajo pelado',                            'Ajo pelado',                  0.020, 'kg',  false),
    ('arroz-con-pollo', 'Pasta de ají amarillo Alacena (100 g)',  'Pasta de ají amarillo',       1.000, 'und', false),
    ('arroz-con-pollo', 'Arveja verde fresca',                   'Arveja verde',                0.200, 'kg',  false),
    ('arroz-con-pollo', 'Zanahoria',                             'Zanahoria',                   0.200, 'kg',  false),
    ('arroz-con-pollo', 'Pimiento rojo',                         'Pimiento rojo',               0.100, 'kg',  true),

    -- causa limeña
    ('causa-limena', 'Papa amarilla',                            'Papa amarilla',               1.000, 'kg',  false),
    ('causa-limena', 'Pasta de ají amarillo Alacena (100 g)',     'Pasta de ají amarillo',       1.000, 'und', false),
    ('causa-limena', 'Limón sutil',                              'Limón',                       0.200, 'kg',  false),
    ('causa-limena', 'Atún Florida en aceite (170 g)',            'Atún en conserva',            2.000, 'und', false),
    ('causa-limena', 'Mayonesa Alacena (400 g)',                 'Mayonesa',                    1.000, 'und', false),
    ('causa-limena', 'Palta fuerte',                             'Palta',                       0.400, 'kg',  false),
    ('causa-limena', 'Cebolla roja',                             'Cebolla roja',                0.100, 'kg',  false),
    ('causa-limena', 'Huevos pardos (paquete 15 und)',            'Huevos',                      2.000, 'und', true),
    ('causa-limena', 'Aceituna botija',                          'Aceituna botija',             0.050, 'kg',  true),

    -- ceviche
    ('ceviche', 'Filete de merluza',                             'Pescado en filete',           0.700, 'kg',  false),
    ('ceviche', 'Limón sutil',                                   'Limón',                       0.700, 'kg',  false),
    ('ceviche', 'Cebolla roja',                                  'Cebolla roja',                0.300, 'kg',  false),
    ('ceviche', 'Culantro (atado)',                              'Culantro',                    1.000, 'und', false),
    ('ceviche', 'Rocoto fresco',                                 'Rocoto',                      0.050, 'kg',  false),
    ('ceviche', 'Camote amarillo',                               'Camote',                      0.500, 'kg',  false),
    ('ceviche', 'Choclo desgranado',                             'Choclo',                      0.300, 'kg',  false),
    ('ceviche', 'Lechuga americana',                             'Lechuga',                     1.000, 'und', true),

    -- tallarín saltado
    ('tallarin-saltado', 'Fideos Don Vittorio spaghetti (500 g)', 'Fideos spaghetti',            1.000, 'paq', false),
    ('tallarin-saltado', 'Pechuga de pollo',                     'Pechuga de pollo',            0.500, 'kg',  false),
    ('tallarin-saltado', 'Cebolla roja',                         'Cebolla roja',                0.250, 'kg',  false),
    ('tallarin-saltado', 'Tomate italiano',                      'Tomate',                      0.250, 'kg',  false),
    ('tallarin-saltado', 'Ají amarillo fresco',                  'Ají amarillo fresco',         0.080, 'kg',  false),
    ('tallarin-saltado', 'Sillao Kikko (500 ml)',                'Sillao',                      1.000, 'und', false),
    ('tallarin-saltado', 'Vinagre tinto (500 ml)',               'Vinagre tinto',               1.000, 'und', false),
    ('tallarin-saltado', 'Culantro (atado)',                     'Culantro',                    1.000, 'und', false),

    -- sopa de lentejas
    ('sopa-de-lentejas', 'Lentejas',                             'Lentejas',                    0.500, 'kg',  false),
    ('sopa-de-lentejas', 'Cebolla roja',                         'Cebolla roja',                0.150, 'kg',  false),
    ('sopa-de-lentejas', 'Ajo pelado',                           'Ajo pelado',                  0.015, 'kg',  false),
    ('sopa-de-lentejas', 'Zanahoria',                            'Zanahoria',                   0.200, 'kg',  false),
    ('sopa-de-lentejas', 'Apio',                                 'Apio',                        1.000, 'und', false),
    ('sopa-de-lentejas', 'Papa blanca',                          'Papa blanca',                 0.400, 'kg',  false),
    ('sopa-de-lentejas', 'Pasta de ají panca Alacena (100 g)',    'Pasta de ají panca',          1.000, 'und', true),
    ('sopa-de-lentejas', 'Culantro (atado)',                     'Culantro',                    1.000, 'und', true),

    -- seco de pollo
    ('seco-de-pollo', 'Pollo entero',                            'Pollo en presas',             1.200, 'kg',  false),
    ('seco-de-pollo', 'Culantro (atado)',                        'Culantro',                    3.000, 'und', false),
    ('seco-de-pollo', 'Cebolla roja',                            'Cebolla roja',                0.200, 'kg',  false),
    ('seco-de-pollo', 'Ajo pelado',                              'Ajo pelado',                  0.020, 'kg',  false),
    ('seco-de-pollo', 'Pasta de ají amarillo Alacena (100 g)',    'Pasta de ají amarillo',       1.000, 'und', false),
    ('seco-de-pollo', 'Frejol canario',                          'Frejol canario',              0.400, 'kg',  false),
    ('seco-de-pollo', 'Zanahoria',                               'Zanahoria',                   0.200, 'kg',  false),
    ('seco-de-pollo', 'Arveja verde fresca',                     'Arveja verde',                0.200, 'kg',  false),
    ('seco-de-pollo', 'Arroz Costeño extra',                     'Arroz',                       0.400, 'kg',  false),
    ('seco-de-pollo', null,                                      'Chicha de jora',              0.200, 'L',   true),

    -- papa a la huancaína
    ('papa-a-la-huancaina', 'Papa amarilla',                     'Papa amarilla',               1.000, 'kg',  false),
    ('papa-a-la-huancaina', 'Queso fresco (500 g)',              'Queso fresco',                1.000, 'paq', false),
    ('papa-a-la-huancaina', 'Pasta de ají amarillo Alacena (100 g)', 'Pasta de ají amarillo',    1.000, 'und', false),
    ('papa-a-la-huancaina', 'Leche Gloria evaporada (lata 395 g)', 'Leche evaporada',            1.000, 'und', false),
    ('papa-a-la-huancaina', 'Galletas Soda Field (paquete 6)',    'Galletas de soda',            1.000, 'paq', false),
    ('papa-a-la-huancaina', 'Cebolla roja',                      'Cebolla roja',                0.100, 'kg',  false),
    ('papa-a-la-huancaina', 'Huevos pardos (paquete 15 und)',     'Huevos',                      2.000, 'und', true),
    ('papa-a-la-huancaina', 'Lechuga americana',                 'Lechuga',                     1.000, 'und', true),

    -- tortilla de verduras
    ('tortilla-de-verduras', 'Huevos pardos (paquete 15 und)',    'Huevos',                      6.000, 'und', false),
    ('tortilla-de-verduras', 'Espinaca (bolsa 250 g)',           'Espinaca',                    1.000, 'paq', false),
    ('tortilla-de-verduras', 'Zanahoria',                        'Zanahoria',                   0.150, 'kg',  false),
    ('tortilla-de-verduras', 'Cebolla china (atado)',            'Cebolla china',               1.000, 'und', false),
    ('tortilla-de-verduras', 'Aceite vegetal Primor (900 ml)',   'Aceite vegetal',              1.000, 'und', false),
    ('tortilla-de-verduras', 'Sal de mesa Emsal (1 kg)',         'Sal',                         1.000, 'und', false),

    -- arroz chaufa
    ('arroz-chaufa', 'Arroz Costeño extra',                      'Arroz cocido del día anterior', 0.500, 'kg', false),
    ('arroz-chaufa', 'Pechuga de pollo',                         'Pechuga de pollo',            0.400, 'kg',  false),
    ('arroz-chaufa', 'Huevos pardos (paquete 15 und)',            'Huevos',                      3.000, 'und', false),
    ('arroz-chaufa', 'Cebolla china (atado)',                    'Cebolla china',               2.000, 'und', false),
    ('arroz-chaufa', 'Sillao Kikko (500 ml)',                    'Sillao',                      1.000, 'und', false),
    ('arroz-chaufa', 'Aceite vegetal Primor (900 ml)',           'Aceite vegetal',              1.000, 'und', false),

    -- estofado de pollo
    ('estofado-de-pollo', 'Pollo entero',                        'Pollo en presas',             1.200, 'kg',  false),
    ('estofado-de-pollo', 'Cebolla roja',                        'Cebolla roja',                0.200, 'kg',  false),
    ('estofado-de-pollo', 'Tomate italiano',                     'Tomate',                      0.400, 'kg',  false),
    ('estofado-de-pollo', 'Zanahoria',                           'Zanahoria',                   0.250, 'kg',  false),
    ('estofado-de-pollo', 'Papa amarilla',                       'Papa amarilla',               0.600, 'kg',  false),
    ('estofado-de-pollo', 'Arveja verde fresca',                 'Arveja verde',                0.200, 'kg',  false),
    ('estofado-de-pollo', 'Pasta de ají panca Alacena (100 g)',   'Pasta de ají panca',          1.000, 'und', false),
    ('estofado-de-pollo', 'Arroz Costeño extra',                 'Arroz',                       0.400, 'kg',  false),

    -- ocopa
    ('ocopa', 'Papa amarilla',                                   'Papa amarilla',               1.000, 'kg',  false),
    ('ocopa', 'Maní salado (200 g)',                             'Maní tostado',                1.000, 'paq', false),
    ('ocopa', 'Queso fresco (500 g)',                            'Queso fresco',                1.000, 'paq', false),
    ('ocopa', 'Pasta de ají amarillo Alacena (100 g)',            'Pasta de ají amarillo',       1.000, 'und', false),
    ('ocopa', 'Galletas Soda Field (paquete 6)',                  'Galletas de soda',            1.000, 'paq', false),
    ('ocopa', 'Leche Gloria evaporada (lata 395 g)',              'Leche evaporada',             1.000, 'und', false),
    ('ocopa', 'Cebolla roja',                                    'Cebolla roja',                0.100, 'kg',  false),
    ('ocopa', null,                                              'Huacatay',                    1.000, 'und', true),

    -- escabeche de pollo
    ('escabeche-de-pollo', 'Pollo entero',                       'Pollo en presas',             1.200, 'kg',  false),
    ('escabeche-de-pollo', 'Cebolla roja',                       'Cebolla roja',                0.600, 'kg',  false),
    ('escabeche-de-pollo', 'Vinagre tinto (500 ml)',             'Vinagre tinto',               1.000, 'und', false),
    ('escabeche-de-pollo', 'Pasta de ají amarillo Alacena (100 g)', 'Pasta de ají amarillo',     1.000, 'und', false),
    ('escabeche-de-pollo', 'Orégano Sibarita (12 g)',            'Orégano',                     1.000, 'und', false),
    ('escabeche-de-pollo', 'Harina Blanca Flor sin preparar (1 kg)', 'Harina sin preparar',      0.150, 'kg',  false),
    ('escabeche-de-pollo', 'Camote amarillo',                    'Camote',                      0.500, 'kg',  false),
    ('escabeche-de-pollo', 'Huevos pardos (paquete 15 und)',      'Huevos',                      2.000, 'und', true),
    ('escabeche-de-pollo', 'Aceituna botija',                    'Aceituna botija',             0.050, 'kg',  true),

    -- quinua atamalada
    ('quinua-atamalada', 'Quinua perlada',                       'Quinua perlada',              0.400, 'kg',  false),
    ('quinua-atamalada', 'Papa amarilla',                        'Papa amarilla',               0.400, 'kg',  false),
    ('quinua-atamalada', 'Zanahoria',                            'Zanahoria',                   0.200, 'kg',  false),
    ('quinua-atamalada', 'Arveja verde fresca',                  'Arveja verde',                0.200, 'kg',  false),
    ('quinua-atamalada', 'Queso fresco (500 g)',                 'Queso fresco',                1.000, 'paq', false),
    ('quinua-atamalada', 'Cebolla roja',                         'Cebolla roja',                0.150, 'kg',  false),
    ('quinua-atamalada', 'Pasta de ají amarillo Alacena (100 g)', 'Pasta de ají amarillo',       1.000, 'und', false),
    ('quinua-atamalada', 'Culantro (atado)',                     'Culantro',                    1.000, 'und', true)
) as v(recipe_slug, product_name, name, qty, unit, is_optional)
join public.recipes r on r.slug = v.recipe_slug
on conflict (recipe_id, name) do update set
  product_id  = excluded.product_id,
  qty         = excluded.qty,
  unit        = excluded.unit,
  is_optional = excluded.is_optional;

-- --------------------------------------------------------------------------
-- PRECIOS FRESCOS (caché) — unas cuantas capturas "recientes" para que el
-- comparador arranque con el camino de snapshot fresco y no solo con el
-- fallback al catálogo. Se borra y se rehace: los snapshots son caché, no
-- historia, y así el seed sigue siendo idempotente.
-- --------------------------------------------------------------------------
delete from public.price_snapshots where source = 'dataset';

insert into public.price_snapshots (product_key, store, price, unit, source, fetched_at)
select p.product_key, p.store, p.price, p.unit, 'dataset', now()
from public.products p
where p.product_key in (
  'pollo-entero', 'papa-amarilla', 'arroz-costeno', 'aceite-primor',
  'leche-gloria', 'atun-florida', 'inca-kola-15', 'fideos-don-vittorio',
  'palta-fuerte', 'limon'
);
