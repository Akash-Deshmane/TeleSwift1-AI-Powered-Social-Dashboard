import 'package:flutter/material.dart';

class CustomButton extends StatelessWidget {
  final String? text;
  final Widget? child;
  final Function()? onPressed;

  const CustomButton({
    super.key,
    this.text,
    this.child,
    required this.onPressed,
  }) : assert(
         text != null || child != null,
         'either of these must be provided',
       );

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onPressed == null
            ? null
            : () async {
                await onPressed?.call();
              },
        style: ElevatedButton.styleFrom(
          backgroundColor: Theme.of(context).colorScheme.primary,
          foregroundColor: Colors.black87,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child:
            child ?? Text(text!, style: Theme.of(context).textTheme.bodyMedium),
      ),
    );
  }
}
