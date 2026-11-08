import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ROLE_LABELS } from '../../infrastructure/api'
import type { AuditRow, Role, Stats } from '../../infrastructure/api'
import { typesOf } from '../../content/artifactTypeIndex'
import { typeLabel } from '../../domain/artifactTypes'
import { ACTIONS, when } from './AdminPage'
import { useAdmin } from './context'

const nf = new Intl.NumberFormat('tr-TR')
const mb = (bytes: number) => `${nf.format(Math.round(bytes / 1e6))} MB`

/** Horizontal bars inside a real table: the numbers stay readable without the bars (screen readers, print). */
function BarTable({ caption, rows, total }: { caption: string; rows: [string, number][]; total: number }) {
  const max = Math.max(1, ...rows.map(([, n]) => n))
  return <table className="bar-table">
    <caption>{caption}</caption>
    <thead className="sr-only"><tr><th scope="col">Ad</th><th scope="col">Sayı</th><th scope="col">Pay</th></tr></thead>
    <tbody>{rows.map(([label, n]) => <tr key={label} title={`${label}: ${nf.format(n)} (%${Math.round((n / total) * 100)})`}>
      <th scope="row">{label}</th>
      <td className="bar-cell"><span className="bar" style={{ width: `${(n / max) * 100}%` }} /></td>
      <td className="num">{nf.format(n)}</td>
    </tr>)}</tbody>
  </table>
}

function Tile({ label, value, note, to }: { label: string; value: string; note?: string; to?: string }) {
  const body = <><span className="tile-label">{label}</span><span className="tile-value">{value}</span>{note && <span className="tile-note">{note}</span>}</>
  return to ? <Link className="tile" to={to}>{body}</Link> : <div className="tile">{body}</div>
}

export default function DashboardPage() {
  const { artifacts, role } = useAdmin()
  const [stats, setStats] = useState<Stats | null>(null)
  const [audit, setAudit] = useState<AuditRow[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([api.stats(), api.audit()]).then(([s, a]) => { setStats(s); setAudit(a.slice(0, 8)) }, (e) => setError((e as Error).message))
  }, [])

  // Content figures from the published list the site shows (the same data visitors see).
  const content = useMemo(() => {
    const count = (key: (a: (typeof artifacts)[number]) => string | string[]) => {
      const m = new Map<string, number>()
      for (const a of artifacts) for (const k of [key(a)].flat()) m.set(k, (m.get(k) ?? 0) + 1)
      return [...m].sort((x, y) => y[1] - x[1])
    }
    return {
      cities: count((a) => a.city),
      types: count((a) => typesOf(a)).map(([k, n]) => [typeLabel(k), n] as [string, number]),
      sourced: artifacts.filter((a) => a.verification === 'verified').length,
      models: artifacts.filter((a) => a.model).length,
      quality: [
        ['Görseli olmayan', artifacts.filter((a) => !a.images.length).length],
        ['Kaynağı olmayan', artifacts.filter((a) => !a.sources.length).length],
        ['Hiçbir kaynağında sayfa bilgisi olmayan', artifacts.filter((a) => a.sources.length > 0 && !a.sources.some((s) => s.page?.trim())).length],
        ['Görselinde künye eksik', artifacts.filter((a) => a.images.some((g) => !g.credit)).length],
        ['Temsilî içerik (kaynaksız)', artifacts.filter((a) => a.verification !== 'verified').length],
      ] as [string, number][],
    }
  }, [artifacts])

  const maxDay = Math.max(1, ...(stats?.activity.map((d) => d.n) ?? [0]))
  const dayLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })

  return <section className="admin-page dashboard">
    <h1>Genel bakış</h1>
    {error && <p role="alert" className="area-error">{error}</p>}

    <div className="tiles">
      <Tile label="Yayındaki eser" value={nf.format(artifacts.length)} note={`${nf.format(content.sourced)} kaynaklı · ${nf.format(content.models)} maketli`} to="/admin/eserler" />
      <Tile label="Onay bekleyen" value={stats ? nf.format(stats.status.pending) : '…'} note={stats ? `${nf.format(stats.status.unpublished_new)} yeni kayıt · ${nf.format(stats.status.rejected)} reddedilen` : undefined} to="/admin/onay" />
      <Tile label="Medya" value={stats ? nf.format(stats.media.files) : '…'} note={stats ? `${mb(stats.media.bytes)} · ${nf.format(stats.media.uploads)} panelden yüklendi` : undefined} to="/admin/medya" />
      <Tile label="Envanter yapısı" value={stats ? nf.format(stats.inventory.buildings) : '…'} note={stats ? `${nf.format(stats.inventory.linked)} esere bağlı · ${nf.format(stats.inventory.with_facts)} ayrıntılı` : undefined} to="/admin/envanter" />
    </div>

    <div className="dash-grid">
      <section className="panel" aria-labelledby="pending-title">
        <h2 id="pending-title">Onay bekleyenler</h2>
        {!stats ? <p role="status">Yükleniyor…</p> : !stats.pending.length ? <p>Bekleyen kayıt yok.</p> : <ul className="plain-list">{stats.pending.map((p) => <li key={p.id}>
          <Link to={`/admin/artifact/${p.id}`}>{p.name}</Link> <small>{p.city} · {p.live ? 'değişiklik' : 'yeni kayıt'} · {when(p.updated_at)}{p.updated_by ? ` · ${ROLE_LABELS[p.updated_by as Role] ?? p.updated_by}` : ''}</small>
        </li>)}</ul>}
        {stats && stats.status.pending > stats.pending.length && <p><Link to="/admin/onay">Tümünü gör ({stats.status.pending})</Link></p>}
        {role === 'editor' && <p className="hint">Onay yalnız küratör hesabıyla verilir.</p>}
      </section>

      <section className="panel" aria-labelledby="activity-title">
        <h2 id="activity-title">Son 14 gün</h2>
        {!stats ? <p role="status">Yükleniyor…</p> : <>
          <ol className="spark" aria-label="Günlük işlem sayısı, son 14 gün">{stats.activity.map((d) => <li key={d.day} title={`${dayLabel(d.day)}: ${d.n} işlem`} aria-label={`${dayLabel(d.day)}: ${d.n} işlem`}>
            <span className="spark-bar" style={{ height: `${d.n ? Math.max(6, (d.n / maxDay) * 100) : 2}%` }} data-zero={d.n ? undefined : ''} />
          </li>)}</ol>
          <p className="spark-axis" aria-hidden="true"><span>{dayLabel(stats.activity[0].day)}</span><span>Bugün</span></p>
          <p className="hint">Toplam {nf.format(stats.activity.reduce((s, d) => s + d.n, 0))} işlem; en yoğun gün {nf.format(maxDay)}.</p>
        </>}
      </section>

      <section className="panel" aria-labelledby="city-title">
        <h2 id="city-title">Şehirlere göre</h2>
        <BarTable caption="Yayındaki eser sayısı" rows={content.cities} total={artifacts.length} />
      </section>

      <section className="panel" aria-labelledby="type-title">
        <h2 id="type-title">Türlere göre</h2>
        <BarTable caption="Bir eser birden fazla türde sayılabilir" rows={content.types} total={artifacts.length} />
      </section>

      <section className="panel" aria-labelledby="quality-title">
        <h2 id="quality-title">Veri kalitesi</h2>
        <p className="hint">Düzeltilmesi gereken yayındaki kayıtlar.</p>
        <table className="quality-table"><tbody>{content.quality.map(([label, n]) => <tr key={label}>
          <th scope="row">{label}</th><td className="num">{nf.format(n)}</td><td><span className={`chip ${n ? 'chip-warn' : 'chip-ok'}`}>{n ? 'İncele' : 'Tamam'}</span></td>
        </tr>)}</tbody></table>
      </section>

      <section className="panel" aria-labelledby="recent-title">
        <h2 id="recent-title">Son işlemler</h2>
        {!audit.length ? <p>Henüz işlem yok.</p> : <ol className="plain-list">{audit.map((a, i) => <li key={i}>
          <small>{when(a.at)}</small><br />{ROLE_LABELS[a.actor as Role] ?? a.actor} <strong>{a.artifact_id}</strong> {ACTIONS[a.action] ?? a.action}
        </li>)}</ol>}
        <p><Link to="/admin/kayit">Tüm işlem kaydı</Link></p>
      </section>
    </div>
  </section>
}
