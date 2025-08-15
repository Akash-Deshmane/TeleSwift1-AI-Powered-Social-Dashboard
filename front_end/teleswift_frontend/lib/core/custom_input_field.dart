import 'package:flutter/material.dart';

class CustomTextfield extends StatelessWidget {
  final String hintText;
  final bool obscuredText;
  final TextInputType? keyboardType;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final String prefixText;
  final FocusNode? focusNode;
  final String? Function(String?)? validator;
  final TextEditingController controller;

  const CustomTextfield({
    super.key,
    required this.hintText,
    this.obscuredText = false,
    this.keyboardType,
    this.prefixIcon,
    this.suffixIcon,
    this.focusNode,
    this.validator,
    required this.controller,
    required this.prefixText,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context); // Access current theme

    return TextFormField(
      controller: controller,
      obscureText: obscuredText,
      keyboardType: keyboardType,
      focusNode: focusNode,
      validator: validator,
      style: theme.textTheme.bodyLarge, // Uses theme's text style
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: theme.textTheme.bodyMedium?.copyWith(
          color: theme.hintColor, // Adapts for light/dark
        ),
        prefixIcon: prefixIcon,
        suffixIcon: suffixIcon,
        prefixText: prefixText.isNotEmpty ? prefixText : null,
        prefixStyle: theme.textTheme.bodyLarge?.copyWith(
          fontWeight: FontWeight.bold,
        ),
        filled: true,
        fillColor:
            theme.inputDecorationTheme.fillColor ??
            theme.colorScheme.surfaceVariant,
        border:
            theme.inputDecorationTheme.border ??
            OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: theme.colorScheme.outline),
            ),
      ),
    );
  }
}
