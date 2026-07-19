export type AccountProvider = "apple" | "email_magic_link" | "google";

export type AccountStatus =
  | { mode: "local"; label: "Saved on this device"; localProfileId: string }
  | {
      mode: "authenticating";
      provider: AccountProvider;
      localProfileId: string;
    }
  | {
      mode: "signed_in";
      label: "Synced to your account";
      userId: string;
      provider: AccountProvider;
      syncEnabled: boolean;
    }
  | {
      mode: "error";
      safeErrorCode: string;
      localDataPreserved: true;
      localProfileId: string;
    };

export interface AccountProviderStatus {
  provider: AccountProvider;
  configured: boolean;
  enabled: boolean;
  reason?: "cloud_disabled" | "incomplete_configuration" | "provider_disabled";
}

export interface AccountIdentity {
  userId: string;
  provider: AccountProvider;
  emailHint?: string;
  firstName?: string;
}

export interface AccountGateway {
  status(): Promise<AccountStatus>;
  providers(): AccountProviderStatus[];
  startOAuth(provider: "apple" | "google", returnTo: string): Promise<void>;
  requestMagicLink(
    email: string,
    returnTo: string,
  ): Promise<{ accepted: true }>;
  signOut(options: {
    pendingChangesResolvedOrExported: boolean;
  }): Promise<void>;
}
