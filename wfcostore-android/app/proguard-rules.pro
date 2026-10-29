# The app exposes no @JavascriptInterface, so no WebView-specific keep rules are needed.
# If you ever add one, keep its annotated methods:
# -keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }

# Keep line numbers for readable crash reports.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
