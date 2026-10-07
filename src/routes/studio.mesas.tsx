import { useEffect, useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Utensils,
  Plus,
  QrCode,
  Printer,
  CheckCircle2,
  Clock,
  Users,
  Receipt,
  X,
  Search,
  RefreshCw,
  ExternalLink,
  Trash2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { money } from "@/components/localhub/ui";
import { useLocalHub, type Service } from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/studio/mesas")({
  component: StudioMesasPage,
});

type TableItem = {
  id: string;
  table_number: number;
  table_label: string;
  seats: number;
  status: "free" | "occupied" | "bill_requested" | "reserved";
  active: boolean;
};

type OrderItemDraft = {
  service: Service;
  quantity: number;
};

function StudioMesasPage() {
  const { business, services } = useLocalHub();

  if (business && business.category !== "alimentacao") {
    return (
      <div className="mx-auto max-w-xl text-center py-16 px-4">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-100 text-amber-800 font-bold mb-4">
          <Utensils size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Módulo exclusivo de Gastronomia</h2>
        <p className="mt-2 text-sm text-slate-600">
          O controle de Mesas e Salão é exclusivo para restaurantes, bares e lanchonetes.
          Para o segmento <b>{business.category}</b>, utilize a <b>Agenda de Atendimentos</b> ou a <b>Frente de Caixa / PDV</b>.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/studio" className="rounded-xl bg-[#292b25] px-4 py-2 text-xs font-bold text-white hover:bg-[#3d3f37]">
            Voltar para o Painel
          </Link>
          <Link to="/studio/agenda" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
            Ir para a Agenda
          </Link>
        </div>
      </div>
    );
  }

  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [tableOrders, setTableOrders] = useState<Record<number, OrderItemDraft[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrTableNumber, setQrTableNumber] = useState<number | null>(null);
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableLabel, setNewTableLabel] = useState("");
  const [newTableSeats, setNewTableSeats] = useState("4");

  const loadTables = async () => {
    if (!business?.id) return;
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("localhub_restaurant_tables")
      .select("*")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("table_number", { ascending: true });

    if (!error && data) {
      setTables(data as TableItem[]);
    } else {
      // Fallback para estado local inicial se tabela ainda não tiver sido criada no banco
      if (tables.length === 0) {
        setTables([
          { id: "1", table_number: 1, table_label: "Mesa 01", seats: 4, status: "free", active: true },
          { id: "2", table_number: 2, table_label: "Mesa 02", seats: 2, status: "free", active: true },
          { id: "3", table_number: 3, table_label: "Mesa 03", seats: 4, status: "free", active: true },
          { id: "4", table_number: 4, table_label: "Mesa 04", seats: 6, status: "free", active: true },
        ]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadTables();
  }, [business?.id]);

  const handleCreateQuickTables = async (count: number) => {
    if (!business?.id) return;
    const supabase = getSupabaseBrowserClient();
    const newItems: TableItem[] = [];
    const currentMax = tables.reduce((max, t) => Math.max(max, t.table_number), 0);

    for (let i = 1; i <= count; i++) {
      const num = currentMax + i;
      newItems.push({
        id: crypto.randomUUID(),
        table_number: num,
        table_label: `Mesa ${String(num).padStart(2, "0")}`,
        seats: 4,
        status: "free",
        active: true,
      });
    }

    if (supabase) {
      await supabase.from("localhub_restaurant_tables").insert(
        newItems.map((item) => ({
          business_id: business.id,
          table_number: item.table_number,
          table_label: item.table_label,
          seats: item.seats,
          status: item.status,
          active: true,
        })),
      );
    }

    setTables((curr) => [...curr, ...newItems]);
    toast.success(`${count} mesas criadas com sucesso!`);
  };

  const handleSaveNewTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) return;
    const num = parseInt(newTableNumber, 10);
    if (isNaN(num)) {
      toast.error("Informe um número válido para a mesa.");
      return;
    }
    const label = newTableLabel.trim() || `Mesa ${String(num).padStart(2, "0")}`;
    const seats = parseInt(newTableSeats, 10) || 4;

    const newObj: TableItem = {
      id: crypto.randomUUID(),
      table_number: num,
      table_label: label,
      seats,
      status: "free",
      active: true,
    };

    const supabase = getSupabaseBrowserClient();
    if (supabase && business?.id) {
      await supabase.from("localhub_restaurant_tables").insert({
        business_id: business.id,
        table_number: num,
        table_label: label,
        seats,
        status: "free",
        active: true,
      });
    }

    setTables((curr) => [...curr.filter((t) => t.table_number !== num), newObj].sort((a, b) => a.table_number - b.table_number));
    setIsAddingTable(false);
    setNewTableNumber("");
    setNewTableLabel("");
    toast.success("Mesa adicionada com sucesso!");
  };

  const handleUpdateStatus = async (tableNumber: number, status: TableItem["status"]) => {
    setTables((curr) =>
      curr.map((t) => (t.table_number === tableNumber ? { ...t, status } : t)),
    );
    if (selectedTable?.table_number === tableNumber) {
      setSelectedTable((curr) => (curr ? { ...curr, status } : null));
    }
    const supabase = getSupabaseBrowserClient();
    if (supabase && business?.id) {
      await supabase
        .from("localhub_restaurant_tables")
        .update({ status })
        .eq("business_id", business.id)
        .eq("table_number", tableNumber);
    }
    toast.success("Status da mesa atualizado!");
  };

  const handleAddItemToTable = (tableNumber: number, service: Service) => {
    setTableOrders((prev) => {
      const currentItems = prev[tableNumber] || [];
      const existing = currentItems.find((i) => i.service.id === service.id);
      if (existing) {
        return {
          ...prev,
          [tableNumber]: currentItems.map((i) =>
            i.service.id === service.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return {
        ...prev,
        [tableNumber]: [...currentItems, { service, quantity: 1 }],
      };
    });

    // Marca como ocupada se estiver livre
    handleUpdateStatus(tableNumber, "occupied");
    toast.success(`1x ${service.name} adicionado à Mesa ${tableNumber}`);
  };

  const handleRemoveItemFromTable = (tableNumber: number, serviceId: string) => {
    setTableOrders((prev) => {
      const currentItems = prev[tableNumber] || [];
      return {
        ...prev,
        [tableNumber]: currentItems
          .map((i) => (i.service.id === serviceId ? { ...i, quantity: i.quantity - 1 } : i))
          .filter((i) => i.quantity > 0),
      };
    });
  };

  const handleClearTable = (tableNumber: number) => {
    setTableOrders((prev) => {
      const next = { ...prev };
      delete next[tableNumber];
      return next;
    });
    handleUpdateStatus(tableNumber, "free");
    setSelectedTable(null);
    toast.success(`Mesa ${tableNumber} finalizada e liberada!`);
  };

  const handlePrintTableReceipt = (table: TableItem) => {
    const items = tableOrders[table.table_number] || [];
    const total = items.reduce((acc, i) => acc + i.service.price * i.quantity, 0);

    const printWindow = window.open("", "_blank", "width=380,height=600");
    if (!printWindow) {
      toast.error("Por favor, permita janelas pop-up para impressão.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Conta - ${table.table_label}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 13px; margin: 0; padding: 12px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .border { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin: 8px 0; }
          .flex { display: flex; justify-content: space-between; margin: 3px 0; }
          .total { font-size: 16px; font-weight: bold; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 16px;">${business?.name || "RESTAURANTE"}</div>
        <div class="center" style="font-size: 11px;">CONFERÊNCIA DE CONTA (NÃO É DOCUMENTO FISCAL)</div>
        <div class="border center bold">
          ${table.table_label.toUpperCase()} · ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div class="bold flex">
          <span>ITEM</span>
          <span>VALOR</span>
        </div>
        ${items
          .map(
            (i) => `
          <div class="flex">
            <span>${i.quantity}x ${i.service.name}</span>
            <span>${money(i.service.price * i.quantity)}</span>
          </div>
        `,
          )
          .join("")}
        <div class="border">
          <div class="flex total">
            <span>TOTAL:</span>
            <span>${money(total)}</span>
          </div>
          <div class="flex" style="font-size: 11px; margin-top: 4px;">
            <span>10% Sugerido:</span>
            <span>${money(total * 0.1)}</span>
          </div>
          <div class="flex" style="font-size: 11px;">
            <span>Total com 10%:</span>
            <span>${money(total * 1.1)}</span>
          </div>
        </div>
        <div class="center" style="margin-top: 15px; font-size: 11px;">
          Obrigado pela preferência! Volte sempre!<br/>
          Pediu pelo ELLO
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.menuCategory) set.add(s.menuCategory);
    });
    return Array.from(set);
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (!s.active) return false;
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || s.menuCategory === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchTerm, selectedCategory]);

  const activeTableOrders = selectedTable
    ? tableOrders[selectedTable.table_number] || []
    : [];
  const currentTableTotal = activeTableOrders.reduce(
    (acc, i) => acc + i.service.price * i.quantity,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#586341] text-white">
              <Utensils size={18} />
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#292b25]">
              Mesas e Salão
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Controle de pedidos em mesas, comandas abertas, fechamento de conta e QR Codes para autoatendimento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleCreateQuickTables(5)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <Plus size={14} />
            +5 Mesas
          </button>
          <button
            type="button"
            onClick={() => setIsAddingTable(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#292b25] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#3d4036]"
          >
            <Plus size={14} />
            Nova Mesa
          </button>
        </div>
      </div>

      {/* Resumo do Salão */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total de Mesas</div>
          <div className="mt-1 text-2xl font-black text-[#292b25]">{tables.length}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Livres</div>
          <div className="mt-1 text-2xl font-black text-emerald-700">
            {tables.filter((t) => t.status === "free").length}
          </div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-2xs">
          <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">Ocupadas</div>
          <div className="mt-1 text-2xl font-black text-rose-700">
            {tables.filter((t) => t.status === "occupied").length}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
          <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pediram Conta</div>
          <div className="mt-1 text-2xl font-black text-amber-700">
            {tables.filter((t) => t.status === "bill_requested").length}
          </div>
        </div>
      </div>

      {/* Grid de Mesas (Mapa Visual) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {tables.map((table) => {
          const items = tableOrders[table.table_number] || [];
          const total = items.reduce((acc, i) => acc + i.service.price * i.quantity, 0);
          const isSelected = selectedTable?.table_number === table.table_number;

          const statusStyles = {
            free: "border-emerald-300 bg-emerald-50/30 text-emerald-900 hover:border-emerald-400",
            occupied: "border-rose-300 bg-rose-50/30 text-rose-900 hover:border-rose-400",
            bill_requested: "border-amber-300 bg-amber-50/30 text-amber-900 hover:border-amber-400 animate-pulse",
            reserved: "border-blue-300 bg-blue-50/30 text-blue-900 hover:border-blue-400",
          };

          const statusBadge = {
            free: { text: "Livre", bg: "bg-emerald-100 text-emerald-800" },
            occupied: { text: "Ocupada", bg: "bg-rose-100 text-rose-800" },
            bill_requested: { text: "Pede Conta", bg: "bg-amber-100 text-amber-800" },
            reserved: { text: "Reservada", bg: "bg-blue-100 text-blue-800" },
          };

          return (
            <div
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`group relative cursor-pointer rounded-2xl border p-4 shadow-2xs transition duration-150 active:scale-95 ${
                statusStyles[table.status]
              } ${isSelected ? "ring-2 ring-[#292b25] shadow-md" : ""}`}
            >
              <div className="flex items-start justify-between">
                <span className="font-display text-lg font-black">{table.table_label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadge[table.status].bg}`}>
                  {statusBadge[table.status].text}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <Users size={13} />
                <span>{table.seats} lugares</span>
              </div>

              {table.status !== "free" && (
                <div className="mt-2 border-t border-slate-200/60 pt-2">
                  <div className="text-xs font-bold text-[#292b25]">
                    {items.length} {items.length === 1 ? "item" : "itens"} · {money(total)}
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between pt-1">
                <button
                  type="button"
                  title="Ver QR Code da mesa"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQrTableNumber(table.table_number);
                    setShowQrModal(true);
                  }}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-900"
                >
                  <QrCode size={15} />
                </button>
                {table.status !== "free" && (
                  <button
                    type="button"
                    title="Imprimir conferência de conta"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintTableReceipt(table);
                    }}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-900"
                  >
                    <Receipt size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal / Gaveta Lateral de Detalhes da Mesa Selecionada */}
      {selectedTable && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-black text-[#292b25]">
                  {selectedTable.table_label}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    selectedTable.status === "free"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedTable.status === "occupied"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {selectedTable.status === "free"
                    ? "Livre"
                    : selectedTable.status === "occupied"
                      ? "Ocupada"
                      : "Aguardando Conta"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Capacidade: {selectedTable.seats} pessoas · Salão Principal
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedTable.status === "free" ? (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedTable.table_number, "occupied")}
                  className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Abrir Mesa
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handlePrintTableReceipt(selectedTable)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Printer size={14} />
                    Imprimir Conta
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClearTable(selectedTable.table_number)}
                    className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700"
                  >
                    Fechar & Liberar Mesa
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Lançamento de Itens (Cardápio Rápido) */}
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-bold text-[#292b25]">Adicionar itens à mesa</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar produto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:border-[#586341] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Categorias */}
              {categories.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      selectedCategory === "all"
                        ? "bg-[#292b25] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Todos
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedCategory === cat
                          ? "bg-[#292b25] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Grid de Produtos */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-72 overflow-y-auto pr-1">
                {filteredServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleAddItemToTable(selectedTable.table_number, service)}
                    className="flex flex-col justify-between rounded-xl border border-slate-100 bg-[#fafaf7] p-3 text-left hover:border-[#a5b280] hover:bg-white transition"
                  >
                    <span className="font-semibold text-xs text-[#292b25] line-clamp-1">{service.name}</span>
                    <span className="mt-2 text-xs font-black text-[#586341]">{money(service.price)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Comanda Aberta da Mesa */}
            <div className="rounded-2xl border border-slate-100 bg-[#fbfbf8] p-4">
              <h3 className="font-bold text-sm text-[#292b25]">Comanda Atual</h3>
              {activeTableOrders.length === 0 ? (
                <div className="mt-8 text-center text-xs text-slate-400">
                  Nenhum item lançado nesta mesa ainda.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {activeTableOrders.map((item) => (
                    <div
                      key={item.service.id}
                      className="flex items-center justify-between text-xs border-b border-slate-100 pb-2"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-800">{item.service.name}</span>
                        <div className="text-slate-400 text-[11px]">
                          {item.quantity}x {money(item.service.price)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#292b25]">
                          {money(item.service.price * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveItemFromTable(selectedTable.table_number, item.service.id)
                          }
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex justify-between text-base font-black text-[#292b25]">
                      <span>Subtotal:</span>
                      <span>{money(currentTableTotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Serviço (10% opcional):</span>
                      <span>{money(currentTableTotal * 0.1)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de QR Code da Mesa */}
      {showQrModal && qrTableNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <h3 className="font-display text-xl font-black text-[#292b25]">
              QR Code · Mesa {String(qrTableNumber).padStart(2, "0")}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Coloque este QR Code na mesa para o cliente pedir pelo celular.
            </p>

            <div className="my-6 flex justify-center">
              <div className="size-48 rounded-2xl border-2 border-slate-100 p-2 shadow-inner bg-white flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `https://ello.app.br/loja/${business?.slug}?mesa=${qrTableNumber}`,
                  )}`}
                  alt={`QR Code Mesa ${qrTableNumber}`}
                  className="size-40"
                />
              </div>
            </div>

            <p className="text-[11px] font-mono text-slate-400 truncate">
              https://ello.app.br/loja/{business?.slug}?mesa={qrTableNumber}
            </p>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const printWin = window.open("", "_blank", "width=400,height=500");
                  if (!printWin) return;
                  printWin.document.write(`
                    <html>
                      <body style="text-align:center; font-family:sans-serif; padding:20px;">
                        <h2>${business?.name}</h2>
                        <h1>MESA ${qrTableNumber}</h1>
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                          `https://ello.app.br/loja/${business?.slug}?mesa=${qrTableNumber}`,
                        )}" />
                        <p style="margin-top:20px; font-weight:bold;">Aponte a câmera do seu celular para pedir</p>
                      </body>
                    </html>
                  `);
                  printWin.document.close();
                  printWin.focus();
                  printWin.print();
                }}
                className="flex-1 rounded-xl bg-[#292b25] py-2.5 text-xs font-bold text-white hover:bg-[#3d4036]"
              >
                Imprimir Placa
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Mesa Individual */}
      {isAddingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSaveNewTable}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h3 className="font-display text-lg font-black text-[#292b25]">Nova Mesa</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Número da Mesa</label>
                <input
                  type="number"
                  required
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="Ex: 5"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#586341] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Identificação / Nome (opcional)</label>
                <input
                  type="text"
                  value={newTableLabel}
                  onChange={(e) => setNewTableLabel(e.target.value)}
                  placeholder="Ex: Mesa 05 - Varanda"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#586341] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Quantidade de Lugares</label>
                <input
                  type="number"
                  value={newTableSeats}
                  onChange={(e) => setNewTableSeats(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#586341] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingTable(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#292b25] px-4 py-2 text-xs font-bold text-white hover:bg-[#3d4036]"
              >
                Salvar Mesa
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
