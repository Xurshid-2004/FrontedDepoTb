# TB — Android ilova (Flutter)

Buxoro lokomotiv deposi (TCH-6) TB tizimining mobil qismi.
Web/API bilan bitta backend orqali ishlaydi.

## Ishga tushirish

Har bir buyruq PowerShell'da **alohida**:

```powershell
cd "C:\Users\ANUBIS PC\Desktop\tb_web\app_flutter"
```

```powershell
flutter create . --platforms=android,ios --project-name tb_app
```

```powershell
flutter pub get
```

```powershell
flutter run --dart-define=TB_API=http://10.0.2.2:3000
```

`10.0.2.2` — Android emulyatoridan kompyuterdagi `localhost` ga murojaat.
Haqiqiy telefondan sinash uchun kompyuter IP sini yozing, masalan
`--dart-define=TB_API=http://192.168.1.50:3000`.

## APK yigʻish

```powershell
flutter build apk --release --dart-define=TB_API=https://SIZNING_DOMEN
```

Fayl: `build\app\outputs\flutter-apk\app-release.apk`

## Android ruxsatlari

`android\app\src\main\AndroidManifest.xml` ichiga `<manifest>` tegi ostiga:

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.USE_BIOMETRIC"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

`MainActivity` `FlutterFragmentActivity` dan meros olishi kerak
(`local_auth` shuni talab qiladi) — `MainActivity.kt` da:

```kotlin
import io.flutter.embedding.android.FlutterFragmentActivity
class MainActivity : FlutterFragmentActivity()
```

`android\app\build.gradle.kts` da `minSdk = 23`.

## Tuzilma

| Fayl | Vazifa |
|---|---|
| `lib/main.dart` | Ilova, marshrutlar, boshlash ekrani |
| `lib/core/api.dart` | HTTP mijoz, token, domen metodlari |
| `lib/core/store.dart` | PIN, biometriya, Riverpod provayderlari, savat |
| `lib/core/theme.dart` | Dizayn tizimi va holat ranglari |
| `lib/screens/kirish.dart` | Tabel → F.I.Sh. → Face ID → imzo |
| `lib/screens/pin.dart` | 4 xonali PIN, barmoq izi |
| `lib/screens/kabinet.dart` | Ishchi kabineti: buyumlar, talon, imtixon, KIP |
| `lib/screens/yangi_ariza.dart` | Ariza yuborish (norma va muddat tekshiruvi bilan) |
| `lib/screens/arizalar.dart` | Arizalar holati, «oldim» tasdigʻi |

## Keyingi bosqich

- Push (Firebase) — `firebase_core` va `firebase_messaging` qoʻshiladi, `google-services.json` kerak
- Rahbariyat ekranlari (tasdiqlash, ombor, jurnal) — hozircha web orqali
- iOS build
