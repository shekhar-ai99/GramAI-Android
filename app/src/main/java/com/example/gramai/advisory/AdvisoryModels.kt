package com.example.gramai.advisory

import android.content.Context
import com.google.gson.Gson

data class WeatherDay(
    val date: String,
    val tMax: Double,
    val tMin: Double,
    val rainMm: Double,
    val rainProb: Int,
    val code: Int
)

data class WeatherCache(
    val syncedAt: Long,
    val lat: Double,
    val lon: Double,
    val days: List<WeatherDay>
)

data class CropStage(
    val id: String,
    val name: String,
    val nameOd: String,
    val datFrom: Int,
    val datTo: Int,
    val general: String,
    val organic: String,
    val chemical: String
)

data class CropCalendar(val crop: String, val stages: List<CropStage>)

data class Scheme(
    val name: String,
    val summary: String,
    val portal: String?,
    val verifyNote: String
)

data class Insurance(
    val scheme: String,
    val premium: String,
    val enrolment: String,
    val claim: String,
    val portal: String?,
    val verifyNote: String
)

data class AdvisoryData(
    val calendar: CropCalendar,
    val schemes: List<Scheme>,
    val insurance: Insurance
)

object AdvisoryRepository {
    private val gson = Gson()

    /** Reads the bundled advisory content. Works fully offline. */
    fun load(context: Context): AdvisoryData? = try {
        context.assets.open("advisory/advisory.json").use { stream ->
            gson.fromJson(stream.reader(Charsets.UTF_8), AdvisoryData::class.java)
        }
    } catch (e: Exception) {
        null
    }
}
