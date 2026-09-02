const TRANSLATIONS: Record<string, string> = {
  person: 'Pessoa',
  bicycle: 'Bicicleta',
  car: 'Carro',
  motorcycle: 'Motocicleta',
  bus: 'Ônibus',
  truck: 'Caminhão',
  dog: 'Cachorro',
  cat: 'Gato',
  bird: 'Pássaro',
  backpack: 'Mochila',
  handbag: 'Bolsa',
  suitcase: 'Mala',
  bottle: 'Garrafa',
  cup: 'Xícara',
  chair: 'Cadeira',
  couch: 'Sofá',
  bed: 'Cama',
  tv: 'Televisão',
  laptop: 'Notebook',
  'cell phone': 'Celular',
  'sports ball': 'Bola',
  umbrella: 'Guarda-chuva',
  book: 'Livro',
  clock: 'Relógio',
  cow: 'Vaca',
  horse: 'Cavalo',
  sheep: 'Ovelha',
  bear: 'Urso',
  giraffe: 'Girafa',
  elephant: 'Elefante',
  zebra: 'Zebra',
  frisbee: 'Disco voador',
  kite: 'Pipa',
  'teddy bear': 'Ursinho de pelúcia',
  apple: 'Maçã',
  banana: 'Banana',
  orange: 'Laranja',
  broccoli: 'Brócolis',
  carrot: 'Cenoura',
  'potted plant': 'Vaso de planta',
  scissors: 'Tesoura',
  airplane: 'Avião',
  boat: 'Barco',
  'traffic light': 'Semáforo',
  'fire hydrant': 'Hidrante',
  'stop sign': 'Placa de pare',
  'parking meter': 'Parquímetro',
  bench: 'Banco',
}

export function translateLabel(label: string): string {
  const known = TRANSLATIONS[label]
  if (known) return known
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const OBJECT_PALETTE = ['#38bdf8', '#4ade80', '#fbbf24', '#a78bfa', '#fb923c', '#2dd4bf']

export function labelColor(label: string): string {
  if (label === 'person') return '#f43f5e'
  let hash = 0
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) % 997
  }
  return OBJECT_PALETTE[hash % OBJECT_PALETTE.length]
}
