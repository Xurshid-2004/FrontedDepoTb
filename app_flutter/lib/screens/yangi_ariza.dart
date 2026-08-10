import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/api.dart';
import '../core/store.dart';
import '../core/theme.dart';

/// Yangi ariza: faqat olish vaqti kelgan buyumlar roʻyxatdan tanlanadi
class YangiArizaEkrani extends ConsumerStatefulWidget {
  const YangiArizaEkrani({super.key});
  @override
  ConsumerState<YangiArizaEkrani> createState() => _YangiArizaEkraniState();
}

class _YangiArizaEkraniState extends ConsumerState<YangiArizaEkrani> {
  bool _yuborilmoqda = false;

  @override
  Widget build(BuildContext context) {
    final men = ref.watch(menProvider);
    final savat = ref.watch(savatProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Yangi ariza')),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton(
            onPressed: savat.isEmpty || _yuborilmoqda ? null : () => _yubor(savat),
            child: _yuborilmoqda
                ? const SizedBox(width: 22, height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white))
                : Text('Yuborish (${savat.length})'),
          ),
        ),
      ),
      body: men.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Padding(padding: const EdgeInsets.all(24), child: Text('$e'))),
        data: (d) {
          final barcha = (d['buyumlar'] as List).cast<Map<String, dynamic>>();
          final mumkin = barcha.where((b) => b['soralishiMumkin'] == true).toList();
          final mumkinEmas = barcha.where((b) => b['soralishiMumkin'] != true).toList();
          final olchamlar = d['olchamlar'] as Map<String, dynamic>?;

          if (barcha.isEmpty) {
            return const Center(child: Text('Lavozimingiz uchun norma topilmadi'));
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (mumkin.isEmpty)
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF6E5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFF3D9A4)),
                  ),
                  child: const Text(
                    'Hozircha soʻrash mumkin boʻlgan buyum yoʻq. '
                    'Olish muddati kelganda ilova xabar beradi.',
                    style: TextStyle(fontSize: 13),
                  ),
                ),
              if (mumkin.isNotEmpty) ...[
                const Text('Soʻrash mumkin', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: 8),
                ...mumkin.map((b) => _Qator(b: b, olchamlar: olchamlar, tanlanadi: true)),
              ],
              if (mumkinEmas.isNotEmpty) ...[
                const SizedBox(height: 18),
                const Text('Hozircha mumkin emas',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: Colors.black54)),
                const SizedBox(height: 8),
                ...mumkinEmas.map((b) => _Qator(b: b, olchamlar: olchamlar, tanlanadi: false)),
              ],
              const SizedBox(height: 16),
            ],
          );
        },
      ),
    );
  }

  Future<void> _yubor(List<Map<String, dynamic>> savat) async {
    setState(() => _yuborilmoqda = true);
    try {
      final r = await Api.I.arizaYubor(savat
          .map((e) => {'itemId': e['itemId'], 'olcham': e['olcham'], 'soni': e['soni']})
          .toList());
      ref.read(savatProvider.notifier).tozala();
      ref.invalidate(menProvider);
      if (!mounted) return;
      final xatolar = (r['xatolar'] as List?) ?? [];
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        backgroundColor: TB.yashil,
        content: Text('Ariza yuborildi: ${r['raqam']}'
            '${xatolar.isNotEmpty ? '\n${xatolar.length} satr qabul qilinmadi' : ''}'),
      ));
      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(backgroundColor: TB.qizil, content: Text('$e')));
    } finally {
      if (mounted) setState(() => _yuborilmoqda = false);
    }
  }
}

class _Qator extends ConsumerWidget {
  final Map<String, dynamic> b;
  final Map<String, dynamic>? olchamlar;
  final bool tanlanadi;
  const _Qator({required this.b, required this.olchamlar, required this.tanlanadi});

  String _standartOlcham(String sizeKind) => switch (sizeKind) {
        'kiyim' => '${olchamlar?['kiyim_olchami'] ?? '-'}',
        'poyabzal' => '${olchamlar?['poyabzal_olchami'] ?? '-'}',
        'bosh_kiyim' => '${olchamlar?['bosh_kiyim_olchami'] ?? '-'}',
        _ => '-',
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final item = b['item'] as Map<String, dynamic>;
    final savat = ref.watch(savatProvider);
    final tanlangan = savat.any((e) => e['itemId'] == item['id']);
    final olcham = _standartOlcham('${item['size_kind']}');

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        enabled: tanlanadi,
        onTap: !tanlanadi
            ? null
            : () {
                final n = ref.read(savatProvider.notifier);
                tanlangan ? n.olib(item['id']) : n.qosh(item['id'], item['nomi'], olcham: olcham);
              },
        leading: Icon(
          tanlangan ? Icons.check_circle : Icons.radio_button_unchecked,
          color: tanlangan ? TB.yashil : Colors.black26,
        ),
        title: Text(item['nomi'] ?? '',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14.5,
                color: tanlanadi ? Colors.black : Colors.black45)),
        subtitle: Text(
          tanlanadi
              ? (olcham != '-' ? 'Oʻlcham: $olcham' : 'Oʻlchamsiz')
              : (b['sabab'] ?? '').toString(),
          style: const TextStyle(fontSize: 12),
        ),
      ),
    );
  }
}
