import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meApi } from '@/api/client'
import { Button } from '@/components/ui/Button'

const PROVIDERS = [
  { id: 'google' as const, nameKey: 'dashboard.integrations.google', icon: '📅' },
  { id: 'microsoft' as const, nameKey: 'dashboard.integrations.microsoft', icon: '📆' },
]

export function IntegrationsSection() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['connections'],
    queryFn: meApi.listConnections,
  })

  const connectMutation = useMutation({
    mutationFn: (provider: 'google' | 'microsoft') => meApi.connect(provider),
    onSuccess: (data) => {
      window.location.href = data.authorize_url
    },
  })
  const disconnectMutation = useMutation({
    mutationFn: (id: number) => meApi.disconnect(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connections'] }),
  })

  if (isLoading) return <p className="text-gray-400 text-sm">{t('common.loading')}</p>

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{t('dashboard.integrations.title')}</h2>
      <p className="text-sm text-gray-500 mb-6">{t('dashboard.integrations.subtitle')}</p>

      <div className="space-y-3 max-w-lg">
        {PROVIDERS.map((p) => {
          const conn = connections.find((c) => c.provider === p.id)
          return (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t(p.nameKey)}</p>
                  {conn ? (
                    <p className="text-xs text-green-500">{t('dashboard.integrations.connected')}{conn.account_email ? ` · ${conn.account_email}` : ''}</p>
                  ) : (
                    <p className="text-xs text-gray-400">{t('dashboard.integrations.not_connected')}</p>
                  )}
                </div>
              </div>
              {conn ? (
                <button className="text-sm text-red-500 hover:underline" onClick={() => disconnectMutation.mutate(conn.id)}>
                  {t('dashboard.integrations.disconnect')}
                </button>
              ) : (
                <Button size="sm" disabled={connectMutation.isPending} onClick={() => connectMutation.mutate(p.id)}>
                  {t('dashboard.integrations.connect')}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
