import React, { useState } from 'react';
import {
  ArrowLeft,
  Mic,
  Copy,
  Check,
  Volume2,
  Crosshair,
  RotateCcw,
  Sliders,
  MessageSquarePlus,
  Pencil,
  Trash2,
  BellRing,
} from 'lucide-react';
import { useEstafetas } from '../context/EstafetasContext';
import {
  AlertPopupDurationMode,
  AlertPopupPosition,
  AlertPopupSizeVh,
  AutoMessageCategory,
  CustomAutoMessage,
  TouchMacroActionKey,
} from '../types/models';

const BUDDY_VOICE_COMMANDS: { label: string; phrase: string }[] = [
  {
    label: 'Quantos estafetas online?',
    phrase: 'Buddy, quantos estafetas tem online agora?',
  },
  {
    label: 'Quanto tá pagando / km?',
    phrase: 'Buddy, quanto tá pagando por quilómetro?',
  },
  {
    label: 'Projeção para hoje',
    phrase: 'Buddy, qual a projeção para hoje?',
  },
  {
    label: 'Ensinar caminho (Skill IA)',
    phrase: 'Buddy, ensinar caminho',
  },
  { label: 'O trânsito agora', phrase: 'Buddy como está o trânsito agora' },
  { label: 'As entregas na localização', phrase: 'As entregas na localização' },
  { label: 'Minhas estatísticas atuais', phrase: 'Minhas estatísticas atuais' },
  { label: 'O clima na localização', phrase: 'O clima para a localização' },
  { label: 'Estatísticas entrega atual', phrase: 'Estatísticas entrega atual' },
  { label: 'Estatísticas última entrega', phrase: 'Estatísticas última entrega' },
  { label: 'Cancelar alerta (Corta som)', phrase: 'Cancelar alerta' },
  { label: 'Estender perfil (80% ecrã)', phrase: 'Estender' },
  { label: 'Retrair perfil (45% ecrã)', phrase: 'Retrair' },
  { label: 'Minimizar (Modo Invisível)', phrase: 'Buddy minimizar' },
  { label: 'Maximizar (Restaurar Tela)', phrase: 'Buddy maximizar' },
  { label: 'Enviar mensagem p/ Carlos', phrase: 'Enviar mensagem para Carlos' },
  { label: 'Abrir Acordos de Zona', phrase: 'Abrir acordos de zona' },
  { label: 'Abrir Arquivo de Provas', phrase: 'Abrir arquivo de provas' },
];

const PLATFORM_VOICE_COMMANDS: { label: string; phrase: string }[] = [
  { label: 'Aceitar pedido', phrase: 'Aceitar pedido' },
  { label: 'Recusar pedido', phrase: 'Recusar pedido' },
  { label: 'Dividir pedido', phrase: 'Dividir pedido' },
  { label: 'Iniciar entrega', phrase: 'Iniciar entrega' },
  { label: 'Finalizar entrega', phrase: 'Finalizar entrega' },
  { label: 'Mapa: Aproximar zoom (+)', phrase: 'Mapa: aproximar zoom' },
  { label: 'Mapa: Afastar zoom (-)', phrase: 'Mapa: afastar zoom' },
  { label: 'Mapa: Recentralizar rota', phrase: 'Mapa: recentralizar rota' },
  { label: 'Mapa: Marcar perigo', phrase: 'Mapa: marcar perigo no mapa' },
  { label: 'Mapa: Rota alternativa', phrase: 'Mapa: rota alternativa' },
  {
    label: 'Acessar suporte Glovo',
    phrase: 'Acessar suporte Glovo sobrepeso',
  },
  {
    label: 'Reportar problema Buddy',
    phrase: 'Reportar problema para Buddy',
  },
];

export const TriggerWordGuideCard: React.FC<{
  showCustomCommandInput?: boolean;
}> = ({ showCustomCommandInput = false }) => {
  const {
    voiceActivationConfig,
    updateVoiceActivationConfig,
    isListeningSpeechRecognition,
    startLiveVoiceCommandSession,
    executeVoiceCommandPt,
  } = useEstafetas();

  const [manualText, setManualText] = useState<string>('');
  const triggerWord =
    voiceActivationConfig.customTriggerWord?.trim() || 'Buddy';

  const cheatSheetPairs: { left: string; right?: string }[] = [
    {
      left: `${triggerWord}, aceitar pedido`,
      right: `${triggerWord}, recusar pedido`,
    },
    {
      left: `${triggerWord}, minimizar`,
      right: `${triggerWord}, maximizar`,
    },
    {
      left: `${triggerWord}, quantos estafetas tem online agora?`,
      right: `${triggerWord}, quanto tá pagando por quilómetro?`,
    },
    {
      left: `${triggerWord}, qual a projeção para hoje?`,
      right: `${triggerWord}, ensinar caminho`,
    },
    {
      left: `${triggerWord}, iniciar entrega`,
      right: `${triggerWord}, finalizar entrega`,
    },
    {
      left: `${triggerWord}, dividir pedido`,
    },
    {
      left: `${triggerWord}, como está o trânsito`,
      right: `${triggerWord}, clima agora`,
    },
    {
      left: `${triggerWord}, minhas estatísticas`,
      right: `${triggerWord}, abrir mapa`,
    },
    {
      left: `${triggerWord}, ativar SOS`,
      right: 'Cancelar alerta',
    },
  ];

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    executeVoiceCommandPt(manualText.trim());
    setManualText('');
  };

  return (
    <section
      aria-label="Guia da Palavra de Ativação (Trigger Word)"
      className="relative z-10 rounded-2xl bg-zinc-900 border border-zinc-800/80 p-3.5 space-y-3 shadow-sm"
    >
      {/* Header: Palavra de Ativação (Trigger Word): "Buddy" + Escuta Ativa (Microfone) Toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
              voiceActivationConfig.triggerWordEnabled
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-zinc-950 text-zinc-300 border border-zinc-800'
            }`}
          >
            <Mic className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-extrabold text-zinc-100 leading-snug">
              Palavra de Ativação (Trigger Word): &ldquo;{triggerWord}&rdquo;
            </h3>
            <span className="text-[10px] text-zinc-400 block">
              Diga &ldquo;{triggerWord}...&rdquo; seguido do comando ou toque
              num comando abaixo
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            updateVoiceActivationConfig({
              triggerWordEnabled: !voiceActivationConfig.triggerWordEnabled,
            })
          }
          className={`rounded-xl px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0 border ${
            voiceActivationConfig.triggerWordEnabled
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-xs'
              : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
          }`}
          title="Alternar Escuta Ativa (Microfone) por Trigger Word"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              voiceActivationConfig.triggerWordEnabled
                ? 'bg-slate-950 animate-pulse'
                : 'bg-zinc-500'
            }`}
          />
          <span>
            Escuta Ativa (Microfone):{' '}
            {voiceActivationConfig.triggerWordEnabled ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Inline Input to Change Trigger Word + Instant Mic Test */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[11px] font-semibold text-zinc-300 whitespace-nowrap">
            Mudar palavra:
          </span>
          <input
            type="text"
            value={voiceActivationConfig.customTriggerWord}
            onChange={(e) =>
              updateVoiceActivationConfig({
                customTriggerWord: e.target.value,
              })
            }
            placeholder="Buddy"
            aria-label="Palavra de Ativação (Trigger Word)"
            className="flex-1 min-w-0 rounded-xl bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-100 focus:outline-none"
          />
        </label>

        <button
          type="button"
          onClick={() =>
            startLiveVoiceCommandSession(
              `${triggerWord}, como está o trânsito`,
              'TRIGGER_WORD'
            )
          }
          className={`rounded-xl px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition ${
            isListeningSpeechRecognition
              ? 'bg-emerald-500 text-slate-950 animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          <Mic className="h-3.5 w-3.5" />
          <span>Falar Agora</span>
        </button>
      </div>

      {showCustomCommandInput && (
        <form onSubmit={handleManualSubmit} className="flex gap-1.5">
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder={`Ex: "${triggerWord}, aceitar pedido" ou "Cancelar alerta"...`}
            className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-white text-zinc-950 px-3 py-1.5 text-xs font-bold cursor-pointer shrink-0"
          >
            Testar
          </button>
        </form>
      )}

      {/* Clean Cheat-Sheet of Exact Voice Commands Starting with "Buddy" */}
      <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
            Guia Rápido de Comandos de Voz (&ldquo;{triggerWord}&rdquo;):
          </span>
          <span className="text-[10px] text-zinc-500">
            Toque ou fale
          </span>
        </div>

        <div className="space-y-1">
          {cheatSheetPairs.map((pair, idx) => (
            <div
              key={idx}
              className={`grid ${
                pair.right ? 'grid-cols-2' : 'grid-cols-1'
              } gap-1.5`}
            >
              <button
                type="button"
                onClick={() =>
                  startLiveVoiceCommandSession(pair.left, 'TRIGGER_WORD')
                }
                className="rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/90 px-2 py-1.5 text-left text-[11px] font-semibold text-zinc-200 leading-snug cursor-pointer transition"
              >
                &ldquo;{pair.left}&rdquo;
              </button>
              {pair.right && (
                <button
                  type="button"
                  onClick={() =>
                    startLiveVoiceCommandSession(pair.right!, 'TRIGGER_WORD')
                  }
                  className="rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/90 px-2 py-1.5 text-left text-[11px] font-semibold text-zinc-200 leading-snug cursor-pointer transition"
                >
                  &ldquo;{pair.right}&rdquo;
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const AlertVoiceMessagesCustomizationPanel: React.FC = () => {
  const {
    alertPopupPrefs,
    updateAlertPopupPrefs,
    voiceActivationConfig,
    updateVoiceActivationConfig,
    isPttActive,
    startPttHold,
    releasePttHold,
    customAutoMessages,
    addCustomAutoMessage,
    updateCustomAutoMessage,
    deleteCustomAutoMessage,
    executeVoiceCommandPt,
    speakTextPt,
    startLiveVoiceDictation,
    onlineDirectoryCouriers,
  } = useEstafetas();

  const [activeConfigSection, setActiveConfigSection] = useState<
    'ALERTAS_45' | 'VOZ_TRIGGER' | 'MENSAGENS_AUTO'
  >('VOZ_TRIGGER');

  const [msgCategoryTab, setMsgCategoryTab] =
    useState<AutoMessageCategory>('CLIENTE');
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editTemplate, setEditTemplate] = useState<string>('');
  const [editVoiceShortcut, setEditVoiceShortcut] = useState<string>('');

  const [isAddingNewMsg, setIsAddingNewMsg] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newTemplate, setNewTemplate] = useState<string>('');
  const [newVoiceShortcut, setNewVoiceShortcut] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredMessages = customAutoMessages.filter(
    (m) => m.category === msgCategoryTab
  );

  const handleStartEdit = (msg: CustomAutoMessage) => {
    setEditingMsgId(msg.id);
    setEditTitle(msg.title);
    setEditTemplate(msg.messageBody);
    setEditVoiceShortcut(msg.voiceTriggerPhrase);
    setIsAddingNewMsg(false);
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim() || !editTemplate.trim()) return;
    updateCustomAutoMessage(id, {
      title: editTitle.trim(),
      messageBody: editTemplate.trim(),
      voiceTriggerPhrase: editVoiceShortcut.trim() || editTitle.trim(),
    });
    setEditingMsgId(null);
  };

  const handleCreateMessage = () => {
    if (!newTitle.trim() || !newTemplate.trim()) return;
    addCustomAutoMessage({
      category: msgCategoryTab,
      title: newTitle.trim(),
      messageBody: newTemplate.trim(),
      voiceTriggerPhrase: newVoiceShortcut.trim() || newTitle.trim(),
    });
    setNewTitle('');
    setNewTemplate('');
    setNewVoiceShortcut('');
    setIsAddingNewMsg(false);
  };

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard errors
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section
      aria-label="Painel de Personalização de Alertas, Voz e Mensagens"
      className="rounded-2xl bg-zinc-900 border border-zinc-800/80 p-3.5 space-y-3 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sliders className="h-4 w-4 text-zinc-300 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-zinc-100 truncate">
              Personalizar Alertas (±45%), Voz &amp; Mensagens
            </h2>
            <p className="text-[10px] text-zinc-400 truncate">
              Tamanho/Posição do Pop-up, Trigger Word (&ldquo;
              {voiceActivationConfig.customTriggerWord || 'Buddy'}&rdquo;) e
              Textos Rápidos
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            executeVoiceCommandPt(
              `${voiceActivationConfig.customTriggerWord || 'Buddy'} como está o trânsito agora`
            )
          }
          className="rounded-lg bg-white text-zinc-950 px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
        >
          <BellRing className="h-3 w-3" />
          <span>Testar Pop-up {alertPopupPrefs.sizeVh.replace('VH', '%')}</span>
        </button>
      </div>

      {/* 3 Sub-Tabs Inside Customization Panel */}
      <div className="bg-zinc-950 p-1 rounded-xl grid grid-cols-3 gap-1 border border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveConfigSection('VOZ_TRIGGER')}
          className={`rounded-lg py-1.5 px-2 text-[11px] font-semibold transition cursor-pointer truncate ${
            activeConfigSection === 'VOZ_TRIGGER'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          1. Voz &amp; Trigger
        </button>
        <button
          type="button"
          onClick={() => setActiveConfigSection('ALERTAS_45')}
          className={`rounded-lg py-1.5 px-2 text-[11px] font-semibold transition cursor-pointer truncate ${
            activeConfigSection === 'ALERTAS_45'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          2. Alertas ({alertPopupPrefs.sizeVh.replace('VH', '%')})
        </button>
        <button
          type="button"
          onClick={() => setActiveConfigSection('MENSAGENS_AUTO')}
          className={`rounded-lg py-1.5 px-2 text-[11px] font-semibold transition cursor-pointer truncate ${
            activeConfigSection === 'MENSAGENS_AUTO'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          3. Mensagens ({customAutoMessages.length})
        </button>
      </div>

      {/* TAB 1: CUSTOMIZABLE ALERT PREFERENCES (SIZE, POSITION, DURATION) */}
      {activeConfigSection === 'ALERTAS_45' && (
        <div className="space-y-2.5 pt-0.5">
          {/* Position on Screen */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-zinc-300 block">
              Posição na Tela:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'BOTTOM', label: 'Inferior (Padrão)' },
                  { id: 'CENTER', label: 'Centro' },
                  { id: 'TOP', label: 'Topo' },
                ] as { id: AlertPopupPosition; label: string }[]
              ).map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => updateAlertPopupPrefs({ position: pos.id })}
                  className={`rounded-lg py-1.5 px-2 text-[11px] font-semibold border transition cursor-pointer ${
                    alertPopupPrefs.position === pos.id
                      ? 'bg-white text-zinc-950 border-white'
                      : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Popup Height Size (35% / 45% / 55%) */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-zinc-300 block">
              Tamanho do Pop-up (% da Altura do Ecrã):
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { size: '35VH', label: 'Compacto (35%)' },
                  { size: '45VH', label: 'Padrão (45%)' },
                  { size: '55VH', label: 'Grande (55%)' },
                ] as { size: AlertPopupSizeVh; label: string }[]
              ).map((item) => (
                <button
                  key={item.size}
                  type="button"
                  onClick={() => updateAlertPopupPrefs({ sizeVh: item.size })}
                  className={`rounded-lg py-1.5 px-2 text-[11px] font-semibold border transition cursor-pointer ${
                    alertPopupPrefs.sizeVh === item.size
                      ? 'bg-white text-zinc-950 border-white'
                      : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Display Duration after Audio Finishes */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-zinc-300 block">
              Tempo de Exibição (Auto-Fechar após fim da voz pt-BR):
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { mode: '3S', label: '3 Seg' },
                  { mode: '5S', label: '5 Seg' },
                  { mode: '10S', label: '10 Seg' },
                  { mode: 'MANUAL', label: 'Manual' },
                ] as { mode: AlertPopupDurationMode; label: string }[]
              ).map((dur) => (
                <button
                  key={dur.mode}
                  type="button"
                  onClick={() =>
                    updateAlertPopupPrefs({ durationMode: dur.mode })
                  }
                  className={`rounded-lg py-1.5 px-1.5 text-[11px] font-semibold border transition cursor-pointer ${
                    alertPopupPrefs.durationMode === dur.mode
                      ? 'bg-white text-zinc-950 border-white'
                      : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-[11px] text-zinc-400 flex items-center justify-between gap-2">
            <span>
              Toque fora do pop-up (nos restantes 55% do ecrã) ou diga{' '}
              <strong className="text-zinc-200">&ldquo;Cancelar alerta&rdquo;</strong>{' '}
              para fechar e cortar o som na hora.
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: DUAL VOICE ACTIVATION (TRIGGER WORD GUIDE CARD + PUSH-TO-TALK) */}
      {activeConfigSection === 'VOZ_TRIGGER' && (
        <div className="space-y-2.5 pt-0.5">
          {/* Trigger Word Status & Command Helper Card */}
          <TriggerWordGuideCard />

          {/* Push-to-Talk (PTT) Option */}
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-zinc-200 block">
                Botão Flutuante Push-to-Talk (PTT)
              </span>
              <span className="text-[10px] text-zinc-400 block">
                Visível e arrastável na tela quando a Trigger Word está OFF.
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onMouseDown={startPttHold}
                onMouseUp={() => releasePttHold()}
                onTouchStart={startPttHold}
                onTouchEnd={() => releasePttHold()}
                className={`rounded-lg py-1.5 px-2.5 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                  isPttActive
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                }`}
              >
                <Mic className="h-3 w-3" />
                <span>{isPttActive ? 'Ouvindo...' : 'Testar PTT'}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  updateVoiceActivationConfig({
                    pushToTalkEnabled: !voiceActivationConfig.pushToTalkEnabled,
                  })
                }
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold cursor-pointer ${
                  voiceActivationConfig.pushToTalkEnabled
                    ? 'bg-white text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {voiceActivationConfig.pushToTalkEnabled ? 'ATIVO' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EDITABLE AUTO-MESSAGES (CLIENTES, SUPORTE, OUTROS ESTAFETAS) */}
      {activeConfigSection === 'MENSAGENS_AUTO' && (
        <div className="space-y-2.5 pt-0.5">
          {/* Category Filter (Clientes | Suporte | Outros Estafetas) */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="grid grid-cols-3 gap-1 flex-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              {(
                [
                  { cat: 'CLIENTE', label: 'Clientes' },
                  { cat: 'SUPORTE', label: 'Suporte' },
                  { cat: 'ESTAFETA_BUDDY', label: 'Estafetas' },
                ] as { cat: AutoMessageCategory; label: string }[]
              ).map((item) => (
                <button
                  key={item.cat}
                  type="button"
                  onClick={() => {
                    setMsgCategoryTab(item.cat);
                    setEditingMsgId(null);
                    setIsAddingNewMsg(false);
                  }}
                  className={`rounded-md py-1 px-2 text-[11px] font-semibold transition cursor-pointer ${
                    msgCategoryTab === item.cat
                      ? 'bg-white text-zinc-950'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsAddingNewMsg((prev) => !prev);
                setEditingMsgId(null);
              }}
              className="rounded-lg bg-white text-zinc-950 px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              <span>+ Nova</span>
            </button>
          </div>

          {/* Add New Message Form */}
          {isAddingNewMsg && (
            <div className="rounded-xl bg-zinc-950 border border-zinc-700 p-2.5 space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Título (ex: Cheguei na Portaria)"
                  className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100"
                />
                <input
                  type="text"
                  value={newVoiceShortcut}
                  onChange={(e) => setNewVoiceShortcut(e.target.value)}
                  placeholder="Comando de voz (ex: Avisar chegada)"
                  className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100"
                />
              </div>
              <textarea
                rows={2}
                value={newTemplate}
                onChange={(e) => setNewTemplate(e.target.value)}
                placeholder="Texto da mensagem automática..."
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingNewMsg(false)}
                  className="rounded-lg bg-zinc-800 text-zinc-300 px-2.5 py-1 text-[11px] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateMessage}
                  className="rounded-lg bg-white text-zinc-950 px-3 py-1 text-[11px] font-bold cursor-pointer"
                >
                  Guardar Mensagem
                </button>
              </div>
            </div>
          )}

          {/* List of Messages in Current Category */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
            {filteredMessages.map((msg) => {
              const isEditing = editingMsgId === msg.id;
              const isCopied = copiedId === msg.id;

              if (isEditing) {
                return (
                  <div
                    key={msg.id}
                    className="rounded-xl bg-zinc-950 border border-zinc-600 p-2.5 space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-100"
                      />
                      <input
                        type="text"
                        value={editVoiceShortcut}
                        onChange={(e) => setEditVoiceShortcut(e.target.value)}
                        className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-100"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={editTemplate}
                      onChange={(e) => setEditTemplate(e.target.value)}
                      className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-100"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingMsgId(null)}
                        className="rounded-lg bg-zinc-800 text-zinc-300 px-2.5 py-1 text-[10px] font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(msg.id)}
                        className="rounded-lg bg-white text-zinc-950 px-2.5 py-1 text-[10px] font-bold cursor-pointer"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-zinc-100 truncate">
                      {msg.title}
                    </span>
                    <span className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400 shrink-0">
                      Voz: &ldquo;{msg.voiceTriggerPhrase}&rdquo;
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug">
                    {msg.messageBody}
                  </p>
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(msg)}
                        className="rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2 py-1 text-[10px] text-zinc-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="h-3 w-3" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCustomAutoMessage(msg.id)}
                        className="rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-1 text-zinc-400 hover:text-rose-400 cursor-pointer"
                        title="Apagar mensagem"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          startLiveVoiceDictation({
                            targetType:
                              msg.category === 'CLIENTE'
                                ? 'CLIENTE'
                                : msg.category === 'SUPORTE'
                                  ? 'SUPORTE'
                                  : 'BUDDY_DIRETO',
                            recipientId:
                              msg.category === 'ESTAFETA_BUDDY'
                                ? onlineDirectoryCouriers[0]?.id || 'DIR-AMA-1'
                                : msg.id,
                            recipientName:
                              msg.category === 'CLIENTE'
                                ? 'Cliente da Entrega'
                                : msg.category === 'SUPORTE'
                                  ? 'Suporte da Plataforma'
                                  : onlineDirectoryCouriers[0]?.callsign ||
                                    'Rui Moto',
                            initialPhrase: msg.messageBody,
                          })
                        }
                        className="rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Mic className="h-3 w-3" />
                        <span>Ditar ao Vivo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => speakTextPt(msg.messageBody)}
                        className="rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2 py-1 text-[10px] text-zinc-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="h-3 w-3" />
                        <span>Ouvir</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyMessage(msg.id, msg.messageBody)
                        }
                        className="rounded-md bg-white text-zinc-950 px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export const VoiceCopilotAndSupportMacrosModule: React.FC = () => {
  const {
    setActiveTab,
    executeVoiceCommandPt,
    lastVoiceCommandResult,
    isListeningSpeechRecognition,
    startSpeechRecognitionPt,
    resolvedPtBrVoiceName,
    activeSupportSplitMacro,
    triggerSupportSplitOrderMacro,
    touchCoordinatesMap,
    updateTouchCoordinatePoint,
    resetTouchCoordinatesToDefault,
    totalAuditedWeightKg,
    activeScannedOffer,
    activePlatforms,
  } = useEstafetas();

  const [subTab, setSubTab] = useState<'VOZ' | 'MAPEAMENTO_TOQUES'>('VOZ');
  const [commandCategoryTab, setCommandCategoryTab] = useState<
    'COMANDOS_BUDDY' | 'COMANDOS_PLATAFORMAS'
  >('COMANDOS_BUDDY');
  const [customPhrase, setCustomPhrase] = useState<string>('');
  const [mapperPlatform, setMapperPlatform] = useState<'Glovo' | 'Uber Eats'>(
    activePlatforms.includes('Glovo') ? 'Glovo' : 'Uber Eats'
  );
  const [selectedActionKey, setSelectedActionKey] =
    useState<TouchMacroActionKey>('SUPORTE_DIVIDIR_PEDIDO');

  const activePlatformPoints = touchCoordinatesMap[mapperPlatform];
  const selectedPoint =
    activePlatformPoints.find((p) => p.actionKey === selectedActionKey) ||
    activePlatformPoints[0];

  const handleVirtualScreenClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.max(
      0,
      Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100))
    );
    const clickY = Math.max(
      0,
      Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 100))
    );
    updateTouchCoordinatePoint(mapperPlatform, selectedPoint.actionKey, {
      xPct: clickX,
      yPct: clickY,
    });
  };

  return (
    <div className="space-y-2.5">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('menu_mais')}
          className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Voltar a Ajustes</span>
        </button>
        <span className="text-[11px] font-semibold text-zinc-400 truncate">
          Voz Natural (pt-BR) • {resolvedPtBrVoiceName}
        </span>
      </div>

      {/* 2-Tab Switcher for Voice Command Tree & Coordinate Mapper */}
      <div className="bg-zinc-900 p-1 rounded-lg grid grid-cols-2 gap-1 border border-zinc-800/80">
        <button
          type="button"
          onClick={() => setSubTab('VOZ')}
          className={`rounded-md py-1.5 px-1 text-[11px] truncate transition cursor-pointer ${
            subTab === 'VOZ'
              ? 'bg-white text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          Árvore de Comandos de Voz
        </button>
        <button
          type="button"
          onClick={() => setSubTab('MAPEAMENTO_TOQUES')}
          className={`rounded-md py-1.5 px-1 text-[11px] truncate transition cursor-pointer ${
            subTab === 'MAPEAMENTO_TOQUES'
              ? 'bg-white text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          Calibrar Toques %X/%Y
        </button>
      </div>

      {/* VIEW 1: COMPLETE VOICE COMMAND TREE */}
      {subTab === 'VOZ' && (
        <div className="space-y-2.5">
          <TriggerWordGuideCard />

          <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-3">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customPhrase}
                onChange={(e) => setCustomPhrase(e.target.value)}
                placeholder='Diga ex: "O clima para a localização" ou "Cancelar alerta"...'
                className="flex-1 rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (customPhrase.trim()) {
                    executeVoiceCommandPt(customPhrase.trim());
                    setCustomPhrase('');
                  }
                }}
                className="rounded-lg bg-white text-zinc-950 px-3 py-2 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Executar</span>
              </button>
              <button
                type="button"
                onClick={() => startSpeechRecognitionPt()}
                title="Reconhecimento de Voz Web Speech API (pt-BR)"
                className={`rounded-lg px-2.5 py-2 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0 border transition ${
                  isListeningSpeechRecognition
                    ? 'bg-white text-zinc-950 border-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700'
                }`}
              >
                <Mic className="h-3.5 w-3.5" />
                <span>
                  {isListeningSpeechRecognition ? 'Ouvindo...' : 'pt-BR'}
                </span>
              </button>
            </div>

            <div className="bg-zinc-950 p-1 rounded-lg grid grid-cols-2 gap-1 border border-zinc-800/80">
              <button
                type="button"
                onClick={() => setCommandCategoryTab('COMANDOS_BUDDY')}
                className={`rounded-md py-1.5 px-2 text-[11px] font-semibold cursor-pointer transition ${
                  commandCategoryTab === 'COMANDOS_BUDDY'
                    ? 'bg-white text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Cat. A: Comandos Buddy
              </button>
              <button
                type="button"
                onClick={() => setCommandCategoryTab('COMANDOS_PLATAFORMAS')}
                className={`rounded-md py-1.5 px-2 text-[11px] font-semibold cursor-pointer transition truncate ${
                  commandCategoryTab === 'COMANDOS_PLATAFORMAS'
                    ? 'bg-white text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Cat. B: {activePlatforms.join(' / ')}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {(commandCategoryTab === 'COMANDOS_BUDDY'
                ? BUDDY_VOICE_COMMANDS
                : PLATFORM_VOICE_COMMANDS
              ).map((cmd) => (
                <button
                  key={cmd.label}
                  type="button"
                  onClick={() => executeVoiceCommandPt(cmd.phrase)}
                  className="rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800/80 p-2 text-left text-xs font-medium text-zinc-200 cursor-pointer transition truncate"
                >
                  &ldquo;{cmd.label}&rdquo;
                </button>
              ))}
            </div>

            {lastVoiceCommandResult && (
              <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 space-y-1 text-xs">
                <span className="text-[10px] text-zinc-400 block">
                  {lastVoiceCommandResult.commandMatched} •{' '}
                  {lastVoiceCommandResult.timestamp}
                </span>
                <p className="text-zinc-200">
                  {lastVoiceCommandResult.actionSummary}
                </p>
              </div>
            )}
          </section>

          {/* SUPPORT SPLIT-ORDER MACRO CARD */}
          <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-zinc-100 block truncate">
                  Macro Automática: &ldquo;Dividir Pedido&rdquo; no Suporte
                </span>
                <span className="text-[10px] text-zinc-400 block truncate">
                  Plataforma Ativa: {activeSupportSplitMacro.platform} • Pedido{' '}
                  {activeScannedOffer.orderId || activeSupportSplitMacro.orderId}{' '}
                  ({totalAuditedWeightKg.toFixed(1)} kg reais)
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {activePlatforms.includes('Glovo') && (
                  <button
                    type="button"
                    onClick={() => triggerSupportSplitOrderMacro('Glovo')}
                    className={`rounded px-2 py-1 text-[10px] font-semibold cursor-pointer transition ${
                      activeSupportSplitMacro.platform === 'Glovo'
                        ? 'bg-white text-zinc-950'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    Simular Glovo
                  </button>
                )}
                {activePlatforms.includes('Uber Eats') && (
                  <button
                    type="button"
                    onClick={() => triggerSupportSplitOrderMacro('Uber Eats')}
                    className={`rounded px-2 py-1 text-[10px] font-semibold cursor-pointer transition ${
                      activeSupportSplitMacro.platform === 'Uber Eats'
                        ? 'bg-white text-zinc-950'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    Simular Uber
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>
                  {activeSupportSplitMacro.isRunning
                    ? `Executando Passo ${
                        activeSupportSplitMacro.currentStepIndex + 1
                      } de 4...`
                    : 'Sequência Completa (4/4 Toques Simulados)'}
                </span>
                <span className=" text-zinc-200">
                  {((activeSupportSplitMacro.currentStepIndex + 1) * 25).toFixed(
                    0
                  )}
                  %
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-zinc-100 transition-all duration-300"
                  style={{
                    width: `${
                      (activeSupportSplitMacro.currentStepIndex + 1) * 25
                    }%`,
                  }}
                />
              </div>
            </div>
          </section>
        </div>
      )}

      {/* VIEW 2: SCREEN TOUCH COORDINATE MAPPER */}
      {subTab === 'MAPEAMENTO_TOQUES' && (
        <section className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                <Crosshair className="h-3.5 w-3.5 text-zinc-300" />
                <span>Calibrador de Toques ({activePlatforms.join(' + ')}) (%X, %Y)</span>
              </h3>
              <p className="text-[10px] text-zinc-400">
                Toque no ecrã virtual (100% x 100%) ou ajuste %X, %Y e atraso (ms)
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {activePlatforms.includes('Glovo') && (
                <button
                  type="button"
                  onClick={() => setMapperPlatform('Glovo')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer transition ${
                    mapperPlatform === 'Glovo'
                      ? 'bg-white text-zinc-950'
                      : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  Glovo
                </button>
              )}
              {activePlatforms.includes('Uber Eats') && (
                <button
                  type="button"
                  onClick={() => setMapperPlatform('Uber Eats')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer transition ${
                    mapperPlatform === 'Uber Eats'
                      ? 'bg-white text-zinc-950'
                      : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  Uber
                </button>
              )}
              <button
                type="button"
                onClick={resetTouchCoordinatesToDefault}
                title="Repor coordenadas padrão"
                className="rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 p-1.5 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div
            onClick={handleVirtualScreenClick}
            className="relative w-full h-44 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden cursor-crosshair select-none"
          >
            <div className="absolute inset-0 pointer-events-none opacity-25">
              <div className="absolute left-1/4 top-0 bottom-0 border-l border-dashed border-zinc-700" />
              <div className="absolute left-2/4 top-0 bottom-0 border-l border-dashed border-zinc-700" />
              <div className="absolute left-3/4 top-0 bottom-0 border-l border-dashed border-zinc-700" />
              <div className="absolute top-1/4 left-0 right-0 border-t border-dashed border-zinc-700" />
              <div className="absolute top-2/4 left-0 right-0 border-t border-dashed border-zinc-700" />
              <div className="absolute top-3/4 left-0 right-0 border-t border-dashed border-zinc-700" />
            </div>

            <div className="absolute top-1.5 left-2 text-[9px] text-zinc-500 pointer-events-none">
              ECRÃ VIRTUAL 100% x 100% ({mapperPlatform}) — Clique para posicionar{' '}
              &ldquo;{selectedPoint.label}&rdquo;
            </div>

            {activePlatformPoints.map((pt, index) => {
              const isSelected = pt.actionKey === selectedPoint.actionKey;
              return (
                <React.Fragment key={pt.id}>
                  {pt.gestureType === 'SWIPE' && pt.endXPct !== undefined && (
                    <div
                      className={`absolute h-0.5 pointer-events-none ${
                        isSelected ? 'bg-white' : 'bg-zinc-600'
                      }`}
                      style={{
                        left: `${Math.min(pt.xPct, pt.endXPct)}%`,
                        top: `${pt.yPct}%`,
                        width: `${Math.abs(pt.endXPct - pt.xPct)}%`,
                      }}
                    />
                  )}
                  <div
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setSelectedActionKey(pt.actionKey);
                    }}
                    style={{
                      left: `${pt.xPct}%`,
                      top: `${pt.yPct}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-1.5 py-0.5 text-[9px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                      isSelected
                        ? 'bg-white text-zinc-950 ring-2 ring-zinc-400 z-10'
                        : 'bg-zinc-800 text-zinc-200 border border-zinc-600 opacity-85'
                    }`}
                  >
                    <span>#{index + 1}</span>
                    <span>
                      {pt.xPct}%,{pt.yPct}%
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div className="space-y-1.5">
            {activePlatformPoints.map((pt, index) => {
              const isSelected = pt.actionKey === selectedPoint.actionKey;
              return (
                <div
                  key={pt.id}
                  onClick={() => setSelectedActionKey(pt.actionKey)}
                  className={`rounded-lg p-2 border transition cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-950 border-zinc-400'
                      : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold text-zinc-100 truncate">
                      {index + 1}. {pt.label}
                    </span>
                    <span className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-300 shrink-0">
                      {pt.gestureType}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <label className="flex items-center justify-between rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-[10px]">
                      <span className="text-zinc-400">X%:</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={pt.xPct}
                        onChange={(e) =>
                          updateTouchCoordinatePoint(
                            mapperPlatform,
                            pt.actionKey,
                            { xPct: Number(e.target.value) }
                          )
                        }
                        className="w-10 bg-transparent text-right font-semibold text-zinc-100 focus:outline-none"
                      />
                    </label>

                    <label className="flex items-center justify-between rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-[10px]">
                      <span className="text-zinc-400">Y%:</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={pt.yPct}
                        onChange={(e) =>
                          updateTouchCoordinatePoint(
                            mapperPlatform,
                            pt.actionKey,
                            { yPct: Number(e.target.value) }
                          )
                        }
                        className="w-10 bg-transparent text-right font-semibold text-zinc-100 focus:outline-none"
                      />
                    </label>

                    <label className="flex items-center justify-between rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-[10px]">
                      <span className="text-zinc-400">ms:</span>
                      <input
                        type="number"
                        min={50}
                        max={5000}
                        step={50}
                        value={pt.delayMs}
                        onChange={(e) =>
                          updateTouchCoordinatePoint(
                            mapperPlatform,
                            pt.actionKey,
                            { delayMs: Number(e.target.value) }
                          )
                        }
                        className="w-12 bg-transparent text-right font-semibold text-zinc-100 focus:outline-none"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
