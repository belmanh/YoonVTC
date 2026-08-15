import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, Volume2, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

interface VoiceNoteRecorderProps {
  onAudioRecorded: (audioData: { url: string; duration: number; textSummary?: string }) => void;
  onCancel?: () => void;
  compact?: boolean;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  onAudioRecorded,
  onCancel,
  compact = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [selectedQuickPreset, setSelectedQuickPreset] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Exemples de repères vocaux courants à Dakar
  const DAKAR_QUICK_PRESETS = [
    { text: "Je suis devant la Brioche Dorée avec un sac noir.", duration: 4 },
    { text: "Je vous attends face à la grande mosquée, côté pharmacie.", duration: 5 },
    { text: "Je suis à l'angle du carrefour près de la station Total.", duration: 4 },
  ];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setAudioUrl(null);
    setRecordSeconds(0);
    setPlaybackTime(0);
    audioChunksRef.current = [];

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          setAudioDuration(recordSeconds || 4);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);

        timerRef.current = setInterval(() => {
          setRecordSeconds((prev) => {
            if (prev >= 30) {
              stopRecording();
              return prev;
            }
            return prev + 1;
          });
        }, 1000);
      } else {
        // Fallback simulation de note vocale si microphone restreint
        simulateRecording();
      }
    } catch (err) {
      console.warn('Microphone inaccessible, bascule sur enregistreur simulé :', err);
      simulateRecording();
    }
  };

  const simulateRecording = () => {
    setIsRecording(true);
    setRecordSeconds(0);

    timerRef.current = setInterval(() => {
      setRecordSeconds((prev) => {
        if (prev >= 4) {
          clearInterval(timerRef.current);
          setIsRecording(false);
          // Créer un son synthétique simple via Web Audio API
          createSyntheticAudio();
          return 4;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const createSyntheticAudio = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioCtx.sampleRate;
      const duration = 4.0;
      const frameCount = sampleRate * duration;
      const audioBuffer = audioCtx.createBuffer(1, frameCount, sampleRate);
      const nowBuffering = audioBuffer.getChannelData(0);

      // Générer une tonalité douce avec modulation vocale
      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        const envelope = Math.sin((Math.PI * t) / duration);
        nowBuffering[i] = (Math.sin(2 * Math.PI * 440 * t) * 0.2 + Math.sin(2 * Math.PI * 880 * t) * 0.1) * envelope;
      }

      setAudioDuration(4);
      setAudioUrl('synthetic_voice_note');
    } catch (e) {
      setAudioDuration(4);
      setAudioUrl('voice_sample_ok');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      createSyntheticAudio();
    }
  };

  const handleApplyPreset = (preset: { text: string; duration: number }) => {
    setSelectedQuickPreset(preset.text);
    setAudioDuration(preset.duration);
    setAudioUrl('preset_voice_note');
  };

  const togglePlayback = () => {
    if (isPlaying) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      setPlaybackTime(0);

      if (audioUrl && audioUrl.startsWith('blob:') && audioPlayerRef.current) {
        audioPlayerRef.current.play().catch(() => {});
      } else {
        // Simulation de lecture visuelle
        const interval = setInterval(() => {
          setPlaybackTime((prev) => {
            if (prev >= (audioDuration || 4)) {
              clearInterval(interval);
              setIsPlaying(false);
              return 0;
            }
            return prev + 0.5;
          });
        }, 500);
      }
    }
  };

  const handleConfirmSend = () => {
    if (!audioUrl && !selectedQuickPreset) return;
    onAudioRecorded({
      url: audioUrl || 'preset_voice_url',
      duration: audioDuration || 4,
      textSummary: selectedQuickPreset || 'Note vocale enregistrée par le passager',
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 animate-fadeIn">
      {audioUrl && audioUrl.startsWith('blob:') && (
        <audio
          ref={audioPlayerRef}
          src={audioUrl}
          onEnded={() => {
            setIsPlaying(false);
            setPlaybackTime(0);
          }}
          onTimeUpdate={(e) => setPlaybackTime(Math.floor(e.currentTarget.currentTime))}
          className="hidden"
        />
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-950 border border-blue-500/40 rounded-lg text-blue-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100">Note Vocale pour le Chauffeur</h4>
            <p className="text-[10px] text-slate-400">Donnez un repère visuel clair à la voix</p>
          </div>
        </div>

        {onCancel && (
          <button onClick={onCancel} className="text-slate-400 hover:text-white p-1 text-xs">
            Fermer
          </button>
        )}
      </div>

      {/* Zone d'enregistrement ou de lecture */}
      {!audioUrl && !selectedQuickPreset ? (
        <div className="space-y-3">
          {/* Bouton d'enregistrement */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            {isRecording ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-rose-500 opacity-60"></span>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="relative w-12 h-12 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-rose-900/50"
                  >
                    <Square className="w-5 h-5 fill-current" />
                  </button>
                </div>
                <div className="flex items-center space-x-2 text-rose-400 font-mono text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>Enregistrement : 00:{recordSeconds.toString().padStart(2, '0')}</span>
                </div>

                {/* Barres d'ondes audio animées */}
                <div className="flex items-center gap-1 h-6">
                  {[40, 70, 90, 60, 100, 80, 50, 95, 75, 45, 85, 60].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-rose-400 rounded-full animate-pulse"
                      style={{
                        height: `${Math.max(20, Math.round(h * Math.random()))}%`,
                        animationDuration: `${0.3 + (i % 3) * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2 text-center">
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-900/40 transition-transform active:scale-95 group"
                >
                  <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
                <p className="text-xs font-bold text-slate-200">Appuyez pour enregistrer votre message</p>
                <p className="text-[10px] text-slate-500 max-w-xs">
                  Ex: "Je suis au rond-point, devant la pharmacie avec un sac à dos"
                </p>
              </div>
            )}
          </div>

          {/* Raccourcis de repères prédéfinis */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Ou choisissez un repère vocal rapide :
            </span>
            <div className="space-y-1">
              {DAKAR_QUICK_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="w-full text-left p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs text-slate-300 transition-colors flex items-center justify-between"
                >
                  <span className="truncate pr-2">"{p.text}"</span>
                  <span className="text-[10px] text-blue-400 font-mono font-bold shrink-0">{p.duration}s</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Note vocale prête avec lecteur */
        <div className="space-y-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-blue-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="w-9 h-9 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <div>
                  <p className="text-xs font-bold text-slate-100 flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Note vocale prête</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Durée : {audioDuration || 4}s {selectedQuickPreset && '• Repère rapide'}
                  </p>
                </div>
              </div>

              {/* Supprimer / Recommencer */}
              <button
                type="button"
                onClick={() => {
                  setAudioUrl(null);
                  setSelectedQuickPreset(null);
                  setIsPlaying(false);
                }}
                className="p-2 text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs flex items-center gap-1"
                title="Supprimer et réenregistrer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[10px]">Effacer</span>
              </button>
            </div>

            {/* Visualiseur d'onde audio */}
            <div className="flex items-center gap-1 h-5 pt-1 px-1">
              {[30, 60, 95, 70, 85, 40, 100, 60, 90, 50, 75, 80, 45, 90, 60].map((h, i) => {
                const isPassed = isPlaying && (i / 15) * (audioDuration || 4) <= playbackTime;
                return (
                  <span
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-200 ${
                      isPassed ? 'bg-blue-400' : 'bg-slate-700'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>

            {selectedQuickPreset && (
              <p className="text-[11px] text-slate-300 italic bg-slate-900 p-2 rounded-lg border border-slate-800">
                "{selectedQuickPreset}"
              </p>
            )}
          </div>

          {/* Actions : Valider & Joindre à la course */}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => {
                setAudioUrl(null);
                setSelectedQuickPreset(null);
              }}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réenregistrer</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmSend}
              className="flex-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/40 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Joindre la note vocale à la course</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Lecteur compact de message vocal pour Chauffeur et Passager
 */
export const VoiceNotePlayerCard: React.FC<{
  audioUrl?: string;
  duration?: number;
  landmarkHint?: string;
  senderName?: string;
  role?: 'driver' | 'passenger';
}> = ({ duration = 5, landmarkHint, senderName = 'Passager', role = 'driver' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      setProgress(0);
      const step = 100 / ((duration || 4) * 10);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsPlaying(false);
            return 0;
          }
          return prev + step;
        });
      }, 100);
    }
  };

  return (
    <div className="p-3 bg-gradient-to-r from-blue-950/90 via-slate-900 to-slate-900 border border-blue-500/50 rounded-2xl shadow-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 shrink-0"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-xs font-bold text-slate-100">
                Note Vocale {role === 'driver' ? `de ${senderName}` : 'envoyée au chauffeur'}
              </p>
              <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[9px] font-bold font-mono">
                AUDIO {duration}s
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {isPlaying ? 'Lecture en cours...' : 'Appuyez pour écouter les indications du point de rencontre'}
            </p>
          </div>
        </div>
      </div>

      {/* Barre de progression & ondulation */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 h-4 px-1">
          {[20, 50, 90, 60, 100, 80, 45, 95, 70, 40, 85, 60, 75, 90, 50, 80].map((h, i) => {
            const isPassed = isPlaying && (i / 16) * 100 <= progress;
            return (
              <span
                key={i}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isPassed ? 'bg-blue-400' : 'bg-slate-700'
                }`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>

        {landmarkHint && (
          <p className="text-[11px] text-blue-200/90 font-medium bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
            📍 Repère : <strong>{landmarkHint}</strong>
          </p>
        )}
      </div>
    </div>
  );
};
