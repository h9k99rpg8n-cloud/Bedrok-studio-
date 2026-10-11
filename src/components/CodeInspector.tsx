import React, { useState } from 'react';
import { AddonProject, CustomBlock } from '../types/bedrock';
import {
  generateBlockBehaviorJson,
  generateBlocksResourceJson,
  generateTerrainTextureJson,
  generateBehaviorPackManifest,
  generateResourcePackManifest,
  generateLangFile,
} from '../utils/bedrockExport';
import { Copy, Check, FileCode, Info } from 'lucide-react';

interface CodeInspectorProps {
  project: AddonProject;
  block: CustomBlock;
}

type FileTab = 'block_bp' | 'blocks_rp' | 'terrain_texture' | 'bp_manifest' | 'rp_manifest' | 'lang';

export const CodeInspector: React.FC<CodeInspectorProps> = ({ project, block }) => {
  const [activeTab, setActiveTab] = useState<FileTab>('block_bp');
  const [copied, setCopied] = useState<boolean>(false);

  const getFileContent = (): { path: string; content: string; desc: string } => {
    switch (activeTab) {
      case 'block_bp':
        return {
          path: `behavior_pack/blocks/${block.identifier}.json`,
          content: JSON.stringify(generateBlockBehaviorJson(project, block), null, 2),
          desc: 'Define los componentes, dureza, resistencia a explosiones, emisión de luz y física del bloque en el juego.',
        };
      case 'blocks_rp':
        return {
          path: 'resource_pack/blocks.json',
          content: JSON.stringify(generateBlocksResourceJson(project), null, 2),
          desc: 'Mapea el identificador del bloque a su archivo de sonido y textura en el atlas de recursos.',
        };
      case 'terrain_texture':
        return {
          path: 'resource_pack/textures/terrain_texture.json',
          content: JSON.stringify(generateTerrainTextureJson(project), null, 2),
          desc: 'Registra la textura PNG del bloque en el atlas de terreno de Minecraft Bedrock.',
        };
      case 'bp_manifest':
        return {
          path: 'behavior_pack/manifest.json',
          content: JSON.stringify(generateBehaviorPackManifest(project), null, 2),
          desc: 'Manifiesto del Behavior Pack con UUIDs y versión de motor de Minecraft Bedrock.',
        };
      case 'rp_manifest':
        return {
          path: 'resource_pack/manifest.json',
          content: JSON.stringify(generateResourcePackManifest(project), null, 2),
          desc: 'Manifiesto del Resource Pack requerido para cargar las texturas y modelos.',
        };
      case 'lang':
        return {
          path: 'resource_pack/texts/en_US.lang',
          content: generateLangFile(project),
          desc: 'Nombres traducidos del bloque que lee el juego en español e inglés.',
        };
    }
  };

  const currentFile = getFileContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-200">Inspector de Código Bedrock JSON</h3>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="min-h-[44px] px-3 flex items-center gap-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">¡Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Archivo</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs for files */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('block_bp')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'block_bp'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          {block.identifier}.json (BP)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('blocks_rp')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'blocks_rp'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          blocks.json (RP)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('terrain_texture')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'terrain_texture'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          terrain_texture.json
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lang')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'lang'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          en_US.lang
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bp_manifest')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'bp_manifest'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          manifest BP
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rp_manifest')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'rp_manifest'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          manifest RP
        </button>
      </div>

      {/* File info notice */}
      <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-mono text-slate-300 font-semibold">{currentFile.path}</span>
          <p className="mt-0.5">{currentFile.desc}</p>
        </div>
      </div>

      {/* Code Box */}
      <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 overflow-x-auto max-h-[360px]">
        <pre className="font-mono text-xs text-emerald-300 whitespace-pre leading-relaxed">
          {currentFile.content}
        </pre>
      </div>
    </div>
  );
};
