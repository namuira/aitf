export interface CustomButton {
  id: string;
  title: string;
  description?: string;
  type: 'link' | 'modal' | 'typebot';
  url?: string;
  htmlContent?: string;
  typebotId?: string;
  apiHost?: string;
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface AuthSession {
  authenticated: boolean;
  expiresAt: number;
}

export type CloudflareBindings = {
  WEBAPP_KV: KVNamespace;
}