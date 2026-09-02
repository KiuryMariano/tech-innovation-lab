import { Link } from 'react-router'
import './Menu.css'

interface Activity {
  title: string
  description: string
  to: string
  available: boolean
}

const ACTIVITIES: Activity[] = [
  {
    title: 'YOLO Video Analytics',
    description: 'Detecção de pessoas e objetos em vídeos do YouTube com YOLO, em tempo real.',
    to: '/yolo-analytics',
    available: true,
  },
]

const NEXT_SLOT: Activity = {
  title: 'Em breve',
  description: 'A próxima atividade da disciplina aparecerá aqui.',
  to: '#',
  available: false,
}

function ActivityCard({ activity }: { activity: Activity }) {
  if (!activity.available) {
    return (
      <button className="activity-card" disabled>
        <span className="activity-title">{activity.title}</span>
        <span className="activity-description">{activity.description}</span>
      </button>
    )
  }
  return (
    <Link className="activity-card" to={activity.to}>
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
        <ActivityCard activity={ACTIVITIES[0]} />
        <ActivityCard activity={NEXT_SLOT} />
      </nav>
    </main>
  )
}
