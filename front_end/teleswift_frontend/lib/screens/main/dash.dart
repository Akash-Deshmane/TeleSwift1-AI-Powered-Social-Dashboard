import 'dart:convert';
import 'dart:typed_data';
import 'package:teleswift_frontend/config/config.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:teleswift_frontend/screens/main/profile.dart';

class DashBoardScreen extends StatefulWidget {
  const DashBoardScreen({super.key});

  @override
  State<DashBoardScreen> createState() => _DashBoardScreenState();
}

class _DashBoardScreenState extends State<DashBoardScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return PopScope(
      canPop: false,
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            "TeleSwift",
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: colorScheme.onPrimary,
              fontSize: 28,
            ),
          ),
          backgroundColor: colorScheme.primary,
          actions: <Widget>[
            IconButton(
              onPressed: () async {
                final prefs = await SharedPreferences.getInstance();
                final phone = prefs.getString('phone_stored');

                final response = await http.get(
                  Uri.parse(
                    'http://${Config.baseUrl}:8000/teleswift/profile/$phone',
                  ),
                  headers: {'Content-Type': 'application/json'},
                );

                if (response.statusCode == 200) {
                  final data = jsonDecode(response.body);
                  final fname = data["first_name"];
                  //final lname = data["last_name"];
                  final username = data["username"];
                  final phone = data["phone"];
                  final String photo = data["photo"];
                  Uint8List photoBytes = base64Decode(photo);

                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ProfileScreen(
                        fname: fname,
                        //lname: lname,
                        photo: photoBytes,
                        username: username,
                        phone: phone,
                      ),
                    ),
                  );
                } else {
                  print("Error:${response.statusCode}");
                }
              },
              icon: Icon(
                Icons.person_2_rounded,
                color: colorScheme.onPrimary,
                size: 35,
              ),
            ),
          ],
        ),
        body: ListView(),
      ),
    );
  }
}
