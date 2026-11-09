package hu.anno117.pipeprobe;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

final class GitHubUpdater {
    static final String REPO="https://github.com/oriskoat/anno117companion/releases";
    static final String API="https://api.github.com/repos/oriskoat/anno117companion/releases/latest";
    private final Activity activity;
    private final String current;
    private JSONObject state;
    private File downloaded;
    GitHubUpdater(Activity activity) throws Exception {
        this.activity=activity;
        current=activity.getPackageManager().getPackageInfo(activity.getPackageName(),0).versionName;
        state=base("idle");
    }
    private JSONObject base(String status) throws Exception {return new JSONObject().put("status",status).put("current",current).put("url",REPO);}
    static int compareVersions(String first,String second) throws Exception {
        if(!first.matches("v?\\d+\\.\\d+\\.\\d+")||!second.matches("v?\\d+\\.\\d+\\.\\d+"))throw new IOException("Invalid release version");
        String[] a=first.replaceFirst("^v","").split("\\."),b=second.replaceFirst("^v","").split("\\.");
        for(int i=0;i<3;i++){int result=Integer.compare(Integer.parseInt(a[i]),Integer.parseInt(b[i]));if(result!=0)return result;}return 0;
    }
    private HttpURLConnection connection(String address) throws Exception {
        HttpURLConnection c=(HttpURLConnection)new URL(address).openConnection();
        c.setConnectTimeout(12000);c.setReadTimeout(30000);c.setRequestProperty("User-Agent","Anno117Companion/"+current);c.setRequestProperty("Accept","application/vnd.github+json");return c;
    }
    private String read(InputStream input,int limit) throws Exception {
        try(InputStream in=input;ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] bytes=new byte[8192];int n;while((n=in.read(bytes))!=-1){if(out.size()+n>limit)throw new IOException("Response too large");out.write(bytes,0,n);}return out.toString(StandardCharsets.UTF_8.name());
        }
    }
    synchronized JSONObject check(boolean force) {
        try {
            if(activity.getPackageName().endsWith(".productionbeta"))return state=base("preview");
            android.content.SharedPreferences prefs=activity.getSharedPreferences("github-update",0);
            long age=System.currentTimeMillis()-prefs.getLong("checked",0);String json;
            if(!force&&age>=0&&age<21600000)json=prefs.getString("release","");
            else {
                HttpURLConnection c=connection(API);
                try {int status=c.getResponseCode();if(status==404)json="";else if(status==200)json=read(c.getInputStream(),2000000);else throw new IOException("GitHub unavailable");}
                finally{c.disconnect();}
                prefs.edit().putLong("checked",System.currentTimeMillis()).putString("release",json).apply();
            }
            if(json.isEmpty())return state=base("unpublished");
            JSONObject release=new JSONObject(json);String tag=release.getString("tag_name");
            if(release.optBoolean("draft")||release.optBoolean("prerelease"))throw new IOException("Stable releases only");
            state=base("current").put("latest",tag.replaceFirst("^v",""));
            if(compareVersions(tag,current)<=0)return state;
            JSONArray assets=release.getJSONArray("assets");String prefix=REPO+"/download/"+tag+"/";
            for(int i=0;i<assets.length();i++) {
                JSONObject a=assets.getJSONObject(i);String name=a.optString("name"),url=a.optString("browser_download_url"),digest=a.optString("digest");long size=a.optLong("size");
                if(!name.startsWith("Anno")||!name.endsWith(".apk")||!url.startsWith(prefix)||!Uri.decode(url.substring(prefix.length())).equals(name))continue;
                if(!digest.matches("sha256:[0-9a-fA-F]{64}")||size<=0||size>200000000)continue;
                return state.put("status","available").put("asset",new JSONObject().put("url",url).put("name",name).put("bytes",size).put("sha256",digest.substring(7).toLowerCase(java.util.Locale.ROOT)));
            }
            return state.put("status","incomplete");
        } catch(Exception e){try{return state=base("offline");}catch(Exception impossible){return new JSONObject();}}
    }
    private String hex(byte[] bytes){StringBuilder out=new StringBuilder();for(byte b:bytes)out.append(String.format(java.util.Locale.ROOT,"%02x",b&255));return out.toString();}
    @SuppressWarnings("deprecation")
    private void verifyPackage(File file) throws Exception {
        PackageManager manager=activity.getPackageManager();int flags=Build.VERSION.SDK_INT>=28?PackageManager.GET_SIGNING_CERTIFICATES:PackageManager.GET_SIGNATURES;
        PackageInfo incoming=manager.getPackageArchiveInfo(file.toString(),flags),installed=manager.getPackageInfo(activity.getPackageName(),flags);
        if(incoming==null||!activity.getPackageName().equals(incoming.packageName))throw new IOException("Wrong Android package");
        if(compareVersions(incoming.versionName,state.optString("latest"))!=0)throw new IOException("Release version mismatch");
        long next=Build.VERSION.SDK_INT>=28?incoming.getLongVersionCode():incoming.versionCode,old=Build.VERSION.SDK_INT>=28?installed.getLongVersionCode():installed.versionCode;
        if(next<=old)throw new IOException("Package version must increase");
        Signature[] a=Build.VERSION.SDK_INT>=28?incoming.signingInfo.getApkContentsSigners():incoming.signatures,b=Build.VERSION.SDK_INT>=28?installed.signingInfo.getApkContentsSigners():installed.signatures;
        Set<Signature> first=new HashSet<>(Arrays.asList(a)),second=new HashSet<>(Arrays.asList(b));
        if(!first.equals(second))throw new IOException("Android signing certificate changed");
    }
    synchronized JSONObject download() {
        JSONObject latest=check(true);if(!"available".equals(latest.optString("status")))return latest;
        File folder=new File(activity.getCacheDir(),"updates"),partial=new File(folder,"package.pending.apk"),target=new File(folder,"package.apk");
        HttpURLConnection c=null;
        try {
            if(!folder.exists()&&!folder.mkdirs())throw new IOException("Cannot create update folder");
            JSONObject asset=latest.getJSONObject("asset");c=connection(asset.getString("url"));c.setRequestProperty("Accept","application/octet-stream");
            if(c.getResponseCode()!=200)throw new IOException("Download failed");
            URL finalUrl=c.getURL();String host=finalUrl.getHost();
            if(!"https".equals(finalUrl.getProtocol())||!(host.equals("github.com")||host.equals("release-assets.githubusercontent.com")||host.equals("objects.githubusercontent.com")))throw new IOException("Unexpected download host");
            MessageDigest digest=MessageDigest.getInstance("SHA-256");long count=0,expected=asset.getLong("bytes");
            try(InputStream in=c.getInputStream();FileOutputStream out=new FileOutputStream(partial)) {
                byte[] bytes=new byte[262144];int n;while((n=in.read(bytes))!=-1){count+=n;if(count>expected||count>200000000)throw new IOException("Package too large");digest.update(bytes,0,n);out.write(bytes,0,n);}
            }
            if(count!=expected||!hex(digest.digest()).equals(asset.getString("sha256")))throw new IOException("Checksum mismatch");
            verifyPackage(partial);
            if(target.exists()&&!target.delete())throw new IOException("Previous package busy");
            if(!partial.renameTo(target))throw new IOException("Cannot save update");downloaded=target;
            return state.put("status","ready");
        }catch(Exception e){partial.delete();downloaded=null;try{return state.put("status","failed");}catch(Exception impossible){return state;}}
        finally{if(c!=null)c.disconnect();}
    }
    void install() {
        try {
            if(downloaded==null||!downloaded.isFile())throw new IOException("Download an update first");
            verifyPackage(downloaded);
            if(!activity.getPackageManager().canRequestPackageInstalls()) {
                activity.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+activity.getPackageName())));return;
            }
            Uri uri=Uri.parse("content://"+activity.getPackageName()+".updates/package.apk");
            activity.startActivity(new Intent(Intent.ACTION_VIEW).setDataAndType(uri,"application/vnd.android.package-archive").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION));
        }catch(Exception e){android.widget.Toast.makeText(activity,"Update could not be installed. Download it again.",android.widget.Toast.LENGTH_LONG).show();}
    }
}
