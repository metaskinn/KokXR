/** Mokap ekranlarının görünür etiketi: gösterilen içerik gerçek kayıt değildir. */
export default function DemoEtiketi({ metin = 'Demo · örnek veri' }: { metin?: string }) {
  return <p className="demo-etiketi" style={{
    display: 'inline-block', margin: '0 0 1rem', padding: '0.25rem 0.75rem', borderRadius: '999px',
    background: 'var(--bronz)', color: '#fff', fontSize: '0.875rem', fontWeight: 600,
  }}>{metin}</p>
}
