import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../core/store.dart';
import '../core/theme.dart';

/// Ishchi kabineti: buyumlar, talonlar, imtixon, KIP
class KabinetEkrani extends ConsumerWidget {
  const KabinetEkrani({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final men = ref.watch(menProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Kabinet'),
        actions: [
          IconButton(
            icon: const Icon(Icons.description_outlined),
            tooltip: 'Arizalarim',
            onPressed: () => context.push('/arizalar'),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Chiqish',
            onPressed: () async {
              await Kirish.tozala();
              if (context.mounted) context.go('/kirish');
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/yangi-ariza'),
        backgroundColor: TB.oltin,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Ariza yuborish'),
      ),
      body: men.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _Xato(xabar: '$e', qayta: () => ref.invalidate(menProvider)),
        data: (d) {
          final u = d['me'] as Map<String, dynamic>;
          final buyumlar = (d['buyumlar'] as List).cast<Map<String, dynamic>>();
          final talonlar = (d['talonlar'] as List).cast<Map<String, dynamic>>();
          final imtixon = d['imtixon'] as Map<String, dynamic>?;
          final kip = d['kip'] as Map<String, dynamic>?;

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(menProvider),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _Profil(u: u),
                const SizedBox(height: 16),

                if (imtixon != null) _ImtixonKarta(imtixon),
                if (kip != null) ...[const SizedBox(height: 12), _KipKarta(kip)],
                const SizedBox(height: 12),
                _TalonKarta(talonlar),
                const SizedBox(height: 20),

                const Text('Menga tegishli buyumlar',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(
                  d['qishOchiq'] == true
                      ? 'Qishki buyumlar arizasi ochiq'
                      : 'Qishki buyumlar mavsumi yopiq (15.09 – 15.04)',
                  style: const TextStyle(fontSize: 12, color: Colors.black54),
                ),
                const SizedBox(height: 10),
                ...buyumlar.map((b) => _BuyumQator(b)),
                const SizedBox(height: 90),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _Profil extends StatelessWidget {
  final Map<String, dynamic> u;
  const _Profil({required this.u});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [TB.osmon, TB.osmonOchiq]),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Row(children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: Colors.white24,
            child: Text(
              '${u['familiya']?[0] ?? ''}${u['ism']?[0] ?? ''}',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${u['familiya']} ${u['ism']}',
                  style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 3),
              Text('${u['lavozim'] ?? ''} · tabel ${u['tabel']}',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 12.5)),
            ]),
          ),
        ]),
      );
}

class _BuyumQator extends StatelessWidget {
  final Map<String, dynamic> b;
  const _BuyumQator(this.b);

  @override
  Widget build(BuildContext context) {
    final item = b['item'] as Map<String, dynamic>;
    final holat = b['holat'] as String;
    final muddat = b['muddatOy'];
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(width: 6, height: 44,
            decoration: BoxDecoration(color: TB.holat(holat), borderRadius: BorderRadius.circular(3))),
        title: Text(item['nomi'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14.5)),
        subtitle: Text(
          muddat == null
              ? 'Иш. Чиққун — yaroqsiz boʻlganda almashtiriladi'
              : b['keyingi'] != null
                  ? 'Keyingi olish: ${b['keyingi']}'
                  : 'Hali olinmagan',
          style: const TextStyle(fontSize: 12),
        ),
        trailing: b['soralishiMumkin'] == true
            ? const Chip(
                label: Text('Soʻrash mumkin', style: TextStyle(fontSize: 11)),
                backgroundColor: Color(0xFFE8F7EE),
                side: BorderSide(color: Color(0xFFB7E4C7)),
                padding: EdgeInsets.zero)
            : null,
      ),
    );
  }
}

class _TalonKarta extends StatelessWidget {
  final List<Map<String, dynamic>> talonlar;
  const _TalonKarta(this.talonlar);
  @override
  Widget build(BuildContext context) {
    const ranglar = [TB.yashil, TB.sariq, TB.qizil];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Ogohlantirish talonlari', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          Row(children: List.generate(3, (i) {
            final t = talonlar.firstWhere((e) => e['raqam'] == i + 1, orElse: () => {'olingan': false});
            final olingan = t['olingan'] == true;
            return Expanded(
              child: Container(
                margin: EdgeInsets.only(right: i < 2 ? 8 : 0),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: olingan ? const Color(0xFFF1F3F6) : ranglar[i].withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: olingan ? const Color(0xFFDDE3EA) : ranglar[i]),
                ),
                child: Column(children: [
                  Icon(olingan ? Icons.remove_circle_outline : Icons.confirmation_number_outlined,
                      color: olingan ? Colors.black26 : ranglar[i], size: 22),
                  const SizedBox(height: 5),
                  Text('${i + 1}-talon', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600)),
                  Text(olingan ? 'olingan' : 'joyida',
                      style: TextStyle(fontSize: 10.5, color: olingan ? Colors.black45 : ranglar[i])),
                ]),
              ),
            );
          })),
        ]),
      ),
    );
  }
}

class _ImtixonKarta extends StatelessWidget {
  final Map<String, dynamic> e;
  const _ImtixonKarta(this.e);
  @override
  Widget build(BuildContext context) {
    final keyingi = e['keyingi_sana'];
    int? qoldi;
    if (keyingi != null) {
      qoldi = DateTime.parse(keyingi).difference(DateTime.now()).inDays;
    }
    final ogohlantirish = qoldi != null && qoldi <= 10;
    return Card(
      child: ListTile(
        leading: Icon(Icons.school_outlined, color: ogohlantirish ? TB.sariq : TB.osmon),
        title: const Text('TB bilim sinash imtixoni', style: TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(keyingi == null
            ? 'Sana belgilanmagan'
            : 'Sana: ${DateFormat('dd.MM.yyyy').format(DateTime.parse(keyingi))}'
              '${qoldi != null ? ' · $qoldi kun qoldi' : ''}'),
        trailing: ogohlantirish ? const Icon(Icons.notifications_active, color: TB.sariq) : null,
      ),
    );
  }
}

class _KipKarta extends StatelessWidget {
  final Map<String, dynamic> k;
  const _KipKarta(this.k);
  @override
  Widget build(BuildContext context) {
    final tugash = DateTime.parse(k['tugash']);
    final qoldi = tugash.difference(DateTime.now()).inDays;
    return Card(
      child: ListTile(
        leading: Container(width: 6, height: 40,
            decoration: BoxDecoration(color: TB.kip(qoldi), borderRadius: BorderRadius.circular(3))),
        title: Text('KIP — ${k['liniya']}', style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text('${k['muddat_oy']} oy · tugash: ${DateFormat('dd.MM.yyyy').format(tugash)}'),
        trailing: Text(
          qoldi < 0 ? 'oʻtdi' : qoldi == 0 ? 'bugun' : '$qoldi kun',
          style: TextStyle(color: TB.kip(qoldi), fontWeight: FontWeight.w700, fontSize: 12.5),
        ),
      ),
    );
  }
}

class _Xato extends StatelessWidget {
  final String xabar;
  final VoidCallback qayta;
  const _Xato({required this.xabar, required this.qayta});
  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.cloud_off, size: 44, color: Colors.black26),
            const SizedBox(height: 12),
            Text(xabar, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13)),
            const SizedBox(height: 16),
            OutlinedButton.icon(
                onPressed: qayta, icon: const Icon(Icons.refresh), label: const Text('Qayta urinish')),
          ]),
        ),
      );
}
