package com.nochimzero.app;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;

// 문자 앱에서 "공유 → 놓침제로"로 보낸 글을 받아 붙여넣기 칸에 넣어 줌
public class MainActivity extends BridgeActivity {
    private String pendingText = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        pendingText = sharedText(getIntent());
        getBridge().getWebView().addJavascriptInterface(new Object() {
            @JavascriptInterface
            public String takeShared() {
                String t = pendingText;
                pendingText = null;
                return t == null ? "" : t;
            }
        }, "NzAndroid");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String t = sharedText(intent);
        if (t != null) {
            String js = "window.nzShared && window.nzShared(" + JSONObject.quote(t) + ")";
            getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(js, null));
        }
    }

    private String sharedText(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return null;
        if (!"text/plain".equals(intent.getType())) return null;
        String t = intent.getStringExtra(Intent.EXTRA_TEXT);
        return (t == null || t.trim().isEmpty()) ? null : t;
    }
}
