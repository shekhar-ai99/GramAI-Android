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

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color(0xFF0F2027), Color(0xFF203A43), Color(0xFF2C5364))
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {

            // HEADER + OFFLINE BADGE (unchanged)
            Card(
                modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.1f)),
                elevation = CardDefaults.cardElevation(0.dp)
            ) {
                Box(Modifier.fillMaxWidth()) {
                    Surface(
                        color = Color(0xFF4CAF50).copy(alpha = 0.2f),
                        shape = RoundedCornerShape(bottomStart = 12.dp),
                        modifier = Modifier.align(Alignment.TopEnd)
                    ) {
                        Text(
                            "⚡ Offline AI",
                            color = Color(0xFF7CFF91),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }

                    Column(
                        modifier = Modifier.padding(20.dp).fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("GramAI – ଗ୍ରାମଏଆଇ", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text("AI Powered Paddy & Skin Detection", fontSize = 14.sp, color = Color(0xFFB0BEC5))
                        Text("ଧାନ ଓ ଚର୍ମ ରୋଗ ଚିହ୍ନଟ", fontSize = 15.sp, color = Color(0xFFB0BEC5), fontWeight = FontWeight.Medium)
                    }
                }
            }

            // MODE SELECTION (unchanged)
            if (mode == null) {
                Spacer(Modifier.height(20.dp))
                Button(
                    onClick = { mode = "paddy" },
                    modifier = Modifier.fillMaxWidth().height(65.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50))
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("🌾 Paddy Detection", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text("ଧାନ ରୋଗ ଚିହ୍ନଟ", fontSize = 12.sp, color = Color.White.copy(alpha = 0.9f))
                    }
                }

                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = { mode = "skin" },
                    modifier = Modifier.fillMaxWidth().height(65.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E88E5))
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("🧑‍⚕️ Skin Detection", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text("ଚର୍ମ ରୋଗ ଚିହ୍ନଟ", fontSize = 12.sp, color = Color.White.copy(alpha = 0.9f))
                    }
                }

                Spacer(Modifier.height(40.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF3E0)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Info, contentDescription = null, tint = Color(0xFFFF9800))
                        Spacer(Modifier.width(12.dp))
                        Text("Tip: Take photos in bright light for best results.", color = Color(0xFFE65100), fontSize = 12.sp)
                    }
                }
            }
            else {

                // SCANNER UI (unchanged)
                Text(
                    text = if (mode == "paddy") "Selected: Paddy / ଧାନ" else "Selected: Skin / ଚର୍ମ",
                    fontSize = 20.sp, color = Color.White
                )

                Spacer(Modifier.height(20.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedButton(
                        onClick = { galleryLauncher.launch("image/*") },
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("📂 Upload")
                            Text("ଅପଲୋଡ୍", fontSize = 10.sp)
                        }
                    }
                    OutlinedButton(
                        onClick = { cameraLauncher.launch(null) },
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("📷 Camera")
                            Text("କ୍ୟାମେରା", fontSize = 10.sp)
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))

                // Vision Scanner (unchanged)
                Box(
                    modifier = Modifier
                        .size(280.dp)
                        .padding(8.dp)
                        .border(3.dp, Brush.sweepGradient(listOf(Color(0xFF00E5FF), Color(0xFFD500F9), Color(0xFF2979FF))), RoundedCornerShape(20.dp))
                        .clip(RoundedCornerShape(20.dp))
                ) {
                    if (imageUri != null) {
                        AsyncImage(model = imageUri, contentDescription = null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                    } else if (bitmap != null) {
                        Image(bitmap = bitmap!!.asImageBitmap(), contentDescription = null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                    } else {
                        Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha=0.3f)), contentAlignment = Alignment.Center) {
                            Text("No Image Selected", color = Color.Gray)
                        }
                    }

                    if (isAnalyzing) {
                        Box(
                            Modifier
                                .fillMaxWidth()
                                .height(4.dp)
                                .align(Alignment.TopCenter)
                                .offset(y = (264 * scanLineY).dp)
                                .background(Brush.horizontalGradient(listOf(Color.Transparent, Color.Red, Color.Transparent)))
                        )
                        Box(Modifier.fillMaxSize().background(Color(0xFF00FF00).copy(alpha = 0.1f)))
                    }
                }

                if (imageUri != null || bitmap != null) {
                    Spacer(Modifier.height(20.dp))

                    // --- ANALYZE BUTTON (unchanged) ---
                    Button(
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

                                    // AUTO-SPEAK (updated with speedRate)
                                    val engine = tts.value
                                    val locale = Locale("or", "IN")
                                    val result = engine?.setLanguage(locale)
                                    if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                                        Toast.makeText(context, "Odia voice not installed.", Toast.LENGTH_LONG).show()
                                    } else {
                                        engine?.setSpeechRate(speechRate)
                                        engine?.stop()
                                        engine?.speak(resultOdia, TextToSpeech.QUEUE_FLUSH, null, "tts_auto_play")
                                    }
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(65.dp),
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFC107))
                    ) {
                        if (isAnalyzing) {
                            Text("Scanning... / ଚିହ୍ନଟ ଚାଲିଛି...", color = Color.Black)
                        } else {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("🔍 Analyze with AI", fontSize = 18.sp, color = Color.Black, fontWeight = FontWeight.Bold)
                                Text("AI ଦ୍ୱାରା ଚିହ୍ନଟ କରନ୍ତୁ", fontSize = 12.sp, color = Color.Black, fontWeight = FontWeight.Medium)
                            }
                        }
                    }
                }

                // RESULTS CARD (unchanged except speed slider)
                AnimatedVisibility(
                    visible = showResult,
                    enter = fadeIn() + slideInVertically(initialOffsetY = { 50 }),
                    exit = fadeOut()
                ) {
                    Spacer(Modifier.height(24.dp))

                    Card(
                        modifier = Modifier.fillMaxWidth().padding(top = 24.dp),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.15f)),
                        elevation = CardDefaults.cardElevation(0.dp)
                    ) {

                        Column(modifier = Modifier.padding(20.dp)) {

                            // Confidence Section (unchanged)
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Column {
                                    Text("AI Confidence", color = Color.Gray, fontSize = 12.sp)
                                    Text("ବିଶ୍ୱସନୀୟତା", color = Color.Gray, fontSize = 10.sp)
                                }
                                Text("${String.format("%.1f", confidence)}%", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            }

                            Spacer(Modifier.height(4.dp))
                            LinearProgressIndicator(
                                progress = confidence / 100f,
                                modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                                color = if (confidence > 80) Color(0xFF4CAF50) else Color(0xFFFF9800)
                            )

                            Spacer(Modifier.height(8.dp))
                            Text(
                                text = when {
                                    confidence > 85 -> "✅ Highly Reliable Result"
                                    confidence > 60 -> "⚠️ Moderate Accuracy"
                                    else -> "❌ Unclear - Please Retake Photo"
                                },
                                fontSize = 12.sp, color = Color.LightGray
                            )

                            Spacer(Modifier.height(20.dp))

                            // --- ODIA SECTION ---
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Diagnosis (Odia)", color = Color(0xFF7CFF91), fontWeight = FontWeight.Bold)
                            }

                            Spacer(Modifier.height(8.dp))

                            //---------------------------
                            //  🎚 MINIMAL SPEED SLIDER
                            //---------------------------
                            Text(
                                text = "${String.format("%.1f", speechRate)}x",
                                color = Color.White,
                                modifier = Modifier.align(Alignment.CenterHorizontally)
                            )

                            Slider(
                                value = speechRate,
                                onValueChange = { speechRate = it },
                                valueRange = 0.5f..2.0f,
                                steps = 10,
                                modifier = Modifier.fillMaxWidth()
                            )

                            Spacer(Modifier.height(8.dp))

                            //---------------------------
                            //  🔊 LISTEN BUTTON (updated)
                            //---------------------------
                            Button(
                                onClick = {
                                    val engine = tts.value
                                    if (engine == null) {
                                        Toast.makeText(context, "TTS not ready", Toast.LENGTH_SHORT).show()
                                        return@Button
                                    }

                                    val locale = Locale("or", "IN")
                                    val result = engine.setLanguage(locale)

                                    if (result == TextToSpeech.LANG_MISSING_DATA ||
                                        result == TextToSpeech.LANG_NOT_SUPPORTED) {
                                        Toast.makeText(context, "Odia voice missing.", Toast.LENGTH_LONG).show()
                                    } else {
                                        engine.setSpeechRate(speechRate) // apply slider speed
                                        engine.stop()
                                        engine.speak(resultOdia, TextToSpeech.QUEUE_FLUSH, null, "tts_listen_click")
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50)),
                                shape = RoundedCornerShape(50),
                                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                            ) {
                                Icon(Icons.Default.PlayArrow, contentDescription = "Play", tint = Color.White, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(8.dp))
                                Text("Listen / ଶୁଣନ୍ତୁ", color = Color.White, fontSize = 12.sp)
                            }

                            Spacer(Modifier.height(8.dp))
                            Text(resultOdia, color = Color.White, fontSize = 16.sp, lineHeight = 24.sp)

                            Spacer(Modifier.height(16.dp))
                            Divider(color = Color.White.copy(alpha = 0.2f))
                            Spacer(Modifier.height(16.dp))

                            // English Diagnosis (unchanged)
                            Text("Diagnosis (English)", color = Color(0xFF64B5F6), fontWeight = FontWeight.Bold)
                            Text(resultEng, color = Color.White.copy(alpha = 0.9f), fontSize = 15.sp)

                            Spacer(Modifier.height(20.dp))

                            // SHARE BUTTON (unchanged)
                            Button(
                                onClick = {
                                    val shareIntent = Intent().apply {
                                        action = Intent.ACTION_SEND
                                        putExtra(Intent.EXTRA_TEXT, "GramAI Diagnosis:\n\n$resultEng\n\n$resultOdia")
                                        type = "text/plain"
                                    }
                                    context.startActivity(Intent.createChooser(shareIntent, "Share Result"))
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.2f))
                            ) {
                                Icon(Icons.Default.Share, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(8.dp))
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("Share Result with Doctor", color = Color.White)
                                    Text("ଡାକ୍ତରଙ୍କ ସହ ସେୟାର କରନ୍ତୁ", color = Color.LightGray, fontSize = 10.sp)
                                }
                            }
                        }
                    }
                }

                Spacer(Modifier.height(24.dp))

                // RETAKE BUTTON (unchanged)
                if (showResult) {
                    TextButton(onClick = {
                        imageUri = null; bitmap = null; showResult = false
                    }) {
                        Icon(Icons.Default.Refresh, contentDescription = null, tint = Color.LightGray)
                        Spacer(Modifier.width(4.dp))
                        Text("Retake Photo / ପୁନର୍ବାର ଫଟୋ ନିଅନ୍ତୁ", color = Color.LightGray)
                    }
                }

                TextButton(onClick = {
                    mode = null; imageUri = null; bitmap = null; showResult = false
                }) {
                    Text("← Change Mode / ମୋଡ୍ ବଦଳାନ୍ତୁ", color = Color.LightGray)
                }
            }

            Spacer(Modifier.height(40.dp))

            // FOOTER (unchanged)
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.5f)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("🌾🩺 AI for Health & Agriculture", color = Color(0xFF7CFF91), fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(12.dp))
                    Text("Lead Researcher", color = Color.Gray, fontSize = 10.sp)
                    Text("Chandra Shekhar", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                    Spacer(Modifier.height(8.dp))
                }
            }

            Spacer(Modifier.height(20.dp))
        }
    }

    DisposableEffect(Unit) {
        onDispose { tts.value?.shutdown() }
    }
}
