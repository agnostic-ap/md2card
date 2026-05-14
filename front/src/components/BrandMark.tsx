export function BrandMark() {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        background: '#14110D',
        color: '#FAFAF7',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '-0.02em',
      }}>
        M2
      </div>
      <div style={{
        position: 'absolute',
        right: -3,
        bottom: -3,
        width: 10,
        height: 10,
        background: '#FF5C28',
        borderRadius: 3,
        border: '2px solid #FAFAF7',
      }} />
    </div>
  )
}
