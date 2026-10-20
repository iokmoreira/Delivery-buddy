import React from 'react';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useEstafetas } from '../context/EstafetasContext';

export const OperationalStatusBar: React.FC = () => {
  const {
    userOrderAvailabilityStatus,
    setUserOrderAvailabilityStatus,
    shareOrderStatusPublicly,
    toggleShareOrderStatusPublicly,
    userPrefs,
    completeActiveDeliveryStage,
  } = useEstafetas();

  const isAvailable = userOrderAvailabilityStatus === 'DISPONIVEL';
  const isInTransit = userOrderAvailabilityStatus === 'OCUPADO_EM_ENTREGA';

  return (
    <section
      aria-label="Estado Operacional de Pedido"
      className="border border-zinc-800/80 rounded-xl bg-zinc-900/90 p-2.5 space-y-2"
    >
      {/* 2-Button Status Selector: Disponível (Livre) <-> Ocupado (Com Pedido / Em Entrega) */}
      <div className="bg-zinc-950 p-1 rounded-lg grid grid-cols-2 gap-1 border border-zinc-800/80">
        <button
          type="button"
          onClick={() => setUserOrderAvailabilityStatus('DISPONIVEL')}
          className={`rounded-md py-1.5 px-2 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
            isAvailable
              ? 'bg-white text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate">Disponível (Livre)</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setUserOrderAvailabilityStatus(
              isInTransit ? 'OCUPADO_EM_ENTREGA' : 'OCUPADO_COM_PEDIDO'
            )
          }
          className={`rounded-md py-1.5 px-2 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
            !isAvailable
              ? 'bg-white text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
          <span className="truncate">
            {isInTransit ? 'Ocupado (Em Entrega)' : 'Ocupado (Com Pedido)'}
          </span>
        </button>
      </div>

      {/* Bottom Row: Privacy Sub-Toggle ("Partilhar Estado de Pedido (ON/OFF)") + 1-Tap "Finalizar Entrega" */}
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <button
          type="button"
          onClick={toggleShareOrderStatusPublicly}
          className="flex items-center gap-1.5 text-zinc-300 hover:text-zinc-100 cursor-pointer transition min-w-0"
        >
          {userPrefs.anonymousMode ? (
            <>
              <EyeOff className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <span className="truncate text-zinc-400">
                Modo Anónimo: Invisível
              </span>
            </>
          ) : shareOrderStatusPublicly ? (
            <>
              <Eye className="h-3.5 w-3.5 text-zinc-200 shrink-0" />
              <span className="truncate">
                Partilhar Estado de Pedido: <strong className="text-white">ON</strong>
              </span>
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span className="truncate text-zinc-400">
                Partilhar Estado de Pedido: <strong>OFF</strong>
              </span>
            </>
          )}
        </button>

        {!isAvailable ? (
          <button
            type="button"
            onClick={completeActiveDeliveryStage}
            className="rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2.5 py-1 text-[10px] font-semibold text-zinc-100 flex items-center gap-1 shrink-0 cursor-pointer transition"
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span>Finalizar Entrega</span>
          </button>
        ) : (
          <span className="text-[10px] text-zinc-500 shrink-0">
            Sync Auto
          </span>
        )}
      </div>
    </section>
  );
};
