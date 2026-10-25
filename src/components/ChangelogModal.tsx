import React, { useState } from 'react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const [selectedVersion, setSelectedVersion] = useState<'v2.2' | 'v1.8' | 'v1.6' | 'v0.1.7' | 'v0.1.5' | 'v0.1.4.1' | 'v0.1.4' | 'v0.1.3' | 'v0.1.2'>('v2.2');

  if (!isOpen) return null;

  const features22 = [
    { title: 'Carpetas dentro del proyecto', version: '2.2', badge: 'Espacio de trabajo', desc: 'Crea carpetas internas para organizar bloques, texturas y recetas. La estructura se guarda con el proyecto y los recursos pueden moverse entre carpetas.', icon: 'bx bx-folder' },
    { title: 'Acciones de organización', version: '2.2', badge: 'Recursos', desc: 'El espacio de trabajo incorpora herramientas para organizar recursos sin salir del proyecto. La duplicación conserva el contenido original y crea un recurso independiente.', icon: 'bx bx-copy' },
    { title: 'Exportación sin recargar', version: '2.2', badge: 'Flujo de trabajo', desc: 'La exportación genera el archivo desde el navegador. Al terminar correctamente, la aplicación vuelve al Workbench sin recargar la página.', icon: 'bx bx-package' },
    { title: 'Bienvenida de la nueva era', version: '2.2', badge: 'Novedades', desc: 'Una ventana de presentación explica las mejoras de la versión 2.2 una sola vez por navegador/dispositivo.', icon: 'bx bx-rocket' },
    { title: 'Historial de versiones', version: '2.2', badge: 'Registro', desc: 'El registro muestra las versiones documentadas y sus cambios conocidos. Las versiones sin registro verificable no se inventan.', icon: 'bx bx-history' },
  ];

  const features017 = [
    { title: 'Propiedad mineral y botín personalizado', version: 'v0.1.7', badge: 'Minerales', desc: 'Se añadió la configuración de minerales, objetos de caída con textura personalizada, persistencia y validación de exportación con mensajes de error.', icon: 'bx bx-diamond' },
  ];

  const features18 = [
    { title: 'Rediseño visual adaptable', version: '1.8 Beta Preview', badge: 'Interfaz', desc: 'Jerarquía visual renovada, tarjetas de funciones más claras y controles táctiles adaptados a pantallas verticales y horizontales.', icon: 'bx bx-palette' },
    { title: 'Color de mapa del bloque', version: '1.8 Beta Preview', badge: 'Propiedad nueva', desc: 'Define minecraft:map_color con selector de color, código hexadecimal y una muestra ilustrativa. No cambia la textura del bloque.', icon: 'bx bx-map' },
    { title: 'Zoom preciso del visor 3D', version: '1.8 Beta Preview', badge: 'Geometría', desc: 'Ajusta la escala con un control deslizante y abre el visor de cajas en pantalla completa cuando el navegador lo permite.', icon: 'bx bx-fullscreen' },
    { title: 'Presentación de bienvenida', version: '1.8 Beta Preview', badge: 'Novedades', desc: 'La vista previa aparece una vez por navegador/dispositivo y se recuerda en el almacenamiento local de la aplicación.', icon: 'bx bx-rocket' },
  ];

  const features16 = [
    {
      title: 'Nombres Inteligentes y Predecibles',
      version: 'v1.6',
      badge: 'Nombres',
      desc: 'Los nuevos bloques reciben nombres secuenciales ordenados («Bloque 1», «Bloque 2», «Bloque 3»...) sin números aleatorios. Los nombres personalizados se conservan siempre al guardar y reabrir.',
      icon: 'bx bx-rename',
    },
    {
      title: 'Sugerencias Contextuales de Bloques',
      version: 'v1.6',
      badge: 'Escritura',
      desc: 'Sugerencias mientras escribes (Lámpara, Linterna, Ladrillo, Cristal, Madera, Mineral, Obsidiana...) para facilitar la redacción sin sustituir tu texto de forma obligatoria.',
      icon: 'bx bx-bulb',
    },
    {
      title: 'Sugerencias para el Manifiesto',
      version: 'v1.6',
      badge: 'Manifiesto',
      desc: 'Recomendaciones automáticas de descripción basadas en el nombre del addon (minerales, decoración, magia, etc.) con texto completamente editable y validación de versiones semánticas.',
      icon: 'bx bxs-file-doc',
    },
    {
      title: 'Filtro y Moderación de Palabras Inapropiadas',
      version: 'v1.6',
      badge: 'Moderación',
      desc: 'Detección respetuosa de lenguaje no deseado en nombres visibles y descripciones con opción de censura por asteriscos (***). No afecta identificadores técnicos ni rutas internas.',
      icon: 'bx bx-shield-quarter',
    },
    {
      title: 'Sistema de Texturas Manuales',
      version: 'v1.6',
      badge: 'Atlas',
      desc: 'Los bloques se crean limpios sin asignación automática de texturas de la biblioteca. Muestran estado visual «Sin textura asignada» y botones claros para seleccionar o importar.',
      icon: 'bx bx-images',
    },
    {
      title: 'Protección contra Texturas Faltantes',
      version: 'v1.6',
      badge: 'Exportación',
      desc: 'Avisos preventivos en el visor 3D y en el atlas si una textura fue eliminada, con generación de respaldo seguro al exportar para garantizar que el archivo .mcaddon nunca falle.',
      icon: 'bx bx-check-shield',
    },
    {
      title: 'Mesa de Trabajo 3×3 (Editor de Recetas)',
      version: 'v1.6',
      badge: 'Recetas',
      desc: 'Editor interactivo de recetas de fabricación con cuadrícula de 3×3, catálogo de bloques y materiales clásicos, cantidad de salida configurable (×1 a ×64) y soporte para recetas con patrón y sin patrón.',
      icon: 'bx bxs-grid',
    },
    {
      title: 'Protección Integral contra Pantallas Negras (v0.6.1)',
      version: 'v1.6',
      badge: 'Estabilidad',
      desc: 'Límites de error (ErrorBoundary) y validación profunda de estado en React para eliminar pantallas negras al crear carpetas, editar manifiestos o navegar entre secciones.',
      icon: 'bx bx-shield-quarter',
    },
  ];

  const features015 = [
    {
      title: 'Sistema de Cajas de Colisión (minecraft:collision_box)',
      version: 'v0.1.5',
      badge: 'Geometría 3D',
      desc: 'Configuración completa de colisión física: plantillas predeterminadas (completa 16×16×16, losa 16×8×16, alfombra 16×1×16, sin colisión) y edición numérica personalizada por coordenadas de origen y tamaño.',
      icon: 'bx bxs-shield',
    },
    {
      title: 'Cajas de Selección e Interacción (minecraft:selection_box)',
      version: 'v0.1.5',
      badge: 'Interacción',
      desc: 'Define el área exacta donde el cursor o la mirada del jugador detecta el bloque para seleccionarlo, minarlo o interactuar. Soporta plantillas oficiales y generación automática de la caja envolvente compuesta.',
      icon: 'bx bx-target-lock',
    },
    {
      title: 'Soporte para Múltiples Cajas por Bloque',
      version: 'v0.1.5',
      badge: 'Multicaja',
      desc: 'Añade, duplica, renombra y ajusta múltiples cajas de colisión para crear formas complejas como escaleras, postes, decoraciones o muebles, plenamente compatible con Minecraft Bedrock.',
      icon: 'bx bx-layer',
    },
    {
      title: 'Visor 3D Orbital con Texturas y Capas',
      version: 'v0.1.5',
      badge: 'Visualizador',
      desc: 'Lienzo 3D táctil con rotación orbital en 360°, zoom, accesos directos de ángulo (isométrico, frontal, superior, lateral) y alternador de capas de colisión (verde esmeralda) y selección (azul cian).',
      icon: 'bx bx-cube',
    },
  ];

  const features0141 = [
    {
      title: 'Solución del Flujo de Exportación',
      version: 'v0.1.4.1',
      badge: 'Corrección',
      desc: 'Corregido el problema donde la aplicación se recargaba al exportar. Ahora la descarga de paquetes .mcaddon se realiza de forma directa y segura en segundo plano, mostrando confirmaciones en pantalla y permitiendo seguir editando sin interrupción.',
      icon: 'bx bxs-package',
    },
    {
      title: 'Nueva Pantalla de Carga con Progreso Real 1% - 100%',
      version: 'v0.1.4.1',
      badge: 'Experiencia',
      desc: 'Pantalla de carga moderna adaptada a dispositivos móviles con barra de progreso fluida del 1% al 100%, porcentaje numérico en tiempo real y mensajes descriptivos que reflejan las etapas reales de inicialización (IndexedDB, proyectos, preferencias y esquemas).',
      icon: 'bx bx-loader-circle',
    },
    {
      title: 'Editor de Bloques Organizado en Cuatro Secciones Claras',
      version: 'v0.1.4.1',
      badge: 'Editor',
      desc: 'El creador de bloques ahora se divide en 4 pestañas directas e intuitivas: Identidad (ID, nombre, grupo y traducciones), Atlas Core (mapeo 3D y texturas), Propiedades (física, luz, fricción e inflamabilidad) y Comportamiento.',
      icon: 'bx bxs-grid-alt',
    },
    {
      title: 'Punto de Entrada «+ Agregar comportamiento»',
      version: 'v0.1.4.1',
      badge: 'Comportamiento',
      desc: 'Nuevo botón principal y selector para incorporar comportamientos al bloque: reglas de minado con herramientas, botín y recompensas al destruir, conducción de redstone, efectos visuales de partículas y colocación oficial.',
      icon: 'bx bx-plus-circle',
    },
  ];

  const features014 = [
    {
      title: 'Nueva Arquitectura: Propiedades, Comportamiento y Componentes',
      version: 'v0.1.4',
      badge: 'Editor de Bloques',
      desc: 'El creador de bloques distingue áreas fundamentales: Propiedades básicas (fricción, atenuación, inflamabilidad, dureza), Comportamiento del bloque (herramientas de rotura, botín soltado, XP, redstone) y Componentes técnicos oficiales.',
      icon: 'bx bx-slider-alt',
    },
    {
      title: 'Colocación por Dirección (minecraft:placement_direction)',
      version: 'v0.1.4',
      badge: 'Trait Oficial',
      desc: 'Configura la orientación del bloque al colocarlo según hacia dónde mira el jugador. Soporta cardinal_direction, facing_direction y corner_and_cardinal_direction con rotación en el eje Y.',
      icon: 'bx bx-compass',
    },
    {
      title: 'Colocación por Posición (minecraft:placement_position)',
      version: 'v0.1.4',
      badge: 'Trait Oficial',
      desc: 'Permite registrar la cara del bloque vecino donde se hizo clic (block_face) y la posición vertical de colocación (vertical_half: mitad superior o inferior), permitiendo crear losas y objetos apoyados.',
      icon: 'bx bx-target-lock',
    },
    {
      title: 'Filtro de Colocación y Soporte (minecraft:placement_filter)',
      version: 'v0.1.4',
      badge: 'Componente Oficial',
      desc: 'Establece condiciones de colocación: caras permitidas (suelo, techo, paredes) y lista de bloques válidos de soporte (tierra, piedra, césped, etc.) con validación oficial de Bedrock.',
      icon: 'bx bx-filter-alt',
    },
  ];

  const features013 = [
    {
      title: 'Editor Pixel Art de Alta Precisión y Táctil',
      version: 'v0.1.3',
      badge: 'Pixel Art',
      desc: 'Lienzo interactivo optimizado para móviles con zoom hasta 800%, herramienta de desplazamiento (Pan) sin pintar accidentalmente, cuadrícula visible y fondo ajedrezado para transparencias.',
      icon: 'bx bxs-paint',
    },
    {
      title: 'Herramientas de Dibujo y Algoritmos Pixelados',
      version: 'v0.1.3',
      badge: 'Herramientas',
      desc: 'Lápiz, borrador alfa, relleno de balde (Flood Fill), cuentagotas, línea recta Bresenham, rectángulo y círculo simétrico.',
      icon: 'bx bx-brush',
    },
  ];

  const features012 = [
    {
      title: 'Sistema de Grupos de Bloques',
      version: 'v0.1.2',
      badge: 'Organización',
      desc: 'Crea grupos con categorías del inventario de Bedrock (Construcción, Naturaleza, Equipo, Objetos), colores personalizados y filtros rápidos.',
      icon: 'bx bx-category',
    },
    {
      title: 'Auditoría Previa y Diagnóstico',
      version: 'v0.1.2',
      badge: 'Validación',
      desc: 'Revisión exhaustiva de IDs duplicados, texturas faltantes y valores fuera de rango antes de generar el archivo .mcaddon.',
      icon: 'bx bx-check-shield',
    },
  ];

  const currentList =
    selectedVersion === 'v2.2'
      ? features22
      : selectedVersion === 'v1.8'
      ? features18
      : selectedVersion === 'v1.6'
      ? features16
      : selectedVersion === 'v0.1.7'
      ? features017
      : selectedVersion === 'v0.1.5'
      ? features015
      : selectedVersion === 'v0.1.4.1'
      ? features0141
      : selectedVersion === 'v0.1.3'
      ? features013
      : selectedVersion === 'v0.1.2'
      ? features012
      : features014;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <h2 className="text-sm font-black text-slate-100">Novedades de Bedrock Studio</h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">
              Historial de versiones — de los registros disponibles a la versión 2.2
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100"
          >
            <i className="bx bx-x text-xl" />
          </button>
        </div>

        {/* Version Switch Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 my-3">
          <button
            type="button"
            onClick={() => setSelectedVersion('v2.2')}
            className={`min-h-[38px] text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
              selectedVersion === 'v2.2' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="bx bx-rocket" />
            <span>2.2</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedVersion('v1.8')}
            className={`min-h-[38px] text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
              selectedVersion === 'v1.8' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="bx bx-sparkles" />
            <span>1.8 Beta</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedVersion('v1.6')}
            className={`min-h-[38px] text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
              selectedVersion === 'v1.6'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="bx bx-check-circle" />
            <span>v1.6</span>
          </button>

          <button type="button" onClick={() => setSelectedVersion('v0.1.7')} className={`min-h-[38px] text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${selectedVersion === 'v0.1.7' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}><span>v0.1.7</span></button>

          <button
            type="button"
            onClick={() => setSelectedVersion('v0.1.5')}
            className={`min-h-[38px] text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
              selectedVersion === 'v0.1.5'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>v0.1.5</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedVersion('v0.1.4.1')}
            className={`min-h-[38px] text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
              selectedVersion === 'v0.1.4.1'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>v0.1.4.1</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedVersion('v0.1.4')}
            className={`min-h-[38px] text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
              selectedVersion === 'v0.1.4'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>v0.1.4</span>
          </button>
          <button type="button" onClick={() => setSelectedVersion('v0.1.3')} className={`min-h-[38px] text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center ${selectedVersion === 'v0.1.3' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>v0.1.3</button>
          <button type="button" onClick={() => setSelectedVersion('v0.1.2')} className={`min-h-[38px] text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center ${selectedVersion === 'v0.1.2' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>v0.1.2</button>
        </div>

        {/* Content List */}
        <div className="flex flex-col gap-3 py-1">
          {currentList.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex flex-col gap-2 hover:border-slate-700/80 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <i className={`${item.icon} text-base`} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200">{item.title}</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 font-semibold">
                  {item.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pl-9">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 mt-2 flex justify-between items-center">
          <span className="text-[10px] text-slate-500 font-mono">
            Bedrock Studio · v1.6
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition-all active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
