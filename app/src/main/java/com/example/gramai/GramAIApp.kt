package com.example.gramai

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.speech.tts.TextToSpeech
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import com.example.gramai.ui.*
import com.example.gramai.i18n.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.layout.statusBarsPadding
import com.example.gramai.ui.theme.*
import java.util.*

@Composable
fun GramAIApp(viewModel: GramAIViewModel) {

    val context = LocalContext.current
    val scrollState = rememberScrollState()
    val haptic = LocalHapticFeedback.current

    /** ---------------------------------------
     * TTS SETUP (Optimized for Odia + Female)
     * --------------------------------------*/
    val tts = remember { mutableStateOf<TextToSpeech?>(null) }

    // NEW: Speech rate state (Default = 1.0x normal)
    var speechRate by remember { mutableStateOf(1.0f) }

    LaunchedEffect(Unit) {
        tts.value = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val locale = Locale("or", "IN")
                val result = tts.value?.setLanguage(locale)

                if (result != TextToSpeech.LANG_MISSING_DATA &&
                    result != TextToSpeech.LANG_NOT_SUPPORTED) {

                    try {
                        val voices = tts.value?.voices
                        val femaleVoice = voices?.find {
                            it.locale == locale &&
                                    (it.name.contains("female", true)
                                            || it.name.contains("woman", true)
                                            || it.name.contains("-f-", true))
                        }
                        if (femaleVoice != null) {
                            tts.value?.voice = femaleVoice
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                // NEW: Apply speech rate default
                tts.value?.setSpeechRate(speechRate)
            }
        }
    }

    /** UI STATES */
    var mode by remember { mutableStateOf<String?>(null) }
    var imageUri by remember { mutableStateOf<Uri?>(null) }
    var bitmap by remember { mutableStateOf<Bitmap?>(null) }
    var resultOdia by remember { mutableStateOf("") }
    var resultEng by remember { mutableStateOf("") }
    var confidence by remember { mutableStateOf(0f) }
    var showResult by remember { mutableStateOf(false) }
    var isAnalyzing by remember { mutableStateOf(false) }

    /** ANIMATION FOR LASER */
    val infiniteTransition = rememberInfiniteTransition(label = "scanner")
    val scanLineY by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scanLine"
    )

    /** PICKERS */
    val galleryLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let { imageUri = it; bitmap = null; showResult = false }
    }
    val cameraLauncher = rememberLauncherForActivityResult(ActivityResultContracts.TakePicturePreview()) { bmp ->
        bmp?.let { bitmap = it; imageUri = null; showResult = false }
    }

    // Language for the whole UI and the result text. Saved so a farmer sets it once.
    val prefs = remember { context.getSharedPreferences("gramai", android.content.Context.MODE_PRIVATE) }
    var language by remember { mutableStateOf(Language.fromCode(prefs.getString("lang", null))) }
    val s = stringsFor(language)

    fun speakResult(flushId: String) {
        val engine = tts.value
        val locale = language.ttsLocale
        if (engine == null || locale == null) return
        if (engine.setLanguage(locale).let { it == TextToSpeech.LANG_MISSING_DATA || it == TextToSpeech.LANG_NOT_SUPPORTED }) {
            Toast.makeText(context, "${language.nativeName} voice not installed.", Toast.LENGTH_LONG).show()
            return
        }
        engine.setSpeechRate(speechRate)
        engine.stop()
        engine.speak(if (language == Language.ODIA) resultOdia else resultEng, TextToSpeech.QUEUE_FLUSH, null, flushId)
    }

    // Odia voice is the one the app has always spoken; keep auto-play for Odia only.
    val autoPlay = language == Language.ODIA

    val accentTile = if (mode == "skin") SkinClaySoft else PaddyGoldSoft

    CompositionLocalProvider(LocalStrings provides s) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Cream)
            .statusBarsPadding()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {

            AppHeader(offlineLabel = s.offline)

            LanguagePicker(
                selected = language,
                label = s.language,
                onSelect = { language = it; prefs.edit().putString("lang", it.code).apply() }
            )
            if (!language.hasUiText) {
                // Santali / Ho: no reviewed text yet. Be upfront rather than guess.
                CautionBanner("${language.nativeName}: translation is being prepared. Showing English for now.")
            }

            if (mode == null) {
                // ---------------- HOME ----------------
                HeroCard(eyebrow = s.heroEyebrow, title = s.heroTitle)
                Text(s.chooseCheck, style = MaterialTheme.typography.titleMedium, color = Ink)
                ModeCard("🌾", s.paddyTitle, "Paddy · ଧାନ", PaddyGoldSoft) { mode = "paddy" }
                ModeCard("🧑‍⚕️", s.skinTitle, "Skin · ଚର୍ମ", SkinClaySoft) { mode = "skin" }
                CautionBanner(s.tip)
            } else {
                // ---------------- SCAN / RESULT ----------------
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RoundIconButton("←", s.back, onClick = {
                        mode = null; imageUri = null; bitmap = null; showResult = false
                    })
                    Spacer(Modifier.width(12.dp))
                    Box(Modifier.size(40.dp).clip(CircleShape).background(accentTile), contentAlignment = Alignment.Center) {
                        Text(if (mode == "paddy") "🌾" else "🧑‍⚕️", fontSize = 20.sp)
                    }
                    Spacer(Modifier.width(10.dp))
                    Text(
                        if (mode == "paddy") s.paddyTitle else s.skinTitle,
                        style = MaterialTheme.typography.titleLarge, color = Ink
                    )
                }

                ViewfinderFrame {
                    if (imageUri != null) {
                        AsyncImage(model = imageUri, contentDescription = null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                    } else if (bitmap != null) {
                        Image(bitmap = bitmap!!.asImageBitmap(), contentDescription = null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                    } else {
                        Column(Modifier.align(Alignment.Center), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(if (mode == "paddy") "🌾" else "🖐️", fontSize = 48.sp)
                            Spacer(Modifier.height(8.dp))
                            StatusPill(
                                if (mode == "paddy") s.scanHintPaddy else s.scanHintSkin,
                                BrandSoft, BrandDark
                            )
                        }
                    }

                    if (isAnalyzing) {
                        Box(
                            Modifier
                                .fillMaxWidth()
                                .height(4.dp)
                                .align(Alignment.TopCenter)
                                .offset(y = (264 * scanLineY).dp)
                                .background(Brush.horizontalGradient(listOf(Color.Transparent, BrandBright, Color.Transparent)))
                        )
                        Box(Modifier.fillMaxSize().background(BrandBright.copy(alpha = 0.10f)))
                    }
                }

                if (imageUri == null && bitmap == null) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                        HintChip(s.goodLight)
                        Spacer(Modifier.width(10.dp))
                        HintChip(s.holdSteady)
                    }
                    PrimaryPillButton(onClick = { cameraLauncher.launch(null) }) {
                        Text("📷  ${s.camera}", style = MaterialTheme.typography.labelLarge)
                    }
                    TextButton(
                        onClick = { galleryLauncher.launch("image/*") },
                        modifier = Modifier.align(Alignment.CenterHorizontally).heightIn(min = 48.dp)
                    ) {
                        Text("🖼️  ${s.gallery}", color = Brand, fontWeight = FontWeight.Bold)
                    }
                }

                if (imageUri != null || bitmap != null) {
                    PrimaryPillButton(
                        enabled = !isAnalyzing,
                        onClick = {
                            haptic.performHapticFeedback(HapticFeedbackType.LongPress)

                            val bmpLoaded = bitmap ?: imageUri?.let { uri ->
                                try {
                                    if (Build.VERSION.SDK_INT < 28) {
                                        MediaStore.Images.Media.getBitmap(context.contentResolver, uri)
                                    } else {
                                        val source = ImageDecoder.createSource(context.contentResolver, uri)
                                        ImageDecoder.decodeBitmap(source) { decoder, _, _ ->
                                            try { decoder.isMutableRequired = true } catch (_: Exception) {}
                                            decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
                                        }
                                    }
                                } catch (e: Exception) { null }
                            }

                            if (bmpLoaded != null) {
                                isAnalyzing = true
                                showResult = false
                                viewModel.predict(bmpLoaded, mode!!) { conf, odia, eng, _ ->
                                    confidence = conf
                                    resultOdia = odia
                                    resultEng = eng
                                    showResult = true
                                    isAnalyzing = false
                                    if (autoPlay && conf > UNSURE_BELOW) speakResult("tts_auto_play")
                                }
                            }
                        }
                    ) {
                        Text(
                            if (isAnalyzing) s.scanning else "🔍  ${s.analyze}",
                            style = MaterialTheme.typography.labelLarge
                        )
                    }
                }

                // ---------------- RESULT ----------------
                AnimatedVisibility(
                    visible = showResult,
                    enter = fadeIn() + slideInVertically(initialOffsetY = { 50 }),
                    exit = fadeOut()
                ) {
                    // Only Odia and English result text exist today; other languages show English.
                    val shown = if (language == Language.ODIA) resultOdia else resultEng
                    val lines = parseResult(shown)
                    val unsure = confidence <= UNSURE_BELOW
                    val title = if (unsure) s.unsure
                        else lines.firstOrNull()?.second?.replace(Regex("\\s*\\(\\d+(\\.\\d+)?%\\)"), "") ?: ""
                    val caution = lines.firstOrNull { it.first == "⚠" }?.second ?: s.caution
                    // Skin dosage is medical advice: never shown until a clinician reviews it.
                    val hidden = setOf("⚠", "Dosage", "ମାତ୍ରା")
                    val sections = if (unsure) emptyList() else lines.drop(1).filter {
                        it.first.isNotBlank() && !(mode == "skin" && it.first in hidden) && it.first != "⚠"
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        GramCard {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    if (unsure) StatusPill("📷 ${s.retakePhoto}", AmberSoft, Amber)
                                    else StatusPill("✓ ${s.diagnosis}", BrandSoft, BrandDark)
                                    Spacer(Modifier.height(10.dp))
                                    Text(title, style = MaterialTheme.typography.headlineMedium, color = Ink)
                                }
                                Spacer(Modifier.width(12.dp))
                                ConfidenceRing(confidence, s.sure)
                            }
                            Spacer(Modifier.height(8.dp))
                            Text(
                                when {
                                    confidence > 85 -> s.reliable
                                    confidence > UNSURE_BELOW -> s.moderate
                                    else -> s.unclear
                                },
                                style = MaterialTheme.typography.bodyMedium, color = InkSoft
                            )
                        }

                        if (unsure) AlertBanner(s.unsureBody)

                        if (!unsure && language.ttsLocale != null) {
                            PrimaryPillButton(onClick = { speakResult("tts_listen_click") }) {
                                Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(22.dp))
                                Spacer(Modifier.width(8.dp))
                                Text(s.listen, style = MaterialTheme.typography.labelLarge)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("${s.speed} ${String.format("%.1f", speechRate)}x", color = InkSoft, fontSize = 13.sp)
                                Slider(
                                    value = speechRate,
                                    onValueChange = { speechRate = it },
                                    valueRange = 0.5f..2.0f,
                                    steps = 10,
                                    colors = SliderDefaults.colors(thumbColor = Brand, activeTrackColor = Brand, inactiveTrackColor = CardBorder),
                                    modifier = Modifier.weight(1f).padding(start = 12.dp)
                                )
                            }
                        }

                        sections.forEach { (label, body) -> SectionCard(label, body) }

                        CautionBanner(caution)

                        OutlinedButton(
                            onClick = {
                                val shareIntent = Intent().apply {
                                    action = Intent.ACTION_SEND
                                    putExtra(Intent.EXTRA_TEXT, "GramAI:\n\n$resultEng\n\n$resultOdia")
                                    type = "text/plain"
                                }
                                context.startActivity(Intent.createChooser(shareIntent, s.share))
                            },
                            modifier = Modifier.fillMaxWidth().height(56.dp),
                            shape = RoundedCornerShape(50),
                            border = BorderStroke(1.5.dp, Brand),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Brand)
                        ) {
                            Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text(s.share, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                if (showResult) {
                    TextButton(
                        onClick = { imageUri = null; bitmap = null; showResult = false },
                        modifier = Modifier.align(Alignment.CenterHorizontally).heightIn(min = 48.dp)
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = null, tint = InkSoft)
                        Spacer(Modifier.width(6.dp))
                        Text(s.retake, color = InkSoft)
                    }
                }
            }

            Text(
                "${s.footer} · Chandra Shekhar",
                style = MaterialTheme.typography.labelSmall,
                color = InkSoft,
                modifier = Modifier.align(Alignment.CenterHorizontally).padding(vertical = 12.dp)
            )
        }
    }
    }

    DisposableEffect(Unit) {
        onDispose { tts.value?.shutdown() }
    }
}

/** Below this confidence the app shows "Not sure" and withholds remedies. */
private const val UNSURE_BELOW = 60f

/** Splits "Label: value" lines of the result text into (label, value) pairs for display. */
private fun parseResult(text: String): List<Pair<String, String>> =
    text.split("\n").filter { it.isNotBlank() }.map { line ->
        val i = line.indexOf(':')
        if (i in 1..24 && !line.startsWith("⚠")) line.substring(0, i).trim() to line.substring(i + 1).trim()
        else line.trim() to ""
    }.map { (a, b) ->
        // caution lines have no short label: keep the whole sentence in `second`
        if (a.startsWith("⚠")) "⚠" to a.removePrefix("⚠️").removePrefix("⚠").trim() + (if (b.isNotEmpty()) ": $b" else "")
        else a to b
    }
