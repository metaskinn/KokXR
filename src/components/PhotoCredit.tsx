export const PHOTO_CREDIT = 'Fotoğraf: Vakıf Katılım, Vakıf Eserleri Envanter Projesi – Bursa Fotoğraf Arşivi'

export default function PhotoCredit({ text = PHOTO_CREDIT }: { text?: string }) {
  return <p className="photo-credit">{text}</p>
}
