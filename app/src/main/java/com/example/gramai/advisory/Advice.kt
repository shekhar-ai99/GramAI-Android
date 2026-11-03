package com.example.gramai.advisory

/** Rules that turn the saved forecast and crop stage into plain advice. Runs fully offline. */
object Advice {

    /** Short action messages for the next 10 days, based on the saved forecast. */
    fun weatherAdvice(days: List<WeatherDay>): List<String> {
        if (days.isEmpty()) return emptyList()
        val out = mutableListOf<String>()

        val sprayDays = days.take(3).filter { it.rainMm < 2.0 && it.rainProb < 30 }
        if (sprayDays.isNotEmpty()) {
            out += "Good spraying window: ${sprayDays.first().date}. Little or no rain expected."
        } else {
            out += "No dry window for spraying in the next 3 days. Postpone spraying."
        }

        days.firstOrNull { it.rainMm >= 20.0 }?.let {
            out += "Heavy rain (${it.rainMm.toInt()} mm) expected on ${it.date}. Check field drainage and delay fertilizer."
        }

        days.firstOrNull { it.tMax >= 38.0 }?.let {
            out += "Very hot day (${it.tMax.toInt()}°C) on ${it.date}. Keep standing water and avoid midday field work."
        }

        if (days.take(3).any { it.tMin <= 12.0 }) {
            out += "Cold nights expected. Watch young nursery and seedlings."
        }

        val rainyDays = days.count { it.rainMm >= 2.0 }
        out += "Rain expected on $rainyDays of the next ${days.size} days. Plan field work around it."

        return out
    }

    /** Finds the crop stage for a given number of days after transplanting (negative = nursery). */
    fun stageFor(calendar: CropCalendar, daysAfterTransplanting: Int): CropStage? =
        calendar.stages.firstOrNull { daysAfterTransplanting in it.datFrom..it.datTo }
}
