import React, { useEffect, useRef, useState } from 'react';
import localforage from 'localforage';
import {
  ArrowDown,
  ArrowLeft,
  Check,
  ChevronDown,
  CircleUserRound,
  ImagePlus,
  Languages,
  LockKeyhole,
  LogIn,
  Plus,
  Settings2,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';

interface LocalProfile {
  id: string;
  name: string;
  bio: string;
  avatarDataUrl: string;
  passwordSalt: string;
  passwordHash: string;
  createdAt: number;
}

interface Beta1GateProps {
  children: React.ReactNode;
  showProfileDock?: boolean;
}

const profileStore = localforage.createInstance({
  name: 'BedrockStudioDB',
  storeName: 'beta1_profiles',
  description: 'Perfiles locales de Bedrock Studio 3.0 Beta 1',
});
const metaStore = localforage.createInstance({
  name: 'BedrockStudioDB',
  storeName: 'beta1_meta',
});

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

async function hashPassword(password: string, saltHex: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Este navegador no ofrece almacenamiento seguro de contraseñas. Abre Bedrock Studio desde su dirección HTTPS.');
  }
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
    key,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

function createSalt(): string {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return bytesToHex(salt);
}

export const Beta1Gate: React.FC<Beta1GateProps> = ({ children, showProfileDock = true }) => {
  const [isReady, setIsReady] = useState(false);
  const [welcomeAccepted, setWelcomeAccepted] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [profiles, setProfiles] = useState<LocalProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<LocalProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addingAccount, setAddingAccount] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const storedProfiles = (await profileStore.getItem<LocalProfile[]>('profiles')) ?? [];
        const accepted = !!(await metaStore.getItem<boolean>('welcome_3_0_beta_1_accepted'));
        const savedActiveId = await metaStore.getItem<string>('active_profile_id');
        if (cancelled) return;
        const validProfiles = Array.isArray(storedProfiles) ? storedProfiles : [];
        setProfiles(validProfiles);
        setWelcomeAccepted(accepted);
        const selected = validProfiles.find((profile) => profile.id === savedActiveId) ?? validProfiles[validProfiles.length - 1] ?? null;
        if (selected) {
          setActiveProfile(selected);
          setActiveProfileId(selected.id);
          setProfileName(selected.name);
          setProfileBio(selected.bio ?? '');
          await metaStore.setItem('active_profile_id', selected.id);
        }
      } catch (loadError) {
        console.error('No se pudieron cargar los perfiles locales:', loadError);
        setError('No se pudieron leer los perfiles locales. Comprueba el almacenamiento del navegador e inténtalo de nuevo.');
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const persistProfiles = async (nextProfiles: LocalProfile[]) => {
    await profileStore.setItem('profiles', nextProfiles);
    setProfiles(nextProfiles);
  };

  const acceptWelcome = async () => {
    if (!termsChecked) {
      setError('Debes aceptar las condiciones para continuar.');
      return;
    }
    try {
      await metaStore.setItem('welcome_3_0_beta_1_accepted', true);
      setWelcomeAccepted(true);
      setError('');
    } catch {
      setError('No se pudieron guardar las condiciones aceptadas. Inténtalo de nuevo.');
    }
  };

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = createName.trim();
    if (cleanName.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (createPassword.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (profiles.some((profile) => profile.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase())) {
      setError('Ya existe una cuenta local con ese nombre. Elige otro.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const salt = createSalt();
      const passwordHash = await hashPassword(createPassword, salt);
      const profile: LocalProfile = {
        id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: cleanName,
        bio: '',
        avatarDataUrl: '',
        passwordSalt: salt,
        passwordHash,
        createdAt: Date.now(),
      };
      const nextProfiles = [...profiles, profile];
      await persistProfiles(nextProfiles);
      await metaStore.setItem('active_profile_id', profile.id);
      setActiveProfile(profile);
      setActiveProfileId(profile.id);
      setProfileName(profile.name);
      setProfileBio('');
      setCreateName('');
      setCreatePassword('');
      setAddingAccount(false);
      setMenuOpen(false);
      setError('');
    } catch (createError) {
      console.error('No se pudo crear el perfil local:', createError);
      setError(createError instanceof Error ? createError.message : 'No se pudo crear la cuenta local.');
    } finally {
      setSaving(false);
    }
  };

  const switchProfile = async (profile: LocalProfile) => {
    setActiveProfile(profile);
    setActiveProfileId(profile.id);
    setProfileName(profile.name);
    setProfileBio(profile.bio ?? '');
    await metaStore.setItem('active_profile_id', profile.id);
    setMenuOpen(false);
    setError('');
  };

  const saveProfileDetails = async () => {
    if (!activeProfile) return;
    const cleanName = profileName.trim();
    if (cleanName.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (profiles.some((profile) => profile.id !== activeProfile.id && profile.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase())) {
      setError('Otra cuenta ya utiliza ese nombre.');
      return;
    }
    try {
      const updated = { ...activeProfile, name: cleanName, bio: profileBio.trim().slice(0, 160) };
      const nextProfiles = profiles.map((profile) => profile.id === updated.id ? updated : profile);
      await persistProfiles(nextProfiles);
      setActiveProfile(updated);
      setProfileName(updated.name);
      setProfileBio(updated.bio);
      setError('');
    } catch {
      setError('No se pudieron guardar los cambios del perfil.');
    }
  };

  const handleAvatarImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !activeProfile) return;
    if (!file.type.startsWith('image/')) {
      setError('Elige un archivo de imagen.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe pesar menos de 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string' || !activeProfile) return;
      try {
        const updated = { ...activeProfile, avatarDataUrl: reader.result };
        const nextProfiles = profiles.map((profile) => profile.id === updated.id ? updated : profile);
        await persistProfiles(nextProfiles);
        setActiveProfile(updated);
        setError('');
      } catch {
        setError('No se pudo guardar la imagen del perfil.');
      }
    };
    reader.onerror = () => setError('No se pudo leer la imagen seleccionada.');
    reader.readAsDataURL(file);
  };

  const removeAvatar = async () => {
    if (!activeProfile) return;
    const updated = { ...activeProfile, avatarDataUrl: '' };
    const nextProfiles = profiles.map((profile) => profile.id === updated.id ? updated : profile);
    await persistProfiles(nextProfiles);
    setActiveProfile(updated);
    setError('');
  };

  const deleteActiveProfile = async () => {
    if (!activeProfile) return;
    if (!window.confirm(`¿Eliminar la cuenta local “${activeProfile.name}” de este dispositivo? Esta acción no se puede deshacer.`)) return;
    try {
      const nextProfiles = profiles.filter((profile) => profile.id !== activeProfile.id);
      await persistProfiles(nextProfiles);
      if (nextProfiles.length > 0) {
        await switchProfile(nextProfiles[nextProfiles.length - 1]);
      } else {
        await metaStore.removeItem('active_profile_id');
        setActiveProfile(null);
        setActiveProfileId(null);
        setCreateName('');
        setCreatePassword('');
        setAddingAccount(false);
        setMenuOpen(false);
      }
    } catch {
      setError('No se pudo eliminar la cuenta local.');
    }
  };

  if (!isReady) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080b12] text-blue-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl border border-blue-400/40 bg-blue-500/10 flex items-center justify-center">
            <span className="text-2xl font-black">B</span>
          </div>
          <span className="text-xs text-slate-400">Preparando perfil local…</span>
        </div>
      </div>
    );
  }

  if (!welcomeAccepted) {
    return (
      <main className="fixed inset-0 z-[100] overflow-y-auto bg-[#080b12] text-slate-100 flex items-center justify-center p-4">
        <div className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <section className="relative w-full max-w-lg rounded-[28px] border border-blue-400/20 bg-[#0d111b] p-6 sm:p-8 shadow-2xl shadow-black/50">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/40 bg-blue-500/10 text-blue-300 shadow-lg shadow-blue-950/30">
              <span className="text-3xl font-black tracking-tight">B</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-300">Acceso anticipado</p>
              <p className="text-sm text-slate-400">Bedrock Studio</p>
            </div>
          </div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
            <ShieldCheck size={15} /> Beta 1 Release
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Bienvenidos y bienvenidas al acceso anticipado</h1>
          <p className="mt-2 text-base font-bold text-blue-300">Bedrock Studio 3.0 · Beta 1</p>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Esta versión inicia el rework de Bedrock Studio. La Beta 1 se centra en la pantalla de bienvenida y las cuentas locales. Otras secciones se renovarán en futuras betas.
          </p>
          <div className="mt-5 rounded-2xl border border-slate-700/80 bg-[#090d16] p-4">
            <p className="text-sm font-semibold text-slate-100">Antes de continuar</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Tus perfiles se guardan en este dispositivo. No son cuentas en línea y no se sincronizan automáticamente con otros dispositivos. Si borras los datos del navegador, podrías perderlos.
            </p>
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={termsChecked}
                onChange={(event) => { setTermsChecked(event.target.checked); setError(''); }}
                className="mt-1 h-4 w-4 accent-blue-500"
              />
              <span>He leído y acepto las condiciones del acceso anticipado.</span>
            </label>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
          <button type="button" onClick={acceptWelcome} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400 active:scale-[.99]">
            Aceptar y continuar <ArrowDown size={17} />
          </button>
          <p className="mt-4 text-center text-[11px] text-slate-500">La bienvenida se mostrará una sola vez en este dispositivo.</p>
        </section>
      </main>
    );
  }

  if (!activeProfile || addingAccount) {
    return (
      <main className="fixed inset-0 z-[100] overflow-y-auto bg-[#080b12] text-slate-100 flex items-center justify-center p-4">
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <section className="relative w-full max-w-md rounded-[28px] border border-blue-400/20 bg-[#0d111b] p-6 sm:p-8 shadow-2xl shadow-black/50">
          {addingAccount && activeProfile && (
            <button type="button" onClick={() => { setAddingAccount(false); setError(''); }} className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
              <ArrowLeft size={16} /> Volver al perfil
            </button>
          )}
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/40 bg-blue-500/10 text-blue-300">
            <UserRound size={28} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-300">Cuenta local</p>
          <h1 className="mt-2 text-2xl font-black">{addingAccount ? 'Agregar otra cuenta' : 'Crea tu perfil'}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Elige un nombre y una contraseña para tu cuenta de Bedrock Studio. La cuenta se guardará en este dispositivo.</p>
          <form onSubmit={createAccount} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-200">
              Nombre de usuario
              <input value={createName} onChange={(event) => setCreateName(event.target.value)} autoComplete="username" maxLength={32} required minLength={2} className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-[#080b12] px-4 text-base text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20" placeholder="Tu nombre" />
            </label>
            <label className="block text-sm font-semibold text-slate-200">
              Contraseña
              <span className="mt-2 flex min-h-12 items-center rounded-xl border border-slate-700 bg-[#080b12] focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20">
                <input value={createPassword} onChange={(event) => setCreatePassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={4} required className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-white outline-none" placeholder="Mínimo 4 caracteres" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="min-h-11 px-4 text-xs font-semibold text-blue-300" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? 'Ocultar' : 'Mostrar'}</button>
              </span>
            </label>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs leading-5 text-slate-400">
              La contraseña se guarda como una huella criptográfica, no como texto visible. Como no hay servidor, no existe recuperación en línea si se borran los datos locales.
            </div>
            {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
            <button type="submit" disabled={saving} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-wait disabled:opacity-60">
              {saving ? 'Creando cuenta…' : 'Crear cuenta'} <Check size={17} />
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <>
      {children}
      {showProfileDock && (
        <div className="fixed bottom-3 left-3 z-[80]">
          {menuOpen && (
            <>
              <button type="button" aria-label="Cerrar menú de perfil" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-[79] cursor-default bg-black/35" />
              <section className="absolute bottom-[calc(100%+12px)] left-0 z-[80] max-h-[min(78dvh,680px)] w-[min(340px,calc(100vw-24px))] overflow-y-auto rounded-2xl border border-slate-700 bg-[#0b101b] p-4 text-slate-100 shadow-2xl shadow-black/60">
                <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/10 text-blue-300"><span className="text-xl font-black">B</span></div>
                    <div><p className="text-sm font-extrabold">Bedrock Studio</p><p className="text-[10px] font-semibold text-blue-300">3.0 Beta 1 Release</p></div>
                  </div>
                  <button type="button" onClick={() => setMenuOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Cerrar menú"><X size={18} /></button>
                </header>

                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => avatarInputRef.current?.click()} className="group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-blue-400/30 bg-slate-800 text-blue-200" aria-label="Cambiar imagen de perfil">
                    {activeProfile.avatarDataUrl ? <img src={activeProfile.avatarDataUrl} alt="Avatar del perfil" className="h-full w-full object-cover" /> : <CircleUserRound size={28} />}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100"><ImagePlus size={19} /></span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{activeProfile.name}</p>
                    <p className="mt-1 text-xs text-slate-400">Tu perfil local</p>
                    <button type="button" onClick={() => avatarInputRef.current?.click()} className="mt-1 text-xs font-semibold text-blue-300 hover:text-blue-200">Importar imagen</button>
                    {activeProfile.avatarDataUrl && <button type="button" onClick={removeAvatar} className="ml-3 text-xs text-slate-400 hover:text-rose-300">Quitar</button>}
                  </div>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarImport} />

                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">Nombre
                    <input value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={32} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-700 bg-[#080b12] px-3 text-sm text-white outline-none focus:border-blue-400" />
                  </label>
                  <label className="block text-xs font-semibold text-slate-300">Biografía <span className="font-normal text-slate-500">(máx. 160 caracteres)</span>
                    <textarea value={profileBio} onChange={(event) => setProfileBio(event.target.value)} maxLength={160} rows={2} placeholder="Cuéntanos algo sobre ti…" className="mt-1.5 w-full resize-y rounded-lg border border-slate-700 bg-[#080b12] px-3 py-2 text-sm text-white outline-none focus:border-blue-400" />
                  </label>
                  <button type="button" onClick={saveProfileDetails} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-500/15 px-3 text-sm font-bold text-blue-200 hover:bg-blue-500/25"><Check size={15} /> Guardar perfil</button>
                </div>

                <div className="mt-4 border-t border-slate-800 pt-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Tus cuentas</p>
                  <div className="space-y-1">
                    {profiles.map((profile) => (
                      <button key={profile.id} type="button" onClick={() => switchProfile(profile)} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left transition ${profile.id === activeProfile.id ? 'bg-blue-500/15 text-blue-100' : 'text-slate-300 hover:bg-slate-800'}`}>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700 text-blue-200">{profile.avatarDataUrl ? <img src={profile.avatarDataUrl} alt="" className="h-full w-full object-cover" /> : <UserRound size={15} />}</span>
                        <span className="min-w-0 flex-1 truncate text-sm">{profile.name}</span>
                        {profile.id === activeProfile.id && <Check size={16} className="text-blue-300" />}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => { setAddingAccount(true); setCreateName(''); setCreatePassword(''); setError(''); setMenuOpen(false); }} className="mt-2 flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold text-blue-300 hover:bg-blue-500/10"><Plus size={16} /> Agregar cuenta</button>
                </div>

                <div className="mt-4 border-t border-slate-800 pt-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Configuración</p>
                  <div className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-slate-500"><Languages size={16} /><span className="flex-1">Idioma</span><span className="text-[10px]">Próximamente</span><LockKeyhole size={14} /></div>
                  <div className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-slate-500"><Settings2 size={16} /><span className="flex-1">Más ajustes</span><span className="text-[10px]">Bloqueado</span><LockKeyhole size={14} /></div>
                </div>
                <button type="button" onClick={deleteActiveProfile} className="mt-3 flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-sm text-rose-300 hover:bg-rose-500/10"><Trash2 size={16} /> Eliminar esta cuenta</button>
                {error && <p role="alert" className="mt-3 text-xs text-rose-300">{error}</p>}
              </section>
            </>
          )}
          <button type="button" onClick={() => { setMenuOpen((open) => !open); setProfileName(activeProfile.name); setProfileBio(activeProfile.bio ?? ''); setError(''); }} aria-expanded={menuOpen} aria-label="Abrir menú de perfil" className="flex min-h-12 max-w-[min(280px,calc(100vw-24px))] items-center gap-2 rounded-full border border-blue-400/30 bg-[#0b101b]/95 py-1.5 pl-1.5 pr-3 shadow-xl shadow-black/40 backdrop-blur transition hover:border-blue-300/60">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-500/15 text-blue-200">{activeProfile.avatarDataUrl ? <img src={activeProfile.avatarDataUrl} alt="" className="h-full w-full object-cover" /> : <CircleUserRound size={21} />}</span>
            <span className="max-w-32 truncate text-xs font-bold text-slate-100">{activeProfile.name}</span>
            <ChevronDown size={15} className={`text-blue-300 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </>
  );
};
