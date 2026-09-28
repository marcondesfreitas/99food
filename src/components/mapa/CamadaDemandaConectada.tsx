/**
 * Ponte entre `useDemandaStore` e a camada de demanda pura (`CamadaHexagonos`
 * / `CamadaPills`, B07).
 *
 * Existe só por causa de `demandaStore.tickDemanda()`: a cada 2400ms ele
 * substitui `zonas` por um array novo (com objetos novos para toda zona,
 * mesmo as que mal mudaram — ver `demandaStore.ts`). Quem lê `zonas` direto
 * re-renderiza nesse ritmo. Antes desta ponte, quem lia era `MapaBase`
 * inteiro (500+ linhas — pan/zoom, gestos, marcador, rota): cada tick
 * reconciliava a tela de mapa inteira para atualizar só a cor de alguns
 * hexágonos, mesmo com o app parado, sem nenhuma corrida rolando.
 *
 * Isoladas aqui, o tick re-renderiza só isto. `CamadaHexagonos`/`CamadaPills`
 * continuam puramente apresentacionais (não sabem que a store existe) — é
 * essa separação que B07 documenta como critério de aceite, e este arquivo
 * não a quebra: só decide QUEM se inscreve na store.
 */

import { memo } from 'react';

import {
  CamadaHexagonos,
  CamadaPills,
  type CamadaHexagonosProps,
  type CamadaPillsProps,
} from '@/components/demanda/CamadaDemanda';
import { useDemandaStore } from '@/state/demandaStore';

type PropsHexagonos = Omit<CamadaHexagonosProps, 'zonas'>;

export const CamadaHexagonosConectada = memo(function CamadaHexagonosConectada(
  props: PropsHexagonos
) {
  const zonas = useDemandaStore((s) => s.zonas);
  return <CamadaHexagonos zonas={zonas} {...props} />;
});

type PropsPills = Omit<CamadaPillsProps, 'zonas'>;

export const CamadaPillsConectada = memo(function CamadaPillsConectada(
  props: PropsPills
) {
  const zonas = useDemandaStore((s) => s.zonas);
  return <CamadaPills zonas={zonas} {...props} />;
});
