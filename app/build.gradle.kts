plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.example.gramai"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.gramai"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        // OPTIMIZATION 1: Reduces App Size (Removes PC simulator files)
        ndk {
            abiFilters += listOf("armeabi-v7a", "arm64-v8a")
        }
    }

    // OPTIMIZATION 2: Code Shrinking (Optional)
    // Keep 'isMinifyEnabled = false' for now.
    // If you set it to 'true', PyTorch might crash without extra complex rules.
    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.3"
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    // STABILITY FIX: Prevents crashes on Android 12+
    packaging {
        jniLibs {
            useLegacyPackaging = true
        }
    }
}

dependencies {
    // Core Android
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")

    // Compose UI
    implementation(platform("androidx.compose:compose-bom:2023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")

    // Camera
    implementation("androidx.camera:camera-core:1.3.1")
    implementation("androidx.camera:camera-camera2:1.3.1")
    implementation("androidx.camera:camera-lifecycle:1.3.1")
    implementation("androidx.camera:camera-view:1.3.1")

    // AI: PyTorch Mobile Lite (Optimized for size)
    //implementation("org.pytorch:pytorch_android_lite:1.13.0")
    //implementation("org.pytorch:pytorch_android_torchvision_lite:1.13.0")
    implementation("org.pytorch:pytorch_android:1.13.0")
    implementation("org.pytorch:pytorch_android_torchvision:1.13.0")
    // Images & JSON
    implementation("io.coil-kt:coil-compose:2.5.0")
    implementation("com.google.code.gson:gson:2.10.1")

    // Debugging
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}