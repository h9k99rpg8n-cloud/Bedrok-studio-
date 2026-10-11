import React, { useState, useRef } from 'react';
import { CustomBlock } from '../types/addon';

interface BlockWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBlock: (block: CustomBlock) => void;
  availableTextures?: { name: string; dataUrl: string }[];
}

export const BlockWizardModal: React.FC<BlockWizardModalProps> = ({
  isOpen,
  onClose,
  onSaveBlock,
  availableTextures = [],
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Identifier & Name
  const [identifier, setIdentifier] = useState<string>('nuevo_bloque');
  const [displayName, setDisplayName] = useState<string>('Nuevo Bloque');

  // Step 2: Customization (Texture)
  const [textureDataUrl, setTextureDataUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 3: Properties (Toggles >= 16px)
  const [emitsLight, setEmitsLight] = useState<boolean>(false);
  const [lightLevel, setLightLevel] = useState<number>(15);
  const [consumesRedstone, setConsumesRedstone] = useState<boolean>(false);

  // Step 4: Behaviors & Advanced (Locked with "Próximamente")
  const [proximamenteNotice, setProximamenteNotice] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  // Handle texture upload without pixel limits
  const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setTextureDataUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!identifier.trim()) {
        setErrorMsg('El ID del bloque es obligatorio (letras minúsculas y números).');
        return;
      }
      if (!displayName.trim()) {
        setErrorMsg('El nombre visible del bloque es obligatorio.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleSave = () => {
    // If no texture was imported, generate a default clean block texture
    let finalTex = textureDataUrl;
    if (!finalTex) {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#78716c';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(3, 3, 10, 10);
      finalTex = canvas.toDataURL('image/png');
    }

    const newBlock: CustomBlock = {
      id: `block_${Date.now()}`,
      identifier: identifier.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      displayName: displayName.trim(),
      textureMode: 'one',
      faceTextures: {
        up: finalTex,
        down: finalTex,
        north: finalTex,
        south: finalTex,
        east: finalTex,
        west: finalTex,
      },
      textureDataUrl: finalTex,
      emitsLight,
      lightLevel,
      consumesRedstone,
      destroyTime: 1.5,
      explosionResistance: 6.0,
      createdAt: Date.now(),
    };

    onSaveBlock(newBlock);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between max-h-[92vh] overflow-y-auto">
        {/* Step Indicator Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Tutorial Paso a Paso ({currentStep} de 4)
              </span>
              <h2 className="text-sm font-bold text-slate-100">
                {currentStep === 1 && 'Paso 1: Identificador del Bloque'}
                {currentStep === 2 && 'Paso 2: Textura y Personalización'}
                {currentStep === 3 && 'Paso 3: Propiedades Físicas'}
                {currentStep === 4 && 'Paso 4: Comportamiento Avanzado'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100"
            >
              <i className="bx bx-x text-xl" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-900 h-1.5 rounded-full my-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="my-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <i className="bx bx-error-circle text-base" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Wizard Steps Content */}
        <div className="py-2 flex-1">
          {/* STEP 1: ID & Name */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Identificador Técnico (ID) *
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-emerald-500">
                  <span className="px-3 text-xs text-slate-400 font-mono select-none">custom:</span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                      setErrorMsg('');
                    }}
                    placeholder="ruby_block"
                    className="w-full min-h-[46px] pr-3 bg-transparent text-sm font-mono text-emerald-400 focus:outline-none"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Identificador único usado en comandos como <code className="font-mono text-slate-300">/give @s custom:{identifier || 'bloque'}</code>.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre en Pantalla del Bloque *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Ej: Bloque de Rubí"
                  className="w-full min-h-[46px] px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  El nombre que aparecerá traducido en el inventario de Minecraft.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Customization (Texture) */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-3.5">
              <span className="text-xs text-slate-300">
                Importa una textura de cualquier resolución (16x16, 32x32, 64x64 sin límites) para tu bloque:
              </span>

              {/* Texture Preview Box */}
              <div className="flex items-center gap-4 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="w-20 h-20 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative pixelated">
                  {textureDataUrl ? (
                    <img
                      src={textureDataUrl}
                      alt="Textura de bloque"
                      className="w-full h-full object-contain pixelated"
                    />
                  ) : (
                    <i className="bx bxs-cube text-3xl text-slate-600" />
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleTextureUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[44px] px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-95"
                  >
                    <i className="bx bx-image-add text-base" />
                    <span>Importar Textura PNG</span>
                  </button>

                  <span className="text-[10px] text-slate-400">
                    Soporta imágenes sin límite de píxeles.
                  </span>
                </div>
              </div>

              {/* Previously Created Project Textures if any */}
              {availableTextures.length > 0 && (
                <div className="mt-1">
                  <span className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                    O selecciona una textura creada en el proyecto:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {availableTextures.map((tex) => (
                      <button
                        key={tex.dataUrl}
                        type="button"
                        onClick={() => setTextureDataUrl(tex.dataUrl)}
                        className="w-12 h-12 rounded-xl border border-slate-800 bg-slate-950 p-1 hover:border-emerald-500 shrink-0 overflow-hidden"
                      >
                        <img src={tex.dataUrl} alt={tex.name} className="w-full h-full object-cover pixelated" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Properties (Toggles >= 16px) */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-4">
              <span className="text-xs text-slate-300">
                Ajusta las propiedades físicas y de redstone con los interruptores táctiles de iPhone:
              </span>

              {/* Toggle 1: ¿Emite Luz? */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <i className="bx bxs-sun text-amber-400 text-sm" />
                      ¿Emite luz?
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      El bloque ilumina su alrededor como una antorcha
                    </span>
                  </div>

                  {/* 16px+ Mobile Ergonomic Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center">
                    <input
                      type="checkbox"
                      checked={emitsLight}
                      onChange={(e) => setEmitsLight(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[11px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner" />
                  </label>
                </div>

                {/* Light level slider if emitsLight is true */}
                {emitsLight && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Nivel de iluminación:</span>
                      <span className="font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                        {lightLevel} / 15
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={15}
                      value={lightLevel}
                      onChange={(e) => setLightLevel(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-400 min-h-[36px]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Nivel 1 (Tenue)</span>
                      <span>Nivel 8 (Redstone)</span>
                      <span>Nivel 15 (Máximo / Glowstone)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle 2: ¿Consume Redstone? */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <i className="bx bxs-zap text-rose-500 text-sm" />
                    ¿Consume Redstone?
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Conduce o interactúa con circuitos de redstone
                  </span>
                </div>

                {/* 16px+ Mobile Ergonomic Toggle */}
                <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center">
                  <input
                    type="checkbox"
                    checked={consumesRedstone}
                    onChange={(e) => setConsumesRedstone(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[11px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 shadow-inner" />
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: Behaviors & Advanced (Locked with "Próximamente") */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-3">
              <span className="text-xs text-slate-300 mb-1">
                Comportamientos extendidos de bloques para versiones futuras:
              </span>

              {proximamenteNotice && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <i className="bx bx-time-five text-base" />
                  <span>{proximamenteNotice}</span>
                </div>
              )}

              <div className="space-y-2">
                {[
                  { title: 'Componente de Rotación (Pilar / Horno)', desc: 'minecraft:placement_direction' },
                  { title: 'Loot Tables y Suelta de Ítems Personalizada', desc: 'minecraft:loot con tablas JSON' },
                  { title: 'Colisiones y Cajas de Selección (Hitbox)', desc: 'minecraft:collision_box' },
                  { title: 'Eventos de Interacción (on_interact)', desc: 'Disparadores y sonidos al tocar' },
                ].map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() =>
                      setProximamenteNotice(`"${item.title}" estará disponible en Bedrock Studio v0.2.0`)
                    }
                    className="w-full p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-left flex items-center justify-between opacity-80 active:scale-[0.99] transition-transform"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-300">{item.title}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono shrink-0">
                      <i className="fa-solid fa-lock text-[9px]" />
                      Próximamente
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="min-h-[46px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <i className="bx bx-left-arrow-alt text-base" />
              <span>Atrás</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="min-h-[46px] px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-500/20"
            >
              <span>Siguiente</span>
              <i className="bx bx-right-arrow-alt text-base" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="min-h-[46px] px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-500/20"
            >
              <i className="bx bxs-check-circle text-base" />
              <span>Guardar Bloque</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
