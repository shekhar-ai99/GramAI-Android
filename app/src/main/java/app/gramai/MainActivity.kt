package app.gramai

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.view.ViewGroup
import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.GeolocationPermissions
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.webkit.WebViewAssetLoader
import java.io.File

/**
 * GramAI Android = a thin native shell around the GramAI web app.
 * The web app (UI, logic, content, models) is bundled in assets/www and served from a local https origin,
 * so it works offline and the Android and web versions cannot drift apart.
 * Assets are copied in by scripts/sync_web_assets.sh from the GramAI-Web repo.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var cameraUri: Uri? = null
    private var pendingGeo: Pair<String, GeolocationPermissions.Callback>? = null

    private val pickFile = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { r ->
        val data = r.data
        val result: Array<Uri>? = if (r.resultCode == Activity.RESULT_OK) {
            val picked = data?.data
            when {
                picked != null -> arrayOf(picked)
                cameraUri != null -> arrayOf(cameraUri!!) // camera returns no data, the photo is at our uri
                else -> null
            }
        } else null
        fileCallback?.onReceiveValue(result); fileCallback = null
    }

    private val askLocation = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { grants ->
        val ok = grants.values.any { it }
        pendingGeo?.let { (origin, cb) -> cb.invoke(origin, ok, false) }; pendingGeo = null
    }

    private val askCamera = registerForActivityResult(ActivityResultContracts.RequestPermission()) { launchChooser() }
    private var chooserParams: WebChromeClient.FileChooserParams? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true          // saved language, forecast, news, history
                allowFileAccess = false
                allowContentAccess = false
                cacheMode = WebSettings.LOAD_DEFAULT
                mediaPlaybackRequiresUserGesture = true
            }
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                    loader.shouldInterceptRequest(request.url)

                // Links to other sites (news articles, portals) open in the browser, not inside the app.
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    if (request.url.host == WebViewAssetLoader.DEFAULT_DOMAIN) return false
                    startActivity(Intent(Intent.ACTION_VIEW, request.url)); return true
                }
            }
            webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(v: WebView, cb: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                    fileCallback?.onReceiveValue(null); fileCallback = cb; chooserParams = params
                    if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) launchChooser()
                    else askCamera.launch(Manifest.permission.CAMERA)
                    return true
                }

                override fun onGeolocationPermissionsShowPrompt(origin: String, callback: GeolocationPermissions.Callback) {
                    val fine = Manifest.permission.ACCESS_FINE_LOCATION; val coarse = Manifest.permission.ACCESS_COARSE_LOCATION
                    if (listOf(fine, coarse).any { ContextCompat.checkSelfPermission(this@MainActivity, it) == PackageManager.PERMISSION_GRANTED }) callback.invoke(origin, true, false)
                    else { pendingGeo = origin to callback; askLocation.launch(arrayOf(fine, coarse)) }
                }

                override fun onPermissionRequest(request: PermissionRequest) = request.deny()

                override fun onConsoleMessage(m: ConsoleMessage): Boolean {
                    if (BuildConfig.DEBUG) Log.d("GramWeb", "${m.messageLevel()} ${m.sourceId()}:${m.lineNumber()} ${m.message()}")
                    return true
                }
            }
        }
        if (BuildConfig.DEBUG) WebView.setWebContentsDebuggingEnabled(true)
        setContentView(web)

        // System back: let the web app go back one step first, then leave.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("(function(){var b=document.getElementById('back');if(b&&!b.hidden){b.click();return 1}var c=document.getElementById('chat');if(c&&!c.hidden){c.hidden=true;return 1}return 0})()") { r ->
                    if (r != "1") { isEnabled = false; onBackPressedDispatcher.onBackPressed() }
                }
            }
        })

        if (savedInstanceState != null) web.restoreState(savedInstanceState)
        else web.loadUrl("https://${WebViewAssetLoader.DEFAULT_DOMAIN}/assets/www/web/index.html")
    }

    /** Chooser with Camera + gallery/files, so "Choose photo" works with one tap. */
    private fun launchChooser() {
        val pick = Intent(Intent.ACTION_GET_CONTENT).apply { addCategory(Intent.CATEGORY_OPENABLE); type = "image/*" }
        val extra = mutableListOf<Intent>()
        cameraUri = null
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            val dir = File(cacheDir, "photos").apply { mkdirs() }
            val file = File.createTempFile("leaf_", ".jpg", dir)
            cameraUri = FileProvider.getUriForFile(this, "$packageName.files", file)
            extra += Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply { putExtra(MediaStore.EXTRA_OUTPUT, cameraUri); addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION) }
        }
        val chooser = Intent.createChooser(pick, null).apply { putExtra(Intent.EXTRA_INITIAL_INTENTS, extra.toTypedArray()) }
        try { pickFile.launch(chooser) } catch (e: Exception) { fileCallback?.onReceiveValue(null); fileCallback = null }
    }

    override fun onSaveInstanceState(outState: Bundle) { super.onSaveInstanceState(outState); web.saveState(outState) }
    override fun onDestroy() { fileCallback?.onReceiveValue(null); web.destroy(); super.onDestroy() }
}
