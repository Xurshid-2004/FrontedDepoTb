import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

/// Server manzili — build paytida berilishi mumkin:
/// flutter build apk --dart-define=TB_API=https://tb.example.uz
const kApiBase = String.fromEnvironment('TB_API', defaultValue: 'http://10.0.2.2:3000');

class ApiXato implements Exception {
  final String xabar;
  final int kod;
  ApiXato(this.xabar, this.kod);
  @override
  String toString() => xabar;
}

class Api {
  Api._();
  static final Api I = Api._();

  static const _saqlash = FlutterSecureStorage();
  String? _token;

  Future<String?> token() async => _token ??= await _saqlash.read(key: 'tb_token');

  Future<void> tokenSaqla(String t) async {
    _token = t;
    await _saqlash.write(key: 'tb_token', value: t);
  }

  Future<void> chiqish() async {
    _token = null;
    await _saqlash.delete(key: 'tb_token');
  }

  Future<Map<String, String>> _headers() async {
    final t = await token();
    return {
      'Content-Type': 'application/json',
      if (t != null) 'Authorization': 'Bearer $t',
    };
  }

  Uri _u(String path, [Map<String, dynamic>? q]) =>
      Uri.parse('$kApiBase$path').replace(
        queryParameters: q?.map((k, v) => MapEntry(k, '$v')),
      );

  Future<dynamic> get(String path, [Map<String, dynamic>? q]) async =>
      _javob(await http.get(_u(path, q), headers: await _headers()));

  Future<dynamic> post(String path, Map<String, dynamic> body) async =>
      _javob(await http.post(_u(path), headers: await _headers(), body: jsonEncode(body)));

  dynamic _javob(http.Response r) {
    final body = r.body.isEmpty ? {} : jsonDecode(utf8.decode(r.bodyBytes));
    if (r.statusCode >= 400) {
      final msg = body is Map && body['error'] != null
          ? body['error'].toString()
          : 'Server xatosi (${r.statusCode})';
      if (kDebugMode) debugPrint('API xato ${r.statusCode}: $msg');
      throw ApiXato(msg, r.statusCode);
    }
    return body;
  }

  /* ------------------ Domen metodlari ------------------ */

  /// Tabel + PIN orqali serverdan token olish (self-host JWT — /api/auth/login).
  /// PIN hali oʻrnatilmagan boʻlsa server 409 {needsPin:true} qaytaradi.
  Future<Map<String, dynamic>> login(String tabel, String pin) async {
    final r = await post('/api/auth/login', {'tabel': tabel, 'pin': pin}) as Map<String, dynamic>;
    final access = r['access'] as String?;
    if (access != null) await tokenSaqla(access);
    return r;
  }

  /// Birinchi marta PIN oʻrnatish (faqat pin_hash hali boʻsh boʻlgan hisob uchun).
  Future<void> setPin(String tabel, String pin) async {
    await post('/api/auth/set-pin', {'tabel': tabel, 'pin': pin});
  }

  Future<Map<String, dynamic>> men() async => (await get('/api/me')) as Map<String, dynamic>;

  Future<Map<String, dynamic>> yuzTekshir({
    required String tabel,
    String? familiya,
    String? ism,
    required List<String> kadrlar,
  }) async =>
      (await post('/api/auth/face', {
        'tabel': tabel,
        if (familiya != null) 'familiya': familiya,
        if (ism != null) 'ism': ism,
        'frames': kadrlar,
      })) as Map<String, dynamic>;

  Future<List<dynamic>> arizalar({String? holat}) async {
    final r = await get('/api/requests', {if (holat != null) 'status': holat});
    return (r as Map)['items'] as List<dynamic>;
  }

  Future<Map<String, dynamic>> arizaYubor(List<Map<String, dynamic>> satrlar) async =>
      (await post('/api/requests', {'lines': satrlar})) as Map<String, dynamic>;

  Future<void> arizaAmal(String id, String amal, {String? izoh}) async =>
      post('/api/requests/$id/action', {'amal': amal, if (izoh != null) 'izoh': izoh});

  Future<Map<String, dynamic>> imzola(String doc, String docId, {String? maydon}) async =>
      (await post('/api/sign', {'doc': doc, 'docId': docId, if (maydon != null) 'field': maydon}))
          as Map<String, dynamic>;

  String hujjatUrl(String turi, String id) => '$kApiBase/api/documents/$turi/$id';
}
