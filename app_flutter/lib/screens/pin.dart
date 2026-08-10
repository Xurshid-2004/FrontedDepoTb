import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../core/store.dart';
import '../core/theme.dart';

/// 4 xonali PIN: oʻrnatish (ikki marta) yoki kirish (barmoq izi bilan)
class PinEkrani extends StatefulWidget {
  final bool ornatish;
  const PinEkrani({super.key, this.ornatish = false});
  @override
  State<PinEkrani> createState() => _PinEkraniState();
}

class _PinEkraniState extends State<PinEkrani> {
  String _pin = '';
  String? _birinchi;
  String? _xato;
  int _xatoSoni = 0;

  @override
  void initState() {
    super.initState();
    if (!widget.ornatish) _bio();
  }

  Future<void> _bio() async {
    if (!await Kirish.bioYoqilgan()) return;
    if (await Kirish.bioOchish() && mounted) context.go('/kabinet');
  }

  Future<void> _bosildi(String raqam) async {
    if (_pin.length >= 4) return;
    HapticFeedback.selectionClick();
    setState(() { _pin += raqam; _xato = null; });
    if (_pin.length == 4) await _toldi();
  }

  Future<void> _toldi() async {
    await Future.delayed(const Duration(milliseconds: 120));
    if (widget.ornatish) {
      if (_birinchi == null) {
        setState(() { _birinchi = _pin; _pin = ''; });
      } else if (_birinchi == _pin) {
        final tabel = await Kirish.tabel();
        if (tabel == null) {
          if (mounted) context.go('/kirish');
          return;
        }
        await Kirish.pinOrnatVaServer(tabel, _pin);
        await Kirish.bioYoq(true);
        if (mounted) context.go('/kabinet');
      } else {
        HapticFeedback.heavyImpact();
        setState(() { _xato = 'PIN mos kelmadi. Qaytadan urinib koʻring'; _pin = ''; _birinchi = null; });
      }
    } else {
      if (await Kirish.pinTekshirVaServer(_pin)) {
        if (mounted) context.go('/kabinet');
      } else {
        HapticFeedback.heavyImpact();
        _xatoSoni++;
        setState(() {
          _pin = '';
          _xato = _xatoSoni >= 3
              ? 'Uch marta xato. 15 daqiqadan keyin qayta urinib koʻring'
              : 'PIN notoʻgʻri';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final sarlavha = widget.ornatish
        ? (_birinchi == null ? 'PIN kod oʻrnating' : 'PIN kodni takrorlang')
        : 'PIN kodni kiriting';

    return Scaffold(
      backgroundColor: TB.osmon,
      body: SafeArea(
        child: Column(
          children: [
            const Spacer(flex: 2),
            const Icon(Icons.lock_outline, color: Colors.white, size: 40),
            const SizedBox(height: 16),
            Text(sarlavha,
                style: const TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.w600)),
            const SizedBox(height: 22),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(4, (i) {
                final toldi = i < _pin.length;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  margin: const EdgeInsets.symmetric(horizontal: 9),
                  width: toldi ? 17 : 14,
                  height: toldi ? 17 : 14,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: toldi ? Colors.white : Colors.transparent,
                    border: Border.all(color: Colors.white70, width: 1.6),
                  ),
                );
              }),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 22,
              child: _xato == null
                  ? null
                  : Text(_xato!, style: const TextStyle(color: Color(0xFFFFD1D1), fontSize: 13)),
            ),
            const Spacer(),
            _Klaviatura(
              onRaqam: _bosildi,
              onOchir: () => setState(() {
                if (_pin.isNotEmpty) _pin = _pin.substring(0, _pin.length - 1);
              }),
              onBio: widget.ornatish ? null : _bio,
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

class _Klaviatura extends StatelessWidget {
  final void Function(String) onRaqam;
  final VoidCallback onOchir;
  final VoidCallback? onBio;
  const _Klaviatura({required this.onRaqam, required this.onOchir, this.onBio});

  @override
  Widget build(BuildContext context) {
    Widget tugma(Widget bola, VoidCallback? bosildi) => SizedBox(
          width: 78,
          height: 68,
          child: TextButton(
            onPressed: bosildi,
            style: TextButton.styleFrom(
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: bola,
          ),
        );

    Widget raqam(String r) => tugma(
        Text(r, style: const TextStyle(fontSize: 27, fontWeight: FontWeight.w500)),
        () => onRaqam(r));

    return Column(
      children: [
        for (final qator in [['1','2','3'], ['4','5','6'], ['7','8','9']])
          Row(mainAxisAlignment: MainAxisAlignment.center, children: qator.map(raqam).toList()),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            tugma(onBio == null
                ? const SizedBox.shrink()
                : const Icon(Icons.fingerprint, size: 28), onBio),
            raqam('0'),
            tugma(const Icon(Icons.backspace_outlined, size: 24), onOchir),
          ],
        ),
      ],
    );
  }
}
