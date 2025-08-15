import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:teleswift_frontend/config/config.dart';
import 'package:teleswift_frontend/core/custom_button.dart';
import 'package:teleswift_frontend/core/custom_input_field.dart';
import 'package:teleswift_frontend/screens/auth/otp.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final phoneFocus = FocusNode();
  final _formKey = GlobalKey<FormState>();
  final TextEditingController phoneController = TextEditingController();

  String? _validatePhone(String? value) {
    if (value == null || value.isEmpty) {
      return "Enter your phone number";
    }
    final phoneRegex = RegExp(r'^[0-9]{10}$'); // Only 10 digits allowed
    if (!phoneRegex.hasMatch(value)) {
      return "Enter a valid 10-digit number";
    }
    return null;
  }

  @override
  void dispose() {
    phoneController.dispose();
    phoneFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: BottomAppBar(
        color: Colors.transparent,
        elevation: 0,
        child: Text(
          "Your Chats. Distilled.",
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontSize: 20,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(25),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 30),
              Text(
                "Get Message summaries swiftly!",
                textAlign: TextAlign.left,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 80),
              Text(
                "Sign In to continue",
                textAlign: TextAlign.left,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 10),
              CustomTextfield(
                hintText: "Enter your 10-digit phone number",
                controller: phoneController,
                focusNode: phoneFocus,
                validator: _validatePhone,
                keyboardType: TextInputType.number,
                prefixText: "+91 ",
              ),
              const SizedBox(height: 25),
              CustomButton(
                onPressed: () async {
                  if (_formKey.currentState!.validate()) {
                    final rawPhone = phoneController.text.trim();
                    final phone = "+91$rawPhone"; // Add +91 before sending

                    final response = await http.post(
                      Uri.parse('http://${Config.baseUrl}:8000/auth/start'),
                      headers: {'Content-Type': 'application/json'},
                      body: jsonEncode({'phone': phone}),
                    );

                    if (response.statusCode == 200) {
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(
                          builder: (context) => OtpScreen(phone: phone),
                        ),
                        (Route<dynamic> route) => false,
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Failed to send OTP")),
                      );
                    }
                  }
                },
                text: "Get OTP",
              ),
              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
    );
  }
}
