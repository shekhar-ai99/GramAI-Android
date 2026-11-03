package com.example.gramai.ui

import android.content.SharedPreferences
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.gramai.i18n.Language
import com.example.gramai.i18n.Strings
import com.example.gramai.ui.theme.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.text.DateFormat
import java.util.Date

/** One saved scan. Photos are not stored yet; only the outcome. */
data class HistoryItem(
    val title: String,
    val percent: Int,
    val kind: String, // "ok" | "warn" | "bad"
    val mode: String, // "paddy" | "skin"
    val time: Long
)

/** History lives on the phone only (SharedPreferences), newest first, capped at 30. */
object HistoryStore {
    private val gson = Gson()
    private const val KEY = "history"

    fun load(prefs: SharedPreferences): List<HistoryItem> = try {
        gson.fromJson(prefs.getString(KEY, "[]"), object : TypeToken<List<HistoryItem>>() {}.type) ?: emptyList()
    } catch (e: Exception) { emptyList() }

    fun add(prefs: SharedPreferences, item: HistoryItem): List<HistoryItem> {
        val next = (listOf(item) + load(prefs)).take(30)
        prefs.edit().putString(KEY, gson.toJson(next)).apply()
        return next
    }

    fun clear(prefs: SharedPreferences) { prefs.edit().remove(KEY).apply() }
}

@Composable
fun HistoryRow(item: HistoryItem, s: Strings) {
    val (container, content, label) = when (item.kind) {
        "ok" -> Triple(BrandSoft, BrandDark, s.resultStatus)
        "warn" -> Triple(AmberSoft, Amber, s.retakeStatus)
        else -> Triple(AlertSoft, Alert, s.expertStatus)
    }
    GramCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier.size(56.dp).clip(RoundedCornerShape(16.dp))
                    .background(if (item.mode == "skin") SkinClaySoft else PaddyGoldSoft),
                contentAlignment = Alignment.Center
            ) { Text(if (item.mode == "skin") "🧑‍⚕️" else "🌾", fontSize = 26.sp) }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(item.title, style = MaterialTheme.typography.titleMedium, color = Ink)
                val when_ = DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT).format(Date(item.time))
                Text(
                    if (item.percent > 0) "$when_ · ${item.percent}% ${s.sure}" else when_,
                    style = MaterialTheme.typography.labelSmall, color = InkSoft
                )
            }
            StatusPill(label, container, content)
        }
    }
}

@Composable
fun HistoryScreen(items: List<HistoryItem>, s: Strings, onClear: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(s.historyTitle, style = MaterialTheme.typography.headlineLarge, color = Ink)
        if (items.isEmpty()) Text(s.noHistory, color = InkSoft)
        items.forEach { HistoryRow(it, s) }
        if (items.isNotEmpty()) {
            OutlinedButton(
                onClick = onClear,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(50),
                border = BorderStroke(1.5.dp, Brand),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Brand)
            ) { Text(s.deleteAll, fontWeight = FontWeight.Bold) }
        }
    }
}

@Composable
fun SettingsScreen(language: Language, s: Strings, onLanguage: (Language) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(s.settingsTitle, style = MaterialTheme.typography.headlineLarge, color = Ink)
        GramCard {
            Text(s.language.uppercase(), color = InkSoft, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            Spacer(Modifier.height(10.dp))
            LanguagePicker(selected = language, label = s.language, onSelect = onLanguage)
        }
        if (!language.hasUiText) {
            CautionBanner("${language.nativeName}: translation is being prepared. Showing English for now.")
        } else if (language.machineTranslated) {
            CautionBanner("${language.nativeName}: machine translation, not yet checked by a native speaker.")
        }
        GramCard {
            Text(s.about.uppercase(), color = InkSoft, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            Spacer(Modifier.height(8.dp))
            Text(s.aboutBody, color = Ink, style = MaterialTheme.typography.bodyLarge)
        }
    }
}

/** Three-tab bar: Scan, History, Settings. */
@Composable
fun GramNavBar(tab: String, s: Strings, onTab: (String) -> Unit) {
    Surface(color = CardWhite, shadowElevation = 8.dp) {
        Row(Modifier.fillMaxWidth().navigationBarsPadding()) {
            listOf(
                Triple("scan", "🏠", s.navScan),
                Triple("history", "🕘", s.navHistory),
                Triple("settings", "⚙️", s.navSettings)
            ).forEach { (id, icon, label) ->
                val on = tab == id
                Column(
                    Modifier.weight(1f).heightIn(min = 64.dp)
                        .clickable(role = Role.Tab) { onTab(id) }
                        .semantics { contentDescription = label },
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(icon, fontSize = 22.sp)
                    Text(label, fontSize = 13.sp, fontWeight = if (on) FontWeight.ExtraBold else FontWeight.Medium, color = if (on) Brand else InkSoft)
                }
            }
        }
    }
}
