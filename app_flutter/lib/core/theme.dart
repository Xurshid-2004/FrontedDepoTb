import 'package:flutter/material.dart';

/// TB dizayn tizimi — palitra Afrosiyob videosidan olingan
class TB {
  static const osmon = Color(0xFF1C5C9E); // asosiy
  static const osmonOchiq = Color(0xFF4A9FD8);
  static const qum = Color(0xFFB8895A);
  static const oltin = Color(0xFFC98A2E); // omborxona moduli
  static const yashil = Color(0xFF22C55E);
  static const sariq = Color(0xFFF59E0B);
  static const apelsin = Color(0xFFF97316);
  static const qizil = Color(0xFFEF4444);
  static const toqQizil = Color(0xFFB91C1C);
  static const fon = Color(0xFFF4F7FB);

  /// Holat rangi: yashil — olgan, sariq — muddat keldi, qizil — muddat oʻtdi
  static Color holat(String h) => switch (h) {
        'yashil' => yashil,
        'sariq' => sariq,
        _ => qizil,
      };

  /// KIP muddati rangi
  static Color kip(int kunQoldi) {
    if (kunQoldi < 0) return toqQizil;
    if (kunQoldi == 0) return apelsin;
    if (kunQoldi <= 2) return sariq;
    return yashil;
  }

  static ThemeData theme() {
    final base = ColorScheme.fromSeed(seedColor: osmon, brightness: Brightness.light);
    return ThemeData(
      useMaterial3: true,
      colorScheme: base.copyWith(primary: osmon, secondary: oltin),
      scaffoldBackgroundColor: fon,
      appBarTheme: const AppBarTheme(
        backgroundColor: osmon,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFE3EAF3)),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFD8E2EE)),
        ),
      ),
    );
  }
}
