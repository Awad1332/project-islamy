'use client';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Input } from './input';

export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} dir="ltr" className="h-12 pe-11 text-base" />
      <button type="button" onClick={() => setShow(!show)} className="absolute end-1 top-1 flex size-10 items-center justify-center rounded-md text-muted-foreground hover:text-foreground" aria-label={show ? t('common.hidePassword') : t('common.showPassword')}>
        {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  );
}
