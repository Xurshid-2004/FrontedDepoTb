import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';

/* -------------------- PIN va biometriya -------------------- */

class Kirish {
  static const _kPin = 'tb_pin_hash';
  static const _kBio = 'tb_bio';
  static const _kTabel = 'tb_tabel';

  static String _hash(String pin) {
    // Oddiy, lekin ochiq matnda saqlamaydigan usul.
    var h = 0;
    for (final c in '$pin::tb-tch6'.codeUnits) {
      h = (h * 31 + c) & 0x7fffffff;
    }
    return h.toRadixString(16);
  }

  static Future<void> pinOrnat(String pin) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(_kPin, _hash(pin));
  }

  static Future<bool> pinBorMi() async =>
      (await SharedPreferences.getInstance()).getString(_kPin) != null;

  static Future<bool> pinTekshir(String pin) async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_kPin) == _hash(pin);
  }

  /// Qurilmadagi PIN'ni birinchi marta oʻrnatish HAMDA serverda ham
  /// (tabel + shu PIN orqali) haqiqiy hisob yaratish/tasdiqlash.
  /// Server bilan bogʻlanib boʻlmasa ham, qurilma PIN'i baribir oʻrnatiladi —
  /// ilova oflaynda ham ochiladi, keyinroq internet borida sinxronlashadi.
  static Future<String?> pinOrnatVaServer(String tabel, String pin) async {
    await pinOrnat(pin);
    await tabelSaqla(tabel);
    try {
      await Api.I.setPin(tabel, pin);
    } on ApiXato catch (e) {
      // "PIN allaqachon oʻrnatilgan" — bu ishchi avval saytdan PIN qoʻygan
      // boʻlishi mumkin, xato emas, shunchaki login bilan davom etamiz.
      if (e.kod != 409) return e.xabar;
    } catch (_) {
      // server bilan aloqa yoʻq — oflayn davom etiladi
    }
    try {
      await Api.I.login(tabel, pin);
    } catch (_) {
      // token keyinroq, internet borida yangilanadi
    }
    return null;
  }

  /// Qurilma PIN'ini tekshiradi; toʻgʻri boʻlsa serverdan ham yangi token
  /// olishga urinadi (fon rejimida — xato boʻlsa ham kirish bloklanmaydi).
  static Future<bool> pinTekshirVaServer(String pin) async {
    final ok = await pinTekshir(pin);
    if (ok) {
      final t = await tabel();
      if (t != null) {
        // fon rejimida — kutilmaydi, xatoni yutadi
        // ignore: unawaited_futures
        Api.I.login(t, pin).catchError((_) => <String, dynamic>{});
      }
    }
    return ok;
  }

  static Future<void> tabelSaqla(String t) async =>
      (await SharedPreferences.getInstance()).setString(_kTabel, t);

  static Future<String?> tabel() async =>
      (await SharedPreferences.getInstance()).getString(_kTabel);

  static Future<void> bioYoq(bool v) async =>
      (await SharedPreferences.getInstance()).setBool(_kBio, v);

  static Future<bool> bioYoqilgan() async =>
      (await SharedPreferences.getInstance()).getBool(_kBio) ?? false;

  static Future<bool> bioOchish() async {
    final auth = LocalAuthentication();
    if (!await auth.canCheckBiometrics) return false;
    try {
      return await auth.authenticate(
        localizedReason: 'Ilovani ochish uchun barmoq izini qoʻying',
        options: const AuthenticationOptions(biometricOnly: true, stickyAuth: true),
      );
    } catch (_) {
      return false;
    }
  }

  static Future<void> tozala() async {
    final p = await SharedPreferences.getInstance();
    await p.remove(_kPin);
    await p.remove(_kBio);
    await Api.I.chiqish();
  }
}

/* -------------------- Riverpod provayderlari -------------------- */

/// Joriy foydalanuvchi va uning normalari
final menProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return Api.I.men();
});

/// Arizalar roʻyxati
final arizalarProvider =
    FutureProvider.autoDispose.family<List<dynamic>, String?>((ref, holat) async {
  return Api.I.arizalar(holat: holat);
});

/// Savat — ariza yuborishdan oldin tanlangan buyumlar
class Savat extends StateNotifier<List<Map<String, dynamic>>> {
  Savat() : super([]);

  void qosh(String itemId, String nomi, {String olcham = '-', num soni = 1}) {
    if (state.any((e) => e['itemId'] == itemId)) return;
    state = [...state, {'itemId': itemId, 'nomi': nomi, 'olcham': olcham, 'soni': soni}];
  }

  void olib(String itemId) =>
      state = state.where((e) => e['itemId'] != itemId).toList();

  void olcham(String itemId, String v) => state = [
        for (final e in state) if (e['itemId'] == itemId) {...e, 'olcham': v} else e
      ];

  void tozala() => state = [];
}

final savatProvider =
    StateNotifierProvider<Savat, List<Map<String, dynamic>>>((ref) => Savat());
