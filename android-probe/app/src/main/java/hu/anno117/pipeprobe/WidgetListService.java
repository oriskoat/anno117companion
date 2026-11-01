package hu.anno117.pipeprobe;

import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.NumberFormat;
import java.util.Locale;

/** The launcher requests only visible rows, keeping large empires out of one Binder payload. */
public final class WidgetListService extends RemoteViewsService {
    @Override public RemoteViewsFactory onGetViewFactory(Intent intent){return new Rows(getApplicationContext());}
    private static final class Rows implements RemoteViewsFactory {
        private final Context base;private Context context;private JSONArray rows=new JSONArray();private boolean supply=true;
        Rows(Context context){base=context;}
        @Override public void onCreate(){onDataSetChanged();}
        @Override public void onDataSetChanged(){context=EmpireWidget.localized(base);supply=WidgetStore.tab(base).equals("supply");JSONObject data=WidgetStore.data(base,WidgetStore.demo(base));rows=data==null?null:data.optJSONArray(supply?"routes":"shortages");if(rows==null)rows=new JSONArray();}
        @Override public int getCount(){return rows.length();}
        @Override public RemoteViews getViewAt(int position){JSONObject row=rows.optJSONObject(position);if(row==null)return null;RemoteViews v=new RemoteViews(context.getPackageName(),R.layout.widget_good_row);int guid=row.optInt("guid");v.setTextViewText(R.id.widget_row_name,WidgetStore.goodName(context,guid,row.optString("name")));NumberFormat number=NumberFormat.getNumberInstance(Locale.forLanguageTag(WidgetStore.language(context)));number.setMaximumFractionDigits(2);
            v.setTextViewText(R.id.widget_row_detail,supply?context.getString(R.string.widget_rate,row.optString("from"),row.optString("to"),number.format(row.optDouble("rate"))):row.optString("island")+" · "+number.format(row.optDouble("delta"))+" / min");Bitmap icon=EmpireWidget.goodIcon(context,guid);v.setViewVisibility(R.id.widget_row_icon,icon==null?View.GONE:View.VISIBLE);if(icon!=null)v.setImageViewBitmap(R.id.widget_row_icon,icon);
            v.setOnClickFillInIntent(R.id.widget_row,new Intent().putExtra("widget_page",supply?"supply":"products").putExtra("widget_good",guid).putExtra("widget_area",row.optString("area")));return v;
        }
        @Override public RemoteViews getLoadingView(){return null;}
        @Override public int getViewTypeCount(){return 1;}
        @Override public long getItemId(int position){return position;}
        @Override public boolean hasStableIds(){return false;}
        @Override public void onDestroy(){rows=new JSONArray();}
    }
}
