# GramAI Android

Android app for GramAI: plant (paddy, wheat, millet) and animal (cow, goat) advisory for farmers, in Odia, English, Hindi, Santali (machine draft) and Ho (English fallback).

## How it is built
A thin native shell (Kotlin `WebView`) around the **GramAI web app**. The web app, its content and models are bundled in `app/src/main/assets/www` and served from a local https origin, so the app works offline and the Android and web versions cannot drift apart. The shell adds what a browser cannot do well: camera and gallery chooser, location permission (asked only when needed), system back handling, opening news links in the browser.

The source of truth is the **GramAI-Web** repo (`web/`, `languages/`, `recommendations/`).

## Update the bundled web app
```
scripts/sync_web_assets.sh /path/to/GramAI-Web
./gradlew assembleDebug
```

## Build
Android Studio (recent), JDK 17, Android SDK 34. Minimum Android 8.0 (API 26). Debug APK is about 3.4 MB.

## Status
- Verified on an Android 14 (arm64) emulator: language, sector, crop, photo from gallery, analysis (demo result), organic and non-organic options, 10-day weather sync.
- Diagnosis is a **demo** until the model is wired in (see GramAI-Web).
- Bundled news is a snapshot until a hosted news URL is configured (`window.GRAM_NEWS_URL`).
- Package id is still `com.example.gramai`: change it before any store release.
- The older PyTorch paddy and skin app is in the git history (before this branch). Skin (human health) is out of scope.
