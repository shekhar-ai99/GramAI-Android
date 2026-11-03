package com.example.gramai.advisory

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.google.gson.Gson
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Downloads a 10-day forecast when online and keeps it on the phone.
 * Uses Open-Meteo (no API key). Check its terms before a commercial release.
 */
object WeatherSync {

    // Default location: Bhubaneswar. Make this selectable per farmer later.
    const val DEFAULT_LAT = 20.2961
    const val DEFAULT_LON = 85.8245

    private const val CACHE_FILE = "weather_cache.json"
    private val gson = Gson()

    fun isOnline(context: Context): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            ?: return false
        val caps = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    /** Blocking network call. Call from a background thread only. */
    fun fetch(lat: Double = DEFAULT_LAT, lon: Double = DEFAULT_LON): WeatherCache? {
        val url = URL(
            "https://api.open-meteo.com/v1/forecast" +
                "?latitude=$lat&longitude=$lon" +
                "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum," +
                "precipitation_probability_max,weather_code" +
                "&timezone=Asia%2FKolkata&forecast_days=10"
        )
        val conn = (url.openConnection() as HttpURLConnection).apply {
            connectTimeout = 10_000
            readTimeout = 10_000
        }
        return try {
            if (conn.responseCode != 200) return null
            val body = conn.inputStream.bufferedReader().use { it.readText() }
            parse(body, lat, lon)
        } catch (e: Exception) {
            null
        } finally {
            conn.disconnect()
        }
    }

    private fun parse(body: String, lat: Double, lon: Double): WeatherCache {
        val daily = JSONObject(body).getJSONObject("daily")
        val dates = daily.getJSONArray("time")
        val tMax = daily.getJSONArray("temperature_2m_max")
        val tMin = daily.getJSONArray("temperature_2m_min")
        val rain = daily.getJSONArray("precipitation_sum")
        val prob = daily.getJSONArray("precipitation_probability_max")
        val code = daily.getJSONArray("weather_code")

        val days = (0 until dates.length()).map { i ->
            WeatherDay(
                date = dates.getString(i),
                tMax = tMax.optDouble(i, 0.0),
                tMin = tMin.optDouble(i, 0.0),
                rainMm = rain.optDouble(i, 0.0),
                rainProb = prob.optInt(i, 0),
                code = code.optInt(i, 0)
            )
        }
        return WeatherCache(System.currentTimeMillis(), lat, lon, days)
    }

    fun save(context: Context, cache: WeatherCache) {
        File(context.filesDir, CACHE_FILE).writeText(gson.toJson(cache))
    }

    fun load(context: Context): WeatherCache? {
        val file = File(context.filesDir, CACHE_FILE)
        if (!file.exists()) return null
        return try {
            gson.fromJson(file.readText(), WeatherCache::class.java)
        } catch (e: Exception) {
            null
        }
    }
}
