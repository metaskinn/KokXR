import type { WebGLRenderer } from 'three'

/** True on Android Chrome-like browsers with touch (not on Quest, whose UA contains 'OculusBrowser' or 'Quest'). Safe without `navigator` (Node tests). */
export function isMobileArBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/OculusBrowser|Quest/i.test(ua)) return false
  if (!/Android/i.test(ua) || !/Chrome\//.test(ua)) return false
  // Firefox/Opera/Samsung may carry 'Chrome/' too; keep Chrome and its Chromium siblings, drop non-WebXR ones.
  if (/Firefox|OPR\/|Opera/i.test(ua)) return false
  const touch = (navigator.maxTouchPoints ?? 0) > 0 || (typeof window !== 'undefined' && 'ontouchstart' in window)
  return touch
}

/** Scale used for the XR framebuffer on phones. */
const MOBILE_FRAMEBUFFER_SCALE = 0.8
const MOBILE_PIXEL_RATIO = 1.5

/**
 * Lowers cost for a phone AR session. Returns restore() that puts back exactly what was changed.
 *
 * Call order for the integrator: call this BEFORE `xr.setSession(session)`.
 * `setFramebufferScaleFactor` is only honoured before the session starts (three ignores it while presenting),
 * so it must run before setSession; foveation is applied by three when the layer is created, so it is also set here.
 * Call restore() on 'sessionend' and when the start is rejected.
 */
export function applyMobileArQuality(renderer: WebGLRenderer): () => void {
  const prevRatio = renderer.getPixelRatio()
  const shadow = renderer.shadowMap
  const prevShadowEnabled = shadow.enabled
  const prevShadowAuto = shadow.autoUpdate
  const xr = renderer.xr as WebGLRenderer['xr'] & {
    getFoveation?: () => number | undefined
    setFoveation?: (v: number) => void
    setFramebufferScaleFactor?: (v: number) => void
  }
  const prevFoveation = xr.getFoveation?.()
  // three has no getter for the framebuffer scale factor; its default is 1.
  const prevScale = 1

  if (prevRatio > MOBILE_PIXEL_RATIO) renderer.setPixelRatio(MOBILE_PIXEL_RATIO)
  // Shadow map off in AR: the contact shadow (arLight) draws the ground shadow instead.
  shadow.enabled = false
  shadow.autoUpdate = false
  if (!xr.isPresenting) xr.setFramebufferScaleFactor?.(MOBILE_FRAMEBUFFER_SCALE)
  xr.setFoveation?.(1)

  return () => {
    renderer.setPixelRatio(prevRatio)
    shadow.enabled = prevShadowEnabled
    shadow.autoUpdate = prevShadowAuto
    if (prevShadowEnabled) shadow.needsUpdate = true
    if (!xr.isPresenting) xr.setFramebufferScaleFactor?.(prevScale)
    if (prevFoveation !== undefined) xr.setFoveation?.(prevFoveation)
  }
}

