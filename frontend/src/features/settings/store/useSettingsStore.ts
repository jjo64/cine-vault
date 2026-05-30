import { create } from "zustand";
import type { SettingsStore, SettingsState } from "../types";

const initialSettingsState: SettingsState = {
  loading: true,
  saving: false,
  activeSection: "perfil",
  profileForm: {
    username: "",
    email: "",
    bio: "",
  },
  initialProfile: {
    username: "",
    email: "",
    bio: "",
  },
  passwordForm: {
    password_actual: "",
    password_nueva: "",
    password_confirmacion: "",
  },
  sessions: [],
  avatarPreview: null,
  avatarBase64: null,
  usernameStatus: "idle",
  error: null,
  inlineErrors: {},
  successMessage: null,
  showLeaveModal: false,
  deleteStep: 0,
  deleteInput: "",
  isTwoFactorEnabled: false,
  twoFactorQr: null,
  twoFactorSecret: null,
  twoFactorCode: "",
  twoFactorDisableCode: "",
  twoFactorBusy: false,
  recoveryCodes: [],
  recoveryCodesRemaining: null,
  recoveryRegenerateCode: "",
  recoveryBusy: false,
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  ...initialSettingsState,

  setLoading: (loading) => set({ loading }),
  setSaving: (saving) => set({ saving }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setProfileForm: (form) =>
    set((state) => ({
      profileForm: typeof form === "function" ? form(state.profileForm) : { ...state.profileForm, ...form },
    })),
  setInitialProfile: (initialProfile) => set({ initialProfile }),
  setPasswordForm: (form) =>
    set((state) => ({
      passwordForm: typeof form === "function" ? form(state.passwordForm) : { ...state.passwordForm, ...form },
    })),
  setSessions: (sessions) => set({ sessions }),
  setAvatarPreview: (avatarPreview) => set({ avatarPreview }),
  setAvatarBase64: (avatarBase64) => set({ avatarBase64 }),
  setUsernameStatus: (usernameStatus) => set({ usernameStatus }),
  setError: (error) => set({ error }),
  setInlineErrors: (errors) =>
    set((state) => ({
      inlineErrors: typeof errors === "function" ? errors(state.inlineErrors) : errors,
    })),
  setSuccessMessage: (successMessage) => set({ successMessage }),
  setShowLeaveModal: (showLeaveModal) => set({ showLeaveModal }),
  setDeleteStep: (deleteStep) => set({ deleteStep }),
  setDeleteInput: (deleteInput) => set({ deleteInput }),
  setIsTwoFactorEnabled: (isTwoFactorEnabled) => set({ isTwoFactorEnabled }),
  setTwoFactorQr: (twoFactorQr) => set({ twoFactorQr }),
  setTwoFactorSecret: (twoFactorSecret) => set({ twoFactorSecret }),
  setTwoFactorCode: (twoFactorCode) => set({ twoFactorCode }),
  setTwoFactorDisableCode: (twoFactorDisableCode) => set({ twoFactorDisableCode }),
  setTwoFactorBusy: (twoFactorBusy) => set({ twoFactorBusy }),
  setRecoveryCodes: (recoveryCodes) => set({ recoveryCodes }),
  setRecoveryCodesRemaining: (recoveryCodesRemaining) => set({ recoveryCodesRemaining }),
  setRecoveryRegenerateCode: (recoveryRegenerateCode) => set({ recoveryRegenerateCode }),
  setRecoveryBusy: (recoveryBusy) => set({ recoveryBusy }),

  resetStore: () => set(initialSettingsState),
}));
