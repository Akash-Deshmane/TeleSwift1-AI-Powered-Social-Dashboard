import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const primaryColor = Color.fromARGB(255, 47, 122, 226);

  // dark theme
  static ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    colorScheme: const ColorScheme.dark(
      primary: Color.fromARGB(255, 47, 122, 226),
      secondary: Color.fromARGB(255, 130, 130, 130),
      surface: Color(0xFF1E1E1E),
      tertiary: Color.fromARGB(255, 80, 120, 200),
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: Colors.white,
      onTertiary: Colors.white,
    ),
    scaffoldBackgroundColor: const Color(0xFF121212),

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white.withOpacity(0.08),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: const BorderSide(color: primaryColor),
      ),
      hintStyle: const TextStyle(color: Colors.grey),
    ),

    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF1E1E1E),
      elevation: 0,
      centerTitle: false,
      iconTheme: IconThemeData(color: Colors.white),
      titleTextStyle: TextStyle(
        color: Colors.white,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
    ),

    iconTheme: const IconThemeData(color: Colors.white, size: 24),
    primaryIconTheme: const IconThemeData(color: Colors.white),

    textTheme: TextTheme(
      titleLarge: GoogleFonts.quantico(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: Colors.white,
      ),
      bodyLarge: GoogleFonts.quantico(fontSize: 16, color: Colors.white),
      bodyMedium: GoogleFonts.quantico(fontSize: 14, color: Colors.white70),
      labelMedium: GoogleFonts.quantico(fontSize: 12, color: Colors.grey),
      headlineMedium: GoogleFonts.quantico(fontSize: 18, color: Colors.white30),
    ),

    cardTheme: CardThemeData(
      color: Colors.white.withOpacity(0.05),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
  );

  // light theme
  static ThemeData lightTheme = ThemeData(
    brightness: Brightness.light,
    colorScheme: const ColorScheme.light(
      primary: Color.fromARGB(255, 47, 122, 226),
      secondary: Color.fromARGB(255, 130, 130, 130),
      surface: Colors.white,
      tertiary: Color.fromARGB(255, 80, 120, 200),
      onPrimary: Colors.white,
      onSecondary: Colors.black,
      onSurface: Colors.black,
      onTertiary: Colors.black,
    ),
    scaffoldBackgroundColor: Colors.white,

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: primaryColor.withOpacity(0.08),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: const BorderSide(color: primaryColor),
      ),
      hintStyle: const TextStyle(color: Colors.grey),
    ),

    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
      iconTheme: IconThemeData(color: Colors.black),
      titleTextStyle: TextStyle(
        color: Colors.black,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
    ),

    iconTheme: const IconThemeData(color: Colors.black, size: 24),
    primaryIconTheme: const IconThemeData(color: Colors.black),

    textTheme: TextTheme(
      titleLarge: GoogleFonts.quantico(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: Colors.black,
      ),
      bodyLarge: GoogleFonts.quantico(fontSize: 16, color: Colors.black),
      bodyMedium: GoogleFonts.quantico(fontSize: 14, color: Colors.black87),
      labelMedium: GoogleFonts.quantico(fontSize: 12, color: Colors.grey[700]),
      headlineMedium: GoogleFonts.quantico(
        fontSize: 18,
        color: Colors.grey[700],
      ),
    ),

    cardTheme: CardThemeData(
      color: primaryColor.withOpacity(0.1),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
  );
}
