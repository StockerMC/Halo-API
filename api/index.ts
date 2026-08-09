require('dotenv').config();
const fs = require('fs');
const path = require('path')
const admin = require("firebase-admin");
const express = require('express')
const cors = require("cors");
const { createClient } = require('@supabase/supabase-js');

const app = express()

app.use(express.json());
app.use(cors());

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Key must be set in environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey)

const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error("serviceAccountKey.json not found in project root - download it from the Firebase console (Project settings > Service accounts)");
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.get("/settings", async (req, res) => {
  try {
    const deviceId = req.query.device_id;
  
    if (!deviceId) {
      return res.status(400).json({ error: 'device_id is required' });
    }

    // Fetch settings from Supabase
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('unique_device_id', deviceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }

    // If no settings found, return defaults
    if (!data) {
      const defaultSettings = {
        unique_device_id: deviceId,
        language: 'en-US',
        volume: 100,
        speech_mode: 'verbose',
        alert_types_enabled: ['all'],
        danger_sensitivity: 'medium',
        notify_companion: true,
        location_sharing_enabled: true,
        auto_distress_timeout: 10,
        emergency_contacts: [],
        button_press_behavior: 'confirm_safe',
        device_name: '',
        wake_word: 'Hey Sentra',
        fetch_interval: 300,
        vibration_enabled: true,
        haptic_pattern: 'pulse',
        high_contrast_mode: false,
        last_updated: new Date().toISOString(),
      };

      return res.json(defaultSettings);
    }

    // Return the fetched settings
    return res.json(data);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/settings", async (req, res) => {
  try {
    const { device_id, ...settings } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }

    // Update settings in Supabase
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        unique_device_id: device_id,
        ...settings,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'unique_device_id',
      });

    if (error) {
      console.error('Error updating settings:', error);
      return res.status(500).json({ error: 'Failed to update settings' });
    }

    return res.json({ success: true });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// TODO: Save sent notifications to supabase

// Partial Push Notification
async function sendPartialNotification(token, data) {
  return admin.messaging().send({
    token,
    data: {
      type: "partial_notification",
      notifee: JSON.stringify({
        body: data,
        android: {
          channelId: "default",
        },
      }),
    },
  });
}

// Declare a notification route
app.post("/notifications", async (req, res) => {
  try {
    const data = req.body;
    console.log(data);

    const { data: tokenData, error } = await supabase
      .from('tokens')
      .select('fcm_token')
      .eq('unique_device_id', 'companion_app')
      .single();
    
    if (error || !tokenData) {
      console.error('Error fetching token from Supabase:', error);
      return res.status(404).json({ error: "FCM token not found" });
    }
    
    const token = tokenData.fcm_token;
    if (!token) {
      return res.status(400).json({ error: "FCM token not found" });
    }
    
    await sendPartialNotification(token, data);
    res.json({status: "OK"});
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", async (req, res) => {
  res.send("OK");
});

const port = 4321
app.listen(port, () => {
  console.log(`listening on port ${port}`)
})

module.exports = app;
