import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:teleswift_frontend/config/config.dart';
import 'package:teleswift_frontend/config/provider/theme_provider.dart';
import 'package:teleswift_frontend/core/custom_button.dart';
import 'package:teleswift_frontend/screens/auth/login.dart';

class ProfileScreen extends StatefulWidget {
  final String fname;
  final String username;
  final String phone;
  final Uint8List photo;

  const ProfileScreen({
    super.key,
    required this.fname,
    required this.photo,
    required this.username,
    required this.phone,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final themeProvider = Provider.of<ThemeProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          "Profile",
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: colorScheme.onPrimary,
          ),
        ),
        backgroundColor: colorScheme.primary,
        actions: <Widget>[
          const SizedBox(width: 10),
          Switch(
            thumbIcon: WidgetStateProperty.resolveWith<Icon?>((
              Set<WidgetState> states,
            ) {
              if (states.contains(WidgetState.selected)) {
                return const Icon(
                  Icons.dark_mode,
                  color: Colors.black,
                  size: 18,
                );
              }
              return const Icon(Icons.light_mode, size: 18);
            }),
            value: themeProvider.themeMode == ThemeMode.dark,
            onChanged: (value) {
              themeProvider.toggleTheme(value);
            },
          ),
          const SizedBox(width: 15),
          IconButton(
            onPressed: () async {
              final prefs = await SharedPreferences.getInstance();
              final phone = prefs.getString('phone_stored');
              final response = await http.post(
                Uri.parse('http://${Config.baseUrl}:8000/auth/logout/$phone'),
                headers: {'Content-Type': 'application/json'},
              );

              if (response.statusCode == 200) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (context) => LoginScreen()),
                );
                prefs.clear();
              }
            },
            icon: Icon(
              Icons.logout_outlined,
              color: colorScheme.error,
              size: 30,
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            height: 300,
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [colorScheme.primary, theme.scaffoldBackgroundColor],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(15.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  CircleAvatar(
                    radius: 75,
                    backgroundColor: theme.brightness == Brightness.dark
                        ? colorScheme.surface.withOpacity(0.6)
                        : Colors.grey.shade200,
                    child: CircleAvatar(
                      radius: 69,
                      backgroundImage: MemoryImage(widget.photo),
                    ),
                  ),
                  const SizedBox(height: 15),
                  Text(
                    widget.username,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 25,
                      color: colorScheme.onSurface,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(30),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.fname,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontSize: 20,
                    color: colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 15),
                Text(
                  widget.phone,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontSize: 15,
                    color: colorScheme.onSurface.withOpacity(0.8),
                  ),
                ),
                const SizedBox(height: 40),
                CustomButton(onPressed: () {}, text: "Saved Snippets"),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
