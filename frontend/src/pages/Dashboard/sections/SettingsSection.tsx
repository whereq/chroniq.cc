import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meApi, type Profile } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { ARCHETYPES, PORTRAITS, NATIVE_PREFIX, resolveAvatarValue, type NativeAvatar } from '@/utils/avatars'
import { useAvatar } from '@/contexts/useAvatarContext'

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

// Avatar cropping constants (ported from flowdesk).
const CROP_SIZE = 256
const OUTPUT_SIZE = 128
const MAX_BYTES = 16_384
const BRAND = '#6366f1'

export function SettingsSection() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { setValue: setAvatarValue } = useAvatar()
  const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: meApi.getProfile })
  const [form, setForm] = useState<Partial<Profile>>({})

  useEffect(() => {
    if (profile) setForm(profile)
  }, [profile])

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Profile>) => meApi.updateProfile(data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      setAvatarValue(updated.avatar_url ?? null) // live-update the header avatar
    },
  })

  if (isLoading) return <p className="text-gray-400 text-sm">{t('common.loading')}</p>

  const bookingUrl = `${window.location.origin}/${form.username ?? ''}`

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('dashboard.settings.title')}</h2>

      <div className="space-y-4">
        <Field label={t('dashboard.settings.avatar', 'Avatar')}>
          <AvatarEditor
            currentValue={form.avatar_url ?? ''}
            onChange={(v) => setForm((s) => ({ ...s, avatar_url: v || null }))}
          />
        </Field>
        <Field label={t('dashboard.settings.username')}>
          <input className={inputCls} value={form.username ?? ''} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} />
          <p className="text-xs text-gray-400 mt-1">{bookingUrl}</p>
        </Field>
        <Field label={t('dashboard.settings.display_name')}>
          <input className={inputCls} value={form.display_name ?? ''} onChange={(e) => setForm((s) => ({ ...s, display_name: e.target.value }))} />
        </Field>
        <Field label={t('dashboard.settings.timezone')}>
          <input className={inputCls} value={form.timezone ?? ''} onChange={(e) => setForm((s) => ({ ...s, timezone: e.target.value }))} />
        </Field>
        <Field label={t('dashboard.settings.brand_color')}>
          <input type="color" value={form.brand_color ?? '#6366f1'} onChange={(e) => setForm((s) => ({ ...s, brand_color: e.target.value }))} className="h-9 w-16 rounded border border-gray-300 dark:border-gray-600" />
        </Field>
        <Field label={t('dashboard.settings.bio')}>
          <textarea rows={3} className={inputCls} value={form.bio ?? ''} onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))} />
        </Field>
      </div>

      {saveMutation.isError && <p className="text-sm text-red-500 mt-2">{t('dashboard.settings.save_error')}</p>}
      <div className="mt-5 flex items-center gap-3">
        <Button size="sm" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
          {saveMutation.isPending ? t('common.saving') : t('common.save')}
        </Button>
        {saveMutation.isSuccess && <span className="text-sm text-green-500">{t('common.saved')}</span>}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  )
}

// ── Avatar editor (ported from flowdesk.top) ─────────────────────────────────

interface AvatarEditorProps {
  currentValue: string
  onChange: (value: string) => void
}

function AvatarEditor({ currentValue, onChange }: AvatarEditorProps) {
  const { t } = useTranslation()
  const { ssoPicture } = useAvatar()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(currentValue)
  const [uiState, setUiState] = useState<'idle' | 'cropping' | 'uploading'>('idle')
  const [showPicker, setShowPicker] = useState(false)

  // Cropper state
  const [cropObjectUrl, setCropObjectUrl] = useState('')
  const [scale, setScale] = useState(1)
  const [minScale, setMinScale] = useState(1)
  const [imgLeft, setImgLeft] = useState(0)
  const [imgTop, setImgTop] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null)

  const sourceImgRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null)
  const liveRef = useRef({ scale: 1, imgLeft: 0, imgTop: 0 })
  useLayoutEffect(() => { liveRef.current = { scale, imgLeft, imgTop } }, [scale, imgLeft, imgTop])

  useEffect(() => { setPreview(currentValue) }, [currentValue])

  const strings = {
    uploadPhoto: t('avatar.upload_photo', 'Upload photo'),
    changePhoto: t('avatar.change_photo', 'Change photo'),
    remove: t('avatar.remove', 'Remove'),
    apply: t('avatar.apply', 'Apply'),
    cancel: t('avatar.cancel', 'Cancel'),
    cropHint: t('avatar.crop_hint', 'Drag to reposition · scroll to zoom'),
    hint: t('avatar.hint', 'JPG · PNG · GIF · max 16 KB'),
    pick: t('avatar.pick', 'chroniq avatars'),
    useSignin: t('avatar.use_signin', 'Use sign-in photo'),
    archetypes: t('avatar.archetypes', 'Archetypes'),
    portraits: t('avatar.portraits', 'Portraits'),
  }

  const selectNative = (key: string) => {
    const v = `${NATIVE_PREFIX}${key}`
    setPreview(v)
    onChange(v)
    setShowPicker(false)
  }

  function clamp(left: number, top: number, sc: number): [number, number] {
    const img = sourceImgRef.current
    if (!img) return [left, top]
    return [
      Math.min(0, Math.max(CROP_SIZE - img.naturalWidth * sc, left)),
      Math.min(0, Math.max(CROP_SIZE - img.naturalHeight * sc, top)),
    ]
  }

  function applyZoom(newScale: number) {
    const img = sourceImgRef.current
    if (!img) return
    const { scale: sc, imgLeft: l, imgTop: tp } = liveRef.current
    const cx = CROP_SIZE / 2
    const relX = (cx - l) / (img.naturalWidth * sc)
    const relY = (cx - tp) / (img.naturalHeight * sc)
    const [nl, nt] = clamp(
      cx - relX * img.naturalWidth * newScale,
      cx - relY * img.naturalHeight * newScale,
      newScale,
    )
    liveRef.current = { scale: newScale, imgLeft: nl, imgTop: nt }
    setScale(newScale)
    setImgLeft(nl)
    setImgTop(nt)
  }

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      if (!dragRef.current) return
      const { scale: sc } = liveRef.current
      const [nl, nt] = clamp(
        dragRef.current.startLeft + clientX - dragRef.current.startX,
        dragRef.current.startTop + clientY - dragRef.current.startY,
        sc,
      )
      setImgLeft(nl)
      setImgTop(nt)
    }
    const onUp = () => { setIsDragging(false); dragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }, [isDragging])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileRef.current) fileRef.current.value = ''
    const objUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const ms = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight)
      sourceImgRef.current = img
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
      setCropObjectUrl(objUrl)
      setMinScale(ms)
      setScale(ms)
      setImgLeft((CROP_SIZE - img.naturalWidth * ms) / 2)
      setImgTop((CROP_SIZE - img.naturalHeight * ms) / 2)
      setUiState('cropping')
    }
    img.onerror = () => URL.revokeObjectURL(objUrl)
    img.src = objUrl
  }

  const cleanupCrop = () => {
    if (cropObjectUrl) URL.revokeObjectURL(cropObjectUrl)
    setCropObjectUrl('')
    sourceImgRef.current = null
    setNaturalSize(null)
  }

  const handleApply = () => {
    const img = sourceImgRef.current
    if (!img) return
    setUiState('uploading')

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')!
    const { scale: sc, imgLeft: l, imgTop: tp } = liveRef.current
    ctx.drawImage(img, -l / sc, -tp / sc, CROP_SIZE / sc, CROP_SIZE / sc, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

    let quality = 0.85
    let dataUrl = canvas.toDataURL('image/jpeg', quality)
    while (dataUrl.length * 0.75 > MAX_BYTES && quality > 0.1) {
      quality -= 0.05
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }

    cleanupCrop()
    setPreview(dataUrl)
    onChange(dataUrl)
    setUiState('idle')
  }

  const handleCancel = () => { cleanupCrop(); setUiState('idle') }
  const handleRemove = () => { setPreview(''); onChange('') }

  const onDragStart = (e: ReactMouseEvent | ReactTouchEvent) => {
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragRef.current = { startX: clientX, startY: clientY, startLeft: imgLeft, startTop: imgTop }
    setIsDragging(true)
  }

  const overrideUrl = resolveAvatarValue(preview)
  const displayUrl = overrideUrl || ssoPicture || ''
  const hasOverride = !!overrideUrl
  const hasImage = !!displayUrl

  const smallBtn =
    'px-4 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-brand-600 hover:border-brand-500 transition-colors'
  const textBtn =
    'px-4 py-1.5 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors'

  // ── Cropping UI ──
  if (uiState === 'cropping' || uiState === 'uploading') {
    return (
      <div className="flex flex-col gap-3" style={{ maxWidth: CROP_SIZE }}>
        <p className="text-xs text-gray-500 dark:text-gray-400">{strings.cropHint}</p>
        <div
          className="relative select-none"
          style={{
            width: CROP_SIZE, height: CROP_SIZE, borderRadius: '50%',
            overflow: 'hidden', border: `2px solid ${BRAND}`, background: '#000',
            cursor: uiState === 'uploading' ? 'default' : isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={uiState !== 'uploading' ? onDragStart : undefined}
          onTouchStart={uiState !== 'uploading' ? onDragStart : undefined}
          onWheel={(e) => {
            if (uiState === 'uploading') return
            const step = minScale * 0.08
            applyZoom(Math.min(Math.max(liveRef.current.scale + (e.deltaY < 0 ? step : -step), minScale), minScale * 4))
          }}
        >
          {cropObjectUrl && (
            <img
              src={cropObjectUrl}
              draggable={false}
              alt=""
              style={{
                position: 'absolute', left: imgLeft, top: imgTop, pointerEvents: 'none',
                width: naturalSize ? naturalSize.width * scale : 'auto',
                height: naturalSize ? naturalSize.height * scale : 'auto',
              }}
            />
          )}
        </div>
        {uiState !== 'uploading' && (
          <>
            <div className="flex items-center gap-2">
              <button type="button" className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 text-gray-500 text-base" onClick={() => applyZoom(Math.max(liveRef.current.scale - minScale * 0.1, minScale))}>−</button>
              <input type="range" min={0} max={100} step={1} className="flex-1" style={{ accentColor: BRAND }} value={Math.round((scale - minScale) / (minScale * 3) * 100)} onChange={(e) => applyZoom(minScale + parseInt(e.target.value) / 100 * minScale * 3)} />
              <button type="button" className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 text-gray-500 text-base" onClick={() => applyZoom(Math.min(liveRef.current.scale + minScale * 0.1, minScale * 4))}>+</button>
            </div>
            <div className="flex gap-2">
              <button type="button" className="px-4 py-1 rounded-lg text-sm font-semibold bg-brand-600 text-white" onClick={handleApply}>{strings.apply}</button>
              <button type="button" className={textBtn} onClick={handleCancel}>{strings.cancel}</button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Idle UI ──
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-5">
        <div
          className="shrink-0 flex items-center justify-center overflow-hidden"
          style={{
            width: 80, height: 80, borderRadius: '50%',
            border: `2px solid ${hasImage ? BRAND : 'var(--border, #d1d5db)'}`,
            background: 'var(--surface-2, #f3f4f6)', transition: 'border-color 0.2s',
          }}
        >
          {hasImage ? (
            <img src={displayUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setPreview('')} />
          ) : (
            <svg viewBox="0 0 40 40" width={40} height={40} fill="#9ca3af">
              <circle cx="20" cy="14" r="8" />
              <ellipse cx="20" cy="36" rx="14" ry="10" />
            </svg>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className={smallBtn}>
            {hasOverride ? strings.changePhoto : strings.uploadPhoto}
          </button>
          <button type="button" onClick={() => setShowPicker((v) => !v)} className={smallBtn}>
            {strings.pick}
          </button>
          {ssoPicture && hasOverride && (
            <button type="button" onClick={() => { setPreview(''); onChange('') }} className={textBtn}>
              {strings.useSignin}
            </button>
          )}
          {hasOverride && (
            <button type="button" onClick={handleRemove} className={textBtn}>
              {strings.remove}
            </button>
          )}
        </div>
      </div>

      {showPicker && (
        <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 flex flex-col gap-3">
          <NativePickerGroup label={strings.archetypes} items={ARCHETYPES} selected={preview} onPick={selectNative} />
          <NativePickerGroup label={strings.portraits} items={PORTRAITS} selected={preview} onPick={selectNative} />
        </div>
      )}

      <p className="text-xs text-gray-400 mt-1">{strings.hint}</p>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  )
}

function NativePickerGroup({
  label, items, selected, onPick,
}: {
  label: string
  items: NativeAvatar[]
  selected: string
  onPick: (key: string) => void
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: 8 }}>
        {items.map((a) => {
          const isSel = selected === `${NATIVE_PREFIX}${a.key}`
          return (
            <button
              key={a.key}
              type="button"
              title={a.label}
              onClick={() => onPick(a.key)}
              style={{
                padding: 0, borderRadius: '50%', cursor: 'pointer', lineHeight: 0,
                border: `2px solid ${isSel ? BRAND : 'transparent'}`,
              }}
            >
              <img
                src={a.url}
                alt={a.label}
                width={44}
                height={44}
                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
