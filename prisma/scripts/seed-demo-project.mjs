/**
 * Seed de un proyecto demo en el workspace Trinova.
 *
 * Crea:
 *   - 1 Project "Coralia Tower" (Punta Cana, en construcción)
 *   - 10 Buildings (Torre A..J), 5 pisos cada uno, 4 unidades por piso
 *   - 200 Units con precios y estados variados realistas
 *
 * Idempotente: si el Project demo ya existe, lo borra primero (con sus units +
 * buildings) y lo recrea desde cero. Esto es seguro porque NO toca otros
 * proyectos del workspace.
 *
 * USO:
 *   npm run seed:demo
 */
import { PrismaClient } from '@prisma/client'

const DEMO_NAME = 'Coralia Tower'
const TRINOVA_SLUG = 'trinova'

const db = new PrismaClient({ log: ['warn', 'error'] })

// ---------------- Helpers ----------------

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

const TOWERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

// Unit type distribution by floor (5 floors total, 4 units per floor = 20 per tower)
// floor 1-2: cheap (Estudios + 1 Hab)
// floor 3: 2 Hab + Estudios
// floor 4: 2 Hab + 3 Hab
// floor 5 (penthouse): 3 Hab + Penthouse
function unitTypesForFloor(floor) {
  if (floor <= 2) return ['Estudio', 'Estudio', '1 Hab', '1 Hab']
  if (floor === 3) return ['1 Hab', '2 Hab', '2 Hab', 'Estudio']
  if (floor === 4) return ['2 Hab', '2 Hab', '3 Hab', '3 Hab']
  return ['3 Hab', '3 Hab', 'Penthouse', 'Penthouse']
}

function basePriceFor(type) {
  switch (type) {
    case 'Estudio':
      return rand(90_000, 120_000)
    case '1 Hab':
      return rand(120_000, 180_000)
    case '2 Hab':
      return rand(180_000, 240_000)
    case '3 Hab':
      return rand(240_000, 300_000)
    case 'Penthouse':
      return rand(280_000, 350_000)
    default:
      return rand(150_000, 250_000)
  }
}

function squareMetersFor(type) {
  switch (type) {
    case 'Estudio':
      return rand(38, 55)
    case '1 Hab':
      return rand(55, 75)
    case '2 Hab':
      return rand(75, 110)
    case '3 Hab':
      return rand(110, 160)
    case 'Penthouse':
      return rand(160, 230)
    default:
      return 100
  }
}

function bedroomsFor(type) {
  if (type === 'Estudio') return 0
  if (type === '1 Hab') return 1
  if (type === '2 Hab') return 2
  if (type === '3 Hab' || type === 'Penthouse') return 3
  return 1
}

function bathroomsFor(type) {
  if (type === 'Estudio') return 1
  if (type === '1 Hab') return 1.5
  if (type === '2 Hab') return 2
  if (type === '3 Hab') return 2.5
  if (type === 'Penthouse') return 3
  return 2
}

// Distribution of states across 200 units:
// ~50% DISPONIBLE, ~25% RESERVADA, ~20% VENDIDA, ~5% BLOQUEADA
function statusFor() {
  const r = Math.random()
  if (r < 0.5) return 'DISPONIBLE'
  if (r < 0.75) return 'RESERVADA'
  if (r < 0.95) return 'VENDIDA'
  return 'BLOQUEADA'
}

const VIEWS = ['MAR', 'PISCINA', 'JARDIN', 'CIUDAD', 'INTERIOR']
const ORIENTATIONS = ['NORTE', 'SUR', 'ESTE', 'OESTE', 'NE', 'NO', 'SE', 'SO']

// ---------------- Main ----------------

async function main() {
  console.log(`=== Seed demo: ${DEMO_NAME} ===\n`)

  const trinova = await db.workspace.findUnique({ where: { slug: TRINOVA_SLUG } })
  if (!trinova) {
    throw new Error(`Workspace "${TRINOVA_SLUG}" no encontrado. Corre primero npm run db:seed.`)
  }

  // Idempotencia: borrar proyecto demo previo (con cascada).
  const existing = await db.project.findFirst({
    where: { workspaceId: trinova.id, name: DEMO_NAME, deletedAt: null },
    select: { id: true },
  })
  if (existing) {
    console.log('[*] Proyecto demo encontrado, eliminando units/buildings previos...')
    await db.unit.deleteMany({ where: { projectId: existing.id } })
    await db.building.deleteMany({ where: { projectId: existing.id } })
    await db.project.delete({ where: { id: existing.id } })
    console.log('    ✓ Limpieza completa\n')
  }

  // 1. Project
  console.log('[1] Creando Project')
  const project = await db.project.create({
    data: {
      workspaceId: trinova.id,
      name: DEMO_NAME,
      type: 'RESIDENCIAL',
      location: 'Punta Cana, La Altagracia',
      address: 'Av. Estados Unidos, Bávaro',
      province: 'La Altagracia',
      city: 'Punta Cana',
      sector: 'Bávaro',
      amenities: [
        'Piscina',
        'Casa Club',
        'Centro comercial',
        'Spa',
        'Vista al Mar',
        'Cancha de Tenis',
        'Balcón',
        'Administración de alquileres',
        'Gimnasio',
        'Seguridad 24/7',
        'Estacionamiento',
        'Áreas verdes',
      ],
      status: 'EN_CONSTRUCCION',
      progressPercent: 42,
      startDate: new Date('2024-02-15'),
      expectedDeliveryDate: new Date('2027-06-30'),
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
      ],
    },
  })
  console.log(`    ✓ ${project.name} (id=${project.id})\n`)

  // 2. Buildings
  console.log('[2] Creando 10 Buildings (Torre A..J)')
  const buildings = []
  for (const letter of TOWERS) {
    const b = await db.building.create({
      data: {
        workspaceId: trinova.id,
        projectId: project.id,
        name: `Torre ${letter}`,
        numberOfFloors: 5,
        unitsPerFloor: 4,
        description: `Edificio Torre ${letter} de ${DEMO_NAME}`,
        status: 'EN_CONSTRUCCION',
        expectedDeliveryDate: new Date('2027-06-30'),
      },
    })
    buildings.push(b)
  }
  console.log(`    ✓ ${buildings.length} edificios creados\n`)

  // 3. Units
  console.log('[3] Creando 200 Units (20 por torre)')
  let count = { DISPONIBLE: 0, RESERVADA: 0, VENDIDA: 0, BLOQUEADA: 0 }
  let totalPrice = 0
  let minPrice = Infinity
  let maxPrice = -Infinity

  for (const b of buildings) {
    const towerLetter = b.name.split(' ')[1]
    for (let floor = 1; floor <= 5; floor++) {
      const types = unitTypesForFloor(floor)
      for (let idx = 0; idx < 4; idx++) {
        const letter = String.fromCharCode(65 + idx) // A, B, C, D
        const type = types[idx]
        const price = basePriceFor(type)
        const status = statusFor()
        count[status] += 1
        totalPrice += price
        minPrice = Math.min(minPrice, price)
        maxPrice = Math.max(maxPrice, price)

        await db.unit.create({
          data: {
            workspaceId: trinova.id,
            projectId: project.id,
            buildingId: b.id,
            unitNumber: `${towerLetter}-${floor}${letter}`,
            floor,
            type,
            bedrooms: bedroomsFor(type),
            bathrooms: bathroomsFor(type),
            squareMeters: squareMetersFor(type),
            terraceSquareMeters: type === 'Penthouse' ? rand(20, 50) : null,
            basePrice: price,
            currentPrice: price,
            view: pick(VIEWS),
            orientation: pick(ORIENTATIONS),
            specialFeatures: type === 'Penthouse' ? ['Terraza panorámica', 'Esquinero'] : [],
            status,
          },
        })
      }
    }
  }

  console.log('    ✓ 200 unidades creadas\n')

  await db.$disconnect()

  console.log('=== Resumen ===')
  console.log(`Workspace:       ${trinova.name} (${trinova.slug})`)
  console.log(`Project:         ${project.name}`)
  console.log(`Edificios:       ${buildings.length}`)
  console.log(`Unidades:        200`)
  console.log('  Disponibles:   ', count.DISPONIBLE)
  console.log('  Reservadas:    ', count.RESERVADA)
  console.log('  Vendidas:      ', count.VENDIDA)
  console.log('  Bloqueadas:    ', count.BLOQUEADA)
  console.log(`Precios:         $${minPrice.toLocaleString('en-US')} – $${maxPrice.toLocaleString('en-US')}`)
  console.log(`Avg:             $${Math.round(totalPrice / 200).toLocaleString('en-US')}`)
  console.log(`Total catálogo:  $${totalPrice.toLocaleString('en-US')}`)
  console.log('')
  console.log('Visita http://localhost:3000/desarrollo/proyectos')
}

main().catch((e) => {
  console.error('Seed demo falló:', e)
  process.exit(1)
})
