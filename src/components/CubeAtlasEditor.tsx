import React, { useState } from 'react';
import { BlockFaceKey, CustomTexture, FaceTextures, TextureMode } from '../types/addon';

interface CubeAtlasEditorProps {
  mode: TextureMode;
  faceTextures: FaceTextures;
  availableTextures: CustomTexture[];
  onChangeMode: (mode: TextureMode) => void;
  onChangeFaceTexture: (face: BlockFaceKey, textureRef: string) => void;
  onOpenTextureLibraryForFace: (face: BlockFaceKey) => void;
  onClearFaceTexture: (face: BlockFaceKey) => void;
}

export const CubeAtlasEditor: React.FC<CubeAtlasEditorProps> = ({
  mode,
  faceTextures,
  availableTextures,
  onChangeMode,
  onChangeFaceTexture,
  onOpenTextureLibraryForFace,
  onClearFaceTexture,
}) => {
  const [selectedFace, setSelectedFace] = useState<BlockFaceKey>('up');
  const [showModeConfirm, setShowModeConfirm] = useState<TextureMode | null>(null);

  // Resolves a texture identifier or dataUrl
  const getTexturePreview = (val: string): string => {
    if (!val) return '';
    if (val.startsWith('data:image')) return val;
    const found = availableTextures.find((t) => t.id === val || t.name === val);
    return found?.dataUrl || '';
  };

  const handleModeChangeRequest = (newMode: TextureMode) => {
    if (newMode === mode) return;
    if (mode === 'six' && (newMode === 'one' || newMode === 'three')) {
      setShowModeConfirm(newMode);
    } else if (mode === 'three' && newMode === 'one') {
      setShowModeConfirm(newMode);
    } else {
      onChangeMode(newMode);
    }
  };

  const confirmModeChange = () => {
    if (showModeConfirm) {
      onChangeMode(showModeConfirm);
      setShowModeConfirm(null);
    }
  };

  const faceLabels: Record<BlockFaceKey, { label: string; desc: string }> = {
    up: { label: 'Superior (Up)', desc: 'Cara de arriba' },
    down: { label: 'Inferior (Down)', desc: 'Cara de abajo' },
    north: { label: 'Norte (North)', desc: 'Lateral frontal' },
    south: { label: 'Sur (South)', desc: 'Lateral trasero' },
    east: { label: 'Este (East)', desc: 'Lateral derecho' },
    west: { label: 'Oeste (West)', desc: 'Lateral izquierdo' },
  };

  // Active target texture based on mode and selected face
  const getEffectiveTexture = (face: BlockFaceKey): string => {
    if (mode === 'one') return faceTextures.up || '';
    if (mode === 'three') {
      if (face === 'up') return faceTextures.up || '';
      if (face === 'down') return faceTextures.down || '';
      return faceTextures.north || '';
    }
    return faceTextures[face] || '';
  };

  const activeTexData = getTexturePreview(getEffectiveTexture(selectedFace));

  const handleSelectFaceInThreeMode = (target: 'up' | 'down' | 'sides') => {
    if (target === 'up') setSelectedFace('up');
    else if (target === 'down') setSelectedFace('down');
    else setSelectedFace('north'); // represents all sides
  };

  return (
    <div className="flex flex-col gap-3.5 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
      {/* Mode Switcher Buttons */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <i className="bx bxs-cube-alt text-emerald-400" />
            Configuración del Atlas
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {mode === 'one' && '1 textura (Cubo completo)'}
            {mode === 'three' && '3 texturas (Arriba, Abajo, Laterales)'}
            {mode === 'six' && '6 texturas independientes'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleModeChangeRequest('one')}
            className={`min-h-[40px] px-2 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 ${
              mode === 'one'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="bx bx-square" />
            <span>1 Textura</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChangeRequest('three')}
            className={`min-h-[40px] px-2 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 ${
              mode === 'three'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="bx bxs-layer" />
            <span>3 Texturas</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChangeRequest('six')}
            className={`min-h-[40px] px-2 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 ${
              mode === 'six'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="bx bx-cube" />
            <span>6 Texturas</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal when changing mode */}
      {showModeConfirm && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col gap-2 text-xs text-amber-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <i className="bx bx-error text-base text-amber-400 shrink-0" />
            <span className="font-semibold">¿Cambiar modo de texturizado a {showModeConfirm}?</span>
          </div>
          <p className="text-[11px] text-amber-300/90 leading-relaxed">
            Al simplificar el modo se unificarán las texturas de las caras según el nuevo esquema seleccionado.
          </p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowModeConfirm(null)}
              className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmModeChange}
              className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400"
            >
              Confirmar cambio
            </button>
          </div>
        </div>
      )}

      {/* --- VISUAL PRESENTATION BY MODE --- */}

      {/* MODE 1: UNIFIED SINGLE TEXTURE CUBE */}
      {mode === 'one' && (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Cubo Completo (Textura compartida en las 6 caras)
          </span>

          <div
            onClick={() => onOpenTextureLibraryForFace('up')}
            className="w-24 h-24 rounded-2xl border-2 border-dashed border-emerald-500/60 bg-slate-950 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-400 hover:bg-slate-900/80 transition-all p-1 pixelated shadow-lg relative group"
          >
            {faceTextures.up ? (
              <img
                src={getTexturePreview(faceTextures.up)}
                alt="Textura Cubo"
                className="w-full h-full object-contain pixelated rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500 gap-1">
                <i className="bx bx-image-add text-3xl text-emerald-400" />
                <span className="text-[10px] font-semibold text-slate-300">Toca para asignar</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
              Cambiar
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenTextureLibraryForFace('up')}
              className="min-h-[40px] px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <i className="bx bx-photo-album text-base" />
              <span>{faceTextures.up ? 'Cambiar Textura' : 'Seleccionar Textura'}</span>
            </button>
            {faceTextures.up && (
              <button
                type="button"
                onClick={() => onClearFaceTexture('up')}
                className="min-h-[40px] px-3 bg-slate-900 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-800 rounded-xl text-xs flex items-center gap-1"
                title="Quitar textura"
              >
                <i className="bx bx-trash text-base" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: 3 TEXTURES (UP, SIDES, DOWN) */}
      {mode === 'three' && (
        <div className="flex flex-col items-center justify-center py-2 bg-slate-900/60 rounded-2xl border border-slate-800/80 gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Atlas de 3 Asignaciones (Superior, Laterales e Inferior)
          </span>

          <div className="flex flex-col items-center gap-1.5">
            {/* Superior / Up */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 w-24 text-right">Superior:</span>
              <FaceSlot
                faceKey="up"
                isSelected={selectedFace === 'up'}
                label="ARRIBA"
                textureData={getTexturePreview(faceTextures.up)}
                onClick={() => handleSelectFaceInThreeMode('up')}
              />
            </div>

            {/* Laterales / Sides (all 4 faces shared) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 w-24 text-right">4 Laterales:</span>
              <FaceSlot
                faceKey="north"
                isSelected={selectedFace === 'north' || selectedFace === 'south' || selectedFace === 'east' || selectedFace === 'west'}
                label="LADOS"
                textureData={getTexturePreview(faceTextures.north)}
                onClick={() => handleSelectFaceInThreeMode('sides')}
              />
            </div>

            {/* Inferior / Down */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 w-24 text-right">Inferior:</span>
              <FaceSlot
                faceKey="down"
                isSelected={selectedFace === 'down'}
                label="ABAJO"
                textureData={getTexturePreview(faceTextures.down)}
                onClick={() => handleSelectFaceInThreeMode('down')}
              />
            </div>
          </div>

          <span className="text-[10px] text-slate-400 px-4 text-center">
            La textura de "Lados" se aplicará automáticamente a Norte, Sur, Este y Oeste.
          </span>
        </div>
      )}

      {/* MODE 3: 6 INDEPENDENT TEXTURES (CROSS NET) */}
      {mode === 'six' && (
        <div className="flex flex-col items-center justify-center py-2 bg-slate-900/60 rounded-2xl border border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Atlas Desplegado de 6 Caras (Toca una cara)
          </span>

          {/* Unfolded Cube Cross Net */}
          <div className="flex flex-col items-center gap-1">
            {/* Row 1: UP */}
            <div className="flex justify-center">
              <FaceSlot
                faceKey="up"
                isSelected={selectedFace === 'up'}
                label="ARRIBA"
                textureData={getTexturePreview(faceTextures.up)}
                onClick={() => setSelectedFace('up')}
              />
            </div>

            {/* Row 2: WEST, NORTH, EAST, SOUTH */}
            <div className="flex items-center gap-1">
              <FaceSlot
                faceKey="west"
                isSelected={selectedFace === 'west'}
                label="OESTE"
                textureData={getTexturePreview(faceTextures.west)}
                onClick={() => setSelectedFace('west')}
              />
              <FaceSlot
                faceKey="north"
                isSelected={selectedFace === 'north'}
                label="NORTE"
                textureData={getTexturePreview(faceTextures.north)}
                onClick={() => setSelectedFace('north')}
              />
              <FaceSlot
                faceKey="east"
                isSelected={selectedFace === 'east'}
                label="ESTE"
                textureData={getTexturePreview(faceTextures.east)}
                onClick={() => setSelectedFace('east')}
              />
              <FaceSlot
                faceKey="south"
                isSelected={selectedFace === 'south'}
                label="SUR"
                textureData={getTexturePreview(faceTextures.south)}
                onClick={() => setSelectedFace('south')}
              />
            </div>

            {/* Row 3: DOWN */}
            <div className="flex justify-center">
              <FaceSlot
                faceKey="down"
                isSelected={selectedFace === 'down'}
                label="ABAJO"
                textureData={getTexturePreview(faceTextures.down)}
                onClick={() => setSelectedFace('down')}
              />
            </div>
          </div>

          <span className="text-[10px] text-slate-400 mt-2">
            Cada una de las 6 caras tiene su propia textura independiente.
          </span>
        </div>
      )}

      {/* Action Drawer for Selected Face in 3 or 6 Mode */}
      {mode !== 'one' && (
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 pixelated shadow-inner">
              {activeTexData ? (
                <img
                  src={activeTexData}
                  alt={selectedFace}
                  className="w-full h-full object-contain pixelated"
                />
              ) : (
                <i className="bx bx-image-alt text-2xl text-slate-600" />
              )}
            </div>

            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-100 block truncate">
                {mode === 'three' && selectedFace === 'north'
                  ? '4 Caras Laterales'
                  : faceLabels[selectedFace].label}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {activeTexData ? 'Textura asignada' : 'Sin textura asignada'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenTextureLibraryForFace(selectedFace)}
              className="min-h-[40px] px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <i className="bx bx-folder-open text-sm" />
              <span>Biblioteca</span>
            </button>

            {activeTexData && (
              <button
                type="button"
                onClick={() => onClearFaceTexture(selectedFace)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
                title="Quitar textura de esta cara"
              >
                <i className="bx bx-trash text-base" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent for individual face in the unfolded net
const FaceSlot: React.FC<{
  faceKey: BlockFaceKey;
  isSelected: boolean;
  label: string;
  textureData: string;
  onClick: () => void;
}> = ({ faceKey, isSelected, label, textureData, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center overflow-hidden transition-all relative pixelated ${
        isSelected
          ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-emerald-950/30 scale-105 z-10 shadow-lg'
          : 'border-slate-800 bg-slate-950 hover:border-slate-600'
      }`}
    >
      {textureData ? (
        <img
          src={textureData}
          alt={label}
          className="w-full h-full object-cover pixelated"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-600">
          <i className="bx bx-plus text-base" />
        </div>
      )}
      <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] font-mono font-bold text-slate-200 py-0.5 text-center truncate">
        {label}
      </span>
    </button>
  );
};
