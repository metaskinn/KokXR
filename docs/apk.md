# Android APK (Capacitor)

Aynı web kodu Android uygulamasına sarılır. Quest/VR akışı APK'da denenmez; APK keşif, harita, erişilebilirlik ve çevrimdışı içindir.

Gereken: JDK **21** (bu makinede 17 var; `invalid source release: 21` hatası verir), Android SDK (`~/Library/Android/sdk`, platform 36 kurulu).

```bash
npm run apk:esitle   # Supabase değişkenleri gömülmeden derler ve android/ klasörüne kopyalar
cd android && ./gradlew assembleDebug
# çıktı: android/app/build/outputs/apk/debug/app-debug.apk
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Bulutlu sürüm için `apk:esitle` yerine `npx vite build && npx cap sync android` kullanın (`.env` gömülür).
Durum: iskelet (`android/`, `capacitor.config.json`) hazır ve Gradle eşitlemesi geçti; APK derlemesi JDK 21 olmadığından bu makinede doğrulanmadı.
