import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Invoice } from '../types';

export function useInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchInvoices = async () => {
      try {
        const invoicesRef = collection(db, 'invoices', user.companyId, 'invoices');
        const q = query(invoicesRef);
        const snapshot = await getDocs(q);
        const invoicesList = snapshot.docs.map((doc) => doc.data() as Invoice);
        setInvoices(invoicesList.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch invoices';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user]);

  return { invoices, loading, error };
}
