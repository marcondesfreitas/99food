/**
 * Rota `/` — o portão: decide entre a tela de ativação e o mapa.
 *
 * A splash **não** é uma rota (B25): virou a camada de cobertura
 * `src/components/splash/CoberturaSplash.tsx`, renderizada por cima do destino
 * — hoje tanto do mapa (`app/(motorista)/mapa.tsx`) quanto da ativação
 * (`app/ativacao.tsx`). É assim que ela funciona no protótipo: um `<div>` de
 * `z-index: 8` que faz fade-out e revela a tela já montada por baixo
 * (`.design-import/RotaFacil Motorista v6.dc.html` linhas 1082-1092).
 *
 * ## Por que existe um estado de espera aqui
 *
 * Saber se o app está ativado exige ler o AsyncStorage, que é assíncrono — não
 * dá para decidir na primeira renderização, como o `<Redirect>` anterior fazia.
 * Enquanto a leitura não volta, esta rota pinta um retângulo da cor de base da
 * splash: são poucos quadros, e nessa cor eles se leem como o primeiro instante
 * da splash em vez de uma piscada branca. É a mesma escolha do portão de fontes
 * em `app/_layout.tsx`.
 *
 * O `<Redirect>` (e não `router.replace` num efeito) continua valendo depois da
 * decisão: acontece na renderização, então não chega a existir um quadro desta
 * rota no ar.
 */

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';

import { appEstaAtivado } from '@/servicos/ativacao';
import { ROTAS } from '@/servicos/navegacao';
import { cores } from '@/tema/cores';

export default function Raiz() {
  const [ativado, setAtivado] = useState<boolean | null>(null);

  useEffect(() => {
    let vivo = true;
    void appEstaAtivado().then((resultado) => {
      // A rota pode ter saído de cena antes da leitura voltar (abrir por deep
      // link, por exemplo). Sem esta guarda, o `setState` cairia num
      // componente desmontado.
      if (vivo) setAtivado(resultado);
    });
    return () => {
      vivo = false;
    };
  }, []);

  if (ativado === null) {
    return <View style={{ flex: 1, backgroundColor: cores.amareloSplash }} />;
  }

  return <Redirect href={ativado ? ROTAS.mapa : ROTAS.ativacao} />;
}
