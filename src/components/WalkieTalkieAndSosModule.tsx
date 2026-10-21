import React, { useState, useMemo } from 'react';
import {
  Radio,
  Mic,
  Send,
  Flag,
  Users,
  MessageSquare,
  Check,
  X,
  ArrowLeft,
  ThumbsUp,
  UserPlus,
  Maximize2,
  Minimize2,
  Trophy,
  PhoneCall,
  CircleDot,
  UserCheck,
  MapPin,
  RefreshCw,
  Share2,
  Globe,
  BarChart3,
  FileText,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { BuddyChallengePeriod, WalkieChannelId } from '../types/models';
import { WALKIE_QUICK_MACROS } from '../data/seedData';
import { useEstafetas } from '../context/EstafetasContext';
import { DirectApkShareModal } from './ShiftRadarModule';

export const WalkieTalkieAndSosModule: React.FC = () => {
  const {
    activeWalkieChannel,
    setActiveWalkieChannel,
    walkieMessages,
    mutedSenderIds,
    sendWalkieMessage,
    flagOrMuteWalkieMessage,
    onlineDirectoryCouriers,
    incomingContactRequest,
    requestCourierContactPermission,
    simulateCourierAcceptContactPermission,
    respondToIncomingContactRequest,
    activeDirectChatCourierId,
    setActiveDirectChatCourierId,
    sendDirectCourierMessage,
    socialBuddyPosts,
    addSocialBuddyPost,
    toggleLikeSocialBuddyPost,
    activeBuddyPopupCourierId,
    setActiveBuddyPopupCourierId,
    buddyPopupSizeMode,
    setBuddyPopupSizeMode,
    minimizeBuddyPopupToAvatarBubble,
    sendBuddyVoiceChatRequest,
    inviteBuddyToClosedGroup,
    createBuddyChallenge,
    personalGoals,
    communityReputationPct,
    themeMode,
    startLiveVoiceDictation,
    realCourierProfile,
    setIsCourierRegistrationModalOpen,
    refreshLiveGpsPosition,
    activePlatforms,
    openTranslatorModal,
  } = useEstafetas();

  // Strict Sub-Tab Order: [Chat] | [Walkie] | [Blog] (SOS moved to persistent floating bubble)
  const [subTab, setSubTab] = useState<'CHAT' | 'WALKIE' | 'BLOG'>('CHAT');
  const [directoryFilter, setDirectoryFilter] = useState<
    'TODOS' | 'DISPONIVEIS' | 'COM_PEDIDO'
  >('TODOS');
  const [messageInput, setMessageInput] = useState<string>('');
  const [directMessageInput, setDirectMessageInput] = useState<string>('');
  const [popupMessageInput, setPopupMessageInput] = useState<string>('');
  const [quickTeamMessageInput, setQuickTeamMessageInput] =
    useState<string>('');
  const [quickTeamNotice, setQuickTeamNotice] = useState<string | null>(null);
  const [blogPostInput, setBlogPostInput] = useState<string>('');
  const [blogCategoryInput, setBlogCategoryInput] = useState<
    'DICA_RUA' | 'ALERTA_TRANSITO' | 'COMUNIDADE'
  >('DICA_RUA');
  const [isRecordingPtt, setIsRecordingPtt] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [selectedChallengePeriod, setSelectedChallengePeriod] =
    useState<BuddyChallengePeriod>('PROXIMAS_3H');
  const [isDirectApkShareModalOpen, setIsDirectApkShareModalOpen] =
    useState<boolean>(false);

  const isDaylight = themeMode === 'DAYLIGHT';

  const channelMessages = walkieMessages
    .filter(
      (m) =>
        m.channel === activeWalkieChannel && !mutedSenderIds.includes(m.senderId)
    )
    .slice(-3);

  const counts = useMemo(() => {
    const total = onlineDirectoryCouriers.length;
    const available = onlineDirectoryCouriers.filter(
      (c) => c.isOnlineActive !== false && c.orderStatus === 'DISPONIVEL'
    ).length;
    const busy = onlineDirectoryCouriers.filter(
      (c) => c.isOnlineActive !== false && c.orderStatus !== 'DISPONIVEL'
    ).length;
    return { total, available, busy };
  }, [onlineDirectoryCouriers]);

  const filteredCouriers = useMemo(() => {
    if (directoryFilter === 'DISPONIVEIS') {
      return onlineDirectoryCouriers.filter(
        (c) => c.isOnlineActive !== false && c.orderStatus === 'DISPONIVEL'
      );
    }
    if (directoryFilter === 'COM_PEDIDO') {
      return onlineDirectoryCouriers.filter(
        (c) => c.isOnlineActive !== false && c.orderStatus !== 'DISPONIVEL'
      );
    }
    return onlineDirectoryCouriers;
  }, [onlineDirectoryCouriers, directoryFilter]);

  const activeDirectCourier = useMemo(
    () =>
      onlineDirectoryCouriers.find((c) => c.id === activeDirectChatCourierId) ||
      null,
    [onlineDirectoryCouriers, activeDirectChatCourierId]
  );

  const popupCourier = useMemo(
    () =>
      onlineDirectoryCouriers.find((c) => c.id === activeBuddyPopupCourierId) ||
      null,
    [onlineDirectoryCouriers, activeBuddyPopupCourierId]
  );

  const handleSendText = (textToSend: string, isVoice = false) => {
    const res = sendWalkieMessage(textToSend, {
      isVoicePtt: isVoice,
      voiceDurationSec: isVoice ? 4 : undefined,
    });
    if (!res.ok) {
      setStatusNotice(res.reason || 'Aguarde alguns segundos.');
    } else {
      setMessageInput('');
      setStatusNotice(isVoice ? 'Áudio PTT transmitido.' : 'Mensagem enviada.');
    }
  };

  const handleTogglePtt = () => {
    if (isRecordingPtt) {
      setIsRecordingPtt(false);
      handleSendText(
        activeWalkieChannel === 'PARCEIRO_PEDIDO_DIVIDIDO'
          ? 'Áudio PTT: "Estou a chegar ao ponto de recolha em Amarante para dividir os sacos."'
          : 'Áudio PTT: "Trânsito fluido na N15 e Ponte de São Gonçalo, sem retenções."',
        true
      );
    } else {
      setIsRecordingPtt(true);
      setStatusNotice('A gravar PTT... Toque novamente para transmitir.');
    }
  };

  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDirectCourier || !directMessageInput.trim()) return;
    sendDirectCourierMessage(activeDirectCourier.id, directMessageInput);
    setDirectMessageInput('');
  };

  const handleSendPopupDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!popupCourier || !popupMessageInput.trim()) return;
    sendDirectCourierMessage(popupCourier.id, popupMessageInput);
    setPopupMessageInput('');
  };

  const handleSendQuickTeamMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTeamMessageInput.trim();
    if (!trimmed) return;
    const peerTargets = onlineDirectoryCouriers.filter((c) => !c.isSelfProfile);
    if (peerTargets.length > 0) {
      peerTargets.forEach((peer) => {
        sendDirectCourierMessage(peer.id, trimmed);
      });
    }
    sendWalkieMessage(trimmed, { isVoicePtt: false });
    setQuickTeamMessageInput('');
    setQuickTeamNotice('Mensagem enviada para a equipa de Amarante.');
    window.setTimeout(() => setQuickTeamNotice(null), 3500);
  };

  const handlePublishSocialPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogPostInput.trim()) return;
    addSocialBuddyPost({
      category: blogCategoryInput,
      content: blogPostInput.trim(),
      zoneName: 'Amarante — Centro / São Gonçalo',
    });
    setBlogPostInput('');
  };

  // =========================================================================
  // INTERACTIVE BUDDY PROFILE POP-UP (45% <-> 80% EXPANDABLE + MINIMIZE TO BUBBLE)
  // =========================================================================
  const renderBuddyProfilePopup = () => {
    if (!popupCourier) return null;

    const isFriend = popupCourier.contactPermission === 'APROVADO';
    const isOffline = popupCourier.isOnlineActive === false;
    const isAvailable =
      !isOffline && popupCourier.orderStatus === 'DISPONIVEL';
    const isExpanded80 = buddyPopupSizeMode === '80VH';
    const heightClass = isExpanded80
      ? 'h-[80vh] min-h-[480px]'
      : 'h-[45vh] min-h-[320px]';

    const userDeliveriesToday = personalGoals.completedDeliveriesToday || 11;
    const buddyDeliveriesToday = popupCourier.crossStats?.deliveriesToday ?? 14;
    const buddyAvgEurPerKm = popupCourier.crossStats?.avgEurPerKm ?? 1.58;

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Perfil do Buddy ${popupCourier.callsign}`}
        onClick={() => setActiveBuddyPopupCourierId(null)}
        className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 cursor-pointer"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-[420px] ${heightClass} rounded-3xl border border-zinc-700/80 p-4 shadow-2xl flex flex-col justify-between overflow-y-auto cursor-default transition-all duration-300 ${
            isDaylight
              ? 'bg-white text-slate-900'
              : 'bg-zinc-900 text-zinc-100'
          }`}
        >
          {/* Top Bar: Window Controls Row + Full-Width Avatar & Identity Row */}
          <div className="space-y-3">
            <div className="space-y-2.5 border-b border-zinc-800/40 pb-3">
              {/* Row 1: Dedicated Top Bar with Window Controls (Never overlaps courier name) */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00E5FF]">
                  Perfil &amp; Estatísticas do Buddy
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setBuddyPopupSizeMode(isExpanded80 ? '45VH' : '80VH')
                    }
                    title={
                      isExpanded80
                        ? 'Retrair para 45% da tela (ou diga "Retrair")'
                        : 'Estender para 80% da tela (ou diga "Estender" / "Maximizar")'
                    }
                    className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    {isExpanded80 ? (
                      <>
                        <Minimize2 className="h-3 w-3" />
                        <span>Retrair 45%</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="h-3 w-3" />
                        <span>Estender 80%</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      minimizeBuddyPopupToAvatarBubble(popupCourier.id)
                    }
                    title="Minimizar em Bolinha Flutuante com Foto do Perfil"
                    className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    <CircleDot className="h-3 w-3 text-[#00E5FF]" />
                    <span>Bolinha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBuddyPopupCourierId(null)}
                    title="Fechar Pop-up"
                    aria-label="Fechar Pop-up"
                    className="h-7 w-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center cursor-pointer transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 2: Avatar + Courier Name + AMIGO Badge + Vehicle & Tenure */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-[#00E5FF] bg-slate-900 shrink-0 flex items-center justify-center">
                  {popupCourier.avatarPhotoUrl ? (
                    <img
                      src={popupCourier.avatarPhotoUrl}
                      alt={popupCourier.callsign}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-extrabold text-white">
                      {popupCourier.avatarInitials ||
                        popupCourier.callsign.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-extrabold truncate">
                      {popupCourier.callsign}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold shrink-0 ${
                        isFriend
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {isFriend ? 'AMIGO' : 'PÚBLICO'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">
                    {popupCourier.vehicle} • {popupCourier.zoneName} (
                    {popupCourier.distanceKm.toFixed(1)} km)
                  </p>
                  <p className="text-xs font-bold text-[#00E5FF]">
                    {popupCourier.buddyTenureText || 'Fundador • Out 2026'}
                  </p>
                </div>
              </div>
            </div>

            {/* ===============================================================
                CASE A: NOT FRIENDS (contactPermission !== 'APROVADO')
                Shows ONLY Public Profile Info + "Buddy há X tempo" + Friend Request
                =============================================================== */}
            {!isFriend ? (
              <div className="space-y-3 py-1">
                <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3.5 space-y-2 text-zinc-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Estado no Turno:</span>
                    <span className="font-semibold flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isOffline
                            ? 'bg-zinc-500'
                            : isAvailable
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                        }`}
                      />
                      <span>
                        {isOffline
                          ? 'Offline'
                          : isAvailable
                            ? 'Disponível (Livre)'
                            : 'Ocupado (Em Entrega)'}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Tempo na Comunidade:</span>
                    <span className=" font-bold text-emerald-400">
                      {popupCourier.buddyTenureText ||
                        'Buddy há 1 ano e 2 meses'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Veículo &amp; Zona:</span>
                    <span className="font-semibold">
                      {popupCourier.vehicle} • {popupCourier.zoneName}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800 flex items-start gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      Estatísticas cruzadas, Voice Chat em tempo real, convite
                      para grupo fechado e desafios estão visíveis apenas para
                      Buddys amigos conectados.
                    </span>
                  </p>
                </div>

                {popupCourier.contactPermission === 'NENHUM' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        requestCourierContactPermission(popupCourier.id)
                      }
                      className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 px-3 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Enviar Pedido de Amizade</span>
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-300">
                      ◌ Pedido de Amizade Enviado (Aguardando aceitação...)
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* ===============================================================
                 CASE B: FRIENDS (contactPermission === 'APROVADO')
                 Shows Cross-Referenced Statistics (Tu vs. Buddy) + 3 Friend Actions
                 =============================================================== */
              <div className="space-y-2.5">
                {/* Cross-Referenced Statistics: Tu vs. Buddy */}
                <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3 space-y-2 text-zinc-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Estatísticas Cruzadas: Tu vs. {popupCourier.callsign}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Amarante 35 km
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2">
                      <span className="text-[10px] text-zinc-400 block">
                        Entregas Hoje
                      </span>
                      <span className="text-xs font-bold text-white block mt-0.5">
                        Tu: {userDeliveriesToday} vs. {buddyDeliveriesToday}
                      </span>
                    </div>
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2">
                      <span className="text-[10px] text-zinc-400 block">
                        Média €/km
                      </span>
                      <span className="text-xs font-bold text-emerald-400 block mt-0.5">
                        1.62€ vs. {buddyAvgEurPerKm.toFixed(2)}€
                      </span>
                    </div>
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2">
                      <span className="text-[10px] text-zinc-400 block">
                        Reputação
                      </span>
                      <span className="text-xs font-bold text-white block mt-0.5">
                        {communityReputationPct}% vs.{' '}
                        {popupCourier.reputationPct}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Friend Actions: 1. Voice Chat Real-Time | 2. Invite to Closed Group */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => sendBuddyVoiceChatRequest(popupCourier.id)}
                    className={`rounded-xl py-2 px-2.5 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      popupCourier.voiceChatStatus === 'SOLICITADO' ||
                      popupCourier.voiceChatStatus === 'ATIVO'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-100 border border-zinc-800'
                    }`}
                  >
                    <PhoneCall className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {popupCourier.voiceChatStatus === 'SOLICITADO'
                        ? 'Voice Chat Enviado'
                        : 'Request Voice Chat'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      inviteBuddyToClosedGroup(
                        popupCourier.id,
                        'Grupo Fechado • Amarante 35km'
                      )
                    }
                    className={`rounded-xl py-2 px-2.5 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      popupCourier.invitedGroupName
                        ? 'bg-white text-zinc-950'
                        : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-100 border border-zinc-800'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {popupCourier.invitedGroupName
                        ? 'Convidado p/ Grupo'
                        : 'Convidar p/ Grupo'}
                    </span>
                  </button>
                </div>

                {/* Friend Action 3: Criar Desafio (Período Predeterminado) */}
                <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3 space-y-2 text-zinc-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold flex items-center gap-1 text-zinc-100">
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      <span>Criar Desafio (Período Predeterminado)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        createBuddyChallenge(
                          popupCourier.id,
                          selectedChallengePeriod
                        )
                      }
                      className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-1 text-[10px] font-extrabold cursor-pointer transition"
                    >
                      Lançar Desafio
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { id: 'PROXIMAS_3H', label: 'Próximas 3h' },
                        { id: 'TURNO_HOJE', label: 'Turno de Hoje' },
                        { id: 'SEMANAL', label: 'Semanal' },
                      ] as { id: BuddyChallengePeriod; label: string }[]
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedChallengePeriod(p.id)}
                        className={`rounded-lg py-1 text-[10px] font-semibold cursor-pointer transition ${
                          selectedChallengePeriod === p.id
                            ? 'bg-white text-zinc-950'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {popupCourier.activeChallenge && (
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <Trophy className="h-3 w-3 shrink-0" />
                          <span>{popupCourier.activeChallenge.periodLabel}</span>
                        </span>
                        <span className=" text-zinc-300">
                          Tu: {popupCourier.activeChallenge.userCurrentScore}{' '}
                          vs. {popupCourier.callsign.split(' ')[0]}:{' '}
                          {popupCourier.activeChallenge.buddyCurrentScore}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (popupCourier.activeChallenge.userCurrentScore /
                                  Math.max(
                                    1,
                                    popupCourier.activeChallenge
                                      .userCurrentScore +
                                      popupCourier.activeChallenge
                                        .buddyCurrentScore
                                  )) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Live 1-on-1 Direct Messages Thread Synced via Supabase (public.direct_messages / public.community_events) */}
                <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 shrink-0" />
                      <span>Chat Direto 1-a-1 ({popupCourier.directMessages.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDirectChatCourierId(popupCourier.id);
                        setActiveBuddyPopupCourierId(null);
                        setSubTab('WALKIE');
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                    >
                      Ecrã Completo →
                    </button>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {popupCourier.directMessages.length === 0 ? (
                      <p className="text-[11px] text-zinc-500 py-1">
                        Nenhuma mensagem ainda. Envie uma mensagem abaixo para iniciar conversa em tempo real com {popupCourier.callsign}.
                      </p>
                    ) : (
                      popupCourier.directMessages.slice(-6).map((dm) => (
                        <div
                          key={dm.id}
                          className={`rounded-lg px-2.5 py-1.5 text-[11px] ${
                            dm.sender === 'EU'
                              ? 'bg-emerald-600/25 border border-emerald-500/40 text-emerald-100 ml-4'
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-200 mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] text-zinc-400">
                            <span className="font-bold">
                              {dm.sender === 'EU' ? 'Tu' : popupCourier.callsign}
                            </span>
                            <span className="">{dm.timestamp}</span>
                          </div>
                          <p className="leading-snug">{dm.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Direct 1-on-1 Chat inside the Connected Profile Pop-up + Live Voice Dictation */}
                <form
                  onSubmit={handleSendPopupDirectMessage}
                  className="flex items-center gap-1.5 pt-0.5"
                >
                  <button
                    type="button"
                    onClick={() =>
                      startLiveVoiceDictation({
                        targetType: 'BUDDY_DIRETO',
                        recipientId: popupCourier.id,
                        recipientName: popupCourier.callsign,
                        initialPhrase: `Boas ${popupCourier.callsign}, estou em ${popupCourier.zoneName}, queres combinar apoio na rota?`,
                      })
                    }
                    title={`Ditar mensagem por voz ao vivo para ${popupCourier.callsign}`}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-2 text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0 transition"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>Ditar</span>
                  </button>
                  <input
                    type="text"
                    value={popupMessageInput}
                    onChange={(e) => setPopupMessageInput(e.target.value)}
                    placeholder={`Mensagem direta p/ ${popupCourier.callsign}...`}
                    className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-white text-zinc-950 px-3 py-2 text-xs font-bold cursor-pointer shrink-0"
                  >
                    Enviar
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Footer Voice Hint */}
          <div className="pt-2 border-t border-zinc-800/40 flex items-center justify-between text-[10px] text-zinc-400">
            <span>
              Comandos de voz: <strong>&ldquo;Estender&rdquo;</strong>,{' '}
              <strong>&ldquo;Maximizar&rdquo;</strong> ou{' '}
              <strong>&ldquo;Retrair&rdquo;</strong>
            </span>
            <span className="">
              {isExpanded80 ? '80% Tela' : '45% Tela'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2.5">
      {/* Interactive 45% / 80% Buddy Profile Pop-up */}
      {renderBuddyProfilePopup()}

      {/* Top Bar: Clean Flat Courier Identity + Quick Actions (Profile Editing Lives Exclusively Inside the Perfil Tab) */}
      <div className="border-b border-zinc-800/80 pb-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {realCourierProfile?.isRegistered && realCourierProfile.avatar_url ? (
              <img
                src={realCourierProfile.avatar_url}
                alt={realCourierProfile.name}
                className="h-6 w-6 rounded-full object-cover ring-1 ring-[#00E5FF] shrink-0"
              />
            ) : (
              <MapPin className="h-4 w-4 text-[#00E5FF] shrink-0" />
            )}
            <span className="text-xs font-extrabold text-zinc-100 truncate">
              {realCourierProfile?.isRegistered && realCourierProfile.name
                ? `${realCourierProfile.name} (${realCourierProfile.vehicle}) • ${activePlatforms.join(' + ')}`
                : 'Aceda à aba "Perfil" para gerir a sua conta'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsDirectApkShareModalOpen(true)}
              className="rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 px-2.5 py-1.5 text-[11px] font-bold text-cyan-400 flex items-center gap-1.5 cursor-pointer transition"
            >
              <Share2 className="h-3.5 w-3.5 shrink-0" />
              <span>Partilhar App</span>
            </button>
            <button
              type="button"
              onClick={refreshLiveGpsPosition}
              className="rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1.5 text-[11px] font-bold text-zinc-100 flex items-center gap-1 cursor-pointer transition whitespace-nowrap"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#00E5FF] shrink-0" />
              <span>GPS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clean Flat Segmented Navigation Bar: [Chat] | [Walkie] | [Blog] | [Tradutor] */}
      <div className="grid grid-cols-4 border-b border-zinc-800/80 divide-x divide-zinc-800/80 bg-zinc-950/60 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setSubTab('CHAT')}
          className={`py-2.5 px-2 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer truncate border-b-2 ${
            subTab === 'CHAT'
              ? 'border-[#00E5FF] text-[#00E5FF] font-extrabold bg-slate-900/80'
              : 'border-transparent text-zinc-400 hover:text-zinc-100 font-semibold'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Chat</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('WALKIE')}
          className={`py-2.5 px-2 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer truncate border-b-2 ${
            subTab === 'WALKIE'
              ? 'border-[#00E5FF] text-[#00E5FF] font-extrabold bg-slate-900/80'
              : 'border-transparent text-zinc-400 hover:text-zinc-100 font-semibold'
          }`}
        >
          <Radio className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Walkie</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('BLOG')}
          className={`py-2.5 px-2 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer truncate border-b-2 ${
            subTab === 'BLOG'
              ? 'border-[#00E5FF] text-[#00E5FF] font-extrabold bg-slate-900/80'
              : 'border-transparent text-zinc-400 hover:text-zinc-100 font-semibold'
          }`}
        >
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Blog</span>
        </button>
        <button
          type="button"
          onClick={() => openTranslatorModal('TRADUTOR')}
          className="py-2.5 px-2 text-xs font-extrabold text-[#00E5FF] hover:bg-slate-900/80 flex items-center justify-center gap-1.5 transition cursor-pointer truncate border-b-2 border-transparent"
        >
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Tradutor</span>
        </button>
      </div>

      {/* =====================================================================
          VIEW 1: [CHAT] — 4.5 CARDS VIEWPORT DENSITY & INTERACTIVE PROFILE POP-UP
          ===================================================================== */}
      {subTab === 'CHAT' && (
        <section
          aria-label="Lista de Buddys (4.5 Cartões no Ecrã)"
          className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-3 space-y-2.5"
        >
          {/* Filter Pills: Todos (X) | Livres (X) | Ocupados (X) */}
          <div className="bg-zinc-950 p-1 rounded-xl grid grid-cols-3 gap-1 border border-zinc-800/80">
            <button
              type="button"
              onClick={() => setDirectoryFilter('TODOS')}
              className={`rounded-lg py-1.5 px-1.5 text-[11px] transition cursor-pointer truncate ${
                directoryFilter === 'TODOS'
                  ? 'bg-white text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              Todos ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setDirectoryFilter('DISPONIVEIS')}
              className={`rounded-lg py-1.5 px-1.5 text-[11px] transition cursor-pointer flex items-center justify-center gap-1 truncate ${
                directoryFilter === 'DISPONIVEIS'
                  ? 'bg-white text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">Livres ({counts.available})</span>
            </button>
            <button
              type="button"
              onClick={() => setDirectoryFilter('COM_PEDIDO')}
              className={`rounded-lg py-1.5 px-1.5 text-[11px] transition cursor-pointer flex items-center justify-center gap-1 truncate ${
                directoryFilter === 'COM_PEDIDO'
                  ? 'bg-white text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
              <span className="truncate">Ocupados ({counts.busy})</span>
            </button>
          </div>

          {/* Incoming Permission Request Banner */}
          {incomingContactRequest &&
            incomingContactRequest.status === 'PENDENTE' && (
              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-zinc-100 block truncate">
                    Pedido de Amizade: {incomingContactRequest.callsign} (
                    {incomingContactRequest.vehicle})
                  </span>
                  <span className="text-[10px] text-zinc-400 block truncate">
                    {incomingContactRequest.zoneName} •{' '}
                    {incomingContactRequest.distanceKm.toFixed(1)} km
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => respondToIncomingContactRequest('ACEITE')}
                    className="rounded-lg bg-white text-zinc-950 px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="h-3 w-3" />
                    <span>Aceitar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => respondToIncomingContactRequest('RECUSADO')}
                    className="rounded-lg bg-zinc-800 text-zinc-300 px-2 py-1 text-[10px] cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

          {/* 4.5-Card Buddys Scrollable Viewport:
              4 cards * (112px height + 12px mb-3) = 496px + 50px (top half of 5th card) = 546px */}
          <div
            aria-label="Contentor 4.5 Cartões Buddys"
            className="h-[546px] overflow-y-auto rounded-2xl border border-zinc-800/80 bg-zinc-950 p-2"
          >
            {filteredCouriers.length === 0 ? (
              counts.total > 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <p className="text-xs font-bold text-zinc-100">
                    {directoryFilter === 'DISPONIVEIS'
                      ? `Nenhum estafeta livre neste momento (${counts.busy} em entrega ativa)`
                      : `Nenhum estafeta em entrega ativa neste momento (${counts.available} livre${counts.available === 1 ? '' : 's'})`}
                  </p>
                  <p className="text-[11px] text-zinc-400 max-w-xs leading-snug">
                    {counts.total} estafeta{counts.total === 1 ? '' : 's'} conectado{counts.total === 1 ? '' : 's'} em Amarante no momento. Altera o filtro acima para ver todos os cartões ativos.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDirectoryFilter('TODOS')}
                    className="rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <span>Ver Todos ({counts.total})</span>
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <p className="text-xs font-bold text-zinc-100">
                    Nenhum colega online neste momento em Amarante
                  </p>
                  <p className="text-[11px] text-zinc-400 max-w-xs leading-snug">
                    Configura o teu perfil para ficares visível para outros estafetas na região de Amarante.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCourierRegistrationModalOpen(true)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Configurar Meu Perfil</span>
                  </button>
                </div>
              )
            ) : (
              filteredCouriers.map((courier) => {
                const isOffline = courier.isOnlineActive === false;
                const isPaused =
                  !isOffline &&
                  Boolean(courier.buddyTenureText?.includes('Ausente'));
                const isCourierAvailable =
                  !isOffline &&
                  !isPaused &&
                  courier.orderStatus === 'DISPONIVEL';
                const isSelf = Boolean(courier.isSelfProfile);
                const courierPlatforms =
                  courier.activePlatforms && courier.activePlatforms.length > 0
                    ? courier.activePlatforms
                    : isSelf
                      ? activePlatforms
                      : activePlatforms;

                const statusBadgeLabel = isOffline
                  ? 'Offline'
                  : isPaused
                    ? 'Ausente'
                    : 'Online';

                const statusBadgeClasses = isOffline
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                  : isPaused
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400';

                const statusDotColor = isOffline
                  ? 'bg-slate-400'
                  : isPaused
                    ? 'bg-amber-400'
                    : 'bg-emerald-400';

                return (
                  <div
                    key={courier.id}
                    onClick={() => {
                      setBuddyPopupSizeMode('45VH');
                      setActiveBuddyPopupCourierId(courier.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setBuddyPopupSizeMode('45VH');
                        setActiveBuddyPopupCourierId(courier.id);
                      }
                    }}
                    className={`mb-2.5 last:mb-0 rounded-xl p-3 space-y-2.5 cursor-pointer transition ${
                      isSelf
                        ? 'bg-zinc-900 hover:bg-zinc-800/90 border border-[#00E5FF]/60'
                        : 'bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800/80'
                    }`}
                  >
                    {/* Top Row: Avatar + Courier Name + Clean Status Dot (Online / Ausente / Offline) + Subtitle */}
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`relative h-11 w-11 rounded-full overflow-hidden border shrink-0 flex items-center justify-center ${
                            isSelf
                              ? 'border-[#00E5FF] bg-slate-900'
                              : 'border-zinc-700 bg-zinc-950'
                          }`}
                        >
                          {courier.avatarPhotoUrl ? (
                            <img
                              src={courier.avatarPhotoUrl}
                              alt={courier.callsign}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-extrabold text-white">
                              {courier.avatarInitials ||
                                courier.callsign.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          <span
                            className={`absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border border-zinc-950 ${
                              isOffline
                                ? 'bg-slate-500'
                                : isPaused
                                  ? 'bg-amber-400'
                                  : isCourierAvailable
                                    ? 'bg-emerald-500'
                                    : 'bg-cyan-400'
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              style={{
                                color: isDaylight ? '#0f172a' : '#ffffff',
                              }}
                              className="text-sm font-extrabold leading-tight truncate"
                            >
                              {isSelf
                                ? `${courier.callsign} (Meu Perfil)`
                                : courier.callsign}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold shrink-0 ${statusBadgeClasses}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${statusDotColor}`}
                              />
                              <span>{statusBadgeLabel}</span>
                            </span>
                          </div>

                          <span className="text-xs font-medium text-zinc-400 block truncate mt-0.5">
                            {courier.vehicle} • {courierPlatforms.join(' + ')} •{' '}
                            {courier.zoneName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Two Clean, Side-by-Side Full-Width Buttons with SVG Icons */}
                    <div
                      className="grid grid-cols-2 gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setBuddyPopupSizeMode('45VH');
                          setActiveBuddyPopupCourierId(courier.id);
                        }}
                        className="w-full rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[#00E5FF] py-2 px-2 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition whitespace-nowrap"
                      >
                        <BarChart3 className="h-3.5 w-3.5 shrink-0" />
                        <span>Estatísticas</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          startLiveVoiceDictation({
                            targetType: 'BUDDY_DIRETO',
                            recipientId: courier.id,
                            recipientName: courier.callsign,
                            initialPhrase: `Boas ${courier.callsign}, estás perto de ${courier.zoneName}?`,
                          })
                        }
                        title={`Enviar ou ditar mensagem para ${courier.callsign}`}
                        className="w-full rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 py-2 px-2 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition whitespace-nowrap"
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                        <span>Mensagem</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Direct Quick Message Bar at Bottom of Buddys -> Chat */}
          <form
            onSubmit={handleSendQuickTeamMessage}
            className="pt-1 border-t border-zinc-800/80 space-y-1.5"
          >
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  startLiveVoiceDictation({
                    targetType: 'WALKIE_CANAL',
                    recipientId: activeWalkieChannel,
                    recipientName: 'Equipa Amarante',
                    initialPhrase:
                      'Boas equipa, como está o movimento agora no centro de Amarante?',
                  })
                }
                title="Ditar mensagem rápida por voz para a equipa"
                className="rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-400 px-2.5 py-2 text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0 transition"
              >
                <Mic className="h-3.5 w-3.5 shrink-0" />
                <span>Voz</span>
              </button>
              <input
                type="text"
                value={quickTeamMessageInput}
                onChange={(e) => setQuickTeamMessageInput(e.target.value)}
                placeholder="Mensagem Rápida p/ Equipa..."
                className="min-w-0 flex-1 rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-white hover:bg-zinc-200 text-slate-950 px-3 py-2 text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0 transition"
              >
                <Send className="h-3.5 w-3.5 shrink-0" />
                <span>Enviar</span>
              </button>
            </div>
            {quickTeamNotice && (
              <p className="text-[11px] font-semibold text-cyan-400 px-1">
                {quickTeamNotice}
              </p>
            )}
          </form>
        </section>
      )}

      {/* =====================================================================
          VIEW 2: [WALKIE] — WALKIE-TALKIE & 1-ON-1 DIRECT VOICE CHANNEL
          ===================================================================== */}
      {subTab === 'WALKIE' && (
        <div className="space-y-2.5">
          {activeDirectCourier ? (
            <section className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveDirectChatCourierId(null)}
                    className="rounded-lg bg-zinc-950 border border-zinc-800 p-1.5 text-zinc-300 hover:text-zinc-100 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-zinc-100 block truncate">
                      Canal 1-a-1: {activeDirectCourier.callsign}
                    </span>
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {activeDirectCourier.zoneName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {activeDirectCourier.directMessages.map((dm) => (
                  <div
                    key={dm.id}
                    className={`rounded-lg p-2.5 text-xs ${
                      dm.sender === 'EU'
                        ? 'bg-zinc-800 text-zinc-100 ml-6'
                        : 'bg-zinc-950 border border-zinc-800/80 text-zinc-200 mr-6'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-0.5">
                      <span className="font-semibold">
                        {dm.sender === 'EU'
                          ? 'Tu'
                          : activeDirectCourier.callsign}
                      </span>
                      <span className="">{dm.timestamp}</span>
                    </div>
                    <p>{dm.text}</p>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSendDirectMessage}
                className="flex items-center gap-1.5"
              >
                <button
                  type="button"
                  onClick={() =>
                    startLiveVoiceDictation({
                      targetType: 'BUDDY_DIRETO',
                      recipientId: activeDirectCourier.id,
                      recipientName: activeDirectCourier.callsign,
                      initialPhrase: `Boas ${activeDirectCourier.callsign}, já estou a chegar ao ponto de encontro!`,
                    })
                  }
                  title={`Ditar mensagem por voz ao vivo para ${activeDirectCourier.callsign}`}
                  className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-2 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Mic className="h-3.5 w-3.5" />
                  <span>Ditar</span>
                </button>
                <input
                  type="text"
                  value={directMessageInput}
                  onChange={(e) => setDirectMessageInput(e.target.value)}
                  placeholder={`Mensagem p/ ${activeDirectCourier.callsign}...`}
                  className="flex-1 rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-3 py-2 text-xs font-semibold cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </section>
          ) : (
            <>
              <section className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-3">
                <div className="bg-zinc-950 p-1 rounded-lg grid grid-cols-2 gap-1 border border-zinc-800/80">
                  {(
                    [
                      { id: 'RADIO_ZONA_LOCAL', label: 'Rádio Amarante 35km' },
                      {
                        id: 'PARCEIRO_PEDIDO_DIVIDIDO',
                        label: 'Pedido Dividido',
                      },
                    ] as { id: WalkieChannelId; label: string }[]
                  ).map((ch) => {
                    const active = activeWalkieChannel === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setActiveWalkieChannel(ch.id)}
                        className={`rounded-md py-1.5 text-xs transition cursor-pointer ${
                          active
                            ? 'bg-zinc-800 text-zinc-100 font-semibold'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {ch.label}
                      </button>
                    );
                  })}
                </div>

                <div className="py-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      startLiveVoiceDictation({
                        targetType: 'WALKIE_CANAL',
                        recipientId: activeWalkieChannel,
                        recipientName:
                          activeWalkieChannel === 'PARCEIRO_PEDIDO_DIVIDIDO'
                            ? 'Parceiro de Pedido Dividido'
                            : 'Rádio Amarante 35km',
                        initialPhrase:
                          activeWalkieChannel === 'PARCEIRO_PEDIDO_DIVIDIDO'
                            ? 'Estou a chegar ao restaurante em Amarante para dividirmos os sacos pesados!'
                            : 'Pessoal de Amarante, trânsito limpo na Ponte de São Gonçalo e zero fila!',
                      })
                    }
                    className="w-full rounded-xl py-3 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Mic className="h-4 w-4" />
                    <span>Ditar Mensagem ao Vivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTogglePtt}
                    className={`w-full rounded-xl py-3 px-3 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      isRecordingPtt
                        ? 'bg-zinc-800 text-white border border-zinc-600'
                        : 'bg-white text-zinc-950 hover:bg-zinc-200'
                    }`}
                  >
                    <Radio className="h-4 w-4" />
                    <span>
                      {isRecordingPtt
                        ? 'A Gravar... Toque p/ Enviar PTT'
                        : 'PTT Rádio Rápido'}
                    </span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {WALKIE_QUICK_MACROS.map((macro) => (
                    <button
                      key={macro}
                      type="button"
                      onClick={() => handleSendText(macro, false)}
                      className="rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-300 cursor-pointer transition"
                    >
                      {macro}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Mensagem no rádio..."
                    className="min-w-0 flex-1 rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendText(messageInput, false)}
                    className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-3 py-2 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>

                {statusNotice && (
                  <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-0.5">
                    <span>{statusNotice}</span>
                    <button
                      type="button"
                      onClick={() => setStatusNotice(null)}
                      className="text-zinc-500 hover:text-zinc-200 text-[10px] cursor-pointer"
                    >
                      OK
                    </button>
                  </div>
                )}
              </section>

              <section className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Últimas Transmissões</span>
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Amarante 35km
                  </span>
                </div>

                <div className="space-y-1.5">
                  {channelMessages.length === 0 ? (
                    <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-4 text-center space-y-1">
                      <p className="text-xs font-bold text-zinc-100">
                        Sem transmissões recentes no Rádio de Amarante
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Usa o botão de voz ou envia uma mensagem rápida acima para comunicar com os colegas da zona.
                      </p>
                    </div>
                  ) : (
                    channelMessages.map((msg) => {
                      const cleanMsgText = msg.text
                        .replace(/🚨/g, '')
                        .replace(/🔴/g, '')
                        .trim();
                      const isAlertMsg =
                        msg.text.includes('SOS') ||
                        msg.text.includes('🚨') ||
                        msg.text.toLowerCase().includes('emergência');
                      return (
                        <div
                          key={msg.id}
                          className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2.5 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5 truncate">
                              {isAlertMsg && (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                              )}
                              <span className="truncate">
                                {msg.senderName} ({msg.senderVehicle})
                              </span>
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-zinc-500">
                                {msg.timestamp}
                              </span>
                              {msg.senderId !== 'SELF-COURIER' && (
                                <button
                                  type="button"
                                  onClick={() => flagOrMuteWalkieMessage(msg.id)}
                                  title="Silenciar remetente"
                                  className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                                >
                                  <Flag className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-zinc-300 leading-snug">
                            {cleanMsgText}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          VIEW 3: [BLOG] — MURAL COMUNITÁRIO DOS BUDDYS
          ===================================================================== */}
      {subTab === 'BLOG' && (
        <section className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-zinc-100">
                Blog da Comunidade Buddys (Amarante 35 km)
              </h2>
              <p className="text-[10px] text-zinc-400">
                Dicas de rua, alertas e entreajuda
              </p>
            </div>
            <span className="rounded bg-zinc-950 border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
              Público
            </span>
          </div>

          <form onSubmit={handlePublishSocialPost} className="space-y-1.5">
            <div className="flex gap-1">
              {(
                [
                  { id: 'DICA_RUA', label: 'Dica de Rua' },
                  { id: 'ALERTA_TRANSITO', label: 'Alerta de Zona' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setBlogCategoryInput(cat.id)}
                  className={`rounded px-2 py-0.5 text-[10px] font-medium cursor-pointer ${
                    blogCategoryInput === cat.id
                      ? 'bg-white text-zinc-950 font-semibold'
                      : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={blogPostInput}
                onChange={(e) => setBlogPostInput(e.target.value)}
                placeholder="Partilhar dica ou alerta..."
                className="min-w-0 flex-1 rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-white text-zinc-950 px-3 py-1.5 text-xs font-semibold cursor-pointer shrink-0"
              >
                Publicar
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {socialBuddyPosts.length === 0 ? (
              <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-4 text-center space-y-1">
                <p className="text-xs font-bold text-zinc-100">
                  Sem publicações hoje em Amarante
                </p>
                <p className="text-[11px] text-zinc-400">
                  Partilha uma dica de rua ou alerta de trânsito com os colegas da zona!
                </p>
              </div>
            ) : (
              socialBuddyPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-semibold text-zinc-100 truncate">
                        {post.authorCallsign}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {post.authorVehicle} • {post.zoneName}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 shrink-0">
                      {post.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-snug">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => toggleLikeSocialBuddyPost(post.id)}
                      className={`rounded-md px-2 py-1 text-[10px] font-medium flex items-center gap-1 cursor-pointer transition ${
                        post.likedByUser
                          ? 'bg-white text-zinc-950 font-semibold'
                          : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                      }`}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      <span>Útil ({post.likesCount})</span>
                    </button>

                    {post.authorId !== 'SELF-COURIER' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSubTab('CHAT');
                          setBuddyPopupSizeMode('45VH');
                          setActiveBuddyPopupCourierId(post.authorId);
                        }}
                        className="rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-200 flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="h-3 w-3" />
                        <span>Abrir Perfil do Buddy</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <DirectApkShareModal
        isOpen={isDirectApkShareModalOpen}
        onClose={() => setIsDirectApkShareModalOpen(false)}
      />
    </div>
  );
};
