package com.example.gramai.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

// One warm light theme for every device: farmers use the app outdoors in
// bright sun, so we skip dark mode and Android 12 dynamic colour for now.
private val GramColorScheme = lightColorScheme(
    primary = Brand,
    onPrimary = CardWhite,
    primaryContainer = BrandSoft,
    onPrimaryContainer = BrandDark,
    secondary = Amber,
    secondaryContainer = AmberSoft,
    error = Alert,
    errorContainer = AlertSoft,
    background = Cream,
    onBackground = Ink,
    surface = CardWhite,
    onSurface = Ink,
    onSurfaceVariant = InkSoft,
    outline = CardBorder
)

@Composable
fun GramAIAndroidTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = GramColorScheme,
        typography = Typography,
        content = content
    )
}
