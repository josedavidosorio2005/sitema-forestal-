import db from '../config/database.js';

const demoSpecies = [
  {
    common_name: 'Cedro rojo',
    scientific_name: 'Cedrela odorata',
    type: 'nativa',
    category: 'maderable',
    description: 'Arbol tropical maderable presente en bosques humedos.',
    region: 'Caribe Andes Amazonia',
    observations: 'Sujeto a manejo responsable por presion historica de tala.',
  },
  {
    common_name: 'Guayacan amarillo',
    scientific_name: 'Handroanthus chrysanthus',
    type: 'nativa',
    category: 'restauracion',
    description: 'Arbol ornamental y nativo reconocido por su floracion amarilla.',
    region: 'Andes Caribe zonas secas',
    observations: 'Frecuente en restauracion urbana y corredores biologicos.',
  },
  {
    common_name: 'Nogal cafetero',
    scientific_name: 'Cordia alliodora',
    type: 'nativa',
    category: 'maderable',
    description: 'Especie usada en sistemas agroforestales y sombra para cultivos.',
    region: 'Andes zona cafetera tropico humedo',
    observations: 'Buena opcion para paisajes productivos mixtos.',
  },
  {
    common_name: 'Eucalipto',
    scientific_name: 'Eucalyptus globulus',
    type: 'introducida',
    category: 'maderable',
    description: 'Especie introducida de crecimiento rapido usada en plantaciones.',
    region: 'Andes zonas frias templadas',
    observations: 'Evaluar consumo hidrico y contexto ecologico antes de ampliar.',
  },
  {
    common_name: 'Acacia mangium',
    scientific_name: 'Acacia mangium',
    type: 'comercial',
    category: 'restauracion',
    description: 'Especie comercial usada en restauracion productiva y madera.',
    region: 'Tropico humedo Orinoquia Amazonia',
    observations: 'Requiere manejo para evitar expansion no deseada.',
  },
];

async function seed() {
  try {
    console.log('Seeding demo data...');

    await db.query(
      `
        INSERT INTO users (username, email, password_hash, full_name)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING;
      `,
      ['admin', 'admin@forest.local', 'demo-password-hash', 'Usuario Demo']
    );

    const userResult = await db.query('SELECT id FROM users WHERE username = $1;', ['admin']);
    const userId = userResult.rows[0]?.id || 1;

    for (const species of demoSpecies) {
      const existing = await db.query(
        `
          SELECT id FROM species
          WHERE user_id = $1 AND lower(common_name) = lower($2) AND deleted_at IS NULL;
        `,
        [userId, species.common_name]
      );

      if (existing.rows.length > 0) continue;

      await db.query(
        `
          INSERT INTO species (
            user_id,
            common_name,
            scientific_name,
            type,
            category,
            description,
            region,
            image_url,
            observations
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `,
        [
          userId,
          species.common_name,
          species.scientific_name,
          species.type,
          species.category,
          species.description,
          species.region,
          null,
          species.observations,
        ]
      );
    }

    console.log('Seed completed.');
    await db.closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    await db.closeDatabase();
    process.exit(1);
  }
}

seed();
