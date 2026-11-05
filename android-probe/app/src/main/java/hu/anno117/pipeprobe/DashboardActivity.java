package hu.anno117.pipeprobe;

import android.app.Activity;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import android.widget.Toast;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.graphics.Color;
import android.webkit.*;
import android.view.WindowManager;
import android.view.View;
import org.json.JSONObject;
import java.net.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.concurrent.*;

public final class DashboardActivity extends Activity {
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private WebView web;
    private GitHubUpdater updater;
    private boolean updating=false;
    private boolean ready=false,visible=false,busy=false,demo=true,pendingSave=false;
    private boolean receivedLive=false,accessShown=false,authBlocked=false;
    private int generation=0;
    private String address="http://PC-IP:11780",token="";
    private volatile HttpURLConnection request;
    private volatile long widgetPublished;
    private int widgetGood;private String widgetPage="",widgetArea="";
    private void widgetIntent(Intent intent){widgetGood=intent.getIntExtra("widget_good",0);widgetPage=intent.getStringExtra("widget_page");widgetArea=intent.getStringExtra("widget_area");}
    private void openWidgetTarget(){if(!ready||widgetGood<=0)return;int good=widgetGood;widgetGood=0;js("window.openWidgetTarget&&window.openWidgetTarget("+JSONObject.quote(widgetPage==null?"products":widgetPage)+","+good+","+JSONObject.quote(widgetArea==null?"":widgetArea)+")");}
    @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);widgetIntent(intent);}

    @Override public void onCreate(Bundle saved){
        super.onCreate(saved);widgetIntent(getIntent());
        getWindow().setStatusBarColor(Color.rgb(24,59,96));getWindow().setNavigationBarColor(Color.rgb(246,243,237));
        web=new WebView(this);web.setBackgroundColor(Color.rgb(246,243,237));web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);setContentView(web);
        WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);settings.setAllowContentAccess(false);settings.setAllowFileAccessFromFileURLs(false);settings.setAllowUniversalAccessFromFileURLs(false);
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return true;}
        });
        try{updater=new GitHubUpdater(this);}catch(Exception ignored){}
        web.addJavascriptInterface(new NativeApi(),"Native");
        demo=WidgetStore.prefs(this).contains("demo")?WidgetStore.demo(this):getPreferences(0).getBoolean("demo",true);
        try{String[] pairing=PairingStore.load(this);if(pairing!=null){address=pairing[0];token=pairing[1];}}catch(Exception ignored){}
        web.loadUrl("file:///android_asset/dashboard/index.html");
    }
    private String read(InputStream input) throws IOException {
        try(InputStream in=input;ByteArrayOutputStream bytes=new ByteArrayOutputStream()){
            byte[] buffer=new byte[8192];int n;while((n=in.read(buffer))!=-1){if(bytes.size()+n>8000000)throw new IOException("Snapshot too large");bytes.write(buffer,0,n);}return bytes.toString(StandardCharsets.UTF_8.name());
        }
    }
    private void js(String expression){if(ready)web.evaluateJavascript(expression,null);}
    private void notice(String value){js("window.connectionNotice("+JSONObject.quote(value)+")");}
    private void loadMode(){
        generation++;main.removeCallbacksAndMessages(null);if(request!=null)request.disconnect();
        receivedLive=false;accessShown=false;authBlocked=false;
        getPreferences(0).edit().putBoolean("demo",demo).apply();
        WidgetStore.mode(this,demo);EmpireWidget.render(this);EmpireWidget.request(this);
        js("window.modeChanged("+demo+","+JSONObject.quote(address)+","+(!token.isEmpty())+")");
        if(demo){try{js("window.receiveSnapshot("+read(getAssets().open("dashboard/demo.json"))+",'demo')");openWidgetTarget();}catch(Exception e){notice("Recorded sample could not be loaded");}}
        else if(token.isEmpty()){notice("Pair your PC bridge to receive live data");js("window.liveAccessIssue?window.liveAccessIssue('pairing','Pair your PC bridge to receive live data'):window.openSettings()");}
        else {notice("Connecting to your PC bridge…");fetch(generation);}
    }
    private void fetch(int id){
        if(!ready||!visible||demo||id!=generation||busy||authBlocked)return;
        busy=true;final String host=address,secret=token;final long widgetEpoch=WidgetStore.epoch(this);
        worker.execute(() -> {
            HttpURLConnection connection=null;
            try{
                connection=(HttpURLConnection)new URL(host+"/v1/snapshot").openConnection();request=connection;
                connection.setConnectTimeout(5000);connection.setReadTimeout(8000);connection.setInstanceFollowRedirects(false);connection.setRequestProperty("Authorization","Bearer "+secret);
                int status=connection.getResponseCode();if(status==401)throw new IOException("Pairing code not accepted. Open Connection to update it.");if(status!=200)throw new IOException("Bridge returned HTTP "+status);
                JSONObject parsed=new JSONObject(read(connection.getInputStream()));String result=parsed.toString();
                if(id==generation&&!demo&&System.currentTimeMillis()-widgetPublished>30000){try{WidgetStore.accept(getApplicationContext(),parsed,false,widgetEpoch);widgetPublished=System.currentTimeMillis();}catch(Exception ignored){}}
                main.post(() -> {if(id!=generation||demo)return;receivedLive=true;accessShown=false;if(pendingSave){try{PairingStore.save(DashboardActivity.this,host,secret);pendingSave=false;widgetPublished=0;WidgetStore.paired(DashboardActivity.this);}catch(Exception e){notice("Connected, but pairing could not be saved");}}js("window.receiveSnapshot("+result+",'live')");js("window.liveAccessRecovered&&window.liveAccessRecovered()");openWidgetTarget();});
            }catch(Exception e){String message=e.getMessage();main.post(() -> {
                if(id!=generation||demo)return;
                boolean denied=message!=null&&message.startsWith("Pairing code");
                String feedback=denied?"Code incorrect or expired. Check the PC window.":"Bridge unavailable · showing the previous snapshot";
                notice(feedback);
                if(denied){authBlocked=true;token="";pendingSave=false;js("window.modeChanged(false,"+JSONObject.quote(address)+",false)");}
                if(denied||(!receivedLive&&!accessShown)){accessShown=true;js("window.liveAccessIssue&&window.liveAccessIssue("+JSONObject.quote(denied?"pairing":"offline")+","+JSONObject.quote(feedback)+")");}
            });}
            finally{if(connection!=null)connection.disconnect();request=null;main.post(() -> {busy=false;if(visible&&!demo&&!authBlocked)main.postDelayed(() -> fetch(generation),5000);});}
        });
    }
    private void updateJob(boolean download,boolean force){
        main.post(() -> {
            if(updating||updater==null)return;updating=true;
            worker.execute(() -> {JSONObject state=download?updater.download():updater.check(force);
                main.post(() -> {updating=false;js("window.receiveAppUpdate&&window.receiveAppUpdate("+state+")");});
            });
        });
    }
    public final class NativeApi {
        @JavascriptInterface public void refreshSnapshot(){main.post(() -> {if(!demo&&!busy)fetch(generation);});}
        @JavascriptInterface public void saveInsights(String id,String body){
            final String host=address,secret=token;
            if(demo||id==null||id.length()>100||body==null||body.length()>2048)return;
            worker.execute(() -> {
                HttpURLConnection connection=null;
                try {
                    connection=(HttpURLConnection)new URL(host+"/v1/save-insights").openConnection();
                    connection.setConnectTimeout(5000);connection.setReadTimeout(12000);connection.setInstanceFollowRedirects(false);connection.setRequestProperty("Authorization","Bearer "+secret);
                    if(!body.isEmpty()){
                        connection.setRequestMethod("POST");connection.setDoOutput(true);connection.setRequestProperty("Content-Type","application/json");
                        byte[] bytes=body.getBytes(StandardCharsets.UTF_8);connection.setFixedLengthStreamingMode(bytes.length);try(OutputStream out=connection.getOutputStream()){out.write(bytes);}
                    }
                    int status=connection.getResponseCode();String text=read(status>=400?connection.getErrorStream():connection.getInputStream());
                    JSONObject result=new JSONObject().put("status",status).put("document",new JSONObject(text));
                    main.post(() -> js("window.saveInsightsReply&&window.saveInsightsReply("+JSONObject.quote(id)+","+result+")"));
                }catch(Exception e){main.post(() -> js("window.saveInsightsReply&&window.saveInsightsReply("+JSONObject.quote(id)+",{status:0})"));}
                finally{if(connection!=null)connection.disconnect();}
            });
        }
        @JavascriptInterface public void tradeRoutes(String id,String context,String body){
            final String host=address,secret=token;
            if(demo||context.length()>240||body.length()>2000000)return;
            worker.execute(() -> {
                HttpURLConnection connection=null;
                try {
                    connection=(HttpURLConnection)new URL(host+"/v1/trade-routes?context="+java.net.URLEncoder.encode(context,"UTF-8")).openConnection();
                    connection.setConnectTimeout(5000);connection.setReadTimeout(8000);connection.setInstanceFollowRedirects(false);connection.setRequestProperty("Authorization","Bearer "+secret);
                    if(!body.isEmpty()){
                        connection.setRequestMethod("PUT");connection.setDoOutput(true);connection.setRequestProperty("Content-Type","application/json");
                        byte[] bytes=body.getBytes(StandardCharsets.UTF_8);connection.setFixedLengthStreamingMode(bytes.length);try(OutputStream out=connection.getOutputStream()){out.write(bytes);}
                    }
                    int status=connection.getResponseCode();String text=read(status>=400?connection.getErrorStream():connection.getInputStream());
                    JSONObject result=new JSONObject().put("status",status).put("document",new JSONObject(text));
                    main.post(() -> js("window.tradeRoutesReply&&window.tradeRoutesReply("+JSONObject.quote(id)+","+result+")"));
                }catch(Exception e){main.post(() -> js("window.tradeRoutesReply&&window.tradeRoutesReply("+JSONObject.quote(id)+",{status:0})"));}
                finally{if(connection!=null)connection.disconnect();}
            });
        }
        @JavascriptInterface public void checkUpdate(boolean force){updateJob(false,force);}
        @JavascriptInterface public void downloadUpdate(){updateJob(true,true);}
        @JavascriptInterface public void installUpdate(){main.post(() -> {if(updater!=null)updater.install();});}
        @JavascriptInterface public void printReport(String html){
            if(html==null||html.length()>2000000)return;
            main.post(() -> {
                final WebView report=new WebView(DashboardActivity.this);
                report.getSettings().setJavaScriptEnabled(false);report.getSettings().setAllowFileAccess(false);report.getSettings().setAllowContentAccess(false);
                report.setWebViewClient(new WebViewClient(){
                    private boolean printed=false;
                    @Override public void onPageFinished(WebView view,String url){
                        if(printed)return;printed=true;
                        android.print.PrintManager manager=(android.print.PrintManager)getSystemService(PRINT_SERVICE);
                        final android.print.PrintDocumentAdapter delegate=report.createPrintDocumentAdapter("Anno117 Empire Summary");
                        manager.print("Anno117 Empire Summary",new android.print.PrintDocumentAdapter(){
                            @Override public void onStart(){delegate.onStart();}
                            @Override public void onLayout(android.print.PrintAttributes oldAttributes,android.print.PrintAttributes newAttributes,android.os.CancellationSignal signal,LayoutResultCallback callback,Bundle extras){delegate.onLayout(oldAttributes,newAttributes,signal,callback,extras);}
                            @Override public void onWrite(android.print.PageRange[] pages,android.os.ParcelFileDescriptor destination,android.os.CancellationSignal signal,WriteResultCallback callback){delegate.onWrite(pages,destination,signal,callback);}
                            @Override public void onFinish(){delegate.onFinish();report.destroy();}
                        },new android.print.PrintAttributes.Builder().setMediaSize(android.print.PrintAttributes.MediaSize.ISO_A4).setColorMode(android.print.PrintAttributes.COLOR_MODE_COLOR).build());
                    }
                });
                report.loadDataWithBaseURL("file:///android_asset/dashboard/",html,"text/html","UTF-8",null);
            });
        }
        @JavascriptInterface public void openDonation(){main.post(() -> {
            try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse("https://revolut.me/vafvyop?currency=EUR&amount=500")));}
            catch(ActivityNotFoundException e){Toast.makeText(DashboardActivity.this,"No browser available to open Revolut",Toast.LENGTH_LONG).show();}
        });}
        @JavascriptInterface public void ready(){main.post(() -> {ready=true;loadMode();});}
        @JavascriptInterface public void pinWidget(){main.post(()->{android.appwidget.AppWidgetManager manager=android.appwidget.AppWidgetManager.getInstance(DashboardActivity.this);if(manager.isRequestPinAppWidgetSupported())manager.requestPinAppWidget(new android.content.ComponentName(DashboardActivity.this,EmpireWidget.class),null,null);else Toast.makeText(DashboardActivity.this,EmpireWidget.localized(DashboardActivity.this).getString(R.string.widget_pin_help),Toast.LENGTH_LONG).show();});}
        @JavascriptInterface public void widgetLanguage(String lang){WidgetStore.language(getApplicationContext(),lang);}
        @JavascriptInterface public void useDemo(boolean value){main.post(() -> {demo=value;loadMode();});}
        @JavascriptInterface public void secure(boolean value){main.post(() -> {if(value)getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);});}
        @JavascriptInterface public void connect(String host,String code){main.post(() -> {
            String clean=host.trim();if(!clean.startsWith("http://"))clean="http://"+clean;while(clean.endsWith("/"))clean=clean.substring(0,clean.length()-1);
            try{URL url=new URL(clean);if(!url.getProtocol().equals("http")||url.getHost().isEmpty()||url.getUserInfo()!=null||!url.getPath().isEmpty()||url.getQuery()!=null||url.getRef()!=null)throw new Exception();}
            catch(Exception e){js("window.settingsError('Enter a valid local bridge address')");return;}
            String selected=code.trim().replace(" ","").toUpperCase(Locale.ROOT);if(selected.isEmpty()&&clean.equals(address))selected=token;
            if(selected.isEmpty()){js("window.settingsError('Enter the pairing code shown on your PC')");return;}
            if(selected.matches("\\d{6}")){
                final String target=clean,enrollment=selected;
                worker.execute(() -> {
                    HttpURLConnection pairing=null;
                    try{
                        pairing=(HttpURLConnection)new URL(target+"/v1/pair").openConnection();pairing.setConnectTimeout(5000);pairing.setReadTimeout(8000);pairing.setInstanceFollowRedirects(false);pairing.setRequestMethod("POST");pairing.setDoOutput(true);pairing.setRequestProperty("Content-Type","application/json");
                        byte[] body=new JSONObject().put("code",enrollment).toString().getBytes(StandardCharsets.UTF_8);pairing.setFixedLengthStreamingMode(body.length);try(java.io.OutputStream out=pairing.getOutputStream()){out.write(body);}
                        int status=pairing.getResponseCode();if(status!=200)throw new IOException(status==429?"Too many attempts. Wait one minute.":"Code incorrect or expired. Check the PC window.");
                        String device=new JSONObject(read(pairing.getInputStream())).getString("device_token");
                        main.post(() -> {address=target;token=device;pendingSave=true;demo=false;js("window.closeSheet()");getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);loadMode();});
                    }catch(Exception e){main.post(() -> js("window.settingsError("+JSONObject.quote(e.getMessage())+")"));}
                    finally{if(pairing!=null)pairing.disconnect();}
                });return;
            }
            address=clean;token=selected;pendingSave=true;demo=false;js("window.closeSheet()");getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);loadMode();
        });}
        @JavascriptInterface public void forget(){main.post(() -> {PairingStore.forget(DashboardActivity.this);WidgetStore.forget(DashboardActivity.this);token="";demo=true;loadMode();js("window.closeSheet()");getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);});}
    }
    @Override protected void onResume(){super.onResume();visible=true;if(ready){if(demo!=WidgetStore.demo(this)){demo=WidgetStore.demo(this);loadMode();}else if(!demo)fetch(generation);else openWidgetTarget();}}
    @Override protected void onPause(){visible=false;main.removeCallbacksAndMessages(null);super.onPause();}
    @Override public void onBackPressed(){web.evaluateJavascript("(function(){if(!document.getElementById('overlay').hidden){window.backDetails();return true;}if(typeof current!=='undefined'&&current!=='home'){nav('home');return true;}return false;})()",result -> {if(!"true".equals(result))super.onBackPressed();});}
    @Override protected void onDestroy(){ready=false;generation++;main.removeCallbacksAndMessages(null);if(request!=null)request.disconnect();worker.shutdownNow();web.removeJavascriptInterface("Native");web.destroy();super.onDestroy();}
}
