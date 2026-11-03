package com.example.gramai.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.gramai.ui.theme.*

/** White rounded card with a hairline border, the base surface of every screen. */
@Composable
fun GramCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val shape = RoundedCornerShape(24.dp)
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
        color = CardWhite,
        shape = RoundedCornerShape(24.dp),
        border = BorderStroke(1.dp, CardBorder)
    ) {
        Column(Modifier.padding(18.dp), content = content)
    }
}

/** Full-width green pill, the one primary action on a screen. */
@Composable
fun PrimaryPillButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: @Composable RowScope.() -> Unit
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.fillMaxWidth().height(60.dp),
        shape = RoundedCornerShape(50),
        colors = ButtonDefaults.buttonColors(containerColor = Brand, contentColor = Color.White),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 6.dp),
        content = content
    )
}

/** Small rounded label: "Diagnosis", "Retake", "Good light". */
@Composable
fun StatusPill(text: String, container: Color, content: Color, modifier: Modifier = Modifier) {
    Surface(modifier = modifier, color = container, shape = RoundedCornerShape(50)) {
        Text(
            text,
            color = content,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp)
        )
    }
}

/** App mark + name, with the offline badge on the right. */
@Composable
fun AppHeader(offlineLabel: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            Modifier.size(48.dp).clip(RoundedCornerShape(14.dp)).background(Brand),
            contentAlignment = Alignment.Center
        ) { Text("🌾", fontSize = 26.sp) }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text("GramAI", style = MaterialTheme.typography.titleLarge, color = Ink)
            Text("ଗ୍ରାମଏଆଇ", style = MaterialTheme.typography.labelSmall, color = InkSoft)
        }
        StatusPill("⚡ $offlineLabel", BrandSoft, BrandDark)
    }
}

/** Big green gradient card at the top of the home screen. */
@Composable
fun HeroCard(eyebrow: String, title: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(32.dp))
            .background(Brush.linearGradient(listOf(Brand, BrandDark)))
            .drawBehind {
                // paddy-gold sun low in the corner: a quiet Odisha-fields cue
                drawCircle(PaddyGold.copy(alpha = 0.35f), radius = size.height * 0.55f, center = Offset(size.width * 0.95f, size.height * 1.05f))
                drawCircle(PaddyGold.copy(alpha = 0.55f), radius = size.height * 0.28f, center = Offset(size.width * 0.95f, size.height * 1.05f))
            }
            .padding(horizontal = 24.dp, vertical = 28.dp)
    ) {
        Column {
            Text(eyebrow, color = Color.White.copy(alpha = 0.85f), fontSize = 15.sp)
            Spacer(Modifier.height(6.dp))
            Text(
                title,
                color = Color.White,
                style = MaterialTheme.typography.headlineMedium
            )
        }
    }
}

/** Tappable row used to pick Paddy or Skin. */
@Composable
fun ModeCard(emoji: String, title: String, subtitle: String, tile: Color, onClick: () -> Unit) {
    GramCard(onClick = onClick) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier.size(56.dp).clip(CircleShape).background(tile),
                contentAlignment = Alignment.Center
            ) { Text(emoji, fontSize = 28.sp) }
            Spacer(Modifier.width(16.dp))
            Column(Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleMedium, color = Ink)
                Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = InkSoft)
            }
            Text("›", fontSize = 30.sp, color = Brand, fontWeight = FontWeight.Bold)
        }
    }
}

/** Amber notice. Used for the "AI suggestion, not a prescription" caution. */
@Composable
fun CautionBanner(text: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(AmberSoft)
            .padding(16.dp),
        verticalAlignment = Alignment.Top
    ) {
        Text("🛡️", fontSize = 18.sp)
        Spacer(Modifier.width(10.dp))
        Text(text, color = Amber, style = MaterialTheme.typography.bodyMedium)
    }
}

/** Red notice for results that must not be acted on, such as a wrong-category photo. */
@Composable
fun AlertBanner(text: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(AlertSoft)
            .padding(16.dp),
        verticalAlignment = Alignment.Top
    ) {
        Text("🚫", fontSize = 18.sp)
        Spacer(Modifier.width(10.dp))
        Text(text, color = Alert, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
    }
}

/** One labelled block of a result: "Treatment", "Dosage", ... */
@Composable
fun SectionCard(label: String, body: String, modifier: Modifier = Modifier) {
    GramCard(modifier = modifier) {
        Text(label.uppercase(), color = Brand, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        Spacer(Modifier.height(6.dp))
        Text(body, color = Ink, style = MaterialTheme.typography.bodyLarge)
    }
}

/** Circular "91% sure" gauge. */
@Composable
fun ConfidenceRing(percent: Float, sureLabel: String, modifier: Modifier = Modifier) {
    val color = when {
        percent >= 80f -> Brand
        percent >= 60f -> PaddyGold
        else -> Alert
    }
    Box(
        modifier = modifier.size(88.dp).semantics { contentDescription = "${percent.toInt()}% $sureLabel" },
        contentAlignment = Alignment.Center
    ) {
        Canvas(Modifier.fillMaxSize()) {
            val stroke = 9.dp.toPx()
            val inset = stroke / 2
            val arcSize = Size(size.width - stroke, size.height - stroke)
            drawArc(
                color = CardBorder, startAngle = -90f, sweepAngle = 360f, useCenter = false,
                topLeft = Offset(inset, inset), size = arcSize, style = Stroke(stroke)
            )
            drawArc(
                color = color, startAngle = -90f, sweepAngle = 360f * (percent / 100f).coerceIn(0f, 1f),
                useCenter = false, topLeft = Offset(inset, inset), size = arcSize,
                style = Stroke(stroke, cap = StrokeCap.Round)
            )
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("${percent.toInt()}%", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = Ink)
            Text(sureLabel, fontSize = 12.sp, color = InkSoft)
        }
    }
}

/**
 * Rounded preview area with green corner brackets, like a viewfinder.
 * [content] is the photo (or an empty-state message) drawn inside.
 */
@Composable
fun ViewfinderFrame(
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(1f)
            .clip(RoundedCornerShape(32.dp))
            .background(Brush.verticalGradient(listOf(ScanBgTop, ScanBg)))
    ) {
        content()
        Canvas(Modifier.fillMaxSize().padding(18.dp)) {
            val len = 36.dp.toPx()
            val w = 5.dp.toPx()
            val r = 14.dp.toPx()
            val stroke = Stroke(w, cap = StrokeCap.Round)
            val c = BrandBright
            // four corner brackets
            fun corner(x: Float, y: Float, dx: Float, dy: Float) {
                drawLine(c, Offset(x, y + dy * r), Offset(x, y + dy * len), w, StrokeCap.Round)
                drawLine(c, Offset(x + dx * r, y), Offset(x + dx * len, y), w, StrokeCap.Round)
                drawArc(
                    c, startAngle = if (dx > 0 && dy > 0) 180f else if (dx < 0 && dy > 0) 270f else if (dx > 0) 90f else 0f,
                    sweepAngle = 90f, useCenter = false,
                    topLeft = Offset(if (dx > 0) x else x - 2 * r, if (dy > 0) y else y - 2 * r),
                    size = Size(2 * r, 2 * r), style = stroke
                )
            }
            corner(0f, 0f, 1f, 1f)
            corner(size.width, 0f, -1f, 1f)
            corner(0f, size.height, 1f, -1f)
            corner(size.width, size.height, -1f, -1f)
        }
    }
}

/** Soft hint chip shown under the viewfinder: "Good light", "Hold steady". */
@Composable
fun HintChip(text: String) {
    Surface(color = BrandDark, shape = RoundedCornerShape(50)) {
        Text(
            text,
            color = Color.White,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
    }
}

/** Round white-outlined icon-style button (back, close, retake). */
@Composable
fun RoundIconButton(label: String, description: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier
            .size(48.dp)
            .clip(CircleShape)
            .clickable(role = Role.Button, onClickLabel = description, onClick = onClick)
            .semantics { contentDescription = description },
        shape = CircleShape,
        color = CardWhite,
        border = BorderStroke(1.dp, CardBorder)
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(label, fontSize = 20.sp, color = Ink, fontWeight = FontWeight.Bold)
        }
    }
}

/** Horizontally scrolling language chips, each in its own script. */
@Composable
fun LanguagePicker(
    selected: com.example.gramai.i18n.Language,
    label: String,
    onSelect: (com.example.gramai.i18n.Language) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
            .semantics { contentDescription = label },
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        com.example.gramai.i18n.Language.values().forEach { lang ->
            val on = lang == selected
            Surface(
                modifier = Modifier
                    .heightIn(min = 48.dp)
                    .clip(RoundedCornerShape(50))
                    .clickable(role = Role.RadioButton, onClick = { onSelect(lang) }),
                shape = RoundedCornerShape(50),
                color = if (on) Brand else CardWhite,
                border = BorderStroke(1.dp, if (on) Brand else CardBorder)
            ) {
                Box(Modifier.padding(horizontal = 18.dp), contentAlignment = Alignment.Center) {
                    Text(
                        lang.nativeName,
                        color = if (on) Color.White else Ink,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                }
            }
        }
    }
}
