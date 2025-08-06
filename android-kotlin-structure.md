# Estrutura Android Kotlin - Blink App

## MainActivity.kt
```kotlin
package com.blink.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.blink.app.ui.theme.BlinkTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            BlinkTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    BlinkApp()
                }
            }
        }
    }
}
```

## BlinkApp.kt
```kotlin
package com.blink.app

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.blink.app.ui.screens.HomeScreen
import com.blink.app.ui.screens.LoginScreen
import com.blink.app.ui.screens.RestaurantListScreen

@Composable
fun BlinkApp() {
    val navController = rememberNavController()
    
    NavHost(
        navController = navController,
        startDestination = "home"
    ) {
        composable("home") {
            HomeScreen(navController)
        }
        composable("login") {
            LoginScreen(navController)
        }
        composable("restaurants") {
            RestaurantListScreen(navController)
        }
    }
}
```

## build.gradle (Module: app)
```kotlin
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
    id 'kotlin-kapt'
    id 'dagger.hilt.android.plugin'
}

android {
    namespace 'com.blink.app'
    compileSdk 34

    defaultConfig {
        applicationId "com.blink.app"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary true
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = '1.8'
    }
    buildFeatures {
        compose true
    }
    composeOptions {
        kotlinCompilerExtensionVersion '1.5.4'
    }
    packagingOptions {
        resources {
            excludes += '/META-INF/{AL2.0,LGPL2.1}'
        }
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.lifecycle:lifecycle-runtime-ktx:2.7.0'
    implementation 'androidx.activity:activity-compose:1.8.2'
    implementation platform('androidx.compose:compose-bom:2023.10.01')
    implementation 'androidx.compose.ui:ui'
    implementation 'androidx.compose.ui:ui-tooling-preview'
    implementation 'androidx.compose.material3:material3'
    implementation 'androidx.navigation:navigation-compose:2.7.5'
    
    // Supabase
    implementation 'io.github.jan-tennert.supabase:postgrest-kt:2.0.0'
    implementation 'io.github.jan-tennert.supabase:gotrue-kt:2.0.0'
    implementation 'io.ktor:ktor-client-android:2.3.0'
    
    // Networking
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.11.0'
    
    // Dependency Injection
    implementation 'com.google.dagger:hilt-android:2.48'
    kapt 'com.google.dagger:hilt-compiler:2.48'
    
    // Image Loading
    implementation 'io.coil-kt:coil-compose:2.5.0'
    
    // Payment
    implementation 'com.stripe:stripe-android:20.32.0'
}
```

## Configuração Supabase
```kotlin
// SupabaseClient.kt
package com.blink.app.data

import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.GoTrue
import io.github.jan.supabase.postgrest.Postgrest

object SupabaseClient {
    val client = createSupabaseClient(
        supabaseUrl = "https://lstbjfcupoowfeunlcly.supabase.co",
        supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdGJqZmN1cG9vd2ZldW5sY2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MTU5NzMsImV4cCI6MjA1MjM5MTk3M30.FvrLXIW3LFLNU483IOCnpxlLNlOUU85RuEpBBq9RFYU"
    ) {
        install(Postgrest)
        install(GoTrue)
    }
}
```

## Modelos de Dados
```kotlin
// Models.kt
package com.blink.app.data.models

import kotlinx.serialization.Serializable

@Serializable
data class Restaurant(
    val id: String,
    val name: String,
    val description: String? = null,
    val address: String? = null,
    val city: String? = null,
    val contact: String? = null,
    val working_hours: String,
    val latitude: Double? = null,
    val longitude: Double? = null
)

@Serializable
data class Product(
    val id: String,
    val name: String,
    val description: String? = null,
    val price: Double,
    val category: String,
    val image_url: String? = null,
    val establishment_id: String
)

@Serializable
data class User(
    val id: String,
    val name: String,
    val email: String,
    val phone: String
)
```

## AndroidManifest.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />

    <application
        android:name=".BlinkApplication"
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Blink"
        tools:targetApi="31">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="@string/app_name"
            android:theme="@style/Theme.Blink">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```