import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../core/api.dart';
import '../core/store.dart';
import '../core/theme.dart';

const _holatNomi = {
  'SUBMITTED': 'Bugalterda',
  'ACCOUNTANT_APPROVED': 'Bosh xisobchida',
  'CHIEF_APPROVED': 'Depo boshligʻida',
  'HEAD_APPROVED': 'Omborda',
  'ISSUED': 'Berildi — tasdiqlang',
  'COMPLETED': 'Yakunlandi',
  'REJECTED': 'Rad etildi',
};

const _holatRangi = {
  'SUBMITTED': TB.osmonOchiq,
  'ACCOUNTANT_APPROVED': TB.osmonOchiq,
  'CHIEF_APPROVED': TB.osmon,
  'HEAD_APPROVED': TB.oltin,
  'ISSUED': TB.apelsin,
  'COMPLETED': TB.yashil,
  'REJECTED': TB.qizil,
};

class ArizalarEkrani extends ConsumerWidget {
  const ArizalarEkrani({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final arizalar = ref.watch(arizalarProvider(null));

    return Scaffold(
      appBar: AppBar(title: const Text('Arizalarim')),
      body: arizalar.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Padding(padding: const EdgeInsets.all(24), child: Text('$e'))),
        data: (list) {
          if (list.isEmpty) {
            return const Center(child: Text('Hozircha ariza yoʻq'));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(arizalarProvider(null)),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              itemBuilder: (_, i) => _ArizaKarta(list[i] as Map<String, dynamic>, ref),
            ),
          );
        },
      ),
    );
  }
}

class _ArizaKarta extends StatelessWidget {
  final Map<String, dynamic> a;
  final WidgetRef ref;
  const _ArizaKarta(this.a, this.ref);

  @override
  Widget build(BuildContext context) {
    final status = a['status'] as String;
    final rang = _holatRangi[status] ?? Colors.grey;
    final items = (a['items'] as List?) ?? [];

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(
              child: Text(a['raqam'] ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: rang.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: rang.withValues(alpha: 0.5)),
              ),
              child: Text(_holatNomi[status] ?? status,
                  style: TextStyle(color: rang, fontSize: 11.5, fontWeight: FontWeight.w600)),
            ),
          ]),
          const SizedBox(height: 6),
          Text(
            DateFormat('dd.MM.yyyy HH:mm').format(DateTime.parse(a['yaratilgan'])),
            style: const TextStyle(fontSize: 11.5, color: Colors.black45),
          ),
          const SizedBox(height: 10),
          ...items.map((raw) {
            final it = raw as Map<String, dynamic>;
            final item = it['item'] as Map<String, dynamic>?;
            return Padding(
              padding: const EdgeInsets.only(bottom: 3),
              child: Row(children: [
                const Text('• ', style: TextStyle(color: Colors.black38)),
                Expanded(child: Text(item?['nomi'] ?? '', style: const TextStyle(fontSize: 13))),
                Text('${it['olcham']} · ${it['soralgan']}',
                    style: const TextStyle(fontSize: 12, color: Colors.black54)),
              ]),
            );
          }),
          if (status == 'ISSUED') ...[
            const SizedBox(height: 12),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                  backgroundColor: TB.yashil, minimumSize: const Size.fromHeight(44)),
              onPressed: () async {
                try {
                  await Api.I.arizaAmal(a['id'], 'oldim');
                  ref.invalidate(arizalarProvider(null));
                  ref.invalidate(menProvider);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(backgroundColor: TB.yashil, content: Text('Tasdiqlandi')),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context)
                        .showSnackBar(SnackBar(backgroundColor: TB.qizil, content: Text('$e')));
                  }
                }
              },
              icon: const Icon(Icons.check),
              label: const Text('Olganimni tasdiqlayman'),
            ),
          ],
          if (status == 'COMPLETED') ...[
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: () {}, // hujjatni ochish: Api.I.hujjatUrl('requisition', a['id'])
              icon: const Icon(Icons.picture_as_pdf_outlined, size: 18),
              label: const Text('Требование hujjati'),
            ),
          ],
        ]),
      ),
    );
  }
}
