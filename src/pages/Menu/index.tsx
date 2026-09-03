import { Link } from 'react-router'
import './Menu.css'

interface Activity {
  label: string
  title: string
  description: string
  to: string
  available: boolean
}

const ACTIVITIES: Activity[] = [
  {
    label: 'Atividade 1',
    title: 'YOLO Video Analytics',
    description: 'Detecção de pessoas e objetos em vídeos do YouTube com YOLO, em tempo real.',
    to: '/yolo-analytics',
    available: true,
  },
  {
    label: 'Atividade 2',
    title: 'Banco de Imagens',
    description: 'Upload de imagens com persistência em banco de dados (FastAPI + SQLite).',
    to: '/image-database',
    available: true,
  },
]

const NEXT_SLOT: Activity = {
  label: 'Atividade 3',
  title: 'Em breve',
  description: 'A próxima atividade da disciplina aparecerá aqui.',
  to: '#',
  available: false,
}

function ActivityCard({ activity }: { activity: Activity }) {
  if (!activity.available) {
    return (
      <button className="activity-card" disabled>
        <span className="activity-label">{activity.label}</span>
        <span className="activity-title">{activity.title}</span>
        <span className="activity-description">{activity.description}</span>
      </button>
    )
  }
  return (
    <Link className="activity-card" to={activity.to}>
      <span className="activity-label">{activity.label}</span>
      <span className="activity-title">{activity.title}</span>
      <span className="activity-description">{activity.description}</span>
    </Link>
  )
}

export default function MenuPage() {
  return (
    <main className="menu">
      <header className="menu-header">
        <h1 className="menu-title">Tech Innovation Lab</h1>
        <p className="menu-subtitle">Atividades da disciplina</p>
      </header>
      <nav className="menu-grid">
        {ACTIVITIES.map((activity) => (
          <ActivityCard key={activity.to} activity={activity} />
        ))}
        <ActivityCard activity={NEXT_SLOT} />
      </nav>
    </main>
  )
}
