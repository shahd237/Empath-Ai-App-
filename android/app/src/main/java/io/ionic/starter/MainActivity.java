package io.ionic.starter;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.community.facebooklogin.FacebookLogin; // ← add this

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(FacebookLogin.class); // ← add this
    super.onCreate(savedInstanceState);
  }
}


