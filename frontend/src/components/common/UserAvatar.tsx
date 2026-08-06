/**
 * Smart user avatar.
 * Priority: explicit avatar (uploaded photo, native pick, or SSO picture)
 *   → anonymous default (signed-in, no choice) → random anonymous pose (guest).
 * (Ported from flowdesk.top.)
 */
import { guestAvatar, ANON_DEFAULT } from '@/utils/avatars'

interface Props {
  avatar?: string | null
  isAuthenticated: boolean
  size?: number
}

export function UserAvatar({ avatar, isAuthenticated, size = 24 }: Props) {
  const src = avatar || (isAuthenticated ? ANON_DEFAULT : guestAvatar())
  return (
    <img
      src={src}
      alt=""
      className="avatar-circle"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        border: '1px solid var(--border)',
        background: 'var(--surface-2)',
        flexShrink: 0,
        display: 'block',
      }}
    />
  )
}

export default UserAvatar
