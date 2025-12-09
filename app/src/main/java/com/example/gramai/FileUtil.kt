package com.example.gramai

import android.content.Context
import android.util.Log
import java.io.File
import java.io.FileOutputStream

object FileUtil {
    /**
     * Copies asset to file system.
     * UPDATE: Overwrites existing files to ensure the latest model is always used.
     */
    fun assetFilePath(context: Context, assetName: String): String {
        val outFile = File(context.filesDir, assetName)

        // DANGEROUS LINE REMOVED:
        // if (outFile.exists()) return outFile.absolutePath

        try {
            context.assets.open(assetName).use { input ->
                FileOutputStream(outFile).use { output ->
                    input.copyTo(output)
                }
            }
            Log.d("FileUtil", "Copied asset: $assetName to ${outFile.absolutePath}")
        } catch (e: Exception) {
            Log.e("FileUtil", "Failed to copy asset: $assetName", e)
            throw e // Rethrow so ViewModel handles it
        }

        return outFile.absolutePath
    }
}