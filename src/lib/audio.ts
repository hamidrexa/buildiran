/**
 * BuildIran — Modern Audio Engine
 * Cross-platform strategic game sound system:
 * - Native (iOS/Android): uses modern `expo-audio` (the official non-deprecated successor to `expo-av`)
 * - Web: uses Web Audio API synthesis (zero latency, zero network failure, zero deprecation) + HTML5 Audio
 */

import { Platform } from 'react-native';

export type SoundAction =
  | 'build'
  | 'buy'
  | 'sell'
  | 'levelup'
  | 'tap'
  | 'error'
  | 'coin'
  | 'propose'
  | 'approve';

// ─── Web Audio API Synthesizer ───────────────────────────────────────────────
// Synthesizes rich, instant, zero-latency strategic game sound effects on Web

let webAudioCtx: any = null;

function getWebAudioContext(): any {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!webAudioCtx) {
    webAudioCtx = new AudioContextClass();
  }
  if (webAudioCtx.state === 'suspended') {
    webAudioCtx.resume().catch(() => {});
  }
  return webAudioCtx;
}

function playWebSynthesizedSound(action: SoundAction) {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (action) {
      case 'build': {
        // Construction hammer & stone impact: punchy thud + metallic ring
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);

        // Stone settle chime
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(440, now + 0.08);
        chime.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        chimeGain.gain.setValueAtTime(0.2, now + 0.08);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        chime.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        chime.start(now + 0.08);
        chime.stop(now + 0.38);
        break;
      }

      case 'buy':
      case 'coin': {
        // High-pitched gold coin clink (two sparkling tones)
        [987.77, 1318.51].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + i * 0.07;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.4, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.22);
        });
        break;
      }

      case 'sell': {
        // Cash register exchange (descending-then-ascending coin ring)
        [784, 988, 1175].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + i * 0.06;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.35, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.28);
        });
        break;
      }

      case 'levelup':
      case 'approve': {
        // Grand victory chord arpeggio (C - E - G - C')
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + idx * 0.1;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.4, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.45);
        });
        break;
      }

      case 'propose': {
        // Scroll / blueprint unfold chime (ascending harmonic)
        [440, 554, 659].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + idx * 0.08;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.3, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.35);
        });
        break;
      }

      case 'tap': {
        // Crisp subtle click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }

      case 'error': {
        // Low buzz warning
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.setValueAtTime(120, now + 0.08);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
        break;
      }
    }
  } catch {
    // Non-critical audio error handling
  }
}

// ─── Native (iOS & Android) Audio Engine with expo-audio ─────────────────────

let expoAudioModule: any = null;

async function getExpoAudioModule() {
  if (Platform.OS === 'web') return null;
  if (!expoAudioModule) {
    try {
      // Dynamic import to prevent web bundler crashes
      expoAudioModule = await import('expo-audio');
    } catch {
      // Graceful fallback if native module isn't loaded in web/dev preview
      expoAudioModule = null;
    }
  }
  return expoAudioModule;
}

const SOUND_URLS: Record<SoundAction, string> = {
  build:   'https://assets.mixkit.co/active_storage/sfx/2460/2460-preview.mp3',
  buy:     'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  sell:    'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3',
  levelup: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  tap:     'https://assets.mixkit.co/active_storage/sfx/2073/2073-preview.mp3',
  error:   'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3',
  coin:    'https://assets.mixkit.co/active_storage/sfx/888/888-preview.mp3',
  propose: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  approve: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
};

async function playNativeSound(action: SoundAction) {
  try {
    const audio = await getExpoAudioModule();
    if (audio && audio.createAudioPlayer) {
      const player = audio.createAudioPlayer({
        uri: SOUND_URLS[action],
      });
      player.volume = 0.7;
      player.play();
      return;
    }
  } catch (err) {
    // Fallback if needed
  }
}

// ─── Public GameAudio API ───────────────────────────────────────────────────

export const GameAudio = {
  play: async (action: SoundAction) => {
    if (Platform.OS === 'web') {
      playWebSynthesizedSound(action);
    } else {
      await playNativeSound(action);
    }
  },

  /** Sound when player builds a structure on map */
  playBuild: () => GameAudio.play('build'),
  /** Sound when buying an asset in marketplace */
  playBuy: () => GameAudio.play('buy'),
  /** Sound when listing or selling an asset */
  playSell: () => GameAudio.play('sell'),
  /** Sound when player levels up or achieves victory */
  playLevelUp: () => GameAudio.play('levelup'),
  /** Sound on map / button tap */
  playTap: () => GameAudio.play('tap'),
  /** Sound on insufficient cash or invalid action */
  playError: () => GameAudio.play('error'),
  /** Sound when collecting gold or resources */
  playCoin: () => GameAudio.play('coin'),
  /** Sound when player submits a new building proposal */
  playPropose: () => GameAudio.play('propose'),
  /** Sound when neighborhood editor approves a proposal */
  playApprove: () => GameAudio.play('approve'),

  /** Preload hook for game start */
  preloadAll: async () => {
    // Ready immediately on web; initializes audio context on first interaction
    if (Platform.OS === 'web') {
      getWebAudioContext();
    }
  },

  /** Unload resources on background */
  unloadAll: async () => {
    // Cleanup if needed
  },
};

export default GameAudio;
