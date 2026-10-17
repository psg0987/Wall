package com.wsr.tycoon;
import android.webkit.WebStorage;
public class Wipe implements Runnable { public void run(){ try{ WebStorage.getInstance().deleteAllData(); }catch(Exception e){} } }
