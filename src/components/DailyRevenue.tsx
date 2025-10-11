import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Calendar, 
  Search, 
  Filter,
  TrendingUp,
  Users,
  Table,
  Receipt
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPrice } from '@/utils/productUtils';

interface DailyTransaction {
  id: string;
  table_number: number;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount: number;
  payment_method: string | null;
  transaction_date: string;
  transaction_time: string;
  order_items: any;
  status: string;
}

interface DailyRevenueProps {
  establishmentId: string;
}

const DailyRevenue = ({ establishmentId }: DailyRevenueProps) => {
  const [transactions, setTransactions] = useState<DailyTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<DailyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<'all' | 'table' | 'customer'>('all');
  const [selectedTable, setSelectedTable] = useState<string>('');

  // Calculate daily statistics
  const dailyTotal = filteredTransactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
  const totalTransactions = filteredTransactions.length;
  const averageTicket = totalTransactions > 0 ? dailyTotal / totalTransactions : 0;
  const uniqueTables = new Set(filteredTransactions.map(t => t.table_number)).size;

  useEffect(() => {
    fetchDailyTransactions();
  }, [establishmentId, selectedDate]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, filterType, selectedTable]);

  const fetchDailyTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_transactions')
        .select('*')
        .eq('establishment_id', establishmentId)
        .eq('transaction_date', selectedDate)
        .order('transaction_time', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error('Erro ao carregar transações do dia');
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(transaction => 
        transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customer_phone?.includes(searchTerm) ||
        transaction.table_number.toString().includes(searchTerm)
      );
    }

    // Filter by type
    if (filterType === 'table' && selectedTable) {
      filtered = filtered.filter(transaction => 
        transaction.table_number.toString() === selectedTable
      );
    } else if (filterType === 'customer' && searchTerm) {
      filtered = filtered.filter(transaction => 
        transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customer_phone?.includes(searchTerm)
      );
    }

    setFilteredTransactions(filtered);
  };

  const addSampleTransaction = async () => {
    try {
      const sampleTransaction = {
        establishment_id: establishmentId,
        table_number: Math.floor(Math.random() * 20) + 1,
        customer_name: `Cliente ${Math.floor(Math.random() * 100)}`,
        customer_phone: `(11) ${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000) + 1000}`,
        total_amount: parseFloat((Math.random() * 100 + 20).toFixed(2)),
        payment_method: ['credit', 'app', 'local'][Math.floor(Math.random() * 3)],
        transaction_date: selectedDate,
        order_items: {
          items: [
            { name: 'Item de exemplo', price: 30.50, quantity: 1 }
          ]
        },
        status: 'completed'
      };

      const { error } = await supabase
        .from('daily_transactions')
        .insert([sampleTransaction]);

      if (error) throw error;
      
      toast.success('Transação de exemplo adicionada!');
      fetchDailyTransactions();
    } catch (error: any) {
      console.error('Error adding sample transaction:', error);
      toast.error('Erro ao adicionar transação de exemplo');
    }
  };

  const getPaymentMethodBadge = (method: string | null) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
      'credit': 'default',
      'debit': 'default',
      'pix': 'secondary',
      'pindura': 'outline',
      'local': 'outline'
    };
    
    const labels: { [key: string]: string } = {
      'credit': '💳 Crédito',
      'debit': '💳 Débito',
      'pix': '📱 PIX',
      'pindura': '📌 Pindura',
      'local': '💵 Local'
    };

    return (
      <Badge variant={variants[method || 'default'] || 'default'}>
        {labels[method || ''] || 'N/A'}
      </Badge>
    );
  };

  const availableTables = Array.from(new Set(transactions.map(t => t.table_number))).sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-700 rounded-lg mb-4"></div>
          <div className="h-64 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-400" />
              Total do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{formatPrice(dailyTotal)}</div>
            <p className="text-sm text-gray-300 mt-1">{selectedDate}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Receipt className="h-5 w-5 mr-2 text-blue-400" />
              Transações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalTransactions}</div>
            <p className="text-sm text-gray-300 mt-1">Pedidos processados</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-400" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{formatPrice(averageTicket)}</div>
            <p className="text-sm text-gray-300 mt-1">Por transação</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Table className="h-5 w-5 mr-2 text-orange-400" />
              Mesas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{uniqueTables}</div>
            <p className="text-sm text-gray-300 mt-1">Mesas com pedidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Controle de Valores
            </span>
            <Button
              onClick={addSampleTransaction}
              variant="outline"
              size="sm"
              className="border-gray-600 hover:bg-gray-700"
            >
              + Adicionar Exemplo
            </Button>
          </CardTitle>
          <CardDescription>
            Controle os valores recebidos por dia, mesa e cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Filtrar por</label>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="table">Mesa específica</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType === 'table' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Mesa</label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione uma mesa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as mesas</SelectItem>
                    {availableTables.map(table => (
                      <SelectItem key={table} value={table.toString()}>
                        Mesa {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                {filterType === 'customer' ? 'Nome/Telefone' : 'Buscar'}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={filterType === 'customer' ? "Digite nome ou telefone..." : "Buscar..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <CardTitle>Transações do Dia</CardTitle>
          <CardDescription>
            {filteredTransactions.length} de {transactions.length} transações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma transação encontrada para os filtros selecionados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Table className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Mesa {transaction.table_number}</p>
                      <p className="text-sm text-gray-300">
                        {transaction.customer_name || 'Cliente não identificado'}
                      </p>
                      {transaction.customer_phone && (
                        <p className="text-xs text-gray-400">{transaction.customer_phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-green-400">{formatPrice(transaction.total_amount)}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getPaymentMethodBadge(transaction.payment_method)}
                      <span className="text-xs text-gray-400">
                        {new Date(transaction.transaction_time).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyRevenue;