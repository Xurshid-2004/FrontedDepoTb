import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/store.dart';
import 'core/theme.dart';
import 'screens/kirish.dart';
import 'screens/pin.dart';
import 'screens/kabinet.dart';
import 'screens/arizalar.dart';
import 'screens/yangi_ariza.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: TbApp()));
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (_, __) => const BoshlashEkrani()),
    GoRoute(path: '/kirish', builder: (_, __) => const KirishEkrani()),
    GoRoute(
      path: '/pin',
      builder: (_, s) => PinEkrani(ornatish: s.uri.queryParameters['ornat'] == '1'),
    ),
    GoRoute(path: '/kabinet', builder: (_, __) => const KabinetEkrani()),
    GoRoute(path: '/arizalar', builder: (_, __) => const ArizalarEkrani()),
    GoRoute(path: '/yangi-ariza', builder: (_, __) => const YangiArizaEkrani()),
  ],
);

class TbApp extends StatelessWidget {
  const TbApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp.router(
        title: 'TB — TCH-6',
        debugShowCheckedModeBanner: false,
        theme: TB.theme(),
        routerConfig: _router,
      );
}

/// Ilova ochilganda: PIN bormi → PIN soʻrash, yoʻq boʻlsa roʻyxatdan oʻtish
class BoshlashEkrani extends StatefulWidget {
  const BoshlashEkrani({super.key});
  @override
  State<BoshlashEkrani> createState() => _BoshlashEkraniState();
}

class _BoshlashEkraniState extends State<BoshlashEkrani> {
  @override
  void initState() {
    super.initState();
    _yol();
  }

  Future<void> _yol() async {
    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;
    final bor = await Kirish.pinBorMi();
    if (!mounted) return;
    context.go(bor ? '/pin' : '/kirish');
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: TB.osmon,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.train_rounded, size: 72, color: Colors.white),
              const SizedBox(height: 16),
              const Text('TB',
                  style: TextStyle(
                      fontSize: 40, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 4)),
              const SizedBox(height: 6),
              Text('Buxoro lokomotiv deposi · TCH-6',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 13)),
              const SizedBox(height: 32),
              const SizedBox(
                width: 26,
                height: 26,
                child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
              ),
            ],
          ),
        ),
      );
}
