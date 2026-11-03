package com.example.gramai.i18n

import androidx.compose.runtime.staticCompositionLocalOf

/** Every piece of fixed UI text. Result text (disease, remedy) comes from diseases.json. */
data class Strings(
    val offline: String,
    val heroEyebrow: String,
    val heroTitle: String,
    val chooseCheck: String,
    val paddyTitle: String,
    val skinTitle: String,
    val tip: String,
    val scanHintPaddy: String,
    val scanHintSkin: String,
    val goodLight: String,
    val holdSteady: String,
    val camera: String,
    val gallery: String,
    val analyze: String,
    val scanning: String,
    val listen: String,
    val speed: String,
    val retake: String,
    val share: String,
    val back: String,
    val diagnosis: String,
    val unsure: String,
    val retakePhoto: String,
    val sure: String,
    val reliable: String,
    val moderate: String,
    val unclear: String,
    val unsureBody: String,
    val caution: String,
    val language: String,
    val footer: String
)

private val En = Strings(
    offline = "Offline",
    heroEyebrow = "AI powered paddy & skin detection",
    heroTitle = "One photo, the right advice",
    chooseCheck = "What do you want to check?",
    paddyTitle = "Paddy check",
    skinTitle = "Skin check",
    tip = "Tip: use bright light. Fill the frame with one leaf or one patch.",
    scanHintPaddy = "One leaf, fill the frame",
    scanHintSkin = "One patch, fill the frame",
    goodLight = "Good light",
    holdSteady = "Hold steady",
    camera = "Camera",
    gallery = "Choose from gallery",
    analyze = "Analyze",
    scanning = "Scanning...",
    listen = "Listen",
    speed = "Speed",
    retake = "Retake photo",
    share = "Share with expert",
    back = "Back",
    diagnosis = "Diagnosis",
    unsure = "Not sure",
    retakePhoto = "Retake photo",
    sure = "sure",
    reliable = "Highly reliable result",
    moderate = "Moderate accuracy",
    unclear = "Unclear: please retake the photo",
    unsureBody = "The AI is not sure. Do not spray or treat yet. Take a clearer photo or ask an expert.",
    caution = "AI suggestion, not a diagnosis. Confirm with an expert before any treatment.",
    language = "Language",
    footer = "AI for Health & Agriculture"
)

private val Or = Strings(
    offline = "ଅଫଲାଇନ୍",
    heroEyebrow = "AI ଦ୍ୱାରା ଧାନ ଓ ଚର୍ମ ରୋଗ ଚିହ୍ନଟ",
    heroTitle = "ଧାନ ଓ ଚର୍ମ ରୋଗ ଚିହ୍ନଟ",
    chooseCheck = "ଆପଣ କଣ ଯାଞ୍ଚ କରିବେ?",
    paddyTitle = "ଧାନ ରୋଗ ଚିହ୍ନଟ",
    skinTitle = "ଚର୍ମ ରୋଗ ଚିହ୍ନଟ",
    tip = "ଟିପ୍ପଣୀ: ଭଲ ଆଲୋକରେ ଫଟୋ ନିଅନ୍ତୁ। ଗୋଟିଏ ପତ୍ର ବା ଗୋଟିଏ ସ୍ଥାନ ଫ୍ରେମ୍ ଭରି ରଖନ୍ତୁ।",
    scanHintPaddy = "ଗୋଟିଏ ପତ୍ର, ଫ୍ରେମ୍ ଭରନ୍ତୁ",
    scanHintSkin = "ଗୋଟିଏ ସ୍ଥାନ, ଫ୍ରେମ୍ ଭରନ୍ତୁ",
    goodLight = "ଭଲ ଆଲୋକ",
    holdSteady = "ଫୋନ୍ ସ୍ଥିର ରଖନ୍ତୁ",
    camera = "କ୍ୟାମେରା",
    gallery = "ଗ୍ୟାଲେରୀରୁ ବାଛନ୍ତୁ",
    analyze = "ଚିହ୍ନଟ କରନ୍ତୁ",
    scanning = "ଚିହ୍ନଟ ଚାଲିଛି...",
    listen = "ଶୁଣନ୍ତୁ",
    speed = "ବେଗ",
    retake = "ପୁନର୍ବାର ଫଟୋ ନିଅନ୍ତୁ",
    share = "ସେୟାର କରନ୍ତୁ",
    back = "ପଛକୁ",
    diagnosis = "ରୋଗ ନିର୍ଣ୍ଣୟ",
    unsure = "ନିଶ୍ଚିତ ନୁହେଁ",
    retakePhoto = "ପୁନର୍ବାର ଫଟୋ ନିଅନ୍ତୁ",
    sure = "ନିଶ୍ଚିତ",
    reliable = "ବହୁତ ଭରସାଯୋଗ୍ୟ ଫଳାଫଳ",
    moderate = "ମଧ୍ୟମ ସଠିକତା",
    unclear = "ଅସ୍ପଷ୍ଟ: ଦୟାକରି ପୁନର୍ବାର ଫଟୋ ନିଅନ୍ତୁ",
    unsureBody = "AI ନିଶ୍ଚିତ ନୁହେଁ। ଏବେ ଔଷଧ ଦିଅନ୍ତୁ ନାହିଁ। ସଫା ଫଟୋ ନିଅନ୍ତୁ କିମ୍ବା ବିଶେଷଜ୍ଞଙ୍କୁ ପଚାରନ୍ତୁ।",
    caution = "ଏହା AI ର ପରାମର୍ଶ, ନିଦାନ ନୁହେଁ। ଚିକିତ୍ସା ପୂର୍ବରୁ ବିଶେଷଜ୍ଞଙ୍କ ସହ ପରାମର୍ଶ କରନ୍ତୁ।",
    language = "ଭାଷା",
    footer = "ସ୍ୱାସ୍ଥ୍ୟ ଓ କୃଷି ପାଇଁ AI"
)

private val Hi = Strings(
    offline = "ऑफ़लाइन",
    heroEyebrow = "AI से धान और त्वचा रोग की पहचान",
    heroTitle = "एक फ़ोटो, सही सलाह",
    chooseCheck = "आप क्या जाँचना चाहते हैं?",
    paddyTitle = "धान की जाँच",
    skinTitle = "त्वचा की जाँच",
    tip = "सुझाव: तेज़ रोशनी में फ़ोटो लें। एक पत्ता या एक हिस्सा पूरा फ़्रेम में रखें।",
    scanHintPaddy = "एक पत्ता, पूरा फ़्रेम",
    scanHintSkin = "एक हिस्सा, पूरा फ़्रेम",
    goodLight = "अच्छी रोशनी",
    holdSteady = "फ़ोन स्थिर रखें",
    camera = "कैमरा",
    gallery = "गैलरी से चुनें",
    analyze = "जाँच करें",
    scanning = "जाँच हो रही है...",
    listen = "सुनें",
    speed = "गति",
    retake = "दोबारा फ़ोटो लें",
    share = "विशेषज्ञ को भेजें",
    back = "वापस",
    diagnosis = "निदान",
    unsure = "पक्का नहीं",
    retakePhoto = "दोबारा फ़ोटो लें",
    sure = "भरोसा",
    reliable = "भरोसेमंद नतीजा",
    moderate = "मध्यम सटीकता",
    unclear = "साफ़ नहीं: कृपया फ़ोटो दोबारा लें",
    unsureBody = "AI को पक्का भरोसा नहीं है। अभी दवा न डालें। साफ़ फ़ोटो लें या विशेषज्ञ से पूछें।",
    caution = "यह AI का सुझाव है, निदान नहीं। इलाज से पहले विशेषज्ञ से पुष्टि करें।",
    language = "भाषा",
    footer = "स्वास्थ्य और कृषि के लिए AI"
)

/**
 * Santali and Ho have no reviewed UI text yet, so they show English. Fill
 * these in (with a native speaker's review) and set Language.hasUiText.
 */
fun stringsFor(language: Language): Strings = when (language) {
    Language.ODIA -> Or
    Language.HINDI -> Hi
    Language.ENGLISH, Language.SANTALI, Language.HO -> En
}

val LocalStrings = staticCompositionLocalOf { En }
