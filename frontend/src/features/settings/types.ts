import type { SessionEntry } from "../../services/profileServices";

export type SectionKey = "perfil" | "seguridad" | "cuenta";

export type ProfileForm = {
  username: string;
  email: string;
  bio: string;
};

export type PasswordForm = {
  password_actual: string;
  password_nueva: string;
  password_confirmacion: string;
};

export type SettingsState = {
  loading: boolean;
  saving: boolean;
  activeSection: SectionKey;
  profileForm: ProfileForm;
  initialProfile: ProfileForm;
  passwordForm: PasswordForm;
  sessions: SessionEntry[];
  avatarPreview: string | null;
  avatarBase64: string | null;
  usernameStatus: "idle" | "checking" | "available" | "taken";
  error: string | null;
  inlineErrors: Record<string, string>;
  successMessage: string | null;
  showLeaveModal: boolean;
  deleteStep: number;
  deleteInput: string;
  isTwoFactorEnabled: boolean;
  twoFactorQr: string | null;
  twoFactorSecret: string | null;
  twoFactorCode: string;
  twoFactorDisableCode: string;
  twoFactorBusy: boolean;
  recoveryCodes: string[];
  recoveryCodesRemaining: number | null;
  recoveryRegenerateCode: string;
  recoveryBusy: boolean;
};

export type SettingsActions = {
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setActiveSection: (section: SectionKey) => void;
  setProfileForm: (form: Partial<ProfileForm> | ((prev: ProfileForm) => ProfileForm)) => void;
  setInitialProfile: (form: ProfileForm) => void;
  setPasswordForm: (form: Partial<PasswordForm> | ((prev: PasswordForm) => PasswordForm)) => void;
  setSessions: (sessions: SessionEntry[]) => void;
  setAvatarPreview: (preview: string | null) => void;
  setAvatarBase64: (base64: string | null) => void;
  setUsernameStatus: (status: "idle" | "checking" | "available" | "taken") => void;
  setError: (error: string | null) => void;
  setInlineErrors: (errors: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setSuccessMessage: (msg: string | null) => void;
  setShowLeaveModal: (show: boolean) => void;
  setDeleteStep: (step: number) => void;
  setDeleteInput: (input: string) => void;
  setIsTwoFactorEnabled: (enabled: boolean) => void;
  setTwoFactorQr: (qr: string | null) => void;
  setTwoFactorSecret: (secret: string | null) => void;
  setTwoFactorCode: (code: string) => void;
  setTwoFactorDisableCode: (code: string) => void;
  setTwoFactorBusy: (busy: boolean) => void;
  setRecoveryCodes: (codes: string[]) => void;
  setRecoveryCodesRemaining: (remaining: number | null) => void;
  setRecoveryRegenerateCode: (code: string) => void;
  setRecoveryBusy: (busy: boolean) => void;
  resetStore: () => void;
};

export type SettingsStore = SettingsState & SettingsActions;

export type { SessionEntry };
