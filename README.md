# GramAI Android

Offline Android app that detects crop and skin diseases from a photo and gives remedies in Odia and English.

- **Paddy (rice):** Bacterial Leaf Blight, Brown Spot, Leaf Blast, Tungro, Healthy
- **Skin:** a separate model for common skin conditions (see the note below)

All inference runs on the phone with PyTorch Mobile. No network connection is needed after install.

## Build

Requirements: Android Studio (recent stable), JDK 17, Android SDK 34.

1. Open this folder in Android Studio.
2. Let Gradle sync.
3. Run the `app` configuration on a device or emulator (Android 8.0 / API 26 or newer, arm64 or armeabi-v7a).

## Project layout

- `app/src/main/java/com/example/gramai/` - Kotlin source (UI, ViewModel, file helpers)
- `app/src/main/assets/` - TorchScript models (`paddy_model_std.pt`, `skin_model_std.pt`) and `diseases.json`
- `app/src/main/assets/diseases.json` - class names, Odia and English remedies, dosages, and warnings

## Models

| File | Purpose | Classes |
|------|---------|---------|
| `paddy_model_std.pt` | Paddy leaf disease | See `diseases.json` (`paddy.classes`) |
| `skin_model_std.pt` | Skin condition | See `diseases.json` (`skin.classes`) |

Class order in `diseases.json` must match the output order of each model. Check this whenever a model is retrained.

## Medical disclaimer

Results are AI predictions. Always confirm paddy treatment with an agriculture expert, and see a doctor for any skin condition.

## Status

Early development. Known gaps: no automated tests yet, and the wrong-category (plant vs skin) check is not active on Android.
