import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe,
  Mic,
  Volume2,
  RotateCw,
  X,
  Hand,
  Send,
  Play,
  Square,
  Check,
  Delete,
  Sparkles,
} from 'lucide-react';
import { useEstafetas } from '../context/EstafetasContext';
import { stopBuddySpeech } from '../services/voiceEngine';

export type TranslatorLanguageCode =
  | 'en-US'
  | 'fr-FR'
  | 'es-ES'
  | 'de-DE'
  | 'it-IT'
  | 'uk-UA'
  | 'hi-IN'
  | 'zh-CN';

export interface TranslatorLanguageOption {
  code: TranslatorLanguageCode;
  shortLabel: string;
  namePt: string;
  nativeName: string;
  flag: string;
  myMemoryLang: string;
}

export const TRANSLATOR_LANGUAGES: TranslatorLanguageOption[] = [
  {
    code: 'en-US',
    shortLabel: 'EN',
    namePt: 'Inglês',
    nativeName: 'English',
    flag: '🇬🇧',
    myMemoryLang: 'en',
  },
  {
    code: 'fr-FR',
    shortLabel: 'FR',
    namePt: 'Francês',
    nativeName: 'Français',
    flag: '🇫🇷',
    myMemoryLang: 'fr',
  },
  {
    code: 'es-ES',
    shortLabel: 'ES',
    namePt: 'Espanhol',
    nativeName: 'Español',
    flag: '🇪🇸',
    myMemoryLang: 'es',
  },
  {
    code: 'de-DE',
    shortLabel: 'DE',
    namePt: 'Alemão',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    myMemoryLang: 'de',
  },
  {
    code: 'it-IT',
    shortLabel: 'IT',
    namePt: 'Italiano',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    myMemoryLang: 'it',
  },
  {
    code: 'uk-UA',
    shortLabel: 'UK',
    namePt: 'Ucraniano',
    nativeName: 'Українська',
    flag: '🇺🇦',
    myMemoryLang: 'uk',
  },
  {
    code: 'hi-IN',
    shortLabel: 'HI',
    namePt: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    myMemoryLang: 'hi',
  },
  {
    code: 'zh-CN',
    shortLabel: 'ZH',
    namePt: 'Mandarim',
    nativeName: '中文 (普通话)',
    flag: '🇨🇳',
    myMemoryLang: 'zh-CN',
  },
];

interface DoorstepPresetPhrase {
  id: string;
  ptText: string;
  librasSignId: LibrasCoreSignId;
  translations: Record<TranslatorLanguageCode, string>;
}

export const DOORSTEP_PRESET_PHRASES: DoorstepPresetPhrase[] = [
  {
    id: 'HELLO_ORDER',
    ptText: 'Olá! Trouxe a sua encomenda.',
    librasSignId: 'ENCOMENDA',
    translations: {
      'en-US': 'Hello! I have brought your delivery order.',
      'fr-FR': 'Bonjour ! J’ai apporté votre commande.',
      'es-ES': '¡Hola! He traído su pedido.',
      'de-DE': 'Hallo! Ich habe Ihre Bestellung gebracht.',
      'it-IT': 'Ciao! Ho portato il tuo ordine.',
      'uk-UA': 'Вітаю! Я привіз ваше замовлення.',
      'hi-IN': 'नमस्ते! मैं आपका ऑर्डर लेकर आया हूँ।',
      'zh-CN': '您好！我送来了您的外卖订单。',
    },
  },
  {
    id: 'NEED_PIN',
    ptText: 'Preciso do código PIN de confirmação da entrega.',
    librasSignId: 'CODIGO_PIN',
    translations: {
      'en-US': 'I need the delivery confirmation PIN code, please.',
      'fr-FR': 'J’ai besoin du code PIN de confirmation de livraison, s’il vous plaît.',
      'es-ES': 'Necesito el código PIN de confirmación de la entrega, por favor.',
      'de-DE': 'Ich benötige bitte den PIN-Code zur Lieferbestätigung.',
      'it-IT': 'Ho bisogno del codice PIN di conferma della consegna, per favore.',
      'uk-UA': 'Мені потрібен PIN-код підтвердження доставки, будь ласка.',
      'hi-IN': 'कृपया मुझे डिलीवरी कन्फर्मेशन पिन (PIN) कोड बताएं।',
      'zh-CN': '请提供您的送达确认 PIN 码。',
    },
  },
  {
    id: 'CONFIRM_DOOR',
    ptText: 'Pode confirmar o número da porta ou andar?',
    librasSignId: 'CONFIRMAR',
    translations: {
      'en-US': 'Could you please confirm the door number or floor?',
      'fr-FR': 'Pouvez-vous confirmer le numéro de porte ou l’étage ?',
      'es-ES': '¿Puede confirmar el número de la puerta o el piso?',
      'de-DE': 'Können Sie bitte die Hausnummer oder Etage bestätigen?',
      'it-IT': 'Può confermare il numero civico o il piano?',
      'uk-UA': 'Підкажіть, будь ласка, номер дверей або поверх?',
      'hi-IN': 'क्या आप दरवाजे का नंबर या मंजिल कंफर्म कर सकते हैं?',
      'zh-CN': '请问您能确认一下门牌号或楼层吗？',
    },
  },
  {
    id: 'CASH_PAYMENT',
    ptText: 'Esta entrega tem pagamento em dinheiro na recolha.',
    librasSignId: 'CONFIRMAR',
    translations: {
      'en-US': 'This delivery requires cash payment upon drop-off.',
      'fr-FR': 'Cette livraison nécessite un paiement en espèces à la réception.',
      'es-ES': 'Esta entrega tiene pago en efectivo al recibir.',
      'de-DE': 'Für diese Lieferung ist Barzahlung bei Übergabe erforderlich.',
      'it-IT': 'Questa consegna prevede il pagamento in contanti alla ricezione.',
      'uk-UA': 'Ця доставка потребує оплати готівкою при отриманні.',
      'hi-IN': 'इस डिलीवरी के लिए नकद भुगतान (कैश) आवश्यक है।',
      'zh-CN': '此订单需要货到现金付款。',
    },
  },
  {
    id: 'THANK_YOU',
    ptText: 'Obrigado, bom apetite e tenha um excelente dia!',
    librasSignId: 'OBRIGADO',
    translations: {
      'en-US': 'Thank you, enjoy your meal and have a wonderful day!',
      'fr-FR': 'Merci, bon appétit et passez une excellente journée !',
      'es-ES': '¡Gracias, buen provecho y que tenga un excelente día!',
      'de-DE': 'Vielen Dank, guten Appetit und einen schönen Tag noch!',
      'it-IT': 'Grazie, buon appetito e buona giornata!',
      'uk-UA': 'Дякую, смачного та чудового вам дня!',
      'hi-IN': 'धन्यवाद, भोजन का आनंद लें और आपका दिन शुभ हो!',
      'zh-CN': '谢谢，祝您用餐愉快，度过美好的一天！',
    },
  },
];

interface CustomerQuickForeignPhrase {
  id: string;
  ptMeaning: string;
  byLang: Record<TranslatorLanguageCode, string>;
}

const CUSTOMER_FOREIGN_QUICK_REPLIES: CustomerQuickForeignPhrase[] = [
  {
    id: 'COMING_DOWN',
    ptMeaning: 'Já estou a descer, só 1 minuto por favor!',
    byLang: {
      'en-US': "I'm coming down now, just 1 minute please!",
      'fr-FR': 'Je descends tout de suite, juste 1 minute SVP !',
      'es-ES': '¡Ya bajo ahora mismo, solo 1 minuto por favor!',
      'de-DE': 'Ich komme sofort herunter, nur 1 Minute bitte!',
      'it-IT': 'Scendo subito, solo 1 minuto per favore!',
      'uk-UA': 'Я вже спускаюся, зачекайте 1 хвилину!',
      'hi-IN': 'मैं अभी नीचे आ रहा हूँ, बस 1 मिनट रुकें!',
      'zh-CN': '我马上下来，请稍等一分钟！',
    },
  },
  {
    id: 'LEAVE_AT_DOOR',
    ptMeaning: 'Pode deixar na porta, muito obrigado!',
    byLang: {
      'en-US': 'You can leave it at the door, thank you!',
      'fr-FR': 'Vous pouvez le laisser devant la porte, merci !',
      'es-ES': '¡Puede dejarlo en la puerta, muchas gracias!',
      'de-DE': 'Bitte einfach vor die Tür stellen, vielen Dank!',
      'it-IT': 'Può lasciarlo alla porta, mille grazie!',
      'uk-UA': 'Можете залишити біля дверей, дуже дякую!',
      'hi-IN': 'आप इसे दरवाजे पर छोड़ सकते हैं, बहुत धन्यवाद!',
      'zh-CN': '您可以放在门口，非常感谢！',
    },
  },
  {
    id: 'HERE_IS_PIN',
    ptMeaning: 'Aqui está o código PIN e obrigado pela entrega!',
    byLang: {
      'en-US': 'Here is the PIN code, thank you for the delivery!',
      'fr-FR': 'Voici le code PIN, merci pour la livraison !',
      'es-ES': '¡Aquí está el código PIN, gracias por la entrega!',
      'de-DE': 'Hier ist der PIN-Code, danke für die Lieferung!',
      'it-IT': 'Ecco il codice PIN, grazie per la consegna!',
      'uk-UA': 'Ось PIN-код, дякую за доставку!',
      'hi-IN': 'यह रहा पिन कोड, डिलीवरी के लिए धन्यवाद!',
      'zh-CN': '这是 PIN 码，谢谢您的配送！',
    },
  },
];

export type LibrasCoreSignId =
  | 'OLA'
  | 'ENCOMENDA'
  | 'CODIGO_PIN'
  | 'CONFIRMAR'
  | 'AGUARDAR'
  | 'OBRIGADO';

export type FingerState = 'EXTENDED' | 'HALF' | 'CURLED';

export interface RoboticHandPose {
  thumb: FingerState;
  index: FingerState;
  middle: FingerState;
  ring: FingerState;
  pinky: FingerState;
  tiltDeg: number;
  offsetX: number;
  offsetY: number;
  motionClass:
    | 'WAVE'
    | 'CARRY_BOX'
    | 'TAP_PIN'
    | 'THUMBS_UP'
    | 'WAIT_PULSE'
    | 'THANK_SALUTE'
    | 'SPELL_PULSE';
}

export interface LibrasSignDefinition {
  id: LibrasCoreSignId;
  badgeTitle: string;
  ptCaption: string;
  gestureDescription: string;
  leftHand: RoboticHandPose;
  rightHand: RoboticHandPose;
}

export const LIBRAS_CORE_SIGNS: Record<LibrasCoreSignId, LibrasSignDefinition> =
  {
    OLA: {
      id: 'OLA',
      badgeTitle: '👋 OLÁ / SAUDAÇÃO',
      ptCaption: 'Olá! Sou o seu estafeta Delivery Buddy.',
      gestureDescription:
        'Mão direita aberta levantada em saudação lateral • Mão esquerda em posição amigável de apoio.',
      leftHand: {
        thumb: 'EXTENDED',
        index: 'HALF',
        middle: 'HALF',
        ring: 'CURLED',
        pinky: 'CURLED',
        tiltDeg: -8,
        offsetX: -6,
        offsetY: 8,
        motionClass: 'WAIT_PULSE',
      },
      rightHand: {
        thumb: 'EXTENDED',
        index: 'EXTENDED',
        middle: 'EXTENDED',
        ring: 'EXTENDED',
        pinky: 'EXTENDED',
        tiltDeg: 14,
        offsetX: 6,
        offsetY: -8,
        motionClass: 'WAVE',
      },
    },
    ENCOMENDA: {
      id: 'ENCOMENDA',
      badgeTitle: '📦 A SUA ENCOMENDA / ENTREGA',
      ptCaption: 'Trouxe a sua encomenda! Aqui está o seu pedido.',
      gestureDescription:
        'Ambas as mãos robóticas do Buddy simulam segurar e apresentar a caixa da encomenda em direção ao cliente.',
      leftHand: {
        thumb: 'EXTENDED',
        index: 'HALF',
        middle: 'HALF',
        ring: 'HALF',
        pinky: 'HALF',
        tiltDeg: 18,
        offsetX: 10,
        offsetY: 2,
        motionClass: 'CARRY_BOX',
      },
      rightHand: {
        thumb: 'EXTENDED',
        index: 'HALF',
        middle: 'HALF',
        ring: 'HALF',
        pinky: 'HALF',
        tiltDeg: -18,
        offsetX: -10,
        offsetY: 2,
        motionClass: 'CARRY_BOX',
      },
    },
    CODIGO_PIN: {
      id: 'CODIGO_PIN',
      badgeTitle: '🔢 CÓDIGO PIN / SENHA DE ENTREGA',
      ptCaption: 'Preciso do código PIN de 4 dígitos para confirmar a entrega.',
      gestureDescription:
        'Mão esquerda em palma aberta (teclado) • Dedo indicador da mão direita a digitar os 4 números do PIN.',
      leftHand: {
        thumb: 'EXTENDED',
        index: 'EXTENDED',
        middle: 'EXTENDED',
        ring: 'EXTENDED',
        pinky: 'EXTENDED',
        tiltDeg: 12,
        offsetX: 8,
        offsetY: 4,
        motionClass: 'WAIT_PULSE',
      },
      rightHand: {
        thumb: 'CURLED',
        index: 'EXTENDED',
        middle: 'CURLED',
        ring: 'CURLED',
        pinky: 'CURLED',
        tiltDeg: -16,
        offsetX: -8,
        offsetY: -4,
        motionClass: 'TAP_PIN',
      },
    },
    CONFIRMAR: {
      id: 'CONFIRMAR',
      badgeTitle: '✅ CONFIRMAR / TUDO CERTO',
      ptCaption: 'Entrega e morada confirmadas com sucesso!',
      gestureDescription:
        'Ambas as mãos do Buddy fazem o sinal positivo (Polegar levantado / OK) com anel luminoso Azul Neon.',
      leftHand: {
        thumb: 'EXTENDED',
        index: 'CURLED',
        middle: 'CURLED',
        ring: 'CURLED',
        pinky: 'CURLED',
        tiltDeg: -10,
        offsetX: 4,
        offsetY: 0,
        motionClass: 'THUMBS_UP',
      },
      rightHand: {
        thumb: 'EXTENDED',
        index: 'CURLED',
        middle: 'CURLED',
        ring: 'CURLED',
        pinky: 'CURLED',
        tiltDeg: 10,
        offsetX: -4,
        offsetY: 0,
        motionClass: 'THUMBS_UP',
      },
    },
    AGUARDAR: {
      id: 'AGUARDAR',
      badgeTitle: '⏳ AGUARDAR 1 MINUTO',
      ptCaption: 'Por favor, aguarde só 1 minuto.',
      gestureDescription:
        'Mão direita ergue o indicador (número 1) • Mão esquerda em gesto calmo de espera.',
      leftHand: {
        thumb: 'EXTENDED',
        index: 'EXTENDED',
        middle: 'EXTENDED',
        ring: 'EXTENDED',
        pinky: 'EXTENDED',
        tiltDeg: -6,
        offsetX: -4,
        offsetY: 6,
        motionClass: 'WAIT_PULSE',
      },
      rightHand: {
        thumb: 'CURLED',
        index: 'EXTENDED',
        middle: 'CURLED',
        ring: 'CURLED',
        pinky: 'CURLED',
        tiltDeg: 4,
        offsetX: 4,
        offsetY: -6,
        motionClass: 'WAIT_PULSE',
      },
    },
    OBRIGADO: {
      id: 'OBRIGADO',
      badgeTitle: '🙏 OBRIGADO & BOM DIA!',
      ptCaption: 'Muito obrigado! Bom apetite e tenha um excelente dia!',
      gestureDescription:
        'Mão direita executa o gesto de "Obrigado" à frente com saudação final positiva.',
      leftHand: {
        thumb: 'EXTENDED',
        index: 'CURLED',
        middle: 'CURLED',
        ring: 'CURLED',
        pinky: 'CURLED',
        tiltDeg: -8,
        offsetX: -4,
        offsetY: 4,
        motionClass: 'THUMBS_UP',
      },
      rightHand: {
        thumb: 'EXTENDED',
        index: 'EXTENDED',
        middle: 'EXTENDED',
        ring: 'EXTENDED',
        pinky: 'EXTENDED',
        tiltDeg: -12,
        offsetX: 6,
        offsetY: -6,
        motionClass: 'THANK_SALUTE',
      },
    },
  };

// Hand poses for Alphabet A-Z & Numbers 0-9 in Libras / International Fingerspelling
export function getFingerspellingRightHandPose(charRaw: string): {
  pose: RoboticHandPose;
  desc: string;
} {
  const ch = (charRaw || 'A').toUpperCase()[0];
  switch (ch) {
    case 'A':
      return {
        pose: {
          thumb: 'EXTENDED',
          index: 'CURLED',
          middle: 'CURLED',
          ring: 'CURLED',
          pinky: 'CURLED',
          tiltDeg: 0,
          offsetX: 0,
          offsetY: 0,
          motionClass: 'SPELL_PULSE',
        },
        desc: 'Letra A: Mão fechada com polegar encostado na lateral.',
      };
    case 'B':
      return {
        pose: {
          thumb: 'CURLED',
          index: 'EXTENDED',
          middle: 'EXTENDED',
          ring: 'EXTENDED',
          pinky: 'EXTENDED',
          tiltDeg: 0,
          offsetX: 0,
          offsetY: -4,
          motionClass: 'SPELL_PULSE',
        },
        desc: 'Letra B: 4 dedos esticados unidos e polegar dobrado na palma.',
      };
    case 'C':
      return {
        pose: {
          thumb: 'HALF',
          index: 'HALF',
          middle: 'HALF',
          ring: 'HALF',
          pinky: 'HALF',
          tiltDeg: -10,
          offsetX: 0,
          offsetY: 0,
          motionClass: 'SPELL_PULSE',
        },
        desc: 'Letra C: Dedos curvados formando um semicírculo "C".',
      };
    case 'D':
    case '1':
      return {
        pose: {
          thumb: 'HALF',
          index: 'EXTENDED',
          middle: 'CURLED',
          ring: 'CURLED',
          pinky: 'CURLED',
          tiltDeg: 0,
          offsetX: 0,
          offsetY: -4,
          motionClass: 'SPELL_PULSE',
        },
        desc:
          ch === '1'
            ? 'Número 1: Indicador erguido.'
            : 'Letra D: Indicador erguido e restantes dedos unidos ao polegar.',
      };
    case 'E':
      return {
        pose: {
          thumb: 'CURLED',
          index: 'HALF',
          middle: 'HALF',
          ring: 'HALF',
          pinky: 'HALF',
          tiltDeg: 0,
          offsetX: 0,
          offsetY: 2,
          motionClass: 'SPELL_PULSE',
        },
        desc: 'Letra E: Pontas dos dedos flexionadas e polegar recolhido.',
      };
    case 'F':
    case '9':
      return {
        pose: {
          thumb: 'HALF',
          index: 'HALF',
          middle: 'EXTENDED',
          ring: 'EXTENDED',
          pinky: 'EXTENDED',
          tiltDeg: 4,
          offsetX: 0,
          offsetY: 0,
          motionClass: 'SPELL_PULSE',
        },
        desc: `Sinal ${ch}: Indicador e polegar unidos, 3 dedos estendidos.`,
      };
    case 'G':
      return {
        pose: {
          thumb: 'EXTENDED',
          index: 'EXTENDED',
          middle: 'CURLED',
          ring: 'CURLED',
          pinky: 'CURLED',
          tiltDeg: -14,
          offsetX: 0,
          offsetY: 0,
          motionClass: 'SPELL_PULSE',
        },
        desc: 'Letra G: Polegar e indicador apontados.',
      };
    case 'I':
    case 'J':
      return {
        pose: {
          thumb: 'CURLED',
          index: 'CURLED',
          middle: 'CURLED',
          ring: 'CURLED',
          pinky: 'EXTENDED',
          tiltDeg: ch === 'J' ? 16 : 0,
          offsetX: 0,
          offsetY: 0,
          motionClass: ch === 'J' ? 'WAVE' : 'SPELL_PULSE',
        },
        desc: `Letra ${ch}: Dedo mindinho estendido.`,
      };
    case 'L':
      return {
        pose: {
          thumb: 'EXTENDED',
          index: 'EXTENDED',
          middle: 'CURLED',
          ring: 'CURLED',
          pinky: 'CURLED',
          tiltDeg: 6,
          offsetX: 0,
          offsetY: -2,
          motionClass: 'SPELL_PULSE',
        },
        desc: 'Letra L: Polegar e indicador em ângulo de 90 graus ("L").',
      };
    case 'O':
    case '0':
      return {
        pose: {
          thumb: 'HALF',
          index: 'HALF',
          middle: 'HALF',
          ring: 'HALF',
          pinky: 'HALF',
          tiltDeg: 0,
          offsetX: 0,
          offsetY: 2,
          motionClass: 'SPELL_PULSE',
        },
        desc: `Sinal ${ch}: Dedos arredondados formando um círculo.`,
      };
    case 'U':
    case 'V':
    case '2':
      return {
        pose: {
          thumb: 'CURLED',
          index: 'EXTENDED',
          middle: 'EXTENDED',
          ring: 'CURLED',
          pinky: 'CURLED',
          tiltDeg: 4,
          offsetX: 0,
          offsetY: -4,
          motionClass: 'SPELL_PULSE',
        },
        desc: `Sinal ${ch}: Indicador e dedo médio erguidos.`,
      };
    case 'W':
    case '3':
      return {
        pose: {
          thumb: 'CURLED',
          index: 'EXTENDED',
          middle: 'EXTENDED',
          ring: 'EXTENDED',
          pinky: 'CURLED',
          tiltDeg: 4,
          offsetX: 0,
          offsetY: -4,
          motionClass: 'SPELL_PULSE',
        },
        desc: `Sinal ${ch}: 3 dedos centrais estendidos.`,
      };
    case '4':
      return {
        pose: {
          thumb: 'CURLED',
          index: 'EXTENDED',
          middle: 'EXTENDED',
          ring: 'EXTENDED',
          pinky: 'EXTENDED',
          tiltDeg: 0,
          offsetX: 0,
          offsetY: -4,
          motionClass: 'SPELL_PULSE',
        },
        desc: 'Número 4: 4 dedos erguidos e polegar recolhido.',
      };
    case '5':
      return {
        pose: {
          thumb: 'EXTENDED',
          index: 'EXTENDED',
          middle: 'EXTENDED',
          ring: 'EXTENDED',
          pinky: 'EXTENDED',
          tiltDeg: 0,
          offsetX: 0,
          offsetY: -4,
          motionClass: 'SPELL_PULSE',
        },
        desc: 'Número 5: Todos os 5 dedos abertos.',
      };
    case '6':
      return {
        pose: {
          thumb: 'EXTENDED',
          index: 'CURLED',
          middle: 'CURLED',
          ring: 'CURLED',
          pinky: 'CURLED',
          tiltDeg: -18,
          offsetX: 0,
          offsetY: 0,
          motionClass: 'SPELL_PULSE',
        },
        desc: 'Número 6: Polegar destacado em configuração numérica.',
      };
    case '7':
      return {
        pose: {
          thumb: 'EXTENDED',
          index: 'EXTENDED',
          middle: 'CURLED',
          ring: 'CURLED',
          pinky: 'CURLED',
          tiltDeg: -14,
          offsetX: 0,
          offsetY: 0,
          motionClass: 'SPELL_PULSE',
        },
        desc: 'Número 7: Polegar e indicador em formato "7".',
      };
    case '8':
      return {
        pose: {
          thumb: 'EXTENDED',
          index: 'EXTENDED',
          middle: 'EXTENDED',
          ring: 'CURLED',
          pinky: 'CURLED',
          tiltDeg: 0,
          offsetX: 0,
          offsetY: 0,
          motionClass: 'SPELL_PULSE',
        },
        desc: 'Número 8: Polegar, indicador e médio ativos.',
      };
    case 'Y':
      return {
        pose: {
          thumb: 'EXTENDED',
          index: 'CURLED',
          middle: 'CURLED',
          ring: 'CURLED',
          pinky: 'EXTENDED',
          tiltDeg: 10,
          offsetX: 0,
          offsetY: 0,
          motionClass: 'WAVE',
        },
        desc: 'Letra Y: Polegar e mindinho estendidos.',
      };
    default:
      return {
        pose: {
          thumb: 'EXTENDED',
          index: 'EXTENDED',
          middle: 'HALF',
          ring: 'CURLED',
          pinky: 'CURLED',
          tiltDeg: 6,
          offsetX: 0,
          offsetY: 0,
          motionClass: 'SPELL_PULSE',
        },
        desc: `Sinal Libras "${ch}": Configuração manual articulada do Buddy.`,
      };
  }
}

// Helper to speak in any foreign language via Native Bridge or Web Speech API
export function speakInForeignLanguage(
  text: string,
  langCode: TranslatorLanguageCode | 'pt-PT',
  rate = 1.05
): void {
  if (!text || !text.trim()) return;
  const clean = text.trim();

  if (typeof window !== 'undefined') {
    const winAny = window as unknown as {
      BuddyNativeOverlay?: {
        speakTextWithLang?: (txt: string, lang: string, rate: number) => void;
        speakText?: (txt: string) => void;
      };
    };
    if (typeof winAny.BuddyNativeOverlay?.speakTextWithLang === 'function') {
      try {
        winAny.BuddyNativeOverlay.speakTextWithLang(clean, langCode, rate);
        return;
      } catch {
        // fallback to Web Speech API
      }
    }
    if (
      langCode === 'pt-PT' &&
      typeof winAny.BuddyNativeOverlay?.speakText === 'function'
    ) {
      try {
        winAny.BuddyNativeOverlay.speakText(clean);
        return;
      } catch {
        // fallback
      }
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(clean);
        utter.lang = langCode;
        utter.rate = rate;
        utter.pitch = 0.98;
        const voices = window.speechSynthesis.getVoices();
        const targetPrefix = langCode.split('-')[0].toLowerCase();
        const matchedVoice = voices.find((v) =>
          v.lang.toLowerCase().startsWith(targetPrefix)
        );
        if (matchedVoice) {
          utter.voice = matchedVoice;
        }
        window.speechSynthesis.speak(utter);
      } catch {
        // ignore
      }
    }
  }
}

// Smart translation function: checks instant offline dictionary first, then calls MyMemory free translation API
async function translateTextBetweenLanguages(
  text: string,
  sourceLang: string,
  targetLang: TranslatorLanguageCode | 'pt-PT'
): Promise<string> {
  const clean = text.trim();
  if (!clean) return '';

  const lower = clean.toLowerCase();

  // Check preset phrases if translating from PT to Foreign
  if (sourceLang === 'pt' && targetLang !== 'pt-PT') {
    const exactPreset = DOORSTEP_PRESET_PHRASES.find(
      (p) =>
        p.ptText.toLowerCase() === lower ||
        (lower.includes('encomenda') && p.id === 'HELLO_ORDER') ||
        (lower.includes('pin') && p.id === 'NEED_PIN') ||
        (lower.includes('codigo') && p.id === 'NEED_PIN') ||
        (lower.includes('código') && p.id === 'NEED_PIN') ||
        (lower.includes('porta') && p.id === 'CONFIRM_DOOR') ||
        (lower.includes('andar') && p.id === 'CONFIRM_DOOR') ||
        (lower.includes('dinheiro') && p.id === 'CASH_PAYMENT') ||
        (lower.includes('obrigad') && p.id === 'THANK_YOU')
    );
    if (exactPreset) {
      return exactPreset.translations[targetLang];
    }
  }

  // Check preset customer replies if translating from Foreign to PT
  if (targetLang === 'pt-PT') {
    for (const item of CUSTOMER_FOREIGN_QUICK_REPLIES) {
      const vals = Object.values(item.byLang).map((v) => v.toLowerCase());
      if (vals.includes(lower)) {
        return item.ptMeaning;
      }
    }
  }

  // Live API translation via MyMemory
  try {
    const srcPair = sourceLang.split('-')[0];
    const tgtPair =
      targetLang === 'pt-PT'
        ? 'pt'
        : targetLang === 'zh-CN'
          ? 'zh-CN'
          : targetLang.split('-')[0];
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      clean
    )}&langpair=${srcPair}|${tgtPair}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as {
        responseData?: { translatedText?: string };
      };
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch {
    // fallback below
  }

  return clean;
}

// ============================================================================
// 3D-STYLED BUDDY ROBOTIC HAND SVG COMPONENT (GLOSSY WHITE + CARBON + #00E5FF)
// ============================================================================
const Buddy3DRoboticHandSvg: React.FC<{
  side: 'LEFT' | 'RIGHT';
  pose: RoboticHandPose;
  activePulse?: boolean;
}> = ({ side, pose, activePulse = true }) => {
  const isLeft = side === 'LEFT';
  const uid = `hand_${side}`;

  const getFingerLength = (
    finger: 'index' | 'middle' | 'ring' | 'pinky',
    state: FingerState
  ): { yTop: number; height: number; jointY1: number; jointY2: number; tipGlow: boolean } => {
    const baseHeights = {
      index: 54,
      middle: 62,
      ring: 56,
      pinky: 44,
    };
    const fullH = baseHeights[finger];
    if (state === 'EXTENDED') {
      const yTop = 78 - fullH;
      return {
        yTop,
        height: fullH,
        jointY1: yTop + fullH * 0.34,
        jointY2: yTop + fullH * 0.68,
        tipGlow: true,
      };
    }
    if (state === 'HALF') {
      const h = Math.round(fullH * 0.6);
      const yTop = 80 - h;
      return {
        yTop,
        height: h,
        jointY1: yTop + h * 0.45,
        jointY2: yTop + h * 0.82,
        tipGlow: false,
      };
    }
    // CURLED into palm
    const h = Math.round(fullH * 0.36);
    const yTop = 76;
    return {
      yTop,
      height: h,
      jointY1: yTop + h * 0.5,
      jointY2: yTop + h * 0.85,
      tipGlow: false,
    };
  };

  const fingers: {
    key: 'index' | 'middle' | 'ring' | 'pinky';
    x: number;
    width: number;
    state: FingerState;
  }[] = isLeft
    ? [
        { key: 'pinky', x: 26, width: 15, state: pose.pinky },
        { key: 'ring', x: 44, width: 16, state: pose.ring },
        { key: 'middle', x: 63, width: 17, state: pose.middle },
        { key: 'index', x: 83, width: 16, state: pose.index },
      ]
    : [
        { key: 'index', x: 31, width: 16, state: pose.index },
        { key: 'middle', x: 50, width: 17, state: pose.middle },
        { key: 'ring', x: 70, width: 16, state: pose.ring },
        { key: 'pinky', x: 89, width: 15, state: pose.pinky },
      ];

  // Thumb geometry
  const thumbExtended = pose.thumb === 'EXTENDED';
  const thumbHalf = pose.thumb === 'HALF';
  const thumbTransform = isLeft
    ? thumbExtended
      ? 'translate(96, 86) rotate(38)'
      : thumbHalf
        ? 'translate(88, 92) rotate(18)'
        : 'translate(76, 98) rotate(-28)'
    : thumbExtended
      ? 'translate(22, 74) rotate(-38)'
      : thumbHalf
        ? 'translate(30, 84) rotate(-18)'
        : 'translate(44, 98) rotate(28)';

  const animStyle: React.CSSProperties = {
    transform: `translate(${pose.offsetX}px, ${pose.offsetY}px) rotate(${pose.tiltDeg}deg)`,
    transition: 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  return (
    <div
      style={animStyle}
      className={`relative flex flex-col items-center select-none ${
        pose.motionClass === 'WAVE'
          ? 'animate-bounce'
          : pose.motionClass === 'TAP_PIN' || pose.motionClass === 'SPELL_PULSE'
            ? 'animate-pulse'
            : ''
      }`}
    >
      <svg
        viewBox="0 0 130 175"
        className="w-32 h-40 sm:w-36 sm:h-44 drop-shadow-[0_6px_18px_rgba(0,229,255,0.28)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`${uid}_whiteArmor`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id={`${uid}_carbon`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#090D16" />
          </linearGradient>
          <radialGradient id={`${uid}_neonCore`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E0FFFF" />
            <stop offset="45%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.15" />
          </radialGradient>
        </defs>

        {/* Mechanical Carbon Knuckle Base Shadow */}
        <rect
          x="26"
          y="72"
          width="76"
          height="66"
          rx="26"
          fill={`url(#${uid}_carbon)`}
          stroke="#00E5FF"
          strokeWidth="1.5"
          strokeOpacity="0.55"
        />

        {/* 4 Articulated Robotic Fingers (Index, Middle, Ring, Pinky) */}
        {fingers.map((f) => {
          const geom = getFingerLength(f.key, f.state);
          return (
            <g key={f.key}>
              {/* Dark Carbon Joint Socket */}
              <rect
                x={f.x + 1}
                y={70}
                width={f.width - 2}
                height={12}
                rx={5}
                fill="#090D16"
                stroke="#334155"
                strokeWidth="1"
              />
              {/* Glossy White 3D Finger Segment */}
              <rect
                x={f.x}
                y={geom.yTop}
                width={f.width}
                height={geom.height}
                rx={f.width / 2}
                fill={`url(#${uid}_whiteArmor)`}
                stroke="#090D16"
                strokeWidth="2"
              />
              {/* Carbon Articulation Lines */}
              <line
                x1={f.x + 2}
                y1={geom.jointY1}
                x2={f.x + f.width - 2}
                y2={geom.jointY1}
                stroke="#0F172A"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <line
                x1={f.x + 2}
                y1={geom.jointY2}
                x2={f.x + f.width - 2}
                y2={geom.jointY2}
                stroke="#0F172A"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Neon Blue Fingertip Sensor Pad when extended */}
              {geom.tipGlow && (
                <circle
                  cx={f.x + f.width / 2}
                  cy={geom.yTop + 7}
                  r={3.2}
                  fill="#00E5FF"
                />
              )}
            </g>
          );
        })}

        {/* Glossy White Ergonomic 3D Palm Plate */}
        <rect
          x="24"
          y="76"
          width="80"
          height="62"
          rx="26"
          fill={`url(#${uid}_whiteArmor)`}
          stroke="#090D16"
          strokeWidth="2.4"
        />

        {/* Inner Armor Panel Contour Line */}
        <rect
          x="32"
          y="84"
          width="64"
          height="46"
          rx="18"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="1.2"
          strokeDasharray="4 2"
        />

        {/* Glowing Light Neon Blue (#00E5FF) Palm Energy Node (DB Tech Core) */}
        <circle
          cx="64"
          cy="107"
          r="15"
          fill="#090D16"
          stroke="#00E5FF"
          strokeWidth="2.2"
        />
        <circle
          cx="64"
          cy="107"
          r={activePulse ? '9.5' : '7.5'}
          fill={`url(#${uid}_neonCore)`}
        />
        <text
          x="64"
          y="110.5"
          textAnchor="middle"
          fill="#05070B"
          fontSize="8.5"
          fontWeight="900"
        >
          DB
        </text>

        {/* Articulated 3D Robotic Thumb */}
        <g transform={thumbTransform}>
          <rect
            x="0"
            y="0"
            width="18"
            height="42"
            rx="9"
            fill={`url(#${uid}_whiteArmor)`}
            stroke="#090D16"
            strokeWidth="2.2"
          />
          <line
            x1="3"
            y1="18"
            x2="15"
            y2="18"
            stroke="#0F172A"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="9" cy="8" r="3.2" fill="#00E5FF" />
        </g>

        {/* Buddy Robotic Wrist Cuff with Glowing Light Neon Blue (#00E5FF) Ring */}
        <rect
          x="34"
          y="136"
          width="60"
          height="24"
          rx="11"
          fill="#090D16"
          stroke="#00E5FF"
          strokeWidth="2.4"
        />
        <line
          x1="42"
          y1="148"
          x2="86"
          y2="148"
          stroke="#00E5FF"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          backgroundColor: '#0B0F17',
          borderColor: 'rgba(0, 229, 255, 0.45)',
          color: '#00E5FF',
        }}
        className="rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase -mt-1"
      >
        {isLeft ? 'Mão Esq.' : 'Mão Dir.'}
      </span>
    </div>
  );
};

// ============================================================================
// MAIN MODAL: SIMULTANEOUS TRANSLATOR & LIBRAS ("MÃOS DO BUDDY")
// ============================================================================
export const TranslatorAndSignLanguageModal: React.FC = () => {
  const {
    isTranslatorModalOpen,
    setIsTranslatorModalOpen,
    translatorActiveTab,
    setTranslatorActiveTab,
    translatorTargetLang,
    setTranslatorTargetLang,
    themeMode,
    speakTextPt,
    cancelSpeechNow,
  } = useEstafetas();

  const isDaylight = themeMode === 'DAYLIGHT';

  // Tab 1: Simultaneous Translator State
  const [courierPtText, setCourierPtText] = useState<string>(
    'Olá! Trouxe a sua encomenda.'
  );
  const [translatedCustomerText, setTranslatedCustomerText] = useState<string>(
    'Hello! I have brought your delivery order.'
  );
  const [customerOriginalText, setCustomerOriginalText] = useState<string>('');
  const [customerTranslatedPtText, setCustomerTranslatedPtText] =
    useState<string>('');
  const [isListeningCourierMic, setIsListeningCourierMic] =
    useState<boolean>(false);
  const [isListeningCustomerMic, setIsListeningCustomerMic] =
    useState<boolean>(false);
  const [isListeningLibrasMic, setIsListeningLibrasMic] =
    useState<boolean>(false);
  const [isTranslatingLoading, setIsTranslatingLoading] =
    useState<boolean>(false);
  const [isCardFlippedForCustomer, setIsCardFlippedForCustomer] =
    useState<boolean>(false);
  const [isQuickPhrasesOpen, setIsQuickPhrasesOpen] = useState<boolean>(false);
  const [isCustomerRepliesOpen, setIsCustomerRepliesOpen] =
    useState<boolean>(false);

  // Tab 2: Libras — Mãos do Buddy State
  const [activeCoreSignId, setActiveCoreSignId] =
    useState<LibrasCoreSignId>('OLA');
  const [activeFingerspellChar, setActiveFingerspellChar] = useState<
    string | null
  >(null);
  const [customLibrasInput, setCustomLibrasInput] = useState<string>('');
  const [isPlayingSpellingSequence, setIsPlayingSpellingSequence] =
    useState<boolean>(false);
  const [spellingProgressIndex, setSpellingProgressIndex] = useState<number>(0);
  const [customerLibrasReplyBanner, setCustomerLibrasReplyBanner] = useState<
    string | null
  >(null);
  const [pinDigits, setPinDigits] = useState<string>('');
  const [pinConfirmedBanner, setPinConfirmedBanner] = useState<boolean>(false);

  const speechRecRef = useRef<{
    stop: () => void;
    abort?: () => void;
  } | null>(null);
  const spellingTimerRef = useRef<number | null>(null);

  const selectedLangOption =
    TRANSLATOR_LANGUAGES.find((l) => l.code === translatorTargetLang) ||
    TRANSLATOR_LANGUAGES[0];

  // Re-translate current courier phrase whenever target language changes
  useEffect(() => {
    if (!isTranslatorModalOpen) return;
    let cancelled = false;
    const updateTranslation = async () => {
      const res = await translateTextBetweenLanguages(
        courierPtText,
        'pt',
        translatorTargetLang
      );
      if (!cancelled) {
        setTranslatedCustomerText(res);
      }
    };
    void updateTranslation();
    return () => {
      cancelled = true;
    };
  }, [translatorTargetLang, courierPtText, isTranslatorModalOpen]);

  // Cleanup timers/speech on close
  const handleCloseModal = useCallback(() => {
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
        speechRecRef.current.abort?.();
      } catch {
        // ignore
      }
      speechRecRef.current = null;
    }
    if (spellingTimerRef.current !== null) {
      window.clearInterval(spellingTimerRef.current);
      spellingTimerRef.current = null;
    }
    setIsListeningCourierMic(false);
    setIsListeningCustomerMic(false);
    setIsListeningLibrasMic(false);
    setIsPlayingSpellingSequence(false);
    stopBuddySpeech();
    cancelSpeechNow();
    setIsTranslatorModalOpen(false);
  }, [cancelSpeechNow, setIsTranslatorModalOpen]);

  // Translate and speak Courier -> Customer
  const handleTranslateAndSpeakCourierPt = useCallback(
    async (ptPhrase: string, autoSpeakForeign = true) => {
      const clean = ptPhrase.trim();
      if (!clean) return;
      setCourierPtText(clean);
      setIsTranslatingLoading(true);
      const translated = await translateTextBetweenLanguages(
        clean,
        'pt',
        translatorTargetLang
      );
      setTranslatedCustomerText(translated);
      setIsTranslatingLoading(false);
      if (autoSpeakForeign) {
        speakInForeignLanguage(translated, translatorTargetLang, 1.02);
      }
    },
    [translatorTargetLang]
  );

  // Translate and speak Customer -> Courier (Portuguese at 1.15x)
  const handleTranslateAndSpeakCustomerForeign = useCallback(
    async (foreignPhrase: string) => {
      const clean = foreignPhrase.trim();
      if (!clean) return;
      setCustomerOriginalText(clean);
      setIsTranslatingLoading(true);
      const ptTranslation = await translateTextBetweenLanguages(
        clean,
        translatorTargetLang,
        'pt-PT'
      );
      setCustomerTranslatedPtText(ptTranslation);
      setIsTranslatingLoading(false);
      speakTextPt(`O cliente disse: ${ptTranslation}`);
    },
    [speakTextPt, translatorTargetLang]
  );

  // Play a fingerspelling sequence (A-Z / 0-9) on Buddy's 3D Robotic Hands
  const startFingerspellingWord = useCallback((wordRaw: string) => {
    const cleanChars = wordRaw
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]/g, '')
      .split('');

    if (cleanChars.length === 0) return;

    if (spellingTimerRef.current !== null) {
      window.clearInterval(spellingTimerRef.current);
      spellingTimerRef.current = null;
    }

    setIsPlayingSpellingSequence(true);
    setSpellingProgressIndex(0);
    setActiveFingerspellChar(cleanChars[0]);

    let idx = 0;
    spellingTimerRef.current = window.setInterval(() => {
      idx += 1;
      if (idx >= cleanChars.length) {
        if (spellingTimerRef.current !== null) {
          window.clearInterval(spellingTimerRef.current);
          spellingTimerRef.current = null;
        }
        setIsPlayingSpellingSequence(false);
        return;
      }
      setSpellingProgressIndex(idx);
      setActiveFingerspellChar(cleanChars[idx]);
    }, 720);
  }, []);

  // Match typed/spoken Portuguese phrase to a Core Libras Sign or fingerspell it
  const handleTriggerLibrasFromText = useCallback(
    (textRaw: string) => {
      const clean = textRaw.trim();
      if (!clean) return;
      const lower = clean.toLowerCase();

      if (
        lower.includes('pin') ||
        lower.includes('código') ||
        lower.includes('codigo') ||
        lower.includes('senha')
      ) {
        setActiveFingerspellChar(null);
        setActiveCoreSignId('CODIGO_PIN');
        return;
      }
      if (
        lower.includes('encomenda') ||
        lower.includes('pedido') ||
        lower.includes('entrega')
      ) {
        setActiveFingerspellChar(null);
        setActiveCoreSignId('ENCOMENDA');
        return;
      }
      if (
        lower.includes('obrigad') ||
        lower.includes('bom dia') ||
        lower.includes('apetite')
      ) {
        setActiveFingerspellChar(null);
        setActiveCoreSignId('OBRIGADO');
        return;
      }
      if (
        lower.includes('minuto') ||
        lower.includes('aguard') ||
        lower.includes('esper')
      ) {
        setActiveFingerspellChar(null);
        setActiveCoreSignId('AGUARDAR');
        return;
      }
      if (
        lower.includes('confirm') ||
        lower.includes('porta') ||
        lower.includes('ok')
      ) {
        setActiveFingerspellChar(null);
        setActiveCoreSignId('CONFIRMAR');
        return;
      }
      // Otherwise fingerspell the custom word/number!
      startFingerspellingWord(clean);
    },
    [startFingerspellingWord]
  );

  // Register Native Android Bridge callbacks for multi-language SpeechRecognizer
  useEffect(() => {
    if (!isTranslatorModalOpen || typeof window === 'undefined') return;
    const winAny = window as unknown as {
      onBuddyTranslatorTranscript?: (
        text: string,
        isFinal: boolean,
        role: string,
        langCode: string
      ) => void;
      onBuddyTranslatorListeningEnded?: () => void;
    };

    winAny.onBuddyTranslatorTranscript = (
      text: string,
      isFinal: boolean,
      role: string
    ) => {
      const clean = (text || '').trim();
      if (!clean) return;
      if (role === 'COURIER_PT') {
        setCourierPtText(clean);
        if (isFinal) {
          setIsListeningCourierMic(false);
          void handleTranslateAndSpeakCourierPt(clean, true);
        }
      } else if (role === 'CUSTOMER_FOREIGN') {
        setCustomerOriginalText(clean);
        if (isFinal) {
          setIsListeningCustomerMic(false);
          void handleTranslateAndSpeakCustomerForeign(clean);
        }
      } else if (role === 'LIBRAS_VOICE') {
        setCustomLibrasInput(clean);
        if (isFinal) {
          setIsListeningLibrasMic(false);
          handleTriggerLibrasFromText(clean);
        }
      }
    };

    winAny.onBuddyTranslatorListeningEnded = () => {
      setIsListeningCourierMic(false);
      setIsListeningCustomerMic(false);
      setIsListeningLibrasMic(false);
    };

    return () => {
      delete winAny.onBuddyTranslatorTranscript;
      delete winAny.onBuddyTranslatorListeningEnded;
    };
  }, [
    isTranslatorModalOpen,
    handleTranslateAndSpeakCourierPt,
    handleTranslateAndSpeakCustomerForeign,
    handleTriggerLibrasFromText,
  ]);

  // Start Native Android SpeechRecognizer or Web Speech API for Courier (pt-PT), Customer (targetLang), or Libras (pt-PT)
  const startVoiceRecognition = (
    role: 'COURIER_PT' | 'CUSTOMER_FOREIGN' | 'LIBRAS_VOICE'
  ) => {
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {
        // ignore
      }
      speechRecRef.current = null;
    }

    const langForRole =
      role === 'CUSTOMER_FOREIGN' ? translatorTargetLang : 'pt-PT';

    const winAny = window as unknown as {
      BuddyNativeOverlay?: {
        startTranslatorVoice?: (langCode: string, role: string) => void;
      };
      SpeechRecognition?: new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onresult: ((ev: unknown) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onresult: ((ev: unknown) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
    };

    // 1. Prefer Native Android SpeechRecognizer Bridge when running inside the APK
    if (typeof winAny.BuddyNativeOverlay?.startTranslatorVoice === 'function') {
      try {
        setIsListeningCourierMic(role === 'COURIER_PT');
        setIsListeningCustomerMic(role === 'CUSTOMER_FOREIGN');
        setIsListeningLibrasMic(role === 'LIBRAS_VOICE');
        winAny.BuddyNativeOverlay.startTranslatorVoice(langForRole, role);
        return;
      } catch {
        // fallback below
      }
    }

    const SpeechRecClass =
      winAny.SpeechRecognition || winAny.webkitSpeechRecognition;

    if (!SpeechRecClass) {
      // Fallback if Web SpeechRecognition isn't exposed in browser
      if (role === 'COURIER_PT') {
        void handleTranslateAndSpeakCourierPt(
          courierPtText || 'Olá! Trouxe a sua encomenda.',
          true
        );
      } else if (role === 'CUSTOMER_FOREIGN') {
        const sampleReply =
          CUSTOMER_FOREIGN_QUICK_REPLIES[0].byLang[translatorTargetLang];
        void handleTranslateAndSpeakCustomerForeign(sampleReply);
      } else {
        handleTriggerLibrasFromText(customLibrasInput || 'ENCOMENDA');
      }
      return;
    }

    try {
      const rec = new SpeechRecClass();
      rec.lang = langForRole;
      rec.continuous = false;
      rec.interimResults = true;

      setIsListeningCourierMic(role === 'COURIER_PT');
      setIsListeningCustomerMic(role === 'CUSTOMER_FOREIGN');
      setIsListeningLibrasMic(role === 'LIBRAS_VOICE');

      let latestTranscript = '';
      rec.onresult = (event: unknown) => {
        const ev = event as {
          results?: {
            length: number;
            [idx: number]: { 0?: { transcript?: string } };
          };
        };
        if (!ev.results) return;
        let combined = '';
        for (let i = 0; i < ev.results.length; i++) {
          combined += ev.results[i]?.[0]?.transcript || '';
        }
        latestTranscript = combined.trim();
        if (latestTranscript) {
          if (role === 'COURIER_PT') {
            setCourierPtText(latestTranscript);
          } else if (role === 'CUSTOMER_FOREIGN') {
            setCustomerOriginalText(latestTranscript);
          } else {
            setCustomLibrasInput(latestTranscript);
          }
        }
      };

      rec.onerror = () => {
        setIsListeningCourierMic(false);
        setIsListeningCustomerMic(false);
        setIsListeningLibrasMic(false);
      };

      rec.onend = () => {
        setIsListeningCourierMic(false);
        setIsListeningCustomerMic(false);
        setIsListeningLibrasMic(false);
        if (latestTranscript) {
          if (role === 'COURIER_PT') {
            void handleTranslateAndSpeakCourierPt(latestTranscript, true);
          } else if (role === 'CUSTOMER_FOREIGN') {
            void handleTranslateAndSpeakCustomerForeign(latestTranscript);
          } else {
            handleTriggerLibrasFromText(latestTranscript);
          }
        }
      };

      speechRecRef.current = rec;
      rec.start();
    } catch {
      setIsListeningCourierMic(false);
      setIsListeningCustomerMic(false);
      setIsListeningLibrasMic(false);
    }
  };

  if (!isTranslatorModalOpen) return null;

  // Compute active hand poses for Tab 2 (Libras)
  const currentCoreSign = LIBRAS_CORE_SIGNS[activeCoreSignId];
  const spellingInfo = activeFingerspellChar
    ? getFingerspellingRightHandPose(activeFingerspellChar)
    : null;

  const leftHandPose: RoboticHandPose = spellingInfo
    ? {
        thumb: 'EXTENDED',
        index: 'HALF',
        middle: 'HALF',
        ring: 'CURLED',
        pinky: 'CURLED',
        tiltDeg: -6,
        offsetX: -6,
        offsetY: 6,
        motionClass: 'WAIT_PULSE',
      }
    : currentCoreSign.leftHand;

  const rightHandPose: RoboticHandPose = spellingInfo
    ? spellingInfo.pose
    : currentCoreSign.rightHand;

  // Strict 2-Color Theme tokens
  const surfaceBg = isDaylight ? '#FFFFFF' : '#05070B';
  const cardBg = isDaylight ? '#F8FAFC' : '#0B0F17';
  const innerBg = isDaylight ? '#FFFFFF' : '#111827';
  const primaryText = isDaylight ? '#090D16' : '#FFFFFF';
  const secondaryText = isDaylight ? '#475569' : '#94A3B8';
  const borderCol = isDaylight ? '#CBD5E1' : 'rgba(0, 229, 255, 0.32)';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tradutor Simultâneo e Libras Mãos do Buddy"
      style={{ backgroundColor: 'rgba(5, 7, 11, 0.88)' }}
      className="fixed inset-0 z-[110] backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div
        style={{
          backgroundColor: surfaceBg,
          borderColor: '#00E5FF',
          color: primaryText,
        }}
        className="w-full max-w-[440px] max-h-[94dvh] overflow-y-auto rounded-3xl border-2 p-3.5 sm:p-4 space-y-3.5 shadow-[0_0_35px_rgba(0,229,255,0.22)]"
      >
        {/* =================================================================
            HEADER + TOP TAB SWITCHER (🌍 Tradutor Simultâneo | 🤟 Libras)
            ================================================================= */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              style={{
                backgroundColor: '#0B0F17',
                borderColor: '#00E5FF',
                color: '#00E5FF',
              }}
              className="h-9 w-9 rounded-2xl border flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,229,255,0.25)]"
            >
              {translatorActiveTab === 'TRADUTOR' ? (
                <Globe className="h-5 w-5" />
              ) : (
                <Hand className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0">
              <h2
                style={{ color: primaryText }}
                className="text-base font-black tracking-tight leading-tight truncate"
              >
                {translatorActiveTab === 'TRADUTOR'
                  ? '🌍 Tradutor Simultâneo'
                  : '🤟 Libras — Mãos do Buddy'}
              </h2>
              <p style={{ color: secondaryText }} className="text-xs font-bold">
                Comunicação Instantânea Estafeta ↔ Cliente
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            style={{
              backgroundColor: '#0B0F17',
              borderColor: '#00E5FF',
              color: '#00E5FF',
            }}
            className="rounded-xl border px-3 py-1.5 text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
            <span>Fechar</span>
          </button>
        </div>

        {/* 2-Tab Selector Pill Bar */}
        <div
          style={{ backgroundColor: cardBg, borderColor: borderCol }}
          className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl border"
        >
          <button
            type="button"
            onClick={() => {
              stopBuddySpeech();
              setTranslatorActiveTab('TRADUTOR');
            }}
            style={
              translatorActiveTab === 'TRADUTOR'
                ? {
                    backgroundColor: '#0B0F17',
                    borderColor: '#00E5FF',
                    color: '#00E5FF',
                  }
                : {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    color: secondaryText,
                  }
            }
            className="rounded-xl border py-2.5 px-2 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition"
          >
            <span>🌍 Tradutor Voz/Texto</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopBuddySpeech();
              setTranslatorActiveTab('LIBRAS');
            }}
            style={
              translatorActiveTab === 'LIBRAS'
                ? {
                    backgroundColor: '#0B0F17',
                    borderColor: '#00E5FF',
                    color: '#00E5FF',
                  }
                : {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    color: secondaryText,
                  }
            }
            className="rounded-xl border py-2.5 px-2 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition"
          >
            <span>🤟 Libras (Mãos do Buddy)</span>
          </button>
        </div>

        {/* =================================================================
            TAB 1: SIMULTANEOUS VOICE & TEXT TRANSLATOR (8 LANGUAGES)
            ================================================================= */}
        {translatorActiveTab === 'TRADUTOR' && (
          <div className="space-y-3">
            {/* 1. Compact Horizontal Scrollable Pill Row for Idioma do Cliente */}
            <div
              style={{ backgroundColor: cardBg, borderColor: borderCol }}
              className="rounded-2xl border p-2.5 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  style={{ color: secondaryText }}
                  className="text-[11px] font-extrabold uppercase tracking-wider"
                >
                  Idioma do Cliente:
                </span>
                <span
                  style={{ color: isDaylight ? '#0284C7' : '#00E5FF' }}
                  className="text-xs font-black truncate"
                >
                  {selectedLangOption.flag} {selectedLangOption.namePt}
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {TRANSLATOR_LANGUAGES.map((lang) => {
                  const isSel = lang.code === translatorTargetLang;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setTranslatorTargetLang(lang.code)}
                      style={
                        isSel
                          ? {
                              backgroundColor: '#0B0F17',
                              borderColor: '#00E5FF',
                              color: '#00E5FF',
                            }
                          : {
                              backgroundColor: innerBg,
                              borderColor: borderCol,
                              color: primaryText,
                            }
                      }
                      className="rounded-xl border py-1.5 px-2.5 text-xs font-extrabold flex items-center gap-1 cursor-pointer transition shrink-0 whitespace-nowrap"
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.namePt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Main Translation Display Card (with 180° Flip Toggle for Doorstep Reading) */}
            <div
              style={{
                backgroundColor: cardBg,
                borderColor: '#00E5FF',
                transform: isCardFlippedForCustomer ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.35s ease',
              }}
              className="rounded-2xl border-2 p-3.5 space-y-2.5 shadow-[0_4px_20px_rgba(0,229,255,0.18)]"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span
                  style={{ color: isDaylight ? '#0284C7' : '#00E5FF' }}
                  className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                >
                  <span>
                    {selectedLangOption.flag} Tradução ({selectedLangOption.namePt})
                  </span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      speakInForeignLanguage(
                        translatedCustomerText,
                        translatorTargetLang,
                        1.02
                      )
                    }
                    style={{
                      backgroundColor: '#0B0F17',
                      borderColor: '#00E5FF',
                      color: '#00E5FF',
                    }}
                    className="rounded-lg border px-2.5 py-1 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>🔊 Ouvir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setIsCardFlippedForCustomer((prev) => !prev)
                    }
                    style={{
                      backgroundColor: isCardFlippedForCustomer
                        ? '#00E5FF'
                        : '#0B0F17',
                      borderColor: '#00E5FF',
                      color: isCardFlippedForCustomer ? '#05070B' : '#00E5FF',
                    }}
                    className="rounded-lg border px-2.5 py-1 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>🔄 Virar Cartão</span>
                  </button>
                </div>
              </div>

              {/* Giant High-Contrast Foreign Text for Customer */}
              <div
                style={{
                  backgroundColor: innerBg,
                  borderColor: borderCol,
                }}
                className="rounded-xl border p-3"
              >
                <p
                  style={{ color: primaryText }}
                  className="text-xl sm:text-2xl font-black leading-snug break-words"
                >
                  {isTranslatingLoading
                    ? 'A traduzir...'
                    : translatedCustomerText}
                </p>
                <p
                  style={{ color: secondaryText }}
                  className="text-xs font-bold mt-1.5"
                >
                  🇵🇹 Original: &ldquo;{courierPtText}&rdquo;
                </p>
              </div>

              {customerTranslatedPtText && (
                <div
                  style={{
                    backgroundColor: innerBg,
                    borderColor: '#00E5FF',
                  }}
                  className="rounded-xl border p-2.5 space-y-1"
                >
                  <span
                    style={{ color: isDaylight ? '#0284C7' : '#00E5FF' }}
                    className="text-[10px] font-extrabold uppercase block"
                  >
                    🗣️ Cliente disse (Traduzido p/ Português):
                  </span>
                  <p
                    style={{ color: primaryText }}
                    className="text-sm font-black"
                  >
                    &ldquo;{customerTranslatedPtText}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* 2 Large Simultaneous Voice Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => startVoiceRecognition('COURIER_PT')}
                style={{
                  backgroundColor: isListeningCourierMic
                    ? '#00E5FF'
                    : '#0B0F17',
                  borderColor: '#00E5FF',
                  color: isListeningCourierMic ? '#05070B' : '#00E5FF',
                }}
                className="rounded-2xl border-2 py-3 px-2.5 text-xs sm:text-sm font-black flex flex-col items-center justify-center gap-1 cursor-pointer shadow-md transition active:scale-95"
              >
                <div className="flex items-center gap-1.5">
                  <Mic className="h-4 w-4 shrink-0" />
                  <span>
                    {isListeningCourierMic
                      ? '🎙️ A Ouvir PT...'
                      : '🎙️ Falar em Português'}
                  </span>
                </div>
                <span className="text-[10px] opacity-85 font-bold">
                  Estafeta → {selectedLangOption.namePt}
                </span>
              </button>

              <button
                type="button"
                onClick={() => startVoiceRecognition('CUSTOMER_FOREIGN')}
                style={{
                  backgroundColor: isListeningCustomerMic
                    ? '#00E5FF'
                    : innerBg,
                  borderColor: '#00E5FF',
                  color: isListeningCustomerMic ? '#05070B' : primaryText,
                }}
                className="rounded-2xl border-2 py-3 px-2.5 text-xs sm:text-sm font-black flex flex-col items-center justify-center gap-1 cursor-pointer shadow-md transition active:scale-95"
              >
                <div className="flex items-center gap-1.5">
                  <Mic className="h-4 w-4 text-[#00E5FF] shrink-0" />
                  <span>
                    {isListeningCustomerMic
                      ? `🎙️ A Ouvir ${selectedLangOption.shortLabel}...`
                      : `🎙️ Ouvir Cliente`}
                  </span>
                </div>
                <span
                  style={{ color: secondaryText }}
                  className="text-[10px] font-bold"
                >
                  {selectedLangOption.namePt} → Português
                </span>
              </button>
            </div>

            {/* 3. Properly Aligned Compact Manual Input Row (100% Inside Card, Never Overflows) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleTranslateAndSpeakCourierPt(courierPtText, true);
              }}
              style={{ backgroundColor: cardBg, borderColor: borderCol }}
              className="w-full rounded-2xl border p-2 flex items-center gap-1.5 overflow-hidden"
            >
              <input
                type="text"
                value={courierPtText}
                onChange={(e) => setCourierPtText(e.target.value)}
                placeholder="Escrever em Português..."
                style={{
                  backgroundColor: innerBg,
                  borderColor: borderCol,
                  color: primaryText,
                }}
                className="min-w-0 flex-1 rounded-xl border px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-[#00E5FF]"
              />
              <button
                type="submit"
                style={{
                  backgroundColor: '#0B0F17',
                  borderColor: '#00E5FF',
                  color: '#00E5FF',
                }}
                className="rounded-xl border px-3 py-2 text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Send className="h-3.5 w-3.5 shrink-0" />
                <span>Traduzir</span>
              </button>
            </form>

            {/* 4. Collapsible Drawer: ⚡ Frases Rápidas de Entrega (Closed by Default) */}
            <div
              style={{ backgroundColor: cardBg, borderColor: borderCol }}
              className="rounded-2xl border overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setIsQuickPhrasesOpen((prev) => !prev)}
                style={{ color: primaryText }}
                className="w-full px-3 py-2.5 text-xs font-extrabold flex items-center justify-between gap-2 cursor-pointer"
              >
                <span>
                  ⚡ Frases Rápidas de Entrega ({DOORSTEP_PRESET_PHRASES.length})
                </span>
                <span
                  style={{ color: isDaylight ? '#0284C7' : '#00E5FF' }}
                  className="text-xs font-black"
                >
                  {isQuickPhrasesOpen ? '▲ Ocultar' : '▼ Abrir'}
                </span>
              </button>

              {isQuickPhrasesOpen && (
                <div className="px-3 pb-3 space-y-1.5 border-t border-slate-500/20 pt-2">
                  {DOORSTEP_PRESET_PHRASES.map((phrase) => (
                    <button
                      key={phrase.id}
                      type="button"
                      onClick={() => {
                        setCourierPtText(phrase.ptText);
                        const foreign =
                          phrase.translations[translatorTargetLang];
                        setTranslatedCustomerText(foreign);
                        speakInForeignLanguage(
                          foreign,
                          translatorTargetLang,
                          1.02
                        );
                      }}
                      style={{
                        backgroundColor: innerBg,
                        borderColor: borderCol,
                        color: primaryText,
                      }}
                      className="w-full rounded-xl border px-3 py-2 text-left flex items-center justify-between gap-2 cursor-pointer transition hover:border-[#00E5FF]"
                    >
                      <span className="text-xs font-extrabold truncate">
                        🇵🇹 {phrase.ptText}
                      </span>
                      <Volume2 className="h-3.5 w-3.5 text-[#00E5FF] shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Collapsible Drawer: 💬 Respostas Rápidas do Cliente (Closed by Default) */}
            <div
              style={{ backgroundColor: cardBg, borderColor: borderCol }}
              className="rounded-2xl border overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setIsCustomerRepliesOpen((prev) => !prev)}
                style={{ color: primaryText }}
                className="w-full px-3 py-2.5 text-xs font-extrabold flex items-center justify-between gap-2 cursor-pointer"
              >
                <span>
                  💬 Respostas Rápidas do Cliente ({selectedLangOption.namePt})
                </span>
                <span
                  style={{ color: isDaylight ? '#0284C7' : '#00E5FF' }}
                  className="text-xs font-black"
                >
                  {isCustomerRepliesOpen ? '▲ Ocultar' : '▼ Abrir'}
                </span>
              </button>

              {isCustomerRepliesOpen && (
                <div className="px-3 pb-3 grid grid-cols-1 gap-1.5 border-t border-slate-500/20 pt-2">
                  {CUSTOMER_FOREIGN_QUICK_REPLIES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        void handleTranslateAndSpeakCustomerForeign(
                          item.byLang[translatorTargetLang]
                        )
                      }
                      style={{
                        backgroundColor: innerBg,
                        borderColor: borderCol,
                        color: primaryText,
                      }}
                      className="w-full rounded-xl border px-3 py-2 text-left text-xs font-bold flex items-center justify-between gap-2 cursor-pointer hover:border-[#00E5FF]"
                    >
                      <span className="truncate">
                        {selectedLangOption.flag}{' '}
                        {item.byLang[translatorTargetLang]}
                      </span>
                      <span
                        style={{ color: isDaylight ? '#0284C7' : '#00E5FF' }}
                        className="text-[10px] font-extrabold shrink-0"
                      >
                        Ouvir PT
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 2: SIGN LANGUAGE SCREEN ("🤟 LIBRAS — MÃOS DO BUDDY")
            ================================================================= */}
        {translatorActiveTab === 'LIBRAS' && (
          <div className="space-y-3">
            {/* 1. Centerpiece Stage: Two Friendly 3D-Styled Buddy Robotic Hands */}
            <div
              style={{
                backgroundColor: isDaylight ? '#F8FAFC' : '#05070B',
                borderColor: '#00E5FF',
              }}
              className="rounded-3xl border-2 p-3.5 space-y-3 shadow-[0_0_28px_rgba(0,229,255,0.22)] relative overflow-hidden"
            >
              {/* Stage Top Status Bar */}
              <div className="flex items-center justify-between gap-2">
                <span
                  style={{
                    backgroundColor: '#0B0F17',
                    borderColor: '#00E5FF',
                    color: '#00E5FF',
                  }}
                  className="rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    {activeFingerspellChar
                      ? `SOLETRAR SINAL: "${activeFingerspellChar}"`
                      : currentCoreSign.badgeTitle}
                  </span>
                </span>

                {activeFingerspellChar && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlayingSpellingSequence(false);
                      setActiveFingerspellChar(null);
                    }}
                    style={{
                      backgroundColor: '#0B0F17',
                      borderColor: '#00E5FF',
                      color: '#00E5FF',
                    }}
                    className="rounded-lg border px-2.5 py-1 text-[11px] font-extrabold cursor-pointer"
                  >
                    Voltar aos Sinais
                  </button>
                )}
              </div>

              {/* Dual 3D Robotic Hands Stage */}
              <div className="flex items-center justify-around py-1 relative">
                <Buddy3DRoboticHandSvg
                  side="LEFT"
                  pose={leftHandPose}
                  activePulse={true}
                />

                {/* Central Active Character / Sign Indicator */}
                {activeFingerspellChar && (
                  <div
                    style={{
                      backgroundColor: '#0B0F17',
                      borderColor: '#00E5FF',
                      color: '#00E5FF',
                    }}
                    className="h-14 w-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-black shadow-[0_0_18px_rgba(0,229,255,0.45)]"
                  >
                    {activeFingerspellChar}
                  </div>
                )}

                <Buddy3DRoboticHandSvg
                  side="RIGHT"
                  pose={rightHandPose}
                  activePulse={true}
                />
              </div>

              {/* Giant High-Contrast Live Caption Banner & Gesture Breakdown */}
              <div
                style={{
                  backgroundColor: innerBg,
                  borderColor: borderCol,
                }}
                className="rounded-2xl border p-3 text-center space-y-1"
              >
                <p
                  style={{ color: primaryText }}
                  className="text-lg sm:text-xl font-black leading-snug"
                >
                  {activeFingerspellChar
                    ? customLibrasInput.trim()
                      ? `A soletrar: "${customLibrasInput.toUpperCase()}" (${
                          spellingProgressIndex + 1
                        })`
                      : `Sinal Manual Libras: "${activeFingerspellChar}"`
                    : currentCoreSign.ptCaption}
                </p>
                <p
                  style={{ color: isDaylight ? '#0284C7' : '#00E5FF' }}
                  className="text-xs font-bold"
                >
                  {spellingInfo
                    ? spellingInfo.desc
                    : currentCoreSign.gestureDescription}
                </p>
              </div>
            </div>

            {/* 2. Core Delivery Signs (6 Expressive 1-Tap Gestures) */}
            <div
              style={{ backgroundColor: cardBg, borderColor: borderCol }}
              className="rounded-2xl border p-3 space-y-2"
            >
              <span
                style={{ color: primaryText }}
                className="text-xs font-extrabold block"
              >
                🤟 Sinais de Entrega com as Mãos do Buddy (1 Toque):
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(LIBRAS_CORE_SIGNS) as LibrasCoreSignId[]).map(
                  (signKey) => {
                    const def = LIBRAS_CORE_SIGNS[signKey];
                    const isSelected =
                      !activeFingerspellChar && activeCoreSignId === signKey;
                    return (
                      <button
                        key={signKey}
                        type="button"
                        onClick={() => {
                          setActiveFingerspellChar(null);
                          setIsPlayingSpellingSequence(false);
                          setActiveCoreSignId(signKey);
                        }}
                        style={
                          isSelected
                            ? {
                                backgroundColor: '#0B0F17',
                                borderColor: '#00E5FF',
                                color: '#00E5FF',
                              }
                            : {
                                backgroundColor: innerBg,
                                borderColor: borderCol,
                                color: primaryText,
                              }
                        }
                        className="rounded-xl border py-2 px-2.5 text-left text-xs font-extrabold cursor-pointer transition hover:border-[#00E5FF]"
                      >
                        {def.badgeTitle}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* 3. Interactive Fingerspelling Input + Voice Mic + Alphabet (A–Z) & Numbers (0–9) */}
            <div
              style={{ backgroundColor: cardBg, borderColor: borderCol }}
              className="rounded-2xl border p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  style={{ color: primaryText }}
                  className="text-xs font-extrabold"
                >
                  🔤 Soletrar ou Falar p/ Mãos do Buddy (A–Z &amp; 0–9):
                </span>
                {isPlayingSpellingSequence && (
                  <button
                    type="button"
                    onClick={() => {
                      if (spellingTimerRef.current !== null) {
                        window.clearInterval(spellingTimerRef.current);
                        spellingTimerRef.current = null;
                      }
                      setIsPlayingSpellingSequence(false);
                    }}
                    className="rounded-lg bg-rose-600 text-white px-2 py-0.5 text-[10px] font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Square className="h-2.5 w-2.5" />
                    <span>Parar</span>
                  </button>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTriggerLibrasFromText(customLibrasInput);
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={customLibrasInput}
                  onChange={(e) => setCustomLibrasInput(e.target.value)}
                  placeholder="Escrever ou falar p/ Mãos do Buddy..."
                  style={{
                    backgroundColor: innerBg,
                    borderColor: borderCol,
                    color: primaryText,
                  }}
                  className="flex-1 rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#00E5FF]"
                />
                <button
                  type="button"
                  onClick={() => startVoiceRecognition('LIBRAS_VOICE')}
                  style={{
                    backgroundColor: isListeningLibrasMic
                      ? '#00E5FF'
                      : '#0B0F17',
                    borderColor: '#00E5FF',
                    color: isListeningLibrasMic ? '#05070B' : '#00E5FF',
                  }}
                  className="rounded-xl border px-2.5 py-2 text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
                  title="Falar no microfone para animar as Mãos do Buddy"
                >
                  <Mic className="h-3.5 w-3.5" />
                  <span>{isListeningLibrasMic ? 'A Ouvir...' : '🎙️ Voz'}</span>
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#0B0F17',
                    borderColor: '#00E5FF',
                    color: '#00E5FF',
                  }}
                  className="rounded-xl border px-3 py-2 text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Sinalizar</span>
                </button>
              </form>

              {/* Quick A-Z & 0-9 Horizontal Scroll / Compact Grid */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
                  .split('')
                  .map((ch) => {
                    const isCharActive = activeFingerspellChar === ch;
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => {
                          setIsPlayingSpellingSequence(false);
                          setActiveFingerspellChar(ch);
                        }}
                        style={
                          isCharActive
                            ? {
                                backgroundColor: '#0B0F17',
                                borderColor: '#00E5FF',
                                color: '#00E5FF',
                              }
                            : {
                                backgroundColor: innerBg,
                                borderColor: borderCol,
                                color: primaryText,
                              }
                        }
                        className="h-8 w-8 rounded-lg border text-xs font-black shrink-0 flex items-center justify-center cursor-pointer"
                      >
                        {ch}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* 4. Deaf Customer Quick-Reply Bar & 4-Digit Delivery PIN Keypad */}
            <div
              style={{
                backgroundColor: cardBg,
                borderColor: '#00E5FF',
              }}
              className="rounded-2xl border-2 p-3 space-y-3"
            >
              <div>
                <span
                  style={{ color: isDaylight ? '#0284C7' : '#00E5FF' }}
                  className="text-xs font-black uppercase tracking-wider block"
                >
                  🤝 Área do Cliente Surdo — Resposta Rápida &amp; Código PIN
                </span>
                <span
                  style={{ color: secondaryText }}
                  className="text-[11px] font-bold block"
                >
                  Mostre ao cliente para responder com 1 toque ou digitar o PIN:
                </span>
              </div>

              {/* 1-Tap Visual Reply Buttons for the Deaf Customer */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  {
                    label: '👍 Obrigado!',
                    spoken: 'O cliente respondeu: Obrigado!',
                    sign: 'OBRIGADO' as LibrasCoreSignId,
                  },
                  {
                    label: '⏳ Só 1 minuto',
                    spoken: 'O cliente pediu para aguardar 1 minuto.',
                    sign: 'AGUARDAR' as LibrasCoreSignId,
                  },
                  {
                    label: '🚪 Pode deixar na porta',
                    spoken: 'O cliente indicou que pode deixar na porta.',
                    sign: 'CONFIRMAR' as LibrasCoreSignId,
                  },
                ].map((reply) => (
                  <button
                    key={reply.label}
                    type="button"
                    onClick={() => {
                      setActiveFingerspellChar(null);
                      setActiveCoreSignId(reply.sign);
                      setCustomerLibrasReplyBanner(reply.label);
                      speakTextPt(reply.spoken);
                    }}
                    style={{
                      backgroundColor: innerBg,
                      borderColor: '#00E5FF',
                      color: primaryText,
                    }}
                    className="rounded-xl border py-2.5 px-2 text-xs font-black text-center cursor-pointer transition active:scale-95"
                  >
                    {reply.label}
                  </button>
                ))}
              </div>

              {customerLibrasReplyBanner && (
                <div
                  style={{
                    backgroundColor: '#0B0F17',
                    borderColor: '#00E5FF',
                    color: '#00E5FF',
                  }}
                  className="rounded-xl border px-3 py-2 text-center text-sm font-black"
                >
                  Resposta do Cliente: {customerLibrasReplyBanner}
                </div>
              )}

              {/* Large 4-Digit PIN Keypad (🔢 Digitar Código PIN da Entrega) */}
              <div
                style={{
                  backgroundColor: innerBg,
                  borderColor: borderCol,
                }}
                className="rounded-2xl border p-3 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    style={{ color: primaryText }}
                    className="text-xs font-black"
                  >
                    🔢 Digitar Código PIN da Entrega:
                  </span>
                  {pinConfirmedBanner && (
                    <span
                      style={{
                        backgroundColor: '#0B0F17',
                        borderColor: '#00E5FF',
                        color: '#00E5FF',
                      }}
                      className="rounded-md border px-2 py-0.5 text-[10px] font-black"
                    >
                      ✓ PIN Confirmado
                    </span>
                  )}
                </div>

                {/* Big 4-Digit Display */}
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((slot) => {
                    const digit = pinDigits[slot] || '';
                    return (
                      <div
                        key={slot}
                        style={{
                          backgroundColor: cardBg,
                          borderColor: digit
                            ? '#00E5FF'
                            : borderCol,
                          color: isDaylight ? '#090D16' : '#00E5FF',
                        }}
                        className="h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-black"
                      >
                        {digit || '•'}
                      </div>
                    );
                  })}
                </div>

                {/* Numeric Keypad (1-9, Clear, 0, Confirm) */}
                <div className="grid grid-cols-4 gap-1.5">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setPinConfirmedBanner(false);
                        setActiveFingerspellChar(num);
                        setPinDigits((prev) =>
                          prev.length < 4 ? prev + num : prev
                        );
                      }}
                      style={{
                        backgroundColor: cardBg,
                        borderColor: borderCol,
                        color: primaryText,
                      }}
                      className="h-11 rounded-xl border text-lg font-black flex items-center justify-center cursor-pointer active:scale-95 hover:border-[#00E5FF]"
                    >
                      {num}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setPinConfirmedBanner(false);
                      setActiveFingerspellChar('0');
                      setPinDigits((prev) =>
                        prev.length < 4 ? prev + '0' : prev
                      );
                    }}
                    style={{
                      backgroundColor: cardBg,
                      borderColor: borderCol,
                      color: primaryText,
                    }}
                    className="h-11 rounded-xl border text-lg font-black flex items-center justify-center cursor-pointer active:scale-95 hover:border-[#00E5FF]"
                  >
                    0
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPinConfirmedBanner(false);
                      setPinDigits((prev) => prev.slice(0, -1));
                    }}
                    style={{
                      backgroundColor: cardBg,
                      borderColor: borderCol,
                      color: primaryText,
                    }}
                    className="h-11 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Delete className="h-4 w-4" />
                    <span>Apagar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!pinDigits) return;
                      setPinConfirmedBanner(true);
                      setActiveFingerspellChar(null);
                      setActiveCoreSignId('CONFIRMAR');
                      const spokenPin = pinDigits.split('').join(', ');
                      speakTextPt(
                        `Código PIN confirmado pelo cliente: ${spokenPin}.`
                      );
                    }}
                    style={{
                      backgroundColor: '#00E5FF',
                      borderColor: '#00E5FF',
                      color: '#05070B',
                    }}
                    className="h-11 rounded-xl border text-xs font-black flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Check className="h-4 w-4" />
                    <span>OK</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
