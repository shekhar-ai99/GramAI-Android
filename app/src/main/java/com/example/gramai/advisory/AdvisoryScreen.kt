package com.example.gramai.advisory

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val TextWhite = Color.White
private val TextSoft = Color(0xFFB0BEC5)
private val CardBg = Color.White.copy(alpha = 0.1f)

/**
 * Offline farm advisory: 10-day weather (saved when online), crop stage advice
 * with organic and chemical options, government schemes and crop insurance.
 * Everything except the sync button works without a mobile network.
 */
@Composable
fun AdvisoryScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val uriHandler = LocalUriHandler.current
    val scope = rememberCoroutineScope()
    val data = remember { AdvisoryRepository.load(context) }
    val prefs = remember { context.getSharedPreferences("advisory", Context.MODE_PRIVATE) }

    var weather by remember { mutableStateOf(WeatherSync.load(context)) }
    var online by remember { mutableStateOf(WeatherSync.isOnline(context)) }
    var syncing by remember { mutableStateOf(false) }
    var syncMsg by remember { mutableStateOf("") }
    var tab by remember { mutableStateOf(0) }
    var datText by remember {
        mutableStateOf(prefs.getInt("dat", Int.MIN_VALUE).takeIf { it != Int.MIN_VALUE }?.toString() ?: "")
    }

    fun sync() {
        syncing = true
        syncMsg = ""
        scope.launch {
            val result = withContext(Dispatchers.IO) { WeatherSync.fetch() }
            syncing = false
            if (result != null) {
                WeatherSync.save(context, result)
                weather = result
                syncMsg = "Forecast updated."
            } else {
                syncMsg = "Sync failed. Try again when you have a connection."
            }
        }
    }

    // Refresh automatically when online and the saved forecast is older than 6 hours.
    LaunchedEffect(Unit) {
        online = WeatherSync.isOnline(context)
        val saved = weather
        val stale = saved == null || System.currentTimeMillis() - saved.syncedAt > 6 * 3600_000L
        if (online && stale) sync()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color(0xFF0F2027), Color(0xFF203A43), Color(0xFF2C5364))
                )
            )
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Button(
                onClick = onBack,
                colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.15f))
            ) { Text("← Back", color = TextWhite) }
            Spacer(Modifier.width(12.dp))
            Text("Farm Advisory", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextWhite)
        }

        Spacer(Modifier.height(8.dp))
        OfflineBanner(online = online, weather = weather)
        Spacer(Modifier.height(8.dp))

        TabRow(
            selectedTabIndex = tab,
            containerColor = Color.Transparent,
            contentColor = TextWhite
        ) {
            listOf("Weather", "Crop", "Schemes", "Insurance").forEachIndexed { i, title ->
                Tab(
                    selected = tab == i,
                    onClick = { tab = i },
                    text = { Text(title, fontSize = 12.sp, color = TextWhite) }
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            when (tab) {
                0 -> WeatherTab(
                    weather = weather,
                    online = online,
                    syncing = syncing,
                    syncMsg = syncMsg,
                    onSync = { sync() }
                )
                1 -> CropTab(
                    calendar = data?.calendar,
                    datText = datText,
                    onDatChange = { value ->
                        datText = value
                        val n = value.toIntOrNull()
                        if (n != null) prefs.edit().putInt("dat", n).apply()
                        else prefs.edit().remove("dat").apply()
                    }
                )
                2 -> SchemesTab(
                    schemes = data?.schemes.orEmpty(),
                    onOpen = { uriHandler.openUri(it) }
                )
                3 -> InsuranceTab(
                    insurance = data?.insurance,
                    onOpen = { uriHandler.openUri(it) }
                )
            }
        }
    }
}

@Composable
private fun OfflineBanner(online: Boolean, weather: WeatherCache?) {
    val (bg, msg) = when {
        online -> Color(0xFF1B5E20).copy(alpha = 0.4f) to
            "Online. You can sync the latest 10-day forecast."
        weather == null -> Color(0xFFE65100).copy(alpha = 0.5f) to
            "No mobile network and no saved forecast yet. Connect once to save 10 days for offline use."
        else -> {
            val age = System.currentTimeMillis() - weather.syncedAt
            val note = if (age > 48 * 3600_000L) " This forecast may be outdated." else ""
            Color(0xFF455A64).copy(alpha = 0.6f) to
                "No mobile network. Using the forecast saved on ${formatDate(weather.syncedAt)}.$note"
        }
    }
    Card(colors = CardDefaults.cardColors(containerColor = bg), modifier = Modifier.fillMaxWidth()) {
        Text(msg, color = TextWhite, fontSize = 13.sp, modifier = Modifier.padding(12.dp))
    }
}

@Composable
private fun WeatherTab(
    weather: WeatherCache?,
    online: Boolean,
    syncing: Boolean,
    syncMsg: String,
    onSync: () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Button(
            onClick = onSync,
            enabled = online && !syncing,
            modifier = Modifier.fillMaxWidth()
        ) { Text(if (syncing) "Syncing…" else "Sync 10-day forecast") }

        if (syncMsg.isNotEmpty()) {
            Text(syncMsg, color = TextSoft, fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp))
        }
        Spacer(Modifier.height(12.dp))

        if (weather == null) {
            InfoCard("No forecast saved yet. Connect to the internet and tap Sync once. The 10-day forecast will then stay on this phone.")
        } else {
            Text("Advice from the saved forecast", fontWeight = FontWeight.Bold, color = TextWhite)
            Advice.weatherAdvice(weather.days).forEach { InfoCard(it) }

            Spacer(Modifier.height(12.dp))
            Text("10-day forecast", fontWeight = FontWeight.Bold, color = TextWhite)
            weather.days.forEach { d ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = CardBg),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(d.date, color = TextWhite, fontSize = 13.sp)
                        Text("${d.tMin.toInt()}–${d.tMax.toInt()}°C", color = TextWhite, fontSize = 13.sp)
                        Text(
                            "${"%.1f".format(d.rainMm)} mm · ${d.rainProb}%",
                            color = Color(0xFF90CAF9),
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CropTab(
    calendar: CropCalendar?,
    datText: String,
    onDatChange: (String) -> Unit
) {
    if (calendar == null) {
        InfoCard("Advisory data could not be loaded.")
        return
    }

    OutlinedTextField(
        value = datText,
        onValueChange = onDatChange,
        label = { Text("Days since transplanting (negative for nursery)", color = TextSoft) },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
        modifier = Modifier.fillMaxWidth(),
        colors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = TextWhite,
            unfocusedTextColor = TextWhite,
            focusedBorderColor = TextWhite,
            unfocusedBorderColor = TextSoft
        )
    )
    Spacer(Modifier.height(12.dp))

    val dat = datText.toIntOrNull()
    if (dat == null) {
        Text("All stages for ${calendar.crop}", fontWeight = FontWeight.Bold, color = TextWhite)
        calendar.stages.forEach { StageCard(it, detailed = false) }
    } else {
        val stage = Advice.stageFor(calendar, dat)
        if (stage == null) {
            InfoCard("No stage matches day $dat. Check the number.")
        } else {
            Text("Current stage", fontWeight = FontWeight.Bold, color = TextWhite)
            StageCard(stage, detailed = true)
        }
    }
}

@Composable
private fun StageCard(stage: CropStage, detailed: Boolean) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CardBg),
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text("${stage.name} · ${stage.nameOd}", fontWeight = FontWeight.Bold, color = TextWhite)
            Text("Day ${stage.datFrom} to ${stage.datTo}", color = TextSoft, fontSize = 12.sp)
            if (detailed) {
                Spacer(Modifier.height(8.dp))
                Text(stage.general, color = TextWhite, fontSize = 13.sp)
                Spacer(Modifier.height(6.dp))
                Text("Organic: ${stage.organic}", color = Color(0xFF7CFF91), fontSize = 13.sp)
                Spacer(Modifier.height(4.dp))
                Text("Chemical: ${stage.chemical}", color = Color(0xFFFFCC80), fontSize = 13.sp)
            }
        }
    }
}

@Composable
private fun SchemesTab(schemes: List<Scheme>, onOpen: (String) -> Unit) {
    if (schemes.isEmpty()) InfoCard("Scheme list could not be loaded.")
    schemes.forEach { s ->
        Card(
            colors = CardDefaults.cardColors(containerColor = CardBg),
            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(s.name, fontWeight = FontWeight.Bold, color = TextWhite)
                Text(s.summary, color = TextWhite, fontSize = 13.sp)
                Text(s.verifyNote, color = TextSoft, fontSize = 11.sp)
                s.portal?.let { url ->
                    TextButton(onClick = { onOpen(url) }) { Text("Open $url", color = Color(0xFF90CAF9)) }
                }
            }
        }
    }
}

@Composable
private fun InsuranceTab(insurance: Insurance?, onOpen: (String) -> Unit) {
    if (insurance == null) {
        InfoCard("Insurance details could not be loaded.")
        return
    }
    Card(
        colors = CardDefaults.cardColors(containerColor = CardBg),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(insurance.scheme, fontWeight = FontWeight.Bold, color = TextWhite)
            Spacer(Modifier.height(8.dp))
            Text("Premium", fontWeight = FontWeight.Bold, color = TextWhite, fontSize = 13.sp)
            Text(insurance.premium, color = TextWhite, fontSize = 13.sp)
            Spacer(Modifier.height(6.dp))
            Text("How to enrol", fontWeight = FontWeight.Bold, color = TextWhite, fontSize = 13.sp)
            Text(insurance.enrolment, color = TextWhite, fontSize = 13.sp)
            Spacer(Modifier.height(6.dp))
            Text("If your crop is damaged", fontWeight = FontWeight.Bold, color = TextWhite, fontSize = 13.sp)
            Text(insurance.claim, color = TextWhite, fontSize = 13.sp)
            Spacer(Modifier.height(6.dp))
            Text(insurance.verifyNote, color = TextSoft, fontSize = 11.sp)
            insurance.portal?.let { url ->
                TextButton(onClick = { onOpen(url) }) { Text("Open $url", color = Color(0xFF90CAF9)) }
            }
        }
    }
}

@Composable
private fun InfoCard(text: String) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CardBg),
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
    ) {
        Text(text, color = TextWhite, fontSize = 13.sp, modifier = Modifier.padding(12.dp))
    }
}

private fun formatDate(millis: Long): String =
    SimpleDateFormat("dd MMM yyyy, HH:mm", Locale.getDefault()).format(Date(millis))
