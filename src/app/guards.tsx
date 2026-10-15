import { Navigate, Outlet } from 'react-router-dom'
import { useActivePlayer } from '../stores/playerStore'

export function RequirePlayer() {
  const p = useActivePlayer()
  return p ? <Outlet /> : <Navigate to="/setup" replace />
}
