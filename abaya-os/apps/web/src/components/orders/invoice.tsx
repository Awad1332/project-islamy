'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState } from '@/components/states';

export function Invoice({ orderId }: { orderId: string }) {
  const { t, money, date } = useI18n();
  const q = useQuery({ queryKey: ['invoice', orderId], queryFn: () => api(`/orders/${orderId}/invoice`) });
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    if (q.data?.zatcaQrBase64) QRCode.toDataURL(q.data.zatcaQrBase64, { margin: 1, width: 160 }).then(setQr);
  }, [q.data?.zatcaQrBase64]);
  if (q.isLoading) return <LoadingState rows={3} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const d = q.data;
  return (
    <div className="space-y-4 text-sm" id="invoice">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-lg">{d.seller.nameAr}</div>
          {d.seller.vatNumber && <div className="text-xs">الرقم الضريبي / VAT: <span className="num">{d.seller.vatNumber}</span></div>}
          {d.seller.commercialRegistration && <div className="text-xs">س.ت / CR: <span className="num">{d.seller.commercialRegistration}</span></div>}
          <div className="text-xs text-muted-foreground">{date(d.order.placedAt, true)} · #{d.order.number}</div>
        </div>
        {qr ? <img src={qr} alt="ZATCA QR" className="size-32" /> : <p className="max-w-[180px] text-xs text-amber-800">{t('orders.vatMissing')}</p>}
      </div>
      <table className="w-full text-xs">
        <thead><tr className="border-b"><th className="py-1 text-start">{t('common.name')}</th><th>{t('orders.quantity')}</th><th className="text-end">{t('orders.vat')}</th><th className="text-end">{t('common.total')}</th></tr></thead>
        <tbody>{d.order.items.map((i: any) => <tr key={i.id} className="border-b"><td className="py-1">{i.productTitle} — {i.size}/{i.color}{i.length ? `/${i.length}` : ''}</td><td className="num text-center">{i.quantity}</td><td className="num text-end">{money(i.vatTotal)}</td><td className="num text-end">{money(i.total)}</td></tr>)}</tbody>
      </table>
      <div className="ms-auto max-w-xs space-y-1">
        <div className="flex justify-between"><span>{t('orders.subtotal')}</span><span className="num">{money(d.order.subtotal)}</span></div>
        <div className="flex justify-between"><span>{t('orders.vat')} ({d.order.vatRateBps / 100}%)</span><span className="num">{money(d.order.vatTotal)}</span></div>
        <div className="flex justify-between font-semibold"><span>{t('orders.total')}</span><span className="num">{money(d.order.total)}</span></div>
      </div>
      <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">{t('orders.zatcaNote')}</p>
      <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden"><Printer />{t('orders.print')}</Button>
    </div>
  );
}
