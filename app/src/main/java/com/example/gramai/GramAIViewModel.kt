package com.example.gramai

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.pytorch.IValue
import org.pytorch.Module
import org.pytorch.torchvision.TensorImageUtils
import java.io.InputStreamReader
import kotlin.math.exp

class GramAIViewModel(private val context: Context) : ViewModel() {

    private val TAG = "GramAIViewModel"
    private val gson = Gson()

    private var diseasesMap: Map<String, Any> = emptyMap()

    // ---------------------------------------------------------
    // LOAD STANDARD MODELS (Using standard Module.load)
    // ---------------------------------------------------------
    private val paddyModule: Module by lazy {
        Module.load(FileUtil.assetFilePath(context, "paddy_model_std.pt"))
    }

    private val skinModule: Module by lazy {
        Module.load(FileUtil.assetFilePath(context, "skin_model_std.pt"))
    }

    init {
        loadDiseasesJson()
    }

    private fun loadDiseasesJson() {
        try {
            context.assets.open("diseases.json").use { stream ->
                InputStreamReader(stream).use { reader ->
                    @Suppress("UNCHECKED_CAST")
                    diseasesMap = gson.fromJson(reader.readText(), Map::class.java)
                            as Map<String, Any>
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load diseases.json", e)
        }
    }

    fun predict(
        bitmap: Bitmap,
        mode: String,
        callback: (Float, String, String, Boolean) -> Unit
    ) {
        viewModelScope.launch(Dispatchers.IO) {

            // 1. Safety Check: If JSON failed to load
            if (diseasesMap.isEmpty()) {
                withContext(Dispatchers.Main) {
                    callback(0f, "System Error: Config missing", "Restart App", true)
                }
                return@launch
            }

            val normalizedMode = if (mode.contains("paddy", true)) "paddy" else "skin"

            // 2. Inference
            val (disease, conf, mismatch) = runInference(bitmap, normalizedMode)

            // 3. Safe JSON Parsing
            val modeBlock = diseasesMap[normalizedMode] as? Map<*, *> ?: emptyMap<String, Any>()
            val detailsBlock = modeBlock["details"] as? Map<*, *> ?: emptyMap<String, Any>()

            // Fallback if disease not found in JSON
            val diseaseInfo = detailsBlock[disease] as? Map<*, *> ?: mapOf(
                "odia" to mapOf("description" to "No data", "remedy" to "Contact Expert"),
                "en" to mapOf("description" to "No data", "remedy" to "Contact Expert")
            )

            val od = diseaseInfo["odia"] as? Map<*, *> ?: emptyMap<String, Any>()
            val en = diseaseInfo["en"] as? Map<*, *> ?: emptyMap<String, Any>()

            // ---------------------------------------------------------
            // CONDITIONAL CAUTION MESSAGES
            // ---------------------------------------------------------
            val cautionOdia: String
            val cautionEng: String

            if (normalizedMode == "paddy") {
                // Agriculture Expert for Paddy
                cautionOdia = "⚠️ ସତର୍କତା: ଏହା ଏକ AI ପୂର୍ବାନୁମାନ | ସଠିକ୍ ପରାମର୍ଶ ପାଇଁ କୃଷି ବିଶେଷଜ୍ଞଙ୍କୁ ସମ୍ପର୍କ କରନ୍ତୁ।"
                cautionEng = "⚠️ Caution: AI prediction. Please consult an agriculture expert for verification."
            } else {
                // Dermatologist for Skin
                cautionOdia = "⚠️ ସତର୍କତା: ଏହା ଏକ AI ପୂର୍ବାନୁମାନ | ସଠିକ୍ ପରାମର୍ଶ ପାଇଁ ଚର୍ମ ରୋଗ ବିଶେଷଜ୍ଞ (Dermatologist)ଙ୍କୁ ଦେଖାନ୍ତୁ।"
                cautionEng = "⚠️ Caution: AI prediction. Please consult a dermatologist/doctor for verification."
            }

            val odiaText =
                "ରୋଗ: $disease\n" +
                        "ବର୍ଣ୍ଣନା: ${od["description"] ?: "N/A"}\n" +
                        "ଉପଚାର: ${od["remedy"] ?: "N/A"}\n" +
                        "ମାତ୍ରା: ${od["dosage"] ?: "N/A"}\n" +
                        "ସାବଧାନୀ: ${od["warnings"] ?: "N/A"}\n\n" +
                        cautionOdia

            val engText =
                "Disease: $disease (${String.format("%.1f", conf)}%)\n" +
                        "Description: ${en["description"] ?: "N/A"}\n" +
                        "Treatment: ${en["remedy"] ?: "N/A"}\n" +
                        "Dosage: ${en["dosage"] ?: "N/A"}\n" +
                        "Warning: ${en["warnings"] ?: "N/A"}\n\n" +
                        cautionEng

            withContext(Dispatchers.Main) {
                callback(conf, odiaText, engText, mismatch)
            }
        }
    }

    private fun runInference(bitmap: Bitmap, mode: String): Triple<String, Float, Boolean> {
        return try {
            val module = if (mode == "paddy") paddyModule else skinModule

            val resized = Bitmap.createScaledBitmap(bitmap, 224, 224, true)

            // Standard ImageNet Normalization
            val inputTensor = TensorImageUtils.bitmapToFloat32Tensor(
                resized,
                TensorImageUtils.TORCHVISION_NORM_MEAN_RGB,
                TensorImageUtils.TORCHVISION_NORM_STD_RGB
            )

            val output = module.forward(IValue.from(inputTensor)).toTensor()
            val scores = output.dataAsFloatArray
            val probs = softmax(scores)

            var maxIdx = 0
            var maxProb = 0f
            for (i in probs.indices) {
                if (probs[i] > maxProb) {
                    maxProb = probs[i]
                    maxIdx = i
                }
            }

            val classes = (diseasesMap[mode] as? Map<*, *>)?.get("classes") as? List<String> ?: emptyList()

            if (maxIdx >= classes.size) {
                return Triple("Unknown", 0f, true)
            }

            val disease = classes[maxIdx]
            val confidence = maxProb * 100f

            Triple(disease, confidence, false)

        } catch (e: Exception) {
            Log.e(TAG, "Inference Error", e)
            Triple("Error", 0f, true)
        }
    }

    private fun softmax(logits: FloatArray): FloatArray {
        val maxLogit = logits.maxOrNull() ?: 0f
        val expVals = FloatArray(logits.size)
        var sum = 0f
        for (i in logits.indices) {
            expVals[i] = exp(logits[i] - maxLogit)
            sum += expVals[i]
        }
        for (i in logits.indices) {
            expVals[i] /= sum
        }
        return expVals
    }
}