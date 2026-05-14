import { cn } from '@/lib/utils'
import { matchStylePack, STYLE_PACKS } from '@/themes/stylePacks'
import { useEditor } from '@/state/EditorContext'

export function StylePackPicker() {
  const { state, dispatch } = useEditor()
  const activePack = matchStylePack(state.cardThemeId, state.backgroundId, state.overlayId)

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {STYLE_PACKS.map((pack) => {
        const isActive = activePack?.id === pack.id
        return (
          <button
            key={pack.id}
            type="button"
            onClick={() => {
              dispatch({ type: 'setCardThemeId', payload: pack.themeId })
              dispatch({ type: 'setBackgroundId', payload: pack.backgroundId })
              dispatch({ type: 'setOverlayId', payload: pack.overlayId })
            }}
            className={cn(
              'group flex flex-col items-center gap-1 rounded-lg border p-1 transition-all hover:border-(--accent-ui)',
              isActive
                ? 'border-(--accent-ui) bg-(--accent-ui)/8'
                : 'border-(--border) bg-(--card-shell)',
            )}
            title={pack.label}
          >
            <div
              className="h-8 w-full rounded-md"
              style={{ background: pack.previewGradient }}
            />
            <span
              className={cn(
                'text-[10px] leading-tight',
                isActive ? 'text-(--accent-ui) font-medium' : 'text-(--muted-foreground)',
              )}
            >
              {pack.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
