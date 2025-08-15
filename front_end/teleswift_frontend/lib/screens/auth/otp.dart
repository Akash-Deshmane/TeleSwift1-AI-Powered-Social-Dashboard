import 'dart:async';
import 'dart:convert';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:pin_code_fields/pin_code_fields.dart';
import 'package:teleswift_frontend/core/custom_button.dart';
import 'package:teleswift_frontend/screens/main/dash.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:teleswift_frontend/config/config.dart';

class OtpScreen extends StatefulWidget {
  final String phone;
  const OtpScreen({super.key, required this.phone});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final TextEditingController otpController = TextEditingController();
  final StreamController<ErrorAnimationType> errorController =
      StreamController<ErrorAnimationType>();
  final _formKey = GlobalKey<FormState>();

  bool isResendAvailable = true;
  int secondsRemaining = 30;
  Timer? _timer;

  void startResendCountdown() {
    setState(() => isResendAvailable = false);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => secondsRemaining--);
      if (secondsRemaining == 0) {
        _timer?.cancel();
        setState(() {
          isResendAvailable = true;
          secondsRemaining = 30;
        });
      }
    });
  }

  @override
  void dispose() {
    super.dispose();
    otpController.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: EdgeInsets.symmetric(horizontal: 22, vertical: 30),
        child: Column(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Verification Code",
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontSize: 30,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  "Please enter the OTP you have recieved on your Telegram to continue",
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 60),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Form(
                  key: _formKey,
                  child: PinCodeTextField(
                    appContext: context,
                    length: 5,
                    obscureText: false,
                    pinTheme: PinTheme(
                      shape: PinCodeFieldShape.box,
                      fieldHeight: 50,
                      fieldWidth: 50,
                    ),
                    backgroundColor: const Color.fromARGB(0, 255, 255, 255),
                    controller: otpController,
                    blinkWhenObscuring: true,
                    blinkDuration: Durations.short3,
                    keyboardType: TextInputType.number,
                    animationType: AnimationType.none,
                    hapticFeedbackTypes: HapticFeedbackTypes.medium,
                    errorAnimationController: errorController,
                  ),
                ),
                RichText(
                  text: TextSpan(
                    children: [
                      TextSpan(
                        text: "Didn't recieve the OTP ?  ",
                        style: Theme.of(
                          context,
                        ).textTheme.bodySmall?.copyWith(fontSize: 15),
                      ),
                      TextSpan(
                        text: "Resend",
                        style: Theme.of(
                          context,
                        ).textTheme.bodySmall?.copyWith(fontSize: 15),
                        recognizer: TapGestureRecognizer()
                          ..onTap = isResendAvailable
                              ? () {
                                  startResendCountdown();
                                  //backendLogic
                                }
                              : null,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 30),
                CustomButton(
                  onPressed: () async {
                    if (_formKey.currentState!.validate()) {
                      final otp = otpController.text.trim();

                      final response = await http.post(
                        Uri.parse('http://${Config.baseUrl}:8000/auth/verify'),
                        headers: {'Content-Type': 'application/json'},
                        body: jsonEncode({'phone': widget.phone, 'code': otp}),
                      );

                      if (response.statusCode == 200) {
                        final prefs = await SharedPreferences.getInstance();
                        final success = await prefs.setString(
                          'phone_stored',
                          widget.phone,
                        );
                        print("Phone save success: $success");
                        await prefs.reload();
                        print(
                          "Phone after reload: ${prefs.getString('phone_stored')}",
                        );

                        Navigator.pushAndRemoveUntil(
                          context,
                          MaterialPageRoute(
                            builder: (context) => DashBoardScreen(),
                          ),
                          (Route<dynamic> route) => false,
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text("Failed to send OTP")),
                        );
                      }
                    }
                  },
                  text: "Login",
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
