package org.in2teck.codice.AdivinaMe;

import android.app.Application;

public class Activity extends Application {

	public static boolean isActivityVisible() {
	    return activityVisible;
	  }  

	  public static void activityResumed() {
	    activityVisible = true;
	  }

	  public static void activityPaused() {
	    activityVisible = false;
	  }

	  private static boolean activityVisible;
	
}
