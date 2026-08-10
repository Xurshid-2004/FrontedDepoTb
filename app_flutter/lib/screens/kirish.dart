import 'dart:convert';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:signature/signature.dart';

import '../core/api.dart';
import '../core/store.dart';
import '../core/theme.dart';

/// Roʻyxatdan oʻtish: tabel → F.I.Sh. → Face ID → imzo → PIN
class KirishEkrani extends StatefulWidget {
  const KirishEkrani({super.key});
  @override
  State<KirishEkrani> createState() => _KirishEkraniState();
}

class _KirishEkraniState extends State<KirishEkrani> {
  int _qadam = 0;
  bool _yuklanmoqda = false;
  String? _xato;

  final _tabel = TextEditingController();
  final _familiya = TextEditingController();
  final _ism = TextEditingController();
  final _imzo = SignatureController(penStrokeWidth: 3, penColor: Colors.black);

  CameraController? _kamera;

  @override
  void dispose() {
    _tabel.dispose();
    _familiya.dispose();
    _ism.dispose();
    _imzo.dispose();
    _kamera?.dispose();
    super.dispose();
  }

  Future<void> _kameraTayyorla() async {
    final list = await availableCameras();
    final old = list.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.front,
      orElse: () => list.first,
    );
    _kamera = CameraController(old, ResolutionPreset.medium, enableAudio: false);
    await _kamera!.initialize();
    if (mounted) setState(() {});
  }

  /// Yuz orqali tasdiqlash — ixtiyoriy qadam. Face servis hali serverga
  /// ulanmagan boʻlsa (masalan FACE_SERVICE_URL boʻsh — standart holat,
  /// RAM tejash uchun DEPLOY.md'da shunday tavsiya etilgan) bu qadam
  /// ogohlantirish bilan oʻtkazib yuboriladi — roʻyxatdan oʻtish
  /// bloklanmaydi, tabel + PIN orqali kirish baribir ishlayveradi.
  Future<void> _yuzTekshir() async {
    setState(() { _yuklanmoqda = true; _xato = null; });
    try {
      final kadrlar = <String>[];
      for (var i = 0; i < 3; i++) {
        final f = await _kamera!.takePicture();
        kadrlar.add(base64Encode(await f.readAsBytes()));
        await Future.delayed(const Duration(milliseconds: 450));
      }
      await Api.I.yuzTekshir(
        tabel: _tabel.text.trim(),
        familiya: _familiya.text.trim(),
        ism: _ism.text.trim(),
        kadrlar: kadrlar,
      );
      if (mounted) setState(() { _qadam = 3; _yuklanmoqda = false; });
    } catch (e) {
      // Face servis oʻchirilgan/xato boʻlsa ham davom etamiz — bu qadam
      // ixtiyoriy, asosiy kirish tabel + PIN orqali boʻladi.
      if (mounted) {
        setState(() {
          _xato = 'Yuz tekshiruvi hozircha mavjud emas — PIN bilan davom etyapmiz ($e)';
          _qadam = 3;
          _yuklanmoqda = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Roʻyxatdan oʻtish')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _Bosqichlar(joriy: _qadam),
              const SizedBox(height: 20),
              if (_xato != null) _XatoBanner(_xato!),
              Expanded(child: SingleChildScrollView(child: _tana())),
              const SizedBox(height: 12),
              _tugma(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _tana() => switch (_qadam) {
        0 => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Tabel raqamingizni kiriting',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              const Text('Raqam kadrlar boʻlimi bergan roʻyxat bilan solishtiriladi.',
                  style: TextStyle(color: Colors.black54, fontSize: 13)),
              const SizedBox(height: 18),
              TextField(
                controller: _tabel,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Tabel raqami'),
              ),
            ],
          ),
        1 => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Familiya va ismingiz',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 18),
              TextField(controller: _familiya, decoration: const InputDecoration(labelText: 'Familiya')),
              const SizedBox(height: 12),
              TextField(controller: _ism, decoration: const InputDecoration(labelText: 'Ism')),
            ],
          ),
        2 => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Yuzni tasdiqlash',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              const Text('Kameraga toʻgʻridan qarang. Uch kadr olinadi.',
                  style: TextStyle(color: Colors.black54, fontSize: 13)),
              const SizedBox(height: 16),
              AspectRatio(
                aspectRatio: 3 / 4,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: _kamera?.value.isInitialized == true
                      ? CameraPreview(_kamera!)
                      : Container(
                          color: Colors.black12,
                          child: const Center(child: CircularProgressIndicator()),
                        ),
                ),
              ),
            ],
          ),
        3 => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Imzoingizni chizing',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              const Text('Imzo hujjatlarda QR kod bilan birga chiqadi.',
                  style: TextStyle(color: Colors.black54, fontSize: 13)),
              const SizedBox(height: 16),
              Container(
                height: 220,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFD8E2EE)),
                ),
                child: Signature(controller: _imzo, backgroundColor: Colors.white),
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () => _imzo.clear(),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Tozalash'),
                ),
              ),
            ],
          ),
        _ => const SizedBox.shrink(),
      };

  Widget _tugma() {
    if (_yuklanmoqda) {
      return const Padding(
        padding: EdgeInsets.all(14),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    return FilledButton(
      onPressed: () async {
        setState(() => _xato = null);
        switch (_qadam) {
          case 0:
            if (_tabel.text.trim().isEmpty) return setState(() => _xato = 'Tabel raqamini kiriting');
            await Kirish.tabelSaqla(_tabel.text.trim());
            setState(() => _qadam = 1);
          case 1:
            if (_familiya.text.trim().isEmpty || _ism.text.trim().isEmpty) {
              return setState(() => _xato = 'Familiya va ismni kiriting');
            }
            setState(() => _qadam = 2);
            await _kameraTayyorla();
          case 2:
            await _yuzTekshir();
          case 3:
            if (_imzo.isEmpty) return setState(() => _xato = 'Imzo chizilmagan');
            if (mounted) context.go('/pin?ornat=1');
        }
      },
      child: Text(switch (_qadam) {
        2 => 'Suratga olish',
        3 => 'Tasdiqlash',
        _ => 'Davom etish',
      }),
    );
  }
}

class _Bosqichlar extends StatelessWidget {
  final int joriy;
  const _Bosqichlar({required this.joriy});
  @override
  Widget build(BuildContext context) => Row(
        children: List.generate(4, (i) {
          final faol = i <= joriy;
          return Expanded(
            child: Container(
              height: 5,
              margin: EdgeInsets.only(right: i < 3 ? 6 : 0),
              decoration: BoxDecoration(
                color: faol ? TB.osmon : const Color(0xFFDCE5F0),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          );
        }),
      );
}

class _XatoBanner extends StatelessWidget {
  final String matn;
  const _XatoBanner(this.matn);
  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFFDECEC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFF5B5B5)),
        ),
        child: Row(children: [
          const Icon(Icons.error_outline, color: TB.qizil, size: 20),
          const SizedBox(width: 8),
          Expanded(child: Text(matn, style: const TextStyle(fontSize: 13))),
        ]),
      );
}
