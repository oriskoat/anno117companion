package hu.anno117.pipeprobe;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.os.Handler;
import android.os.Looper;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

public final class WidgetRefreshJob extends JobService {
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private final Handler main=new Handler(Looper.getMainLooper());
    private volatile HttpURLConnection connection;
    private volatile int generation;
    @Override public boolean onStartJob(JobParameters params){final int run=++generation;final long epoch=WidgetStore.epoch(this);final boolean demo=WidgetStore.demo(this);
        worker.execute(()->{HttpURLConnection request=null;try{
            JSONObject snapshot;
            if(demo)snapshot=new JSONObject(WidgetStore.read(getAssets().open("dashboard/demo.json"),8000000));
            else {String[] pair=PairingStore.load(this);if(pair==null){if(run==generation&&epoch==WidgetStore.epoch(this))WidgetStore.error(this,"pair",epoch);return;}
                URL url=new URL(pair[0]+"/v1/snapshot");if(!url.getProtocol().equals("http")&&!url.getProtocol().equals("https"))throw new IllegalArgumentException("Invalid address");
                request=(HttpURLConnection)url.openConnection();connection=request;request.setConnectTimeout(4000);request.setReadTimeout(5000);request.setInstanceFollowRedirects(false);request.setRequestProperty("Authorization","Bearer "+pair[1]);int status=request.getResponseCode();
                if(status==401){if(run==generation&&epoch==WidgetStore.epoch(this))WidgetStore.error(this,"auth",epoch);return;}if(status!=200)throw new IllegalStateException("Bridge unavailable");snapshot=new JSONObject(WidgetStore.read(request.getInputStream(),8000000));}
            if(run==generation)WidgetStore.accept(this,snapshot,demo,epoch);
        }catch(Exception error){if(run==generation&&epoch==WidgetStore.epoch(this))WidgetStore.error(this,"offline",epoch);}
        finally{if(request!=null)request.disconnect();connection=null;main.post(()->{if(run==generation)jobFinished(params,false);});}});return true;}
    @Override public boolean onStopJob(JobParameters params){generation++;if(connection!=null)connection.disconnect();return false;}
    @Override public void onDestroy(){generation++;if(connection!=null)connection.disconnect();worker.shutdownNow();super.onDestroy();}
}
