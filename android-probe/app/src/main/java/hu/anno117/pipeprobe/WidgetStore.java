package hu.anno117.pipeprobe;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

/** Bounded, token-free summaries. Demo and Live can never overwrite one another. */
final class WidgetStore {
    private static JSONObject names;
    static SharedPreferences prefs(Context c){return c.getSharedPreferences("empire-widget",0);}
    static String tab(Context c){return prefs(c).getString("tab","supply");}
    static boolean demo(Context c){return prefs(c).getBoolean("demo",true);}
    static long epoch(Context c){return prefs(c).getLong("epoch",0);}
    static synchronized void mode(Context c,boolean demo){if(demo(c)!=demo)prefs(c).edit().putBoolean("demo",demo).putLong("epoch",epoch(c)+1).apply();}
    static String language(Context c){return prefs(c).getString("language","en");}
    static void language(Context c,String lang){if(!lang.matches("en|de|fr|it|es|ja|ko|pl|pt-BR|ru|zh-CN|zh-TW"))return;if(!lang.equals(language(c))){prefs(c).edit().putString("language",lang).apply();EmpireWidget.render(c);}}
    static String error(Context c){return prefs(c).getString("error","");}
    static synchronized void error(Context c,String error,long expectedEpoch){if(epoch(c)!=expectedEpoch)return;prefs(c).edit().putString("error",error).apply();EmpireWidget.render(c);}
    static JSONObject data(Context c,boolean demo){try{return new JSONObject(prefs(c).getString(demo?"demo_data":"live_data",""));}catch(Exception e){return null;}}
    static synchronized void paired(Context c){prefs(c).edit().remove("live_data").remove("error").putLong("epoch",epoch(c)+1).apply();EmpireWidget.render(c);EmpireWidget.request(c);}
    static synchronized void forget(Context c){prefs(c).edit().remove("live_data").putString("error","pair").putLong("epoch",epoch(c)+1).apply();EmpireWidget.render(c);}
    static String shortText(String value){return value.length()>160?value.substring(0,160):value;}
    static synchronized void accept(Context c,JSONObject snapshot,boolean demo,long expectedEpoch) throws Exception {
        if(epoch(c)!=expectedEpoch)return;
        JSONArray areas=snapshot.optJSONArray("areas");if(areas==null)throw new IllegalArgumentException("Missing islands");
        Set<Integer> products=new HashSet<>();java.util.List<JSONObject> shortages=new java.util.ArrayList<>();int gaps=0,cachedIslands=0;boolean cached=!"connected".equals(snapshot.optString("pipe_state"))||"cached".equals(snapshot.optString("data_mode"));String at=snapshot.optString("last_data_at",snapshot.optString("last_message_at",snapshot.optString("recorded_at","")));
        for(int i=0;i<areas.length();i++){JSONObject area=areas.getJSONObject(i);if(area.optBoolean("cached")||area.optBoolean("stale"))cachedIslands++;JSONArray entries=area.optJSONArray("entries");if(entries==null)continue;for(int j=0;j<entries.length();j++){JSONObject e=entries.getJSONObject(j);products.add(e.optInt("ProductGuid"));if(e.optDouble("ProductDelta")<-.01){gaps++;shortages.add(new JSONObject().put("guid",e.optInt("ProductGuid")).put("name",shortText(e.optString("ProductNameEnglish"))).put("island",shortText(area.optString("area_name"))).put("area",area.optInt("session_id")+":"+area.optInt("island_id")+":"+area.optInt("area_index")).put("delta",e.optDouble("ProductDelta")));}}}
        boolean mixed="connected".equals(snapshot.optString("pipe_state"))&&cachedIslands>0&&cachedIslands<areas.length();cached|=areas.length()>0&&cachedIslands==areas.length();
        JSONObject summary=new JSONObject().put("session",shortText(snapshot.optString("session_name","Your empire"))).put("at",at).put("cached",cached).put("mixed",mixed).put("islands",areas.length()).put("products",products.size()).put("gaps",gaps);
        JSONArray suggestions=snapshot.optJSONArray("supply_suggestions");java.util.List<JSONObject> routes=new java.util.ArrayList<>();
        if(suggestions!=null)for(int i=0;i<suggestions.length();i++){JSONObject r=suggestions.getJSONObject(i);routes.add(new JSONObject().put("guid",r.optInt("product_guid")).put("name",shortText(r.optString("product_name"))).put("from",shortText(r.optString("from_area"))).put("to",shortText(r.optString("to_area"))).put("area",r.optString("to_area_key")).put("rate",r.optDouble("suggested_rate")));}
        routes.sort((a,b)->Double.compare(b.optDouble("rate"),a.optDouble("rate")));shortages.sort((a,b)->Double.compare(a.optDouble("delta"),b.optDouble("delta")));
        summary.put("routes",new JSONArray(routes)).put("shortages",new JSONArray(shortages));
        if(epoch(c)!=expectedEpoch)return;
        prefs(c).edit().putString(demo?"demo_data":"live_data",summary.toString()).putString("error","").apply();EmpireWidget.render(c);
    }
    static String read(InputStream input,int max) throws Exception {try(InputStream in=input;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] buffer=new byte[8192];int count;while((count=in.read(buffer))!=-1){if(out.size()+count>max)throw new IllegalArgumentException("Response too large");out.write(buffer,0,count);}return out.toString(StandardCharsets.UTF_8.name());}}
    static synchronized String goodName(Context c,int guid,String fallback){try{if(names==null){String js=read(c.getAssets().open("dashboard/knowledge.js"),12000000);names=new JSONObject(js.substring(js.indexOf('=')+1,js.lastIndexOf(';'))).getJSONObject("names");}JSONObject locale=names.optJSONObject(language(c));return locale==null?fallback:locale.optString(String.valueOf(guid),fallback);}catch(Exception e){return fallback;}}
}
