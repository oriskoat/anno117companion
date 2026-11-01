package hu.anno117.pipeprobe;

import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONObject;
import java.io.InputStream;
import java.text.NumberFormat;
import java.text.DateFormat;
import java.time.Instant;
import java.util.Date;
import java.util.Locale;

/** Private app broadcasts schedule short background work; no network on the receiver thread. */
public final class EmpireWidget extends AppWidgetProvider {
    static final int JOB_ID=11780;
    static final String REFRESH="hu.anno117.pipeprobe.WIDGET_REFRESH", MODE="hu.anno117.pipeprobe.WIDGET_MODE", SUPPLY="hu.anno117.pipeprobe.WIDGET_SUPPLY", GAPS="hu.anno117.pipeprobe.WIDGET_GAPS";
    static int[] ids(Context c){return AppWidgetManager.getInstance(c).getAppWidgetIds(new ComponentName(c,EmpireWidget.class));}
    static void request(Context c){if(ids(c).length==0)return;JobScheduler scheduler=c.getSystemService(JobScheduler.class);if(scheduler!=null){JobInfo.Builder job=new JobInfo.Builder(JOB_ID,new ComponentName(c,WidgetRefreshJob.class)).setOverrideDeadline(5000);if(!WidgetStore.demo(c))job.setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY);scheduler.schedule(job.build());}}
    @Override public void onUpdate(Context c,AppWidgetManager m,int[] ids){render(c);request(c);}
    @Override public void onAppWidgetOptionsChanged(Context c,AppWidgetManager m,int id,Bundle options){render(c);}
    @Override public void onDisabled(Context c){JobScheduler scheduler=c.getSystemService(JobScheduler.class);if(scheduler!=null)scheduler.cancel(JOB_ID);}
    @Override public void onReceive(Context c,Intent intent){super.onReceive(c,intent);if(MODE.equals(intent.getAction())){WidgetStore.mode(c,!WidgetStore.demo(c));render(c);request(c);}else if(REFRESH.equals(intent.getAction())){render(c);request(c);}else if(SUPPLY.equals(intent.getAction())||GAPS.equals(intent.getAction())){WidgetStore.prefs(c).edit().putString("tab",SUPPLY.equals(intent.getAction())?"supply":"gaps").apply();render(c);}}
    static Context localized(Context c){Configuration conf=new Configuration(c.getResources().getConfiguration());conf.setLocale(Locale.forLanguageTag(WidgetStore.language(c)));return c.createConfigurationContext(conf);}
    static String date(String raw,Locale locale){try{return DateFormat.getDateTimeInstance(DateFormat.SHORT,DateFormat.SHORT,locale).format(Date.from(Instant.parse(raw)));}catch(Exception e){return "—";}}
    static void render(Context base){
        int[] ids=ids(base);if(ids.length==0)return;
        Context c=localized(base);boolean demo=WidgetStore.demo(c);JSONObject d=WidgetStore.data(c,demo);Locale locale=Locale.forLanguageTag(WidgetStore.language(c));RemoteViews v=new RemoteViews(c.getPackageName(),R.layout.empire_widget);
        PendingIntent open=PendingIntent.getActivity(c,0,new Intent(c,DashboardActivity.class).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.widget_root,open);
        v.setOnClickPendingIntent(R.id.widget_refresh,PendingIntent.getBroadcast(c,1,new Intent(c,EmpireWidget.class).setAction(REFRESH),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));
        v.setOnClickPendingIntent(R.id.widget_mode,PendingIntent.getBroadcast(c,2,new Intent(c,EmpireWidget.class).setAction(MODE),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));
        v.setTextViewText(R.id.widget_mode,demo?"Demo":"Live");v.setTextViewText(R.id.widget_session,d==null?"Anno Companion":d.optString("session","Anno Companion"));
        String error=WidgetStore.error(c),at=d==null?"—":date(d.optString("at"),locale),status;
        if(demo)status=d==null?c.getString(R.string.widget_waiting):c.getString(R.string.widget_demo,at);
        else if("pair".equals(error))status=c.getString(R.string.widget_pair);
        else if("auth".equals(error))status=c.getString(R.string.widget_expired);
        else if("offline".equals(error))status=c.getString(R.string.widget_offline,at);
        else status=d==null?c.getString(R.string.widget_waiting):c.getString(d.optBoolean("mixed")?R.string.widget_mixed:d.optBoolean("cached")?R.string.widget_cached:R.string.widget_last,at);
        v.setTextViewText(R.id.widget_status,status);
        v.setTextViewText(R.id.widget_metrics,d==null?"—":c.getString(R.string.widget_metrics,d.optInt("islands"),d.optInt("products"),d.optInt("gaps")));
        boolean supply=WidgetStore.tab(c).equals("supply");
        v.setOnClickPendingIntent(R.id.widget_tab_supply,PendingIntent.getBroadcast(c,3,new Intent(c,EmpireWidget.class).setAction(SUPPLY),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));
        v.setOnClickPendingIntent(R.id.widget_tab_gaps,PendingIntent.getBroadcast(c,4,new Intent(c,EmpireWidget.class).setAction(GAPS),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));
        v.setTextColor(R.id.widget_tab_supply,supply?0xffe0c78e:0xffb7c9db);v.setTextColor(R.id.widget_tab_gaps,supply?0xffb7c9db:0xffe0c78e);
        v.setInt(R.id.widget_tab_supply,"setBackgroundColor",supply?0xff24496d:0xff173b60);v.setInt(R.id.widget_tab_gaps,"setBackgroundColor",supply?0xff173b60:0xff24496d);
        v.setTextViewText(R.id.widget_empty,c.getString(d==null?R.string.widget_open:supply?R.string.widget_no_supply:R.string.widget_no_gaps));v.setEmptyView(R.id.widget_list,R.id.widget_empty);
        int mutable=android.os.Build.VERSION.SDK_INT>=31?PendingIntent.FLAG_MUTABLE:0;
        v.setPendingIntentTemplate(R.id.widget_list,PendingIntent.getActivity(c,5,new Intent(c,DashboardActivity.class).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP),PendingIntent.FLAG_UPDATE_CURRENT|mutable));
        AppWidgetManager manager=AppWidgetManager.getInstance(base);for(int id:ids){Intent adapter=new Intent(c,WidgetListService.class).setData(android.net.Uri.parse("anno-widget://list/"+id));v.setRemoteAdapter(R.id.widget_list,adapter);manager.updateAppWidget(id,v);}manager.notifyAppWidgetViewDataChanged(ids,R.id.widget_list);
    }
    static Bitmap goodIcon(Context c,int guid){try(InputStream in=c.getAssets().open("dashboard/icons/"+guid+".webp")){BitmapFactory.Options o=new BitmapFactory.Options();o.inSampleSize=2;return BitmapFactory.decodeStream(in,null,o);}catch(Exception e){return null;}}
}
