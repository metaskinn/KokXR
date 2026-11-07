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
Durum: `assembleDebug` 2026-11-07'de JDK 21.0.2 ile başarıyla derlendi (`app-debug.apk`, yaklaşık 62 MB, imzasız debug). **Telefonda veya emülatörde kurulup açılmadı**; çalıştığı henüz doğrulanmadı. JDK 21 yoksa ikili dağıtım açılıp `JAVA_HOME` ona yöneltilebilir (sisteme kurmak gerekmez); `ANDROID_HOME=~/Library/Android/sdk`.
