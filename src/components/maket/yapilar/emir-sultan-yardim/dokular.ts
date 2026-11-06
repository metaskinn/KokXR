// Emir Sultan maketinin tuval dokuları. Hepsi kodla çizilir; renk ve düzen envanterdeki fotoğraflara bakılarak
// yorumlanmıştır. Hat yazısı taklit edilmez: levha, madalyon ve kartuşlar yalnız düz zemin ve bitkisel motif taşır.
import * as THREE from 'three'
import { hafifCihaz, rastgele } from '../../ulucamiZemin'

function tuval(g: number, y = g) {
  const el = document.createElement('canvas')
  el.width = g; el.height = y
  const c = el.getContext('2d')
  if (!c) throw new Error('Tuval kullanılamıyor')
  return { el, c }
}

function doku(el: HTMLCanvasElement, renkli = true, tekrar?: [number, number]) {
  const t = new THREE.CanvasTexture(el)
  t.anisotropy = 8
  if (renkli) t.colorSpace = THREE.SRGBColorSpace
  if (tekrar) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(tekrar[0], tekrar[1])
  }
  return t
}

/** Almaşık duvar: bir sıra küfeki taş, üç sıra tuğla; taşların arasında dikey ikişer tuğla. 2,64 metrede tekrarlar. */
function almasikDokusu() {
  const B = hafifCihaz() ? 512 : 1024, olc = B / 2.64
  const { el, c } = tuval(B)
  const r = rastgele(211)
  const tugla = ['#a8583c', '#b3674a', '#98492f', '#ad5f3f', '#8f4a33']
  const taslar = ['#c9ad7d', '#bfa070', '#d3ba8c', '#b89a6b', '#cdb284']
  c.fillStyle = '#c3b59b'
  c.fillRect(0, 0, B, B)
  const TAS = 0.36, SIRA = 0.1, DERZ = 0.012
  const PERYOT = TAS + 3 * SIRA
  for (let p = 0; p < 4; p++) {
    const y0 = p * PERYOT
    // Taş sırası: taş, iki dikey tuğla, taş...
    let x = -r() * 0.4
    while (x < 2.64) {
      const g = 0.5 + r() * 0.55
      c.fillStyle = taslar[Math.floor(r() * taslar.length)]
      for (const kx of [0, 2.64]) c.fillRect((x + kx) * olc, (y0 + DERZ) * olc, (g - DERZ) * olc, (TAS - 2 * DERZ) * olc)
      x += g
      for (let i = 0; i < 2; i++) {
        c.fillStyle = tugla[Math.floor(r() * tugla.length)]
        for (const kx of [0, 2.64]) c.fillRect((x + kx) * olc, (y0 + DERZ) * olc, 0.05 * olc, (TAS - 2 * DERZ) * olc)
        x += 0.062
      }
    }
    // Üç sıra yatay tuğla
    for (let s = 0; s < 3; s++) {
      const y = y0 + TAS + s * SIRA
      let t = -r() * 0.3
      while (t < 2.64) {
        c.fillStyle = tugla[Math.floor(r() * tugla.length)]
        c.fillRect(t * olc, (y + DERZ) * olc, 0.27 * olc, (SIRA - 2 * DERZ) * olc)
        t += 0.285
      }
    }
  }
  // Yıpranma lekeleri
  for (let i = 0; i < 2600; i++) {
    c.fillStyle = `rgba(${r() < 0.5 ? '40,28,18' : '250,235,210'},${0.03 + r() * 0.05})`
    const s = 1 + r() * 6
    c.fillRect(r() * B, r() * B, s * (1 + r() * 3), s)
  }
  return { renk: doku(el, true, [1 / 2.64, 1 / 2.64]), kabartma: doku(el, false, [1 / 2.64, 1 / 2.64]) }
}

/** Dış pencere: beyaz kasalı, kare bölmeli demir çerçeve ve koyu cam (fotoğraftaki gibi). Şekle tek parça oturur. */
function pencereDisDokusu() {
  const { el, c } = tuval(256, 512)
  c.fillStyle = '#23292c'; c.fillRect(0, 0, 256, 512)
  const g = c.createLinearGradient(0, 0, 256, 512)
  g.addColorStop(0, 'rgba(120,150,170,0.55)'); g.addColorStop(1, 'rgba(30,40,46,0)')
  c.fillStyle = g; c.fillRect(0, 0, 256, 512)
  c.strokeStyle = '#d9d5c9'; c.lineWidth = 9
  for (let x = 42; x < 256; x += 57) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 512); c.stroke() }
  for (let y = 40; y < 512; y += 57) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke() }
  c.strokeStyle = '#e8e4d8'; c.lineWidth = 16; c.strokeRect(0, 0, 256, 512)
  return doku(el)
}

/** Üst sıra içi: alçı şebeke ve revzen; aydınlık mavi-beyaz bölmeler, krem örgü. */
function revzenDokusu() {
  const { el, c } = tuval(256, 512)
  c.fillStyle = '#f2ece0'; c.fillRect(0, 0, 256, 512)
  c.fillStyle = '#cfe4f1'
  c.fillRect(70, 70, 116, 150); c.fillRect(70, 292, 116, 150)
  c.fillStyle = '#e2eef5'
  c.fillRect(14, 70, 38, 372); c.fillRect(204, 70, 38, 372)
  c.fillStyle = '#dfe9ea'
  c.fillRect(70, 236, 116, 40)
  c.strokeStyle = '#b8a27a'; c.lineWidth = 3
  for (let y = 66; y < 450; y += 26) for (const x of [14, 204]) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 38, y + 13); c.lineTo(x, y + 26); c.moveTo(x + 38, y); c.lineTo(x, y + 13); c.lineTo(x + 38, y + 26); c.stroke() }
  c.strokeRect(70, 70, 116, 150); c.strokeRect(70, 292, 116, 150); c.strokeRect(70, 236, 116, 40)
  c.strokeStyle = '#8f7a55'; c.lineWidth = 7; c.strokeRect(4, 4, 248, 504)
  return doku(el)
}

/** Alt sıra içi: demir şebekeli aydınlık pencere. */
function altPencereDokusu() {
  const { el, c } = tuval(256, 384)
  const g = c.createLinearGradient(0, 0, 0, 384)
  g.addColorStop(0, '#dfeef2'); g.addColorStop(0.65, '#c9dfd8'); g.addColorStop(1, '#a9bf9a')
  c.fillStyle = g; c.fillRect(0, 0, 256, 384)
  c.strokeStyle = '#26282a'; c.lineWidth = 6
  for (let x = 32; x < 256; x += 48) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 384); c.stroke() }
  for (let y = 32; y < 384; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke() }
  c.strokeStyle = '#1b1c1d'; c.lineWidth = 14; c.strokeRect(0, 0, 256, 384)
  return doku(el)
}

/** Demir parmaklık: türbe pencereleri ve niyaz penceresi için geçme baklava örgü. */
function demirDokusu() {
  const { el, c } = tuval(256, 512)
  c.fillStyle = '#39352c'; c.fillRect(0, 0, 256, 512)
  const g = c.createLinearGradient(0, 0, 0, 512)
  g.addColorStop(0, 'rgba(226,200,140,0.55)'); g.addColorStop(1, 'rgba(120,90,50,0.2)')
  c.fillStyle = g; c.fillRect(0, 0, 256, 512)
  c.strokeStyle = '#121212'; c.lineWidth = 7
  for (let i = -512; i < 768; i += 44) {
    c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 512, 512); c.stroke()
    c.beginPath(); c.moveTo(i + 512, 0); c.lineTo(i, 512); c.stroke()
  }
  c.lineWidth = 12; c.strokeRect(0, 0, 256, 512)
  return doku(el)
}

/** İç kubbe: sekiz dilim, ortada gül, açık tonlu bitkisel kuşak. UV kuşbakışı düzleme oturur. */
function icKubbeDokusu() {
  const B = hafifCihaz() ? 1024 : 2048, M = B / 2
  const { el, c } = tuval(B)
  c.fillStyle = '#f4e8d8'; c.fillRect(0, 0, B, B)
  const yay = (r: number, renk: string, en: number) => { c.strokeStyle = renk; c.lineWidth = en; c.beginPath(); c.arc(M, M, r * M, 0, Math.PI * 2); c.stroke() }
  // Dilim çizgileri ve bantlar
  c.save(); c.translate(M, M)
  for (let i = 0; i < 16; i++) {
    c.save(); c.rotate((i / 16) * Math.PI * 2)
    const ana = i % 2 === 0
    if (ana) {
      c.fillStyle = '#d9c7ae'
      c.beginPath(); c.moveTo(-M * 0.022, M * 0.14); c.lineTo(M * 0.022, M * 0.14); c.lineTo(M * 0.052, M * 0.98); c.lineTo(-M * 0.052, M * 0.98); c.closePath(); c.fill()
      c.fillStyle = '#8c7b66'
      for (let t = 0.17; t < 0.96; t += 0.032) {
        const w = M * (0.012 + 0.03 * t)
        c.beginPath(); c.moveTo(0, M * t); c.lineTo(w, M * (t + 0.012)); c.lineTo(0, M * (t + 0.024)); c.lineTo(-w, M * (t + 0.012)); c.closePath(); c.fill()
      }
    } else {
      c.strokeStyle = 'rgba(150,130,105,0.65)'; c.lineWidth = M * 0.004
      c.beginPath(); c.moveTo(0, M * 0.2); c.lineTo(0, M * 0.5); c.stroke()
    }
    c.restore()
  }
  c.restore()
  yay(0.5, '#8c7b66', M * 0.012)
  yay(0.53, '#d9c7ae', M * 0.03)
  yay(0.2, '#2c2a26', M * 0.016)
  // Ortadaki gül
  c.fillStyle = '#e8d9bd'; c.beginPath(); c.arc(M, M, M * 0.2, 0, Math.PI * 2); c.fill()
  c.save(); c.translate(M, M)
  for (let i = 0; i < 16; i++) {
    c.save(); c.rotate((i / 16) * Math.PI * 2)
    c.fillStyle = i % 2 ? '#a5543a' : '#c79a4e'
    c.beginPath(); c.moveTo(0, M * 0.03); c.quadraticCurveTo(M * 0.04, M * 0.09, 0, M * 0.15); c.quadraticCurveTo(-M * 0.04, M * 0.09, 0, M * 0.03); c.fill()
    c.restore()
  }
  c.restore()
  c.fillStyle = '#7d3f2c'; c.beginPath(); c.arc(M, M, M * 0.03, 0, Math.PI * 2); c.fill()
  // Etek kuşağı: tekrarlı palmet
  yay(0.96, '#8c7b66', M * 0.012)
  c.save(); c.translate(M, M)
  for (let i = 0; i < 48; i++) {
    c.save(); c.rotate((i / 48) * Math.PI * 2)
    c.fillStyle = i % 2 ? '#b39b78' : '#cdb996'
    c.beginPath(); c.moveTo(0, M * 0.9); c.quadraticCurveTo(M * 0.03, M * 0.93, 0, M * 0.955); c.quadraticCurveTo(-M * 0.03, M * 0.93, 0, M * 0.9); c.fill()
    c.restore()
  }
  c.restore()
  return doku(el)
}

/** Pandantif: açık zeminde köşeye inen koyu üçgen alan ve açık kıvrımlar. u bir duvar açıklığını, 0,5 köşeyi gösterir. */
function pandantifDokusu() {
  const { el, c } = tuval(1024, 512)
  c.fillStyle = '#f0e1cf'; c.fillRect(0, 0, 1024, 512)
  c.fillStyle = '#6f645c'
  c.beginPath(); c.moveTo(512, 500); c.lineTo(270, 60); c.lineTo(754, 60); c.closePath(); c.fill()
  c.strokeStyle = '#e9dcc8'; c.lineWidth = 9
  for (const [cx, cy, r] of [[512, 150, 62], [420, 110, 34], [604, 110, 34], [512, 300, 30]]) {
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 1.6); c.stroke()
  }
  c.strokeStyle = '#b8a688'; c.lineWidth = 16
  c.beginPath(); c.moveTo(512, 500); c.lineTo(270, 60); c.lineTo(754, 60); c.closePath(); c.stroke()
  return doku(el, true, [1, 1])
}

/** Mihrap nişi: açık mermer görünümlü dikey fırça çizgileri (fotoğraftaki yivli kalem işi). */
function nisDokusu() {
  const { el, c } = tuval(512, 512)
  const r = rastgele(9)
  c.fillStyle = '#efe6dc'; c.fillRect(0, 0, 512, 512)
  for (let x = 0; x < 512; x += 8) {
    c.fillStyle = r() < 0.5 ? 'rgba(170,145,125,0.35)' : 'rgba(250,245,235,0.5)'
    c.fillRect(x, 0, 3 + r() * 3, 512)
  }
  return doku(el, true, [1, 1])
}

/** Sanduka örtüsü: koyu yeşil zeminde altın sırma benzeri bitkisel dal. Yazı yoktur. */
function ortuDokusu() {
  const { el, c } = tuval(512, 512)
  c.fillStyle = '#0e3c37'; c.fillRect(0, 0, 512, 512)
  c.strokeStyle = '#d7c07a'; c.lineWidth = 7; c.fillStyle = '#d7c07a'
  for (const [x, y] of [[128, 128], [384, 384], [384, 128], [128, 384]]) {
    c.beginPath(); c.moveTo(x - 80, y + 60); c.bezierCurveTo(x - 30, y + 10, x + 20, y + 60, x + 70, y - 40); c.stroke()
    for (let t = 0; t < 5; t++) {
      c.beginPath(); c.ellipse(x - 70 + t * 30, y + 40 - t * 20, 22, 10, -0.6 + t * 0.3, 0, Math.PI * 2); c.fill()
    }
  }
  return doku(el, true, [1, 1])
}

/** Korkuluk paneli: koyu yeşil zemin üstünde altın palmet ve çerçeve. */
function korkulukDokusu() {
  const { el, c } = tuval(256, 256)
  c.fillStyle = '#14463f'; c.fillRect(0, 0, 256, 256)
  c.strokeStyle = '#d3a43f'; c.lineWidth = 14; c.strokeRect(8, 8, 240, 240)
  c.fillStyle = '#e0bb5c'
  c.beginPath(); c.moveTo(128, 34)
  c.bezierCurveTo(186, 90, 196, 160, 128, 222); c.bezierCurveTo(60, 160, 70, 90, 128, 34); c.fill()
  c.fillStyle = '#14463f'
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(128 + i * 19, 150 - Math.abs(i) * 8, 5, 42, i * 0.2, 0, Math.PI * 2); c.fill() }
  return doku(el, true, [1, 1])
}

/** Türbe içi duvar: açık yeşil damarlı mermer taklidi boyalı panolar. 3 metrede tekrar. */
function turbeDuvarDokusu() {
  const { el, c } = tuval(512, 512)
  const r = rastgele(55)
  c.fillStyle = '#c8d0a9'; c.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 160; i++) {
    c.strokeStyle = `rgba(${r() < 0.5 ? '96,116,84' : '240,240,214'},${0.12 + r() * 0.2})`
    c.lineWidth = 1 + r() * 4
    const x = r() * 512, y = r() * 512
    c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + r() * 90 - 45, y + 60, x + r() * 90 - 45, y + 120, x + r() * 140 - 70, y + 170); c.stroke()
  }
  return doku(el, true, [1 / 3, 1 / 3])
}

/** Dokuları tek seferde üretir; maket her açıldığında bir kez çağrılır. */
export function emirDokulari() {
  return {
    almasik: almasikDokusu(),
    pencereDis: pencereDisDokusu(),
    revzen: revzenDokusu(),
    altPencere: altPencereDokusu(),
    demir: demirDokusu(),
    icKubbe: icKubbeDokusu(),
    pandantif: pandantifDokusu(),
    nis: nisDokusu(),
    ortu: ortuDokusu(),
    korkuluk: korkulukDokusu(),
    turbeDuvar: turbeDuvarDokusu(),
  }
}

/**
 * Yalnız avlu ve revaklardan görünen gökyüzü: dışarıdan bakan kamerada çizilmez.
 * Eklemeli karışım AO geçişinden muaf kalmasını sağlar (maketSahnesi eklemeli örgüleri ayırır).
 */
export function gokMalzemesi(mx: number, mz: number, yaricap: number) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { merkez: { value: new THREE.Vector2(mx, mz) }, yaricap: { value: yaricap } },
    vertexShader: `varying vec3 vYon;
      void main() { vYon = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec2 merkez; uniform float yaricap; varying vec3 vYon;
      float g(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(g(i), g(i + vec2(1, 0)), f.x), mix(g(i + vec2(0, 1)), g(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        if (distance(cameraPosition.xz, merkez) > yaricap || cameraPosition.y > 14.0) discard;
        vec3 y = normalize(vYon);
        float t = clamp(y.y * 1.5, 0.0, 1.0);
        vec3 renk = mix(vec3(0.80, 0.82, 0.80), vec3(0.20, 0.44, 0.74), pow(t, 0.7));
        if (y.y > 0.02) {
          vec2 p = y.xz / (y.y + 0.25) * 2.2;
          float b = n(p) * 0.55 + n(p * 2.1) * 0.3 + n(p * 4.3) * 0.15;
          renk = mix(renk, vec3(0.95, 0.94, 0.90), smoothstep(0.52, 0.78, b) * 0.85);
        }
        gl_FragColor = vec4(renk, 1.0);
        #include <colorspace_fragment>
      }`,
  })
}
