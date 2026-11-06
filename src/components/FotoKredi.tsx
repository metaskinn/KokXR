export const FOTO_KREDISI = 'Fotoğraf: Vakıf Katılım, Vakıf Eserleri Envanter Projesi – Bursa Fotoğraf Arşivi'

export default function FotoKredi({ metin = FOTO_KREDISI }: { metin?: string }) {
  return <p className="foto-kredi">{metin}</p>
}
