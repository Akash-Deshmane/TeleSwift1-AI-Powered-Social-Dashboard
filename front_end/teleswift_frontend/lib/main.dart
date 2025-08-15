import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:teleswift_frontend/screens/auth/login.dart';
import 'package:teleswift_frontend/screens/main/dash.dart';
import 'package:teleswift_frontend/config/themes/app_theme.dart';
import 'config/config.dart';
import 'config/provider/theme_provider.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => ThemeProvider(),
      child: const MainApp(),
    ),
  );
}

class MainApp extends StatefulWidget {
  const MainApp({super.key});

  @override
  State<MainApp> createState() => _MainAppState();
}

class _MainAppState extends State<MainApp> {
  late Future<Widget> _homeFuture;

  @override
  void initState() {
    super.initState();
    _homeFuture = _checkSession();
  }

  Future<Widget> _checkSession() async {
    final prefs = await SharedPreferences.getInstance();
    final phone = prefs.getString("phone_stored");
    print("Phone from SharedPreferences: $phone");

    if (phone != null && phone.isNotEmpty) {
      phone.trim();
      print(phone);
      try {
        final response = await http.get(
          Uri.parse(
            "http://${Config.baseUrl}:8000/auth/check_session",
          ).replace(queryParameters: {"phone": phone}),
        );

        if (response.statusCode == 200) {
          final result = jsonDecode(response.body);
          print(result);

          if (result["authenticated"] == true) {
            return const DashBoardScreen();
          }
        }
      } catch (e) {
        print("Error checking session: $e");
      }
    }
    return const LoginScreen();
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    return MaterialApp(
      title: "TeleSwift",
      debugShowCheckedModeBanner: false,
      darkTheme: AppTheme.darkTheme,
      theme: AppTheme.lightTheme,
      themeMode: themeProvider.themeMode,
      home: FutureBuilder<Widget>(
        future: _homeFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          if (snapshot.hasData) {
            return snapshot.data!;
          }
          return const LoginScreen();
        },
      ),
    );
  }
}
